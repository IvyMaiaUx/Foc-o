import { FieldPath } from 'firebase-admin/firestore';
import { getDb } from './_firebase.js';
import {
  sendEmail,
  reserveDispatch,
  inactivityEmail,
  trialEndingEmail,
  weeklyProgressEmail,
  unsubscribeUrl,
} from './_email.js';
import { todayKey, currentMinutes, isDueTime, diffDaysFromToday, isMonday } from './_reminderHelpers.js';

const APP_URL = 'https://focaoapp.com.br';
const EMAIL_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h — trava reprocessamento em reruns do cron no mesmo dia

const INACTIVITY_DAYS = 4; // um pouco mais tolerante que o WhatsApp (3d) pra não duplicar o nudge
const INACTIVITY_COOLDOWN_DAYS = 7;
const TRIAL_WARNING_DAYS = [2]; // dispara quando faltar exatamente esse nº de dias pro fim do trial
const DEFAULT_TIME = '10:00';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, status: 500, error: 'CRON_SECRET is not configured.' };
  const token = getBearerToken(req) || req.query?.secret;
  if (token !== secret) return { ok: false, status: 401, error: 'Unauthorized' };
  return { ok: true };
}

async function markAttempt(userRef, key, dateKey) {
  await userRef.set(
    { pendingEmailNotifications: { [key]: dateKey }, lastEmailReminderRunAt: Date.now() },
    { merge: true },
  );
}

async function logRun(db, { userId, key, status, reason }) {
  await db.collection('email_reminder_runs').add({
    userId,
    key,
    status,
    reason: reason || null,
    createdAt: Date.now(),
  });
}

async function trainingsInLast7Days(db, userId, nowMs) {
  const since = nowMs - 7 * 86400000;
  const snap = await db
    .collection('users')
    .doc(userId)
    .collection('trainingLogs')
    .where('completedAt', '>=', since)
    .get();
  return snap.size;
}

async function processUser(db, userDoc, context) {
  const userId = userDoc.id;
  const user = userDoc.data() || {};
  const results = [];

  const email = String(user.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return { userId, results: [{ status: 'skipped', reason: 'no_email' }] };
  if (user.emailOptOut === true) return { userId, results: [{ status: 'skipped', reason: 'opted_out' }] };

  const dogProfileSnap = await db.collection('users').doc(userId).collection('dog').doc('profile').get();
  const dogName = dogProfileSnap.data()?.name || user.dogName || 'seu cão';
  const pending = user.pendingEmailNotifications || {};
  const userRef = db.collection('users').doc(userId);
  const unsubUrl = unsubscribeUrl(userId);

  // --- Inatividade ---
  const daysSinceLastNudge = pending.inactivity ? Math.abs(diffDaysFromToday(pending.inactivity, context.dateKey)) : null;
  const cooldownOk = daysSinceLastNudge === null || daysSinceLastNudge >= INACTIVITY_COOLDOWN_DAYS;
  if (cooldownOk && user.lastActivityAt) {
    const daysInactive = Math.floor((context.nowMs - user.lastActivityAt) / 86400000);
    if (daysInactive >= INACTIVITY_DAYS) {
      const reserved = await reserveDispatch({ email, kind: 'inactivity', cooldownMs: EMAIL_COOLDOWN_MS });
      if (reserved) {
        try {
          await sendEmail({
            to: email,
            ...inactivityEmail({ dogName, daysInactive, actionUrl: `${APP_URL}/checkin`, unsubUrl }),
          });
          await markAttempt(userRef, 'inactivity', context.dateKey);
          await logRun(db, { userId, key: 'inactivity', status: 'sent' });
          results.push({ status: 'sent', key: 'inactivity' });
        } catch (error) {
          await logRun(db, { userId, key: 'inactivity', status: 'failed', reason: error.message });
          results.push({ status: 'failed', key: 'inactivity', reason: error.message });
        }
      } else {
        results.push({ status: 'skipped', key: 'inactivity', reason: 'dispatch_cooldown' });
      }
    }
  }

  // --- Trial acabando ---
  const isTrialing = user.subscriptionTier === 'trial' || user.subscription?.plan === 'trial';
  const trialEndsAt = user.trialEndsAt || user.subscription?.trialEndsAt;
  if (isTrialing && trialEndsAt) {
    const daysLeft = Math.ceil((trialEndsAt - context.nowMs) / 86400000);
    if (TRIAL_WARNING_DAYS.includes(daysLeft) && pending.trialEnding !== context.dateKey) {
      const reserved = await reserveDispatch({ email, kind: 'trial_ending', cooldownMs: EMAIL_COOLDOWN_MS });
      if (reserved) {
        try {
          await sendEmail({
            to: email,
            ...trialEndingEmail({ dogName, daysLeft, actionUrl: `${APP_URL}/assinatura`, unsubUrl }),
          });
          await markAttempt(userRef, 'trialEnding', context.dateKey);
          await logRun(db, { userId, key: 'trial_ending', status: 'sent' });
          results.push({ status: 'sent', key: 'trial_ending' });
        } catch (error) {
          await logRun(db, { userId, key: 'trial_ending', status: 'failed', reason: error.message });
          results.push({ status: 'failed', key: 'trial_ending', reason: error.message });
        }
      } else {
        results.push({ status: 'skipped', key: 'trial_ending', reason: 'dispatch_cooldown' });
      }
    }
  }

  // --- Progresso semanal (segundas-feiras) ---
  if (isMonday(context.dateKey) && pending.weeklyProgress !== context.dateKey) {
    const reserved = await reserveDispatch({ email, kind: 'weekly_progress', cooldownMs: EMAIL_COOLDOWN_MS });
    if (reserved) {
      try {
        const trainingsCount = await trainingsInLast7Days(db, userId, context.nowMs);
        await sendEmail({
          to: email,
          ...weeklyProgressEmail({ dogName, trainingsCount, actionUrl: `${APP_URL}/relatorio`, unsubUrl }),
        });
        await markAttempt(userRef, 'weeklyProgress', context.dateKey);
        await logRun(db, { userId, key: 'weekly_progress', status: 'sent' });
        results.push({ status: 'sent', key: 'weekly_progress' });
      } catch (error) {
        await logRun(db, { userId, key: 'weekly_progress', status: 'failed', reason: error.message });
        results.push({ status: 'failed', key: 'weekly_progress', reason: error.message });
      }
    } else {
      results.push({ status: 'skipped', key: 'weekly_progress', reason: 'dispatch_cooldown' });
    }
  }

  return { userId, results };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method Not Allowed' });

  const auth = isAuthorized(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const nowMs = Date.now();
  const dateKey = todayKey(nowMs);
  const nowMinutes = currentMinutes(nowMs);

  if (!isDueTime(DEFAULT_TIME, nowMinutes)) {
    return res.status(200).json({ skipped: true, reason: 'not_due_yet' });
  }

  const db = getDb();
  const limit = Math.min(Number(req.query?.limit || 300), 1000);
  const onlyUserId = req.query?.userId;

  try {
    const usersSnap = onlyUserId
      ? await db.collection('users').where(FieldPath.documentId(), '==', onlyUserId).limit(1).get()
      : await db.collection('users').limit(limit).get();

    const summary = { dateKey, checkedUsers: usersSnap.size, sent: 0, skipped: 0, failed: 0, users: [] };

    for (const userDoc of usersSnap.docs) {
      try {
        const result = await processUser(db, userDoc, { dateKey, nowMs });
        result.results.forEach((item) => {
          if (item.status === 'sent') summary.sent += 1;
          else if (item.status === 'skipped') summary.skipped += 1;
          else if (item.status === 'failed') summary.failed += 1;
        });
        if (result.results.length) summary.users.push(result);
      } catch (error) {
        summary.failed += 1;
        summary.users.push({ userId: userDoc.id, error: error.message || 'Failed to process user.' });
      }
    }

    return res.status(200).json(summary);
  } catch (error) {
    console.error('[run-email-reminders] failed', error);
    return res.status(500).json({ error: error.message || 'Failed to run email reminders.' });
  }
}
