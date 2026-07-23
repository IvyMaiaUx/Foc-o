import { admin } from './_firebase.js';
import {
  passwordResetEmail,
  reserveDispatch,
  sendEmail,
  verificationEmail,
} from './_email.js';
import { clientIp, withinRateLimit } from './_rateLimit.js';

const APP_URL = 'https://focao.web.app';
const AUTH_EMAIL_COOLDOWN_MS = 60 * 1000;

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
    'https://app.focaoapp.com.br',
    'https://focao-beta.web.app',
    'https://focaoadm.web.app',
    'https://foc-o.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
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

  try {
    if (req.body?.type === 'verification') {
      await sendVerification(req, res);
      return;
    }

    if (req.body?.type === 'password_reset') {
      await sendPasswordReset(req, res);
      return;
    }

    res.status(400).json({ error: 'Unsupported email type' });
  } catch (error) {
    console.error('[send-auth-email] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
