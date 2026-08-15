import { admin, emailKey, getDb } from './_firebase.js';
import {
  leadMagnetFimDaCulpaEmail,
  marketingUnsubscribeUrl,
  passwordResetEmail,
  reserveDispatch,
  sendEmail,
  verificationEmail,
} from './_email.js';
import { clientIp, withinRateLimit } from './_rateLimit.js';

const APP_URL = 'https://focaoapp.com.br';
const AUTH_EMAIL_COOLDOWN_MS = 60 * 1000;

// A entrega do e-book mora aqui, e não num api/send-lead-magnet.js próprio, porque o
// plano Hobby da Vercel limita a 12 Serverless Functions por deployment e o repo já
// estava no teto — o 13º arquivo derruba o deploy inteiro. A URL pública
// /api/send-lead-magnet continua existindo via rewrite no vercel.json, igual ao que
// já era feito com /api/process-referral.
const LEAD_MAGNET_KIND = 'lead_magnet_fim_da_culpa';
const LEAD_MAGNET_COOLDOWN_MS = 15 * 60 * 1000;
const DEFAULT_MATERIAL_URL = 'https://drive.google.com/file/d/1Ru6qMB_fbHg8sOfUzLT5jZVBcQ5kNTPQ/view?usp=sharing';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function appPasswordResetUrl(firebaseActionUrl) {
  const actionUrl = new URL(firebaseActionUrl);
  return `${APP_URL}/redefinir-senha?${actionUrl.searchParams.toString()}`;
}

function appEmailVerificationUrl(firebaseActionUrl) {
  const actionUrl = new URL(firebaseActionUrl);
  return `${APP_URL}/email-confirmado?${actionUrl.searchParams.toString()}`;
}

function setCors(req, res) {
  const allowedOrigins = new Set([
    APP_URL,
    'https://app.focaoapp.com.br', // domínio antigo do front, agora é a própria API — mantido por segurança na transição
    'https://focao.web.app', // mesmo site de Hosting que focaoapp.com.br, pelo domínio padrão
    'https://focao-beta.web.app',
    'https://focaoadm.web.app',
    'https://foc-o.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function verifyUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  return admin.auth().verifyIdToken(token);
}

async function sendVerification(req, res) {
  const decoded = await verifyUser(req);
  if (!decoded?.uid || !decoded.email) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const email = normalizeEmail(decoded.email);
  const reserved = await reserveDispatch({ email, kind: 'verification', cooldownMs: AUTH_EMAIL_COOLDOWN_MS });
  if (reserved) {
    const actionUrl = await admin.auth().generateEmailVerificationLink(email, {
      url: `${APP_URL}/email-confirmado`,
      handleCodeInApp: true,
    });
    await sendEmail({ to: email, ...verificationEmail({ actionUrl: appEmailVerificationUrl(actionUrl) }) });
  }

  res.status(200).json({ sent: true });
}

async function sendPasswordReset(req, res) {
  const email = normalizeEmail(req.body?.email);
  if (!email || !email.includes('@')) {
    res.status(200).json({ sent: true });
    return;
  }

  // Anti-bombardeio: além do cooldown por e-mail, limita por IP (máx 8/hora).
  // Resposta neutra (sent:true) pra não vazar que houve bloqueio.
  const ip = clientIp(req);
  if (!(await withinRateLimit('pwreset', ip, 8, 60 * 60 * 1000))) {
    res.status(200).json({ sent: true });
    return;
  }

  try {
    const reserved = await reserveDispatch({ email, kind: 'password_reset', cooldownMs: AUTH_EMAIL_COOLDOWN_MS });
    if (reserved) {
      const redirect =
        req.body?.redirect === 'ativar'
          ? '/login?redirect=ativar'
          : req.body?.redirect === 'assinatura'
            ? '/login?redirect=assinatura'
            : '/login';
      const firebaseActionUrl = await admin.auth().generatePasswordResetLink(email, {
        url: `${APP_URL}${redirect}`,
        handleCodeInApp: false,
      });
      await sendEmail({
        to: email,
        ...passwordResetEmail({ actionUrl: appPasswordResetUrl(firebaseActionUrl) }),
      });
    }
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }

  res.status(200).json({ sent: true });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/**
 * Entrega do e-book "O Fim da Culpa" para leads da presell. Diferente dos e-mails de
 * auth, aqui não há usuário logado — quem autoriza é o opt-in explícito da presell,
 * por isso `consent` é obrigatório e a recusa é 400, não um envio silencioso.
 */
async function sendLeadMagnet(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const name = String(req.body?.name || 'Tutor').trim().slice(0, 80);

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'invalid_email' });
    return;
  }
  if (req.body?.consent !== true) {
    res.status(400).json({ error: 'consent_required' });
    return;
  }
  if (!(await withinRateLimit('lead_magnet_email', clientIp(req), 5, 60 * 60 * 1000))) {
    res.status(429).json({ error: 'too_many_requests' });
    return;
  }

  const reserved = await reserveDispatch({
    email,
    kind: LEAD_MAGNET_KIND,
    cooldownMs: LEAD_MAGNET_COOLDOWN_MS,
  });
  if (!reserved) {
    res.status(200).json({ ok: true, status: 'cooldown' });
    return;
  }

  try {
    const materialUrl = process.env.FIM_DA_CULPA_EBOOK_URL || DEFAULT_MATERIAL_URL;
    const delivery = await sendEmail({
      to: email,
      ...leadMagnetFimDaCulpaEmail({ name, materialUrl, unsubUrl: marketingUnsubscribeUrl(email) }),
    });
    await getDb()
      .collection('emailDispatches')
      .doc(`${LEAD_MAGNET_KIND}_${emailKey(email)}`)
      .set(
        {
          kind: LEAD_MAGNET_KIND,
          email,
          status: 'sent',
          providerId: delivery?.id || null,
          materialUrl,
          deliveredAt: Date.now(),
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    res.status(200).json({ ok: true, status: 'sent' });
  } catch (error) {
    console.error('[send-auth-email] lead magnet delivery failed', error);
    res.status(502).json({ error: 'delivery_failed' });
  }
}

export default async function sendAuthEmail(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // O tipo vem do corpo nas chamadas diretas e da query quando o pedido chegou pelo
  // rewrite de /api/send-lead-magnet — o front posta só { name, email, consent }.
  const type = req.body?.type || req.query?.type || '';

  try {
    if (type === 'verification') {
      await sendVerification(req, res);
      return;
    }

    if (type === 'password_reset') {
      await sendPasswordReset(req, res);
      return;
    }

    if (type === 'lead_magnet') {
      await sendLeadMagnet(req, res);
      return;
    }

    res.status(400).json({ error: 'Unsupported email type' });
  } catch (error) {
    console.error('[send-auth-email] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
