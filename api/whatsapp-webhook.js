import crypto from 'node:crypto';
import { getDb } from './_firebase.js';
import { handleResendInbound } from './_inbox.js';

// Precisamos do corpo CRU pra validar a assinatura HMAC da Meta — e, pelo mesmo motivo,
// a assinatura Svix do Resend. É por isso que o inbound da Central de Atendimento mora
// aqui e não em arquivo próprio: `bodyParser: false` é por arquivo, e o repo está no
// teto de 12 Serverless Functions da Vercel (api/README.md). A rota pública continua
// sendo /api/resend-inbound, por rewrite no vercel.json.
export const config = { api: { bodyParser: false } };

function getQueryValue(req, key) {
  return req.query?.[key] || req.query?.[key.replace('.', '_')];
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

// Valida o X-Hub-Signature-256 (HMAC-SHA256 do app secret sobre o corpo cru).
// Sem WHATSAPP_APP_SECRET: aceita só fora de produção; em produção, rejeita.
function verifyMetaSignature(req, rawBuf) {
  const secret = process.env.WHATSAPP_APP_SECRET || '';
  if (!secret) {
    const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    return !isProd;
  }
  const sig = String(req.headers['x-hub-signature-256'] || '');
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBuf).digest('hex');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    const mode = getQueryValue(req, 'hub.mode');
    const token = getQueryValue(req, 'hub.verify_token');
    const challenge = getQueryValue(req, 'hub.challenge');

    if (!verifyToken) {
      return res.status(500).send('WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured.');
    }
    if (mode === 'subscribe' && token === verifyToken && challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    const rawBuf = await readRawBody(req);

    // Central de Atendimento por e-mail: assinatura, idempotência e persistência são
    // outras (ver _inbox.js). Nada abaixo desta linha é tocado por esse caminho.
    if (req.query?.mode === 'resend-inbound') {
      return handleResendInbound(req, res, rawBuf);
    }

    if (!verifyMetaSignature(req, rawBuf)) {
      // Antes: qualquer POST gravava no Firestore sem autenticação.
      return res.status(401).json({ error: 'invalid_signature' });
    }

    let payload = {};
    try {
      payload = rawBuf.length ? JSON.parse(rawBuf.toString('utf8')) : {};
    } catch {
      return res.status(400).json({ error: 'invalid_json' });
    }

    try {
      await getDb().collection('whatsapp_webhook_events').add({
        provider: 'meta_whatsapp_cloud_api',
        payload,
        receivedAt: Date.now(),
      });
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('[whatsapp-webhook] failed to persist event', error);
      return res.status(200).json({ received: true, persisted: false });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
