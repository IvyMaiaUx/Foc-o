import { clientIp, withinRateLimit } from './_rateLimit.js';
import { emailKey, getDb } from './_firebase.js';
import { leadMagnetFimDaCulpaEmail, marketingUnsubscribeUrl, reserveDispatch, sendEmail } from './_email.js';

const ALLOWED_ORIGINS = new Set(['https://focao.web.app', 'https://focao-beta.web.app', 'https://focaoapp.com.br', 'https://app.focaoapp.com.br', 'https://foc-o.vercel.app', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']);
const DEFAULT_MATERIAL_URL = 'https://drive.google.com/file/d/1Ru6qMB_fbHg8sOfUzLT5jZVBcQ5kNTPQ/view?usp=sharing';

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const name = String(req.body?.name || 'Tutor').trim().slice(0, 80);
  const consent = req.body?.consent === true;
  if (!isValidEmail(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!consent) return res.status(400).json({ error: 'consent_required' });
  if (!(await withinRateLimit('lead_magnet_email', clientIp(req), 5, 60 * 60 * 1000))) return res.status(429).json({ error: 'too_many_requests' });

  const kind = 'lead_magnet_fim_da_culpa';
  if (!(await reserveDispatch({ email, kind, cooldownMs: 15 * 60 * 1000 }))) return res.status(200).json({ ok: true, status: 'cooldown' });

  try {
    const materialUrl = process.env.FIM_DA_CULPA_EBOOK_URL || DEFAULT_MATERIAL_URL;
    const message = leadMagnetFimDaCulpaEmail({ name, materialUrl, unsubUrl: marketingUnsubscribeUrl(email) });
    const delivery = await sendEmail({ to: email, ...message });
    await getDb().collection('emailDispatches').doc(`${kind}_${emailKey(email)}`).set({ kind, email, status: 'sent', providerId: delivery?.id || null, materialUrl, deliveredAt: Date.now(), updatedAt: Date.now() }, { merge: true });
    return res.status(200).json({ ok: true, status: 'sent' });
  } catch (error) {
    console.error('[send-lead-magnet] delivery failed', error);
    return res.status(502).json({ error: 'delivery_failed' });
  }
}
