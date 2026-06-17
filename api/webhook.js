import { getDb } from './_firebase.js';
import { clientIp, withinRateLimit } from './_rateLimit.js';

const ALLOWED_ORIGINS = new Set([
  'https://focao.web.app',
  'https://focao-beta.web.app',
  'https://foc-o.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]);

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function cleanString(value, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function cleanPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '').slice(0, 32);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function collectMarketingLead(req, res) {
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
    const email = cleanString(req.body?.email, 120).toLowerCase();
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }

    // Anti-flood: no máx. 10 leads por IP por hora.
    const ip = clientIp(req);
    if (!(await withinRateLimit('lead', ip, 10, 60 * 60 * 1000))) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }

    const now = new Date();
    const docRef = await getDb().collection('marketingLeads').add({
      name: cleanString(req.body?.name || email.split('@')[0], 80),
      email,
      whatsapp: cleanPhone(req.body?.whatsapp),
      source: cleanString(req.body?.source || 'presell_quiz', 60),
      dogName: cleanString(req.body?.dogName, 80),
      quizProfile: cleanString(req.body?.quizProfile, 80),
      answers: req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {},
      page: cleanString(req.body?.page, 180),
      referrer: cleanString(req.body?.referrer, 220),
      userAgent: cleanString(req.headers['user-agent'], 180),
      utm: req.body?.utm && typeof req.body.utm === 'object' ? req.body.utm : {},
      status: 'new',
      createdAt: now,
      updatedAt: now,
    });

    res.status(200).json({ ok: true, id: docRef.id });
  } catch (error) {
    console.error('[webhook:marketing_lead] failed', error);
    res.status(500).json({ error: 'Could not save lead' });
  }
}

export default async function webhook(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(req, res);
    res.status(204).end();
    return;
  }

  if (req.query?.type === 'marketing_lead' || req.body?.type === 'marketing_lead') {
    await collectMarketingLead(req, res);
    return;
  }

  // /api/webhook é só captura de lead. O webhook do WhatsApp tem rota própria
  // (/api/whatsapp-webhook) com verificação de assinatura HMAC. Antes, qualquer POST
  // sem `type` caía aqui num write não autenticado no Firestore — removido.
  res.status(404).json({ error: 'not_found' });
}
