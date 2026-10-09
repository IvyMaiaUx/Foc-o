import Stripe from 'stripe';
import { getDb, emailKey } from './_firebase.js';
import { readRawBody } from './_rawBody.js';
import {
  cancellationScheduledEmail,
  ebookDeliveryEmail,
  paymentFailedEmail,
  sendEmail,
  subscriptionActiveEmail,
  subscriptionCanceledEmail,
  trialStartedEmail,
} from './_email.js';
import { sendZapResponderMessage } from './_whatsapp.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export const config = {
  api: {
    bodyParser: false,
  },
};

function nowMs() {
  return Date.now();
}

function secondsToMs(value) {
  return value ? value * 1000 : undefined;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function extractEmailFromSession(session) {
  return normalizeEmail(
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.email
  );
}

function subscriptionAccess(subscription, fallbackStatus) {
  const status = fallbackStatus || subscription?.status || 'active';
  const isTrialing = status === 'trialing';
  const isActive = status === 'active' || isTrialing;

  return {
    status,
    plan: isTrialing ? 'trial' : 'premium',
    premiumAccess: isActive,
    trialEndsAt: secondsToMs(subscription?.trial_end) || (isTrialing ? nowMs() + 7 * DAY_MS : undefined),
    currentPeriodEnd: secondsToMs(subscription?.current_period_end),
  };
}

function claimPayload({ email, session, subscription }) {
  const access = subscriptionAccess(subscription);

  return {
    email,
    plan: access.plan,
    status: access.status === 'trialing' ? 'trialing' : access.premiumAccess ? 'active' : access.status,
    premiumAccess: access.premiumAccess,
    trialEndsAt: access.trialEndsAt || null,
    currentPeriodEnd: access.currentPeriodEnd || null,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
    stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : subscription?.id || null,
    stripeCheckoutSessionId: session.id,
    cancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
    source: 'stripe_email_claim',
    claimed: false,
    createdAt: nowMs(),
    updatedAt: nowMs(),
  };
}

function subscriptionPayload({ email, customerId, subscription, fallbackStatus }) {
  const access = subscriptionAccess(subscription, fallbackStatus);
  const status = subscription?.status || 'active';

  return {
    email,
    plan: access.plan,
    status: fallbackStatus || status,
    premiumAccess: access.premiumAccess,
    trialEndsAt: access.trialEndsAt || null,
    currentPeriodEnd: access.currentPeriodEnd || null,
    stripeCustomerId: customerId || (typeof subscription?.customer === 'string' ? subscription.customer : subscription?.customer?.id) || null,
    stripeSubscriptionId: subscription?.id || null,
    stripeCheckoutSessionId: null,
    cancelAtPeriodEnd: !!subscription?.cancel_at_period_end,
    source: 'stripe_email_claim',
    claimed: false,
    createdAt: nowMs(),
    updatedAt: nowMs(),
  };
}

async function findUserByStripeIds(db, payload) {
  if (payload.stripeSubscriptionId) {
    const bySubscription = await db.collection('users')
      .where('subscription.stripeSubscriptionId', '==', payload.stripeSubscriptionId)
      .limit(1)
      .get();
    if (!bySubscription.empty) return bySubscription.docs[0];
  }

  if (payload.stripeCustomerId) {
    const byCustomer = await db.collection('users')
      .where('subscription.stripeCustomerId', '==', payload.stripeCustomerId)
      .limit(1)
      .get();
    if (!byCustomer.empty) return byCustomer.docs[0];
  }

  if (payload.email) {
    const byEmail = await db.collection('users')
      .where('email', '==', payload.email)
      .limit(1)
      .get();
    if (!byEmail.empty) return byEmail.docs[0];
  }

  return null;
}

async function upsertClaim(payload) {
  const db = getDb();

  const claimRef = payload.email
    ? db.collection('premiumClaims').doc(emailKey(payload.email))
    : null;

  if (claimRef) {
    await claimRef.set(payload, { merge: true });
  }

  const userDoc = await findUserByStripeIds(db, payload);

  if (userDoc) {
    const subscriptionTier = payload.premiumAccess ? payload.plan : 'free';

    await userDoc.ref.set({
      subscriptionTier,
      trialEndsAt: payload.trialEndsAt || 0,
      subscription: {
        plan: payload.plan,
        status: payload.status,
        premiumAccess: payload.premiumAccess,
        trialEndsAt: payload.trialEndsAt || null,
        currentPeriodEnd: payload.currentPeriodEnd || null,
        stripeCustomerId: payload.stripeCustomerId || null,
        stripeSubscriptionId: payload.stripeSubscriptionId || null,
        cancelAtPeriodEnd: !!payload.cancelAtPeriodEnd,
        accessSource: payload.source,
        updatedAt: nowMs(),
      },
      updatedAt: nowMs(),
    }, { merge: true });

    if (claimRef) {
      await claimRef.set({
      claimed: true,
      claimedUid: userDoc.id,
      claimedAt: nowMs(),
      updatedAt: nowMs(),
      }, { merge: true });
    }

    try {
      const { checkAndProcessReferral } = await import('./_referralHelper.js');
      await checkAndProcessReferral(db, userDoc.id);
    } catch (refErr) {
      console.error('[stripe-webhook] Error processing referral reward:', refErr);
    }
  }
}

async function getCustomerEmail(stripe, customerId) {
  if (!customerId) return '';
  const customer = await stripe.customers.retrieve(customerId);
  if (customer?.deleted) return '';
  return normalizeEmail(customer.email);
}

async function handleSubscriptionEvent(stripe, subscription, fallbackStatus) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;
  const email = await getCustomerEmail(stripe, customerId);
  await upsertClaim(subscriptionPayload({ email, customerId, subscription, fallbackStatus }));
}

async function handleInvoicePaymentFailed(stripe, invoice) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;
  const email = normalizeEmail(invoice.customer_email) || await getCustomerEmail(stripe, customerId);

  let subscription = null;
  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  }

  await upsertClaim(subscriptionPayload({
    email,
    customerId,
    subscription: subscription || { id: subscriptionId, customer: customerId, status: 'past_due' },
    fallbackStatus: 'past_due',
  }));
}

async function sendStripeEmail({ email, eventId, kind, template }) {
  if (!email) return;

  try {
    await sendEmail({
      to: email,
      ...template,
      eventKey: `stripe_${eventId}_${kind}`,
    });
  } catch (error) {
    console.error(`[stripe-webhook] ${kind} email failed`, error);
  }
}

// Decodifica o client_reference_id empacotado pelo funil (base64url de uma querystring s/m/c/ct/t/fb/v).
function decodeAttributionRef(ref) {
  if (!ref) return null;
  try {
    const b64 = String(ref).replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(b64 + '='.repeat((4 - (b64.length % 4)) % 4), 'base64').toString('utf8');
    const params = new URLSearchParams(decoded);
    const out = {};
    for (const [k, v] of params) out[k] = v;
    return out;
  } catch {
    return null;
  }
}

async function tagPaymentIntentAttribution(stripe, session) {
  try {
    const pi = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
    if (!pi) return; // assinatura (sem PaymentIntent direto na sessão) — ignora
    const attr = decodeAttributionRef(session.client_reference_id);
    if (!attr) return;
    const metadata = {};
    if (attr.s) metadata.utm_source = attr.s;
    if (attr.m) metadata.utm_medium = attr.m;
    if (attr.c) metadata.utm_campaign = attr.c;
    if (attr.ct) metadata.utm_content = attr.ct;
    if (attr.t) metadata.utm_term = attr.t;
    if (attr.fb) metadata.fbclid = attr.fb;
    if (attr.v) metadata.visitor_id = attr.v;
    if (!Object.keys(metadata).length) return;
    await stripe.paymentIntents.update(pi, { metadata });
  } catch (error) {
    console.error('[stripe-webhook] attribution tag failed', error);
  }
}

// Meta Conversions API (CAPI): envia o evento Purchase server-side.
// Só roda se META_PIXEL_ID + META_CAPI_TOKEN estiverem configurados na Vercel.
async function sendMetaCapiPurchase(session) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;
  try {
    const { createHash } = await import('node:crypto');
    const sha256 = (value) => createHash('sha256').update(String(value || '').trim().toLowerCase()).digest('hex');
    const email = extractEmailFromSession(session);
    const attr = decodeAttributionRef(session.client_reference_id) || {};
    const userData = {};
    if (email) userData.em = [sha256(email)];
    if (attr.fb) userData.fbc = `fb.1.${Date.now()}.${attr.fb}`;
    const value = (Number(session.amount_total) || 0) / 100;
    const body = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: session.id, // dedup com o pixel do navegador
        event_source_url: process.env.APP_PUBLIC_URL || 'https://focao.web.app',
        user_data: userData,
        custom_data: { currency: (session.currency || 'BRL').toUpperCase(), value },
      }],
    };
    await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[stripe-webhook] Meta CAPI failed', error);
  }
}

// Notificação "nova venda" no WhatsApp do dono (via ZapResponder).
// Só roda se OWNER_WHATSAPP_NUMBER estiver configurado na Vercel.
async function sendNewSaleWhatsapp(session) {
  const to = process.env.OWNER_WHATSAPP_NUMBER;
  if (!to) return;
  try {
    const attr = decodeAttributionRef(session.client_reference_id) || {};
    const value = ((Number(session.amount_total) || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const product = (session.metadata && session.metadata.product) || (session.mode === 'payment' ? 'E-book' : 'App Focão');
    const origem = attr.s || 'direto';
    const campanha = attr.c || '(sem campanha)';
    const pedido = String(session.id || '').replace(/^cs_/, '').slice(-10);
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const message = [
      '💰 NOVA VENDA APROVADA',
      `🛍️ Produto: ${product}`,
      `💵 Valor: R$ ${value}`,
      `🔗 Origem: ${origem}`,
      `📣 Campanha: ${campanha}`,
      `🧾 Pedido: ${pedido}`,
      `🕐 ${hora}`,
    ].join('\n');
    await sendZapResponderMessage({ to, message });
  } catch (error) {
    console.error('[stripe-webhook] nova venda WhatsApp falhou', error);
  }
}

// Telegram: envia mensagem pro grupo configurado (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID).
async function sendTelegram(text, replyMarkup) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const body = { chat_id: chatId, text, disable_web_page_preview: true };
    if (replyMarkup) body.reply_markup = replyMarkup;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[telegram] send failed', error);
  }
}

async function sendNewSaleTelegram(session) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  const attr = decodeAttributionRef(session.client_reference_id) || {};
  const value = ((Number(session.amount_total) || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  const product = (session.metadata && session.metadata.product) || (session.mode === 'payment' ? 'E-book' : 'App Focão');
  const origem = attr.s || 'direto';
  const campanha = attr.c || '(sem campanha)';
  const pedido = String(session.id || '').replace(/^cs_/, '').slice(-10);
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  await sendTelegram([
    '💰 NOVA VENDA APROVADA',
    `🛍️ Produto: ${product}`,
    `💵 Valor: R$ ${value}`,
    `🔗 Origem: ${origem}`,
    `📣 Campanha: ${campanha}`,
    `🧾 Pedido: ${pedido}`,
    `🕐 ${hora}`,
  ].join('\n'));
}

// Um checkout só está "pago" quando payment_status é 'paid' (cartão aprovado) ou
// 'no_payment_required' (trial/cupom 100% — sem cobrança imediata, mas legítimo).
// 'unpaid' = boleto/Pix emitido e ainda NÃO compensado: não entrega nada aqui, espera
// o evento checkout.session.async_payment_succeeded.
function isCheckoutPaid(session) {
  return session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
}

// Entrega o que foi comprado (e-book ou acesso do app) + atribuição/alertas de venda.
// Só é chamado DEPOIS de confirmado o pagamento (completed pago OU async_payment_succeeded).
async function fulfillCheckoutSession(stripe, session, eventId) {
  // Atribuição: o funil envia utm/visitor empacotados no client_reference_id.
  await tagPaymentIntentAttribution(stripe, session);
  // CAPI: avisa o Meta server-side da conversão (melhora otimização dos anúncios).
  await sendMetaCapiPurchase(session);
  // Telegram: alerta de "nova venda" no grupo.
  await sendNewSaleTelegram(session);

  const email = extractEmailFromSession(session);
  if (!email) return { skipped: 'missing_email' };

  // E-book = pagamento único (mode 'payment'). App = assinatura (mode 'subscription').
  // Para a compra do e-book, entregamos o acesso por e-mail e encerramos aqui.
  if (session.mode === 'payment') {
    await sendStripeEmail({
      email,
      eventId,
      kind: 'ebook_delivery',
      template: ebookDeliveryEmail({ downloadUrl: process.env.EBOOK_DOWNLOAD_URL }),
    });
    return { delivered: 'ebook' };
  }

  let subscription = null;
  if (session.subscription) {
    subscription = await stripe.subscriptions.retrieve(session.subscription);
  }

  await upsertClaim(claimPayload({ email, session, subscription }));

  if (subscription?.status === 'trialing') {
    await sendStripeEmail({
      email,
      eventId,
      kind: 'trial_started',
      template: trialStartedEmail({ trialEndsAt: secondsToMs(subscription.trial_end) }),
    });
  }
  return { fulfilled: true };
}

export default async function stripeWebhook(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    res.status(500).send('Stripe environment is not configured.');
    return;
  }

  const stripe = new Stripe(secretKey);
  const signature = req.headers['stripe-signature'];

  let processedEventRef = null;
  try {
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    // Idempotência: o Stripe entrega ao menos uma vez e reentrega em erro/timeout.
    // Marca o event.id de forma atômica; se já foi processado, encerra sem repetir os
    // efeitos colaterais (alertas de venda, CAPI, e-mails, WhatsApp).
    const eventRef = getDb().collection('stripeEvents').doc(event.id);
    try {
      await eventRef.create({ type: event.type, receivedAt: Date.now() });
      processedEventRef = eventRef;
    } catch (dupErr) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Boleto/Pix emitido mas ainda não compensado: NÃO entrega acesso/e-book nem dispara
      // alerta de "venda aprovada". Espera o checkout.session.async_payment_succeeded.
      if (!isCheckoutPaid(session)) {
        res.status(200).json({ received: true, pending: session.payment_status });
        return;
      }
      const result = await fulfillCheckoutSession(stripe, session, event.id);
      res.status(200).json({ received: true, ...result });
      return;
    }

    if (event.type === 'checkout.session.async_payment_succeeded') {
      // Pagamento assíncrono (boleto/Pix) compensou: agora sim entrega o que foi comprado.
      const result = await fulfillCheckoutSession(stripe, event.data.object, event.id);
      res.status(200).json({ received: true, ...result });
      return;
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      await handleSubscriptionEvent(stripe, subscription);

      if (subscription.cancel_at_period_end) {
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;
        await sendStripeEmail({
          email: await getCustomerEmail(stripe, customerId),
          eventId: event.id,
          kind: 'cancellation_scheduled',
          template: cancellationScheduledEmail({
            currentPeriodEnd: secondsToMs(subscription.current_period_end),
          }),
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      await handleSubscriptionEvent(stripe, subscription, 'canceled');
      const customerId = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;
      await sendStripeEmail({
        email: await getCustomerEmail(stripe, customerId),
        eventId: event.id,
        kind: 'subscription_canceled',
        template: subscriptionCanceledEmail(),
      });
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      await handleInvoicePaymentFailed(stripe, invoice);
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;
      await sendStripeEmail({
        email: normalizeEmail(invoice.customer_email) || await getCustomerEmail(stripe, customerId),
        eventId: event.id,
        kind: 'payment_failed',
        template: paymentFailedEmail(),
      });
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;
      const email = normalizeEmail(invoice.customer_email) || await getCustomerEmail(stripe, customerId);

      if (invoice.amount_paid > 0) {
        await sendStripeEmail({
          email,
          eventId: event.id,
          kind: 'subscription_active',
          template: subscriptionActiveEmail(),
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] failed', error);
    // Falhou no meio do processamento: remove o marcador para que a reentrega do
    // Stripe possa reprocessar o evento (senão o pagamento seria perdido).
    if (processedEventRef) {
      await processedEventRef.delete().catch(() => {});
    }
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}
