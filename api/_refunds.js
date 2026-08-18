import crypto from 'node:crypto';
import { admin, getDb } from './_firebase.js';
import { clientIp, withinRateLimit } from './_rateLimit.js';
import { sendEmail, refundRequestedEmail, refundStatusEmail } from './_email.js';

const APP_URL = 'https://focaoapp.com.br';
const DAY_MS = 24 * 60 * 60 * 1000;

// Janela de arrependimento (art. 49 do CDC). Fora dela o botão nem aparece pro usuário —
// e o backend recusa a criação mesmo que alguém chame a API na mão.
export const REFUND_WINDOW_DAYS = 7;

export const REFUND_COLLECTION = 'refundRequests';

export const REFUND_STATUS = {
  REQUESTED: 'requested',
  UNDER_REVIEW: 'under_review',
  NEEDS_INFORMATION: 'needs_information',
  REJECTED: 'rejected',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  REFUNDED: 'refunded',
  FAILED: 'failed',
  CANCELED: 'canceled',
};

// Status em que a solicitação ainda "ocupa" a cobrança — impede um segundo pedido ativo
// para a mesma cobrança.
export const ACTIVE_STATUSES = [
  REFUND_STATUS.REQUESTED,
  REFUND_STATUS.UNDER_REVIEW,
  REFUND_STATUS.NEEDS_INFORMATION,
  REFUND_STATUS.APPROVED,
  REFUND_STATUS.PROCESSING,
  REFUND_STATUS.REFUNDED,
];

// Estados a partir dos quais o admin ainda pode aprovar (mandar pra Stripe).
// `approved` entra porque o processo pode ter morrido entre a trava e a chamada da Stripe
// (ver claimForStripe); `failed` entra pra permitir nova tentativa depois de erro.
const APPROVABLE_STATUSES = [
  REFUND_STATUS.REQUESTED,
  REFUND_STATUS.UNDER_REVIEW,
  REFUND_STATUS.NEEDS_INFORMATION,
  REFUND_STATUS.APPROVED,
  REFUND_STATUS.FAILED,
];

const REJECTABLE_STATUSES = [
  REFUND_STATUS.REQUESTED,
  REFUND_STATUS.UNDER_REVIEW,
  REFUND_STATUS.NEEDS_INFORMATION,
];

const USER_CANCELABLE_STATUSES = [
  REFUND_STATUS.REQUESTED,
  REFUND_STATUS.UNDER_REVIEW,
  REFUND_STATUS.NEEDS_INFORMATION,
];

// Se o processo caiu depois de travar a solicitação e antes de registrar o retorno da
// Stripe, o admin pode reenviar depois desse tempo — reusando a MESMA chave de
// idempotência, então se o reembolso chegou a ser criado a Stripe devolve o mesmo objeto.
const STUCK_APPROVAL_MS = 2 * 60 * 1000;

export const REFUND_REASONS = {
  not_as_expected: 'O app não é o que eu esperava',
  duplicate_charge: 'Cobrança duplicada',
  unrecognized_charge: 'Não reconheço essa cobrança',
  technical_problem: 'Problemas técnicos no app',
  subscribed_by_mistake: 'Assinei sem querer',
  other: 'Outro motivo',
};

// A Stripe só aceita três motivos, e `fraudulent` alimenta as block lists do Radar —
// exagero para um pedido de reembolso comum. Só duplicidade tem motivo próprio.
function stripeReasonFor(reasonKey) {
  return reasonKey === 'duplicate_charge' ? 'duplicate' : 'requested_by_customer';
}

export const STATUS_LABELS = {
  [REFUND_STATUS.REQUESTED]: 'Solicitação recebida',
  [REFUND_STATUS.UNDER_REVIEW]: 'Em análise',
  [REFUND_STATUS.NEEDS_INFORMATION]: 'Precisamos de mais informações',
  [REFUND_STATUS.APPROVED]: 'Reembolso aprovado',
  [REFUND_STATUS.PROCESSING]: 'Estorno em processamento',
  [REFUND_STATUS.REFUNDED]: 'Reembolso concluído',
  [REFUND_STATUS.REJECTED]: 'Solicitação não aprovada',
  [REFUND_STATUS.CANCELED]: 'Solicitação cancelada',
  [REFUND_STATUS.FAILED]: 'Falha no processamento',
};

const STATUS_EMAIL_MESSAGE = {
  [REFUND_STATUS.UNDER_REVIEW]: 'Sua solicitação de reembolso entrou em análise. Assim que houver uma decisão, avisamos por aqui.',
  [REFUND_STATUS.NEEDS_INFORMATION]: 'Precisamos de mais alguns detalhes pra concluir a análise do seu pedido.',
  [REFUND_STATUS.APPROVED]: 'Seu reembolso foi aprovado e está sendo enviado ao seu meio de pagamento.',
  [REFUND_STATUS.PROCESSING]: 'O estorno já foi enviado ao seu meio de pagamento. O prazo de crédito depende do banco emissor.',
  [REFUND_STATUS.REFUNDED]: 'Seu reembolso foi concluído. O valor volta pela mesma forma de pagamento usada na compra.',
  [REFUND_STATUS.REJECTED]: 'Sua solicitação de reembolso não foi aprovada. Os detalhes estão na tela de acompanhamento.',
  [REFUND_STATUS.FAILED]: 'Tivemos um problema ao processar o estorno. Nossa equipe já foi avisada e vai retomar o caso.',
  [REFUND_STATUS.CANCELED]: 'Sua solicitação de reembolso foi cancelada.',
};

export class RefundError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export function nowMs() {
  return Date.now();
}

export function trackingUrl(protocol) {
  return `${APP_URL}/reembolso/${protocol}`;
}

// ---------------------------------------------------------------------------
// HTTP helpers (mesmo padrão dos outros endpoints: allowlist de origem + Bearer token)
// ---------------------------------------------------------------------------

const ALLOWED_ORIGINS = new Set([
  'https://focao.web.app',
  'https://focao-beta.web.app',
  'https://focaoadm.web.app',
  'https://focaoadm.firebaseapp.com',
  'https://focaoapp.com.br',
  'https://app.focaoapp.com.br',
  'https://foc-o.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
]);

export function setRefundCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export async function verifyUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  return admin.auth().verifyIdToken(token);
}

/**
 * Resolve o papel do admin SEMPRE no servidor: custom claims do token e, como o painel
 * hoje governa a equipe pelo doc `adminSettings/auth`, também as listas de e-mail de lá.
 * O que o front diz sobre o próprio papel é ignorado.
 */
export async function resolveAdminActor(req, db = getDb()) {
  const decoded = await verifyUser(req);
  if (!decoded?.uid) return null;

  const email = String(decoded.email || '').trim().toLowerCase();
  let isAdmin = decoded.admin === true;
  let isSuperAdmin = decoded.superAdmin === true;

  if (!isAdmin || !isSuperAdmin) {
    const snap = await db.collection('adminSettings').doc('auth').get();
    const data = snap.exists ? snap.data() : {};
    const authorized = (data?.authorizedEmails || []).map((item) => String(item).trim().toLowerCase());
    const superAdmins = (data?.superAdminEmails || []).map((item) => String(item).trim().toLowerCase());
    if (email && authorized.includes(email)) isAdmin = true;
    if (email && superAdmins.includes(email)) {
      isAdmin = true;
      isSuperAdmin = true;
    }
  }

  if (!isAdmin) return null;
  return { uid: decoded.uid, email, isAdmin, isSuperAdmin };
}

// ---------------------------------------------------------------------------
// Protocolo
// ---------------------------------------------------------------------------

// Sem I/O/0/1: o protocolo é lido em voz alta e digitado no suporte.
const PROTOCOL_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function saoPauloDateStamp(date) {
  // en-CA já devolve YYYY-MM-DD, então só tiramos os hifens.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date).replace(/-/g, '');
}

const PROTOCOL_PATTERN = /^FOC-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/;

/**
 * O protocolo é usado como id do documento, então só entra no Firestore se casar com o
 * formato — sem isso, um valor com barra ("a/b/c") viraria um caminho aninhado qualquer.
 */
export function assertProtocol(value) {
  const protocol = String(value || '').trim().toUpperCase();
  if (!PROTOCOL_PATTERN.test(protocol)) {
    throw new RefundError(400, 'invalid_protocol', 'Protocolo inválido.');
  }
  return protocol;
}

/**
 * FOC-AAAAMMDD-XXXXX. Não é sequencial (não entrega o volume de pedidos) e não carrega
 * nenhum dado pessoal — só a data e 5 caracteres aleatórios (32^5 ≈ 33 milhões).
 */
export function generateProtocol(date = new Date()) {
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += PROTOCOL_ALPHABET[crypto.randomInt(0, PROTOCOL_ALPHABET.length)];
  }
  return `FOC-${saoPauloDateStamp(date)}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Cobranças (a fonte da verdade é a Stripe — nunca o que o cliente manda)
// ---------------------------------------------------------------------------

function cardSummary(charge) {
  const card = charge?.payment_method_details?.card;
  return {
    cardBrand: card?.brand || null,
    // Só os 4 últimos dígitos, que é o que a própria Stripe expõe — nunca o número completo.
    cardLast4: card?.last4 || null,
  };
}

export function isWithinRefundWindow(chargeCreatedAtMs, now = nowMs()) {
  return chargeCreatedAtMs >= now - REFUND_WINDOW_DAYS * DAY_MS;
}

export function mapCharge(charge) {
  return {
    chargeId: charge.id,
    paymentIntentId: typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || null,
    invoiceId: typeof charge.invoice === 'string' ? charge.invoice : charge.invoice?.id || null,
    amount: charge.amount || 0,
    amountRefunded: charge.amount_refunded || 0,
    currency: charge.currency || 'brl',
    createdAt: (charge.created || 0) * 1000,
    description: charge.description || null,
    paid: charge.paid === true && charge.status === 'succeeded',
    refunded: charge.refunded === true || (charge.amount_refunded || 0) > 0,
    ...cardSummary(charge),
  };
}

/**
 * Histórico de cobranças do cliente + se cada uma pode virar pedido de reembolso.
 * `eligible` é recalculado na criação: a tela é só um espelho, não a autoridade.
 */
export async function listUserCharges(stripe, customerId, { limit = 12, now = nowMs() } = {}) {
  const list = await stripe.charges.list({ customer: customerId, limit });
  return (list?.data || []).map(mapCharge).map((charge) => {
    let ineligibleReason = null;
    if (!charge.paid) ineligibleReason = 'not_paid';
    else if (charge.refunded) ineligibleReason = 'already_refunded';
    else if (!isWithinRefundWindow(charge.createdAt, now)) ineligibleReason = 'window_expired';
    return { ...charge, eligible: ineligibleReason === null, ineligibleReason };
  });
}

export async function getUserRequestsByCharge(db, userId) {
  const snap = await db.collection(REFUND_COLLECTION).where('userId', '==', userId).get();
  const byCharge = new Map();
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const current = byCharge.get(data.stripeChargeId);
    // Se a mesma cobrança tiver um pedido recusado e outro novo, o ativo é o que importa.
    if (!current || ACTIVE_STATUSES.includes(data.status)) {
      byCharge.set(data.stripeChargeId, { protocol: doc.id, status: data.status, createdAt: data.createdAt || 0 });
    }
  });
  return byCharge;
}

// ---------------------------------------------------------------------------
// Eventos, notificações e analytics
// ---------------------------------------------------------------------------

function eventRef(requestRef, eventId) {
  const events = requestRef.collection('events');
  return eventId ? events.doc(eventId) : events.doc();
}

/**
 * Toda transição grava o evento na MESMA transação da mudança de status — histórico e
 * status nunca saem de sincronia, nem se a função morrer no meio.
 */
export function appendEventTx(tx, requestRef, { fromStatus, toStatus, actorType, actorId, note, eventId }) {
  tx.create(eventRef(requestRef, eventId), {
    fromStatus: fromStatus || null,
    toStatus,
    actorType,
    actorId: actorId || null,
    note: note || null,
    createdAt: nowMs(),
  });
}

async function notifyInApp(db, userId, { protocol, status, note }) {
  const label = STATUS_LABELS[status] || 'Atualização do reembolso';
  await db.collection('users').doc(userId).collection('notifications').doc(`refund_${protocol}_${status}`).set({
    title: `Reembolso ${protocol}: ${label.toLowerCase()}`,
    body: note || STATUS_EMAIL_MESSAGE[status] || '',
    link: `/reembolso/${protocol}`,
    notifyAt: new Date().toISOString(),
    read: false,
    createdAt: nowMs(),
  }, { merge: true });
}

/**
 * Notificação nunca derruba o fluxo: o dado já foi gravado antes de chegar aqui, e a
 * Stripe não pode ficar re-tentando o webhook porque o Resend caiu.
 */
export async function notifyUser(db, { userId, email, protocol, status, note, isNewRequest = false }) {
  try {
    await notifyInApp(db, userId, { protocol, status, note });
  } catch (error) {
    console.error('[refunds] in-app notification failed', error?.message || error);
  }

  if (!email) return;
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    if (userSnap.exists && userSnap.data()?.emailOptOut === true) return;
    const payload = isNewRequest
      ? refundRequestedEmail({ protocol, actionUrl: trackingUrl(protocol) })
      : refundStatusEmail({
        protocol,
        statusLabel: STATUS_LABELS[status] || 'Atualização do reembolso',
        message: note || STATUS_EMAIL_MESSAGE[status] || '',
        actionUrl: trackingUrl(protocol),
      });
    await sendEmail({ to: email, ...payload });
  } catch (error) {
    console.error('[refunds] status email failed', error?.message || error);
  }
}

/**
 * Mesmo formato que o AnalyticsRepository do app grava. Só chave de status e motivo —
 * nada de valor, texto livre ou e-mail.
 */
export async function logAnalytics(db, userId, event, metadata = {}) {
  try {
    const eventId = `${event}-${nowMs()}-${crypto.randomInt(0, 100000)}`;
    await db.collection('analytics_events').doc(eventId).set({
      id: eventId,
      userId: userId || 'anonymous',
      event,
      timestamp: nowMs(),
      metadata,
    });
  } catch (error) {
    console.warn('[refunds] analytics failed', event, error?.message || error);
  }
}

async function logAudit(db, { adminEmail, action, details, userId }) {
  try {
    await db.collection('adminAuditLogs').add({
      adminEmail: adminEmail || 'sistema',
      userId: userId || null,
      module: 'Reembolsos',
      action,
      details,
      timestamp: nowMs(),
    });
  } catch (error) {
    console.error('[refunds] audit log failed', error?.message || error);
  }
}

// ---------------------------------------------------------------------------
// Criação (usuário)
// ---------------------------------------------------------------------------

export async function createRefundRequest({ db, stripe, user, chargeId, reason, description }) {
  if (!REFUND_REASONS[reason]) {
    throw new RefundError(400, 'invalid_reason', 'Motivo inválido.');
  }
  if (typeof chargeId !== 'string' || !chargeId.startsWith('ch_')) {
    throw new RefundError(400, 'invalid_charge', 'Cobrança inválida.');
  }

  const userSnap = await db.collection('users').doc(user.uid).get();
  if (!userSnap.exists) throw new RefundError(404, 'user_not_found', 'Usuário não encontrado.');
  const userData = userSnap.data() || {};
  const customerId = userData?.subscription?.stripeCustomerId;
  if (!customerId) throw new RefundError(400, 'no_customer', 'Nenhuma cobrança associada a esta conta.');

  const charge = await stripe.charges.retrieve(chargeId);
  const chargeCustomerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
  // Sem esta checagem, qualquer usuário autenticado pediria reembolso da cobrança alheia.
  if (!chargeCustomerId || chargeCustomerId !== customerId) {
    throw new RefundError(403, 'charge_not_owned', 'Esta cobrança não pertence à sua conta.');
  }

  // Valor, moeda e data vêm da Stripe, nunca do corpo da requisição.
  const mapped = mapCharge(charge);
  if (!mapped.paid) throw new RefundError(400, 'charge_not_paid', 'Essa cobrança não foi paga.');
  if (mapped.refunded) throw new RefundError(400, 'already_refunded', 'Essa cobrança já foi reembolsada.');
  if (!isWithinRefundWindow(mapped.createdAt)) {
    throw new RefundError(400, 'window_expired', `O prazo de ${REFUND_WINDOW_DAYS} dias para pedir reembolso dessa cobrança já passou.`);
  }

  const protocol = generateProtocol();
  const requestRef = db.collection(REFUND_COLLECTION).doc(protocol);
  const createdAt = nowMs();

  await db.runTransaction(async (tx) => {
    // Leituras primeiro (exigência do Firestore). Sem índice composto: o status é
    // filtrado em memória, e o volume por cobrança é sempre mínimo.
    const existing = await tx.get(db.collection(REFUND_COLLECTION).where('stripeChargeId', '==', chargeId));
    const active = existing.docs.find((doc) => ACTIVE_STATUSES.includes(doc.data().status));
    if (active) {
      throw new RefundError(409, 'duplicate_request', `Já existe uma solicitação em andamento para essa cobrança (${active.id}).`);
    }

    tx.create(requestRef, {
      protocol,
      userId: user.uid,
      userEmail: userData.email || user.email || '',
      userName: userData.name || userData.userName || '',
      stripeCustomerId: customerId,
      stripeSubscriptionId: userData?.subscription?.stripeSubscriptionId || null,
      stripeChargeId: mapped.chargeId,
      stripePaymentIntentId: mapped.paymentIntentId,
      stripeInvoiceId: mapped.invoiceId,
      chargeCreatedAt: mapped.createdAt,
      cardBrand: mapped.cardBrand,
      cardLast4: mapped.cardLast4,
      amount: mapped.amount,
      currency: mapped.currency,
      reason,
      reasonLabel: REFUND_REASONS[reason],
      description: String(description || '').trim().slice(0, 1000),
      status: REFUND_STATUS.REQUESTED,
      statusUpdatedAt: createdAt,
      rejectionReason: null,
      adminId: null,
      adminEmail: null,
      stripeRefundId: null,
      stripeRefundStatus: null,
      idempotencyKey: null,
      attempts: 0,
      lastError: null,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: null,
    });

    appendEventTx(tx, requestRef, {
      fromStatus: null,
      toStatus: REFUND_STATUS.REQUESTED,
      actorType: 'user',
      actorId: user.uid,
      note: 'Solicitação criada pelo usuário.',
    });
  });

  await notifyUser(db, {
    userId: user.uid,
    email: userData.email || user.email || '',
    protocol,
    status: REFUND_STATUS.REQUESTED,
    isNewRequest: true,
  });
  await logAnalytics(db, user.uid, 'refund_request_submitted', { reason });

  return {
    protocol,
    status: REFUND_STATUS.REQUESTED,
    amount: mapped.amount,
    currency: mapped.currency,
    chargeCreatedAt: mapped.createdAt,
    cardBrand: mapped.cardBrand,
    cardLast4: mapped.cardLast4,
    createdAt,
  };
}

// ---------------------------------------------------------------------------
// Leitura para a tela do usuário (view filtrada)
// ---------------------------------------------------------------------------

/**
 * O doc guarda coisa que é do painel, não do usuário: e-mail do admin que decidiu, id do
 * reembolso na Stripe, mensagem técnica de erro, chave de idempotência. Nada disso sai daqui.
 */
export function toUserView(protocol, data) {
  return {
    protocol,
    status: data.status,
    statusUpdatedAt: data.statusUpdatedAt || data.updatedAt || data.createdAt || 0,
    amount: data.amount || 0,
    currency: data.currency || 'brl',
    chargeCreatedAt: data.chargeCreatedAt || 0,
    cardBrand: data.cardBrand || null,
    cardLast4: data.cardLast4 || null,
    reason: data.reason || null,
    reasonLabel: data.reasonLabel || null,
    description: data.description || '',
    // O motivo da recusa e o pedido de informação são escritos PARA o usuário ler.
    rejectionReason: data.status === REFUND_STATUS.REJECTED ? data.rejectionReason || null : null,
    pendingInformation: data.status === REFUND_STATUS.NEEDS_INFORMATION ? data.pendingInformation || null : null,
    createdAt: data.createdAt || 0,
    resolvedAt: data.resolvedAt || null,
  };
}

function toUserEvent(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    toStatus: data.toStatus,
    // actorType sem actorId: o usuário vê que foi "a equipe", não quem.
    actorType: data.actorType,
    note: data.note || null,
    createdAt: data.createdAt || 0,
  };
}

export async function getUserRefundRequest(db, userId, rawProtocol) {
  const protocol = assertProtocol(rawProtocol);
  const snap = await db.collection(REFUND_COLLECTION).doc(protocol).get();
  // Solicitação de outra conta responde 404 igual a inexistente — não confirma que existe.
  if (!snap.exists || snap.data().userId !== userId) {
    throw new RefundError(404, 'not_found', 'Solicitação não encontrada.');
  }

  const eventsSnap = await snap.ref.collection('events').get();
  const events = eventsSnap.docs.map(toUserEvent).sort((a, b) => a.createdAt - b.createdAt);
  return { request: toUserView(snap.id, snap.data()), events };
}

export async function listUserRefundRequests(db, userId) {
  const snap = await db.collection(REFUND_COLLECTION).where('userId', '==', userId).get();
  return snap.docs
    .map((doc) => toUserView(doc.id, doc.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ---------------------------------------------------------------------------
// Transições simples (sem Stripe)
// ---------------------------------------------------------------------------

async function transition(db, rawProtocol, { from, to, actorType, actorId, note, extra = {}, guard }) {
  const protocol = assertProtocol(rawProtocol);
  const requestRef = db.collection(REFUND_COLLECTION).doc(protocol);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists) throw new RefundError(404, 'not_found', 'Solicitação não encontrada.');
    const data = snap.data();
    if (guard) guard(data);
    if (!from.includes(data.status)) {
      throw new RefundError(409, 'invalid_status', `Não dá pra fazer isso com uma solicitação em "${STATUS_LABELS[data.status] || data.status}".`);
    }

    const updatedAt = nowMs();
    const isTerminal = [REFUND_STATUS.REJECTED, REFUND_STATUS.CANCELED, REFUND_STATUS.REFUNDED].includes(to);
    tx.set(requestRef, {
      status: to,
      statusUpdatedAt: updatedAt,
      updatedAt,
      ...(isTerminal ? { resolvedAt: updatedAt } : {}),
      ...extra,
    }, { merge: true });

    appendEventTx(tx, requestRef, { fromStatus: data.status, toStatus: to, actorType, actorId, note });
    return { ...data, status: to };
  });
}

export async function markUnderReview(db, protocol, actor) {
  const data = await transition(db, protocol, {
    from: [REFUND_STATUS.REQUESTED, REFUND_STATUS.NEEDS_INFORMATION],
    to: REFUND_STATUS.UNDER_REVIEW,
    actorType: 'admin',
    actorId: actor.uid,
    note: 'Solicitação em análise.',
    extra: { adminId: actor.uid, adminEmail: actor.email },
  });
  await notifyUser(db, { userId: data.userId, email: data.userEmail, protocol, status: REFUND_STATUS.UNDER_REVIEW });
  await logAnalytics(db, data.userId, 'refund_under_review', {});
  await logAudit(db, { adminEmail: actor.email, action: 'Marcou em análise', details: `Protocolo ${protocol}`, userId: data.userId });
  return data;
}

export async function requestMoreInformation(db, protocol, actor, note) {
  const message = String(note || '').trim().slice(0, 1000);
  if (!message) throw new RefundError(400, 'note_required', 'Descreva o que falta para o usuário.');
  const data = await transition(db, protocol, {
    from: [REFUND_STATUS.REQUESTED, REFUND_STATUS.UNDER_REVIEW],
    to: REFUND_STATUS.NEEDS_INFORMATION,
    actorType: 'admin',
    actorId: actor.uid,
    note: message,
    extra: { adminId: actor.uid, adminEmail: actor.email, pendingInformation: message },
  });
  await notifyUser(db, { userId: data.userId, email: data.userEmail, protocol, status: REFUND_STATUS.NEEDS_INFORMATION, note: message });
  await logAnalytics(db, data.userId, 'refund_needs_information', {});
  await logAudit(db, { adminEmail: actor.email, action: 'Pediu mais informações', details: `Protocolo ${protocol}`, userId: data.userId });
  return data;
}

export async function rejectRefundRequest(db, protocol, actor, rejectionReason) {
  const message = String(rejectionReason || '').trim().slice(0, 1000);
  if (!message) throw new RefundError(400, 'reason_required', 'O motivo da recusa é obrigatório.');
  // Recusa NUNCA toca na Stripe: muda o status, guarda o motivo e avisa o usuário.
  const data = await transition(db, protocol, {
    from: REJECTABLE_STATUSES,
    to: REFUND_STATUS.REJECTED,
    actorType: 'admin',
    actorId: actor.uid,
    note: message,
    extra: { adminId: actor.uid, adminEmail: actor.email, rejectionReason: message },
  });
  await notifyUser(db, { userId: data.userId, email: data.userEmail, protocol, status: REFUND_STATUS.REJECTED, note: message });
  await logAnalytics(db, data.userId, 'refund_rejected', {});
  await logAudit(db, { adminEmail: actor.email, action: 'Recusou reembolso', details: `Protocolo ${protocol}`, userId: data.userId });
  return data;
}

export async function cancelRefundRequest(db, protocol, user) {
  const data = await transition(db, protocol, {
    from: USER_CANCELABLE_STATUSES,
    to: REFUND_STATUS.CANCELED,
    actorType: 'user',
    actorId: user.uid,
    note: 'Cancelada pelo usuário.',
    // Erro 404 (e não 403) de propósito: quem não é dono não descobre nem que existe.
    guard: (current) => {
      if (current.userId !== user.uid) throw new RefundError(404, 'not_found', 'Solicitação não encontrada.');
    },
  });
  await logAnalytics(db, data.userId, 'refund_request_canceled', {});
  return data;
}

// ---------------------------------------------------------------------------
// Aprovação → chamada autenticada à Stripe
// ---------------------------------------------------------------------------

/**
 * Trava a solicitação antes de falar com a Stripe. Quem perder a corrida (duplo clique,
 * duas abas, dois admins) cai no invalid_status e não chega a criar um segundo reembolso.
 */
async function claimForStripe(db, rawProtocol, actor) {
  const protocol = assertProtocol(rawProtocol);
  const requestRef = db.collection(REFUND_COLLECTION).doc(protocol);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists) throw new RefundError(404, 'not_found', 'Solicitação não encontrada.');
    const data = snap.data();

    if (data.stripeRefundId) {
      throw new RefundError(409, 'already_refunded', 'Essa solicitação já tem um reembolso criado na Stripe.');
    }
    if (!APPROVABLE_STATUSES.includes(data.status)) {
      throw new RefundError(409, 'invalid_status', `Não dá pra aprovar uma solicitação em "${STATUS_LABELS[data.status] || data.status}".`);
    }
    if (data.status === REFUND_STATUS.APPROVED && nowMs() - (data.stripeCallStartedAt || 0) < STUCK_APPROVAL_MS) {
      throw new RefundError(409, 'in_progress', 'Esse reembolso já está sendo enviado à Stripe.');
    }

    const previousAttempts = data.attempts || 0;
    // Reenvio de um envio pendurado reusa a MESMA chave (a Stripe devolve o reembolso
    // original, se ele existir). Depois de uma falha confirmada, chave nova.
    const attempt = data.status === REFUND_STATUS.FAILED ? previousAttempts + 1 : Math.max(previousAttempts, 1);
    const idempotencyKey = attempt <= 1 ? `refund_request_${protocol}` : `refund_request_${protocol}_r${attempt}`;
    const updatedAt = nowMs();

    tx.set(requestRef, {
      status: REFUND_STATUS.APPROVED,
      statusUpdatedAt: updatedAt,
      updatedAt,
      adminId: actor.uid,
      adminEmail: actor.email,
      approvedAt: data.approvedAt || updatedAt,
      attempts: attempt,
      idempotencyKey,
      stripeCallStartedAt: updatedAt,
      lastError: null,
    }, { merge: true });

    if (data.status !== REFUND_STATUS.APPROVED) {
      appendEventTx(tx, requestRef, {
        fromStatus: data.status,
        toStatus: REFUND_STATUS.APPROVED,
        actorType: 'admin',
        actorId: actor.uid,
        note: 'Aprovado. Enviando reembolso à Stripe.',
      });
    }

    return { data, idempotencyKey, attempt };
  });
}

export async function approveRefundRequest({ db, stripe, protocol: rawProtocol, actor }) {
  const protocol = assertProtocol(rawProtocol);
  const { data, idempotencyKey } = await claimForStripe(db, protocol, actor);
  const requestRef = db.collection(REFUND_COLLECTION).doc(protocol);

  await notifyUser(db, { userId: data.userId, email: data.userEmail, protocol, status: REFUND_STATUS.APPROVED });
  await logAnalytics(db, data.userId, 'refund_approved', {});
  await logAudit(db, { adminEmail: actor.email, action: 'Aprovou reembolso', details: `Protocolo ${protocol}`, userId: data.userId });

  let refund;
  try {
    refund = await stripe.refunds.create(
      {
        // Reembolso integral: sem `amount`, a Stripe estorna o valor total da cobrança.
        // Para parcial no futuro basta passar `amount` aqui — o resto do fluxo já lida
        // com isso, porque `refunded` só chega pelo webhook.
        ...(data.stripePaymentIntentId
          ? { payment_intent: data.stripePaymentIntentId }
          : { charge: data.stripeChargeId }),
        reason: stripeReasonFor(data.reason),
        metadata: { refund_request: protocol, focao_user_id: data.userId },
      },
      { idempotencyKey },
    );
  } catch (error) {
    // A mensagem da Stripe não traz chave nem cartão, mas cortamos o tamanho mesmo assim.
    const message = String(error?.message || 'Erro ao criar reembolso na Stripe.').slice(0, 300);
    const failedAt = nowMs();
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists) return;
      tx.set(requestRef, {
        status: REFUND_STATUS.FAILED,
        statusUpdatedAt: failedAt,
        updatedAt: failedAt,
        lastError: message,
        stripeCallStartedAt: null,
      }, { merge: true });
      appendEventTx(tx, requestRef, {
        fromStatus: REFUND_STATUS.APPROVED,
        toStatus: REFUND_STATUS.FAILED,
        actorType: 'system',
        actorId: 'stripe',
        note: message,
      });
    });
    await notifyUser(db, { userId: data.userId, email: data.userEmail, protocol, status: REFUND_STATUS.FAILED });
    await logAnalytics(db, data.userId, 'refund_failed', { origin: 'create' });
    throw new RefundError(502, 'stripe_error', message);
  }

  const processedAt = nowMs();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists) return;
    const current = snap.data();
    tx.set(requestRef, {
      // Fica em `processing` de propósito: `refunded` só depois da confirmação da Stripe
      // pelo webhook, mesmo quando a resposta da criação já vem com succeeded.
      status: REFUND_STATUS.PROCESSING,
      statusUpdatedAt: processedAt,
      updatedAt: processedAt,
      stripeRefundId: refund.id,
      stripeRefundStatus: refund.status || null,
      stripeCallStartedAt: null,
      lastError: null,
    }, { merge: true });
    appendEventTx(tx, requestRef, {
      fromStatus: current.status,
      toStatus: REFUND_STATUS.PROCESSING,
      actorType: 'system',
      actorId: 'stripe',
      note: 'Reembolso criado na Stripe. Aguardando confirmação.',
    });
  });

  await notifyUser(db, { userId: data.userId, email: data.userEmail, protocol, status: REFUND_STATUS.PROCESSING });
  await logAnalytics(db, data.userId, 'refund_processing', {});

  return { protocol, status: REFUND_STATUS.PROCESSING, stripeRefundStatus: refund.status || null };
}

// ---------------------------------------------------------------------------
// Webhook (confirmação) — nunca inicia reembolso, só sincroniza o resultado
// ---------------------------------------------------------------------------

function refundStatusToRequestStatus(refundStatus) {
  if (refundStatus === 'succeeded') return REFUND_STATUS.REFUNDED;
  if (refundStatus === 'failed' || refundStatus === 'canceled') return REFUND_STATUS.FAILED;
  return REFUND_STATUS.PROCESSING;
}

async function findRequestForRefund(db, { refundId, paymentIntentId, chargeId }) {
  const collection = db.collection(REFUND_COLLECTION);

  if (refundId) {
    const byRefund = await collection.where('stripeRefundId', '==', refundId).limit(1).get();
    if (!byRefund.empty) return byRefund.docs[0];
  }
  if (paymentIntentId) {
    const byIntent = await collection.where('stripePaymentIntentId', '==', paymentIntentId).get();
    const match = byIntent.docs.find((doc) => ACTIVE_STATUSES.includes(doc.data().status));
    if (match) return match;
  }
  if (chargeId) {
    const byCharge = await collection.where('stripeChargeId', '==', chargeId).get();
    const match = byCharge.docs.find((doc) => ACTIVE_STATUSES.includes(doc.data().status));
    if (match) return match;
  }
  return null;
}

/**
 * Idempotente por `event.id`: o evento vira um doc de id determinístico no histórico e o
 * `tx.create` falha se ele já existir — reentrega da Stripe não duplica efeito nenhum.
 * Um evento atrasado também não empurra a solicitação de volta pra `processing`.
 */
export async function handleRefundWebhookEvent(db, event) {
  const object = event.data?.object || {};
  let refundId = null;
  let refundStatus = null;
  let paymentIntentId = null;
  let chargeId = null;

  if (event.type === 'charge.refunded') {
    chargeId = object.id || null;
    paymentIntentId = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id || null;
    const lastRefund = object.refunds?.data?.[0];
    refundId = lastRefund?.id || null;
    refundStatus = object.refunded === true ? 'succeeded' : lastRefund?.status || 'pending';
  } else {
    refundId = object.id || null;
    refundStatus = event.type === 'refund.failed' ? 'failed' : object.status || null;
    paymentIntentId = typeof object.payment_intent === 'string' ? object.payment_intent : object.payment_intent?.id || null;
    chargeId = typeof object.charge === 'string' ? object.charge : object.charge?.id || null;
  }

  const doc = await findRequestForRefund(db, { refundId, paymentIntentId, chargeId });
  if (!doc) {
    // Reembolso feito direto no painel da Stripe, sem solicitação nossa: nada a sincronizar.
    console.log('[refunds] webhook sem solicitação correspondente:', event.type);
    return { skipped: 'no_request' };
  }

  const protocol = doc.id;
  const requestRef = db.collection(REFUND_COLLECTION).doc(protocol);
  const targetStatus = refundStatusToRequestStatus(refundStatus);

  const outcome = await db.runTransaction(async (tx) => {
    const snap = await tx.get(requestRef);
    if (!snap.exists) return { skipped: 'not_found' };
    const data = snap.data();

    // `refunded` é final: evento fora de ordem (refund.created chegando depois do
    // refund.updated) não pode rebaixar o status.
    if (data.status === REFUND_STATUS.REFUNDED && targetStatus !== REFUND_STATUS.REFUNDED) {
      return { skipped: 'already_final' };
    }

    const updatedAt = nowMs();
    tx.set(requestRef, {
      status: targetStatus,
      statusUpdatedAt: updatedAt,
      updatedAt,
      stripeRefundId: refundId || data.stripeRefundId || null,
      stripeRefundStatus: refundStatus || data.stripeRefundStatus || null,
      ...(targetStatus === REFUND_STATUS.REFUNDED ? { resolvedAt: updatedAt } : {}),
      ...(targetStatus === REFUND_STATUS.FAILED ? { lastError: `Stripe: ${event.type} (${refundStatus})` } : {}),
    }, { merge: true });

    // Id determinístico = trava de idempotência: processar o mesmo evento de novo estoura
    // ALREADY_EXISTS e aborta a transação inteira, sem gravar nada.
    appendEventTx(tx, requestRef, {
      fromStatus: data.status,
      toStatus: targetStatus,
      actorType: 'stripe',
      actorId: event.id,
      note: `Evento ${event.type}`,
      eventId: `stripe_${event.id}`,
    });

    return {
      changed: data.status !== targetStatus,
      previousStatus: data.status,
      userId: data.userId,
      userEmail: data.userEmail,
    };
  }).catch((error) => {
    if (error?.code === 6 || /ALREADY_EXISTS/i.test(String(error?.message || ''))) {
      return { skipped: 'duplicate_event' };
    }
    throw error;
  });

  if (outcome?.changed) {
    await notifyUser(db, { userId: outcome.userId, email: outcome.userEmail, protocol, status: targetStatus });
    const analyticsEvent = targetStatus === REFUND_STATUS.REFUNDED
      ? 'refund_completed'
      : targetStatus === REFUND_STATUS.FAILED
        ? 'refund_failed'
        : 'refund_processing';
    await logAnalytics(db, outcome.userId, analyticsEvent, { origin: 'webhook' });
  }

  return { protocol, status: targetStatus, ...outcome };
}

// ---------------------------------------------------------------------------
// Rate limit (mesmo mecanismo dos outros endpoints públicos)
// ---------------------------------------------------------------------------

export async function guardRefundRate(req, uid) {
  const okIp = await withinRateLimit('refund_request_ip', clientIp(req), 10, 60 * 60 * 1000);
  const okUser = await withinRateLimit('refund_request_user', uid, 5, 60 * 60 * 1000);
  return okIp && okUser;
}
