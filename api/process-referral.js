import { admin, getDb } from './_firebase.js';
import { checkAndProcessReferral } from './_referralHelper.js';

// Esse endpoint nunca existiu (404 em produção, que o navegador reporta como
// erro de CORS porque uma resposta 404 da Vercel não tem Access-Control-Allow-Origin).
// src/pages/Checkin.tsx, src/pages/onboarding/Analyzing.tsx e src/pages/auth/Register.tsx
// já chamavam ele há tempos — ou seja, a lógica de recompensa de indicação em
// _referralHelper.js nunca rodou de verdade em produção. É best-effort: nunca
// bloqueia o check-in/registro/onboarding do chamador (ver try/catch nos 3 lugares).

function setCors(req, res) {
  const allowedOrigins = new Set([
    'https://focao.web.app',
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
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

export default async function processReferral(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const decoded = await verifyUser(req);
  if (!decoded?.uid) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  try {
    const db = getDb();
    // O chamador é sempre o "amigo" (referredUid) — quem acabou de se registrar,
    // concluir o onboarding ou fazer check-in. checkAndProcessReferral olha o
    // referredBy do próprio perfil dele pra achar quem indicou.
    const result = await checkAndProcessReferral(db, decoded.uid);
    res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error('[process-referral] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
