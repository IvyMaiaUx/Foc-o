import { FieldPath } from 'firebase-admin/firestore';
import { getDb } from './_firebase.js';
import { enqueueAndSendWhatsappNotification } from './_whatsapp.js';

const TIME_ZONE = 'America/Sao_Paulo';

const TEMPLATE_NAMES = {
  training: process.env.WHATSAPP_TEMPLATE_TRAINING_REMINDER || 'focao_training_reminder',
  checkin: process.env.WHATSAPP_TEMPLATE_CHECKIN_REMINDER || 'focao_checkin_reminder',
  vaccine: process.env.WHATSAPP_TEMPLATE_VACCINE_REMINDER || 'focao_vaccine_reminder',
  report: process.env.WHATSAPP_TEMPLATE_WEEKLY_REPORT || 'focao_weekly_report_ready',
};

function sendCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

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

function saoPauloDateParts(value = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(value));

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function todayKey(value = Date.now()) {
  const parts = saoPauloDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function currentMinutes(value = Date.now()) {
  const parts = saoPauloDateParts(value);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function timeToMinutes(time, fallback = '09:00') {
  const [hour, minute] = String(time || fallback).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return timeToMinutes(fallback);
  return hour * 60 + minute;
}

function isDueTime(configTime, nowMinutes) {
  return nowMinutes >= timeToMinutes(configTime);
}

function dateKeyToNoonMs(dateKey) {
  return new Date(`${dateKey}T12:00:00-03:00`).getTime();
}

function diffDaysFromToday(dateKey, today) {
  if (!dateKey) return null;
  return Math.round((dateKeyToNoonMs(dateKey) - dateKeyToNoonMs(today)) / 86400000);
}

function formatDatePtBr(dateKey) {
  if (!dateKey) return 'data indicada';
  const [year, month, day] = String(dateKey).split('-');
  if (!year || !month || !day) return String(dateKey);
  return `${day}/${month}/${year}`;
}

function isMonday(dateKey) {
  return new Date(`${dateKey}T12:00:00-03:00`).getDay() === 1;
}

function isFirstDayOfMonth(dateKey) {
  return String(dateKey || '').endsWith('-01');
}

async function hasCheckinToday(db, userId, dateKey) {
  const snap = await db.collection('users').doc(userId).collection('checkins').doc(dateKey).get();
  return snap.exists;
}

async function hasTrainingToday(db, userId, dateKey) {
  const start = dateKeyToNoonMs(dateKey) - 12 * 60 * 60 * 1000;
  const end = start + 24 * 60 * 60 * 1000;
  const snap = await db
    .collection('users')
    .doc(userId)
    .collection('trainingLogs')
    .where('completedAt', '>=', start)
    .where('completedAt', '<', end)
    .limit(1)
    .get();

  return !snap.empty;
}

// Última atividade do usuário (em ms): mais recente entre check-in e treino.
// Retorna 0 quando não há nenhum registro (usuário que nunca engajou).
async function getLastActivityMs(db, userId) {
  const userRef = db.collection('users').doc(userId);
  const [checkinSnap, trainingSnap] = await Promise.all([
    userRef.collection('checkins').orderBy(FieldPath.documentId(), 'desc').limit(1).get(),
    userRef.collection('trainingLogs').orderBy('completedAt', 'desc').limit(1).get(),
  ]);

  let last = 0;
  if (!checkinSnap.empty) {
    const ms = dateKeyToNoonMs(checkinSnap.docs[0].id);
    if (Number.isFinite(ms)) last = Math.max(last, ms);
  }
  if (!trainingSnap.empty) {
    const ms = Number(trainingSnap.docs[0].data()?.completedAt) || 0;
    last = Math.max(last, ms);
  }
  return last;
}

async function getDogProfile(db, userId) {
  const snap = await db.collection('users').doc(userId).collection('dog').doc('profile').get();
  return snap.exists ? snap.data() || {} : {};
}

async function getUpcomingVaccines(db, userId, dateKey) {
  const snap = await db.collection('users').doc(userId).collection('vaccines').get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((vaccine) => {
      const diff = diffDaysFromToday(vaccine.nextDose, dateKey);
      return diff === 3 || diff === 1 || diff === 0;
    });
}

function eventRunsToday(event, dateKey) {
  if (!event) return false;
  if (event.frequency === 'daily') return true;
  if (event.frequency === 'once') return event.date === dateKey;
  if (event.frequency === 'weekly') {
    const weekday = new Date(`${dateKey}T12:00:00-03:00`).getDay();
    return Array.isArray(event.daysOfWeek) && event.daysOfWeek.includes(weekday);
  }
  return false;
}

async function getTodayAgendaSummary(db, userId, dateKey) {
  const userRef = db.collection('users').doc(userId);
  const [planSnap, eventsSnap, checkinDone] = await Promise.all([
    userRef.collection('plan').doc('current').get(),
    userRef.collection('customEvents').limit(20).get(),
    hasCheckinToday(db, userId, dateKey),
  ]);

  const agenda = [];
  if (planSnap.exists) {
    const plan = planSnap.data() || {};
    const currentTask = Array.isArray(plan.tasks) ? plan.tasks[plan.currentTaskIndex || 0] : null;
    if (currentTask?.title) agenda.push(`treino: ${currentTask.title}`);
  }

  if (!checkinDone) agenda.push('check-in de rotina');

  eventsSnap.docs
    .map((doc) => doc.data())
    .filter((event) => eventRunsToday(event, dateKey))
    .slice(0, 3)
    .forEach((event) => {
      const label = event.time ? `${event.time} ${event.title}` : event.title;
      if (label) agenda.push(label);
    });

  return agenda.length ? agenda.join(' · ') : 'rotina sem eventos pendentes';
}

async function markReminderAttempt(userRef, key, dateKey, result) {
  await userRef.set(
    {
      pendingWhatsappNotifications: {
        [key]: dateKey,
      },
      lastWhatsappReminderRunAt: Date.now(),
      lastWhatsappReminderResult: result,
    },
    { merge: true }
  );
}

async function sendReminder({ db, userRef, userId, dogName, key, dateKey, type, templateName, payload, variables }) {
  const result = await enqueueAndSendWhatsappNotification({
    userId,
    dogName,
    type,
    templateName,
    payload,
    variables,
  });

  await markReminderAttempt(userRef, key, dateKey, {
    key,
    type,
    status: result.status,
    reason: result.reason || null,
    notificationId: result.notificationId || null,
  });

  await db.collection('whatsapp_reminder_runs').add({
    userId,
    key,
    type,
    status: result.status,
    reason: result.reason || null,
    notificationId: result.notificationId || null,
    dateKey,
    createdAt: Date.now(),
  });

  return result;
}

async function processUser(db, userDoc, context) {
  const userId = userDoc.id;
  const user = userDoc.data() || {};
  const settings = user.settings || {};
  const reminders = settings.reminders || {};
  const pending = user.pendingWhatsappNotifications || {};
  const userRef = db.collection('users').doc(userId);
  const dog = await getDogProfile(db, userId);
  const dogName = dog.name || user.dogName || 'seu cão';
  const results = [];

  if (user.whatsappNotificationTypes?.agendaDay === true && pending.agenda !== context.dateKey && isDueTime(settings.agendaReminderTime || '08:00', context.nowMinutes)) {
    const agendaSummary = await getTodayAgendaSummary(db, userId, context.dateKey);
    results.push(
      await sendReminder({
        db,
        userRef,
        userId,
        dogName,
        key: 'agenda',
        dateKey: context.dateKey,
        type: 'agenda_day',
        templateName: 'agenda_day',
        payload: { dogName, agendaSummary },
        variables: [dogName, agendaSummary],
      })
    );
  }

  if (reminders.training !== false && settings.trainingReminderTime && pending.training !== context.dateKey && isDueTime(settings.trainingReminderTime, context.nowMinutes)) {
    if (!(await hasTrainingToday(db, userId, context.dateKey))) {
      results.push(
        await sendReminder({
          db,
          userRef,
          userId,
          dogName,
          key: 'training',
          dateKey: context.dateKey,
          type: 'training_reminder',
          templateName: TEMPLATE_NAMES.training,
          payload: {
            dogName,
            nome_cao: dogName,
            titulo_treino: 'Treino do dia',
            link_treino_especifico: 'https://focao.web.app/plano',
          },
          variables: [dogName, 'Treino do dia'],
        })
      );
    } else {
      await markReminderAttempt(userRef, 'training', context.dateKey, { key: 'training', status: 'skipped', reason: 'training_done_today' });
      results.push({ status: 'skipped', reason: 'training_done_today' });
    }
  }

  if (reminders.checkin !== false && settings.checkinReminderTime && pending.checkin !== context.dateKey && isDueTime(settings.checkinReminderTime, context.nowMinutes)) {
    if (!(await hasCheckinToday(db, userId, context.dateKey))) {
      results.push(
        await sendReminder({
          db,
          userRef,
          userId,
          dogName,
          key: 'checkin',
          dateKey: context.dateKey,
          type: 'checkin_reminder',
          templateName: TEMPLATE_NAMES.checkin,
          payload: { dogName },
          variables: [dogName],
        })
      );
    } else {
      await markReminderAttempt(userRef, 'checkin', context.dateKey, { key: 'checkin', status: 'skipped', reason: 'checkin_done_today' });
      results.push({ status: 'skipped', reason: 'checkin_done_today' });
    }
  }

  const vaccineTime = settings.vaccineReminderTime || settings.trainingReminderTime || '09:00';
  if (reminders.vaccines !== false && pending.vaccines !== context.dateKey && isDueTime(vaccineTime, context.nowMinutes)) {
    const vaccines = await getUpcomingVaccines(db, userId, context.dateKey);
    if (vaccines.length > 0) {
      const vaccineNames = vaccines.map((vaccine) => vaccine.name).filter(Boolean).join(', ');
      const firstVaccine = vaccines[0] || {};
      const daysUntil = diffDaysFromToday(firstVaccine.nextDose, context.dateKey);
      results.push(
        await sendReminder({
          db,
          userRef,
          userId,
          dogName,
          key: 'vaccines',
          dateKey: context.dateKey,
          type: 'vaccine_reminder',
          templateName: TEMPLATE_NAMES.vaccine,
          payload: {
            dogName,
            vaccineNames,
            nome_cao: dogName,
            nome_vacina: vaccineNames || firstVaccine.name || 'vacina',
            data_vacina: formatDatePtBr(firstVaccine.nextDose),
            dias_restantes: daysUntil ?? 'poucos',
            link_vacinas_app: 'https://focao.web.app/vacinas',
          },
          variables: [dogName, vaccineNames, formatDatePtBr(firstVaccine.nextDose), String(daysUntil ?? '')],
        })
      );
    } else {
      await markReminderAttempt(userRef, 'vaccines', context.dateKey, { key: 'vaccines', status: 'skipped', reason: 'no_due_vaccines' });
      results.push({ status: 'skipped', reason: 'no_due_vaccines' });
    }
  }

  const reportTime = settings.reportReminderTime || '09:00';
  if (reminders.report !== false && isMonday(context.dateKey) && pending.report !== context.dateKey && isDueTime(reportTime, context.nowMinutes)) {
    results.push(
      await sendReminder({
        db,
        userRef,
        userId,
        dogName,
        key: 'report',
        dateKey: context.dateKey,
        type: 'weekly_report',
        templateName: TEMPLATE_NAMES.report,
        payload: {
          dogName,
          nome_cao: dogName,
          numero_treinos: 'alguns',
          link_relatorio_semanal: 'https://focao.web.app/relatorio',
        },
        variables: [dogName, 'alguns'],
      })
    );
  }

  if (reminders.report !== false && isFirstDayOfMonth(context.dateKey) && pending.monthlyReport !== context.dateKey && isDueTime(reportTime, context.nowMinutes)) {
    results.push(
      await sendReminder({
        db,
        userRef,
        userId,
        dogName,
        key: 'monthlyReport',
        dateKey: context.dateKey,
        type: 'monthly_report',
        templateName: process.env.WHATSAPP_TEMPLATE_MONTHLY_REPORT || 'focao_monthly_report_ready',
        payload: {
          dogName,
          nome_cao: dogName,
          total_treinos: 'alguns',
          link_relatorio_mensal: 'https://focao.web.app/relatorio',
        },
        variables: [dogName, 'alguns'],
      })
    );
  }

  // Inatividade: 3+ dias sem check-in nem treino. Cooldown de 7 dias para não repetir todo dia.
  const INACTIVITY_DAYS = 3;
  const INACTIVITY_COOLDOWN_DAYS = 7;
  const inactivityTime = settings.inactivityReminderTime || '10:00';
  if (user.whatsappNotificationTypes?.inactivity === true && isDueTime(inactivityTime, context.nowMinutes)) {
    const daysSinceLastNudge = pending.inactivity ? Math.abs(diffDaysFromToday(pending.inactivity, context.dateKey)) : null;
    const cooldownOk = daysSinceLastNudge === null || daysSinceLastNudge >= INACTIVITY_COOLDOWN_DAYS;

    if (cooldownOk) {
      const lastActivityMs = await getLastActivityMs(db, userId);
      const daysInactive = lastActivityMs
        ? Math.floor((dateKeyToNoonMs(context.dateKey) - lastActivityMs) / 86400000)
        : null;

      if (lastActivityMs && daysInactive >= INACTIVITY_DAYS) {
        results.push(
          await sendReminder({
            db,
            userRef,
            userId,
            dogName,
            key: 'inactivity',
            dateKey: context.dateKey,
            type: 'inactivity_3d',
            templateName: 'inactivity_3d',
            payload: {
              dogName,
              nome_cao: dogName,
              dias_inativo: daysInactive,
              link_checkin_app: 'https://focao.web.app/checkin',
            },
            variables: [dogName],
          })
        );
      } else {
        results.push({ status: 'skipped', reason: lastActivityMs ? 'user_active' : 'no_activity_history' });
      }
    } else {
      results.push({ status: 'skipped', reason: 'inactivity_cooldown' });
    }
  }

  return { userId, dogName, results };
}

export default async function handler(req, res) {
  sendCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method Not Allowed' });

  const auth = isAuthorized(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  const db = getDb();
  const limit = Math.min(Number(req.query?.limit || 100), 500);
  const onlyUserId = req.query?.userId;
  const dateKey = todayKey();
  const context = {
    dateKey,
    nowMinutes: currentMinutes(),
  };

  try {
    let usersSnap;
    if (onlyUserId) {
      usersSnap = await db.collection('users').where(FieldPath.documentId(), '==', onlyUserId).limit(1).get();
    } else {
      usersSnap = await db.collection('users').where('whatsappEnabled', '==', true).limit(limit).get();
    }

    const summary = {
      dateKey,
      checkedUsers: usersSnap.size,
      sent: 0,
      skipped: 0,
      failed: 0,
      users: [],
    };

    for (const userDoc of usersSnap.docs) {
      try {
        const result = await processUser(db, userDoc, context);
        result.results.forEach((item) => {
          if (item.status === 'sent') summary.sent += 1;
          else if (item.status === 'skipped') summary.skipped += 1;
          else summary.failed += 1;
        });
        summary.users.push(result);
      } catch (error) {
        summary.failed += 1;
        summary.users.push({ userId: userDoc.id, error: error.message || 'Failed to process user.' });
      }
    }

    return res.status(200).json(summary);
  } catch (error) {
    console.error('[run-whatsapp-reminders] failed', error);
    return res.status(500).json({ error: error.message || 'Failed to run WhatsApp reminders.' });
  }
}
