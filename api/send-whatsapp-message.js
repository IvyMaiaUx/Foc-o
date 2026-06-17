import { admin } from './_firebase.js';
import { enqueueAndSendWhatsappNotification } from './_whatsapp.js';

const APP_URL = 'https://focao.web.app';
const ALLOWED_ORIGINS = new Set([
  APP_URL,
  'https://focaoadm.web.app',
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
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function verifyUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  return admin.auth().verifyIdToken(token);
}

function isAdminEmail(email) {
  const raw = process.env.APP_ADMIN_EMAILS || 'focaosupport@gmail.com,isabelle021004@gmail.com';
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(String(email || '').toLowerCase());
}

// Traduz o motivo do "skip" para uma mensagem clara para o painel/admin.
function humanizeSkipReason(reason) {
  if (!reason) return 'Mensagem não enviada.';
  if (reason.startsWith('disabled_type_')) {
    return 'O usuário desativou esse tipo de notificação no WhatsApp.';
  }
  const map = {
    user_not_found: 'Usuário não encontrado.',
    opt_out: 'O usuário não ativou o WhatsApp (opt-out).',
    missing_phone: 'O usuário não tem número de WhatsApp cadastrado.',
    duplicate_today: 'Já foi enviada uma mensagem desse tipo para este usuário hoje.',
    insufficient_weekly_checkins: 'Usuário com menos de 3 check-ins na semana (regra do relatório semanal).',
  };
  return map[reason] || `Mensagem não enviada (${reason}).`;
}

// Converte o erro do provedor numa categoria segura para o cliente,
// sem vazar diagnóstico de token (prefixo/sufixo/tamanho) nem stack.
// O detalhe completo continua no log do servidor (console.error).
function clientSafeError(message) {
  const m = String(message || '');
  if (/sess/i.test(m)) {
    return 'A sessão do WhatsApp no ZapResponder está desconectada. Reconecte o número no painel.';
  }
  if (/authenticate|unauthorized|\btoken\b|401/i.test(m)) {
    return 'Falha de autenticação com o provedor de WhatsApp. Verifique o token do ZapResponder.';
  }
  return 'Falha ao enviar a mensagem pelo WhatsApp. Tente novamente.';
}

export default async function sendWhatsappMessage(req, res) {
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
    const decoded = await verifyUser(req);
    if (!decoded?.uid) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const requestedUserId = req.body?.userId || decoded.uid;
    // Enviar para OUTRO usuário exige admin com e-mail verificado.
    // Enviar para si mesmo é sempre permitido (não exige verificação).
    const isSelf = requestedUserId === decoded.uid;
    const isVerifiedAdmin = isAdminEmail(decoded.email) && decoded.email_verified === true;
    if (!isSelf && !isVerifiedAdmin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Não-admin não pode injetar texto LIVRE no seu canal de WhatsApp (anti-spoofing
    // da sua identidade de remetente). Removemos `message` do payload/variables —
    // sobra só o disparo por template, que é o uso legítimo do app.
    const rawPayload = req.body?.payload || {};
    const rawVariables = req.body?.variables || req.body?.payload || {};
    const stripMessage = (obj) => {
      if (!obj || typeof obj !== 'object') return {};
      const { message, ...rest } = obj;
      return rest;
    };
    const payload = isVerifiedAdmin ? rawPayload : stripMessage(rawPayload);
    const variables = isVerifiedAdmin ? rawVariables : stripMessage(rawVariables);

    const result = await enqueueAndSendWhatsappNotification({
      userId: requestedUserId,
      dogId: req.body?.dogId || '',
      dogName: req.body?.dogName || '',
      type: req.body?.type || 'test',
      templateName: req.body?.templateName,
      payload,
      variables,
      scheduledFor: req.body?.scheduledFor || Date.now(),
    });

    // Só responde "sucesso" (2xx) quando a mensagem realmente saiu.
    // Quando foi pulada (opt-out, sem número, duplicada, etc.), devolve 422
    // com motivo claro — assim o painel não mostra mais "enviada" falsamente.
    if (result?.status === 'skipped') {
      res.status(422).json({
        ok: false,
        sent: false,
        status: 'skipped',
        reason: result.reason || null,
        error: humanizeSkipReason(result.reason),
        notificationId: result.notificationId || null,
      });
      return;
    }

    res.status(200).json({ ok: true, sent: true, ...result });
  } catch (error) {
    // Falha real no provedor (token inválido, sessão do WhatsApp caída, etc.).
    // Detalhe completo só no log; ao cliente vai uma categoria segura.
    console.error('[send-whatsapp-message] failed', error);
    res.status(502).json({
      ok: false,
      sent: false,
      status: 'failed',
      error: clientSafeError(error.message),
    });
  }
}
