import Stripe from 'stripe';
import { getDb, emailKey } from './_firebase.js';
import { readRawBody } from './_rawBody.js';
import { sendEmail, paymentFailedEmail, subscriptionCanceledEmail } from './_email.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const APP_URL = 'https://focaoapp.com.br';

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

function subscriptionAccess(subscription, fallbackStatus = 'active') {
  const status = subscription?.status || fallbackStatus;
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
  }
}

async function getCustomerEmail(stripe, customerId) {
  if (!customerId) return '';
  const customer = await stripe.customers.retrieve(customerId);
  if (customer?.deleted) return '';
  return normalizeEmail(customer.email);
}

async function lookupUserByEmail(db, email) {
  if (!email) return null;
  const snap = await db.collection('users').where('email', '==', email).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

// E-mail de cobrança/cancelamento nunca deve derrubar o webhook — se o Resend falhar,
// a Stripe não pode ficar re-tentando o evento por causa disso (o dado de assinatura
// já foi salvo pelo upsertClaim antes dessa chamada).
async function sendLifecycleEmailSafely(email, buildEmail) {
  if (!email) return;
  try {
    const db = getDb();
    const userDoc = await lookupUserByEmail(db, email);
    const user = userDoc?.data();
    if (user?.emailOptOut === true) return;
    const dogProfileSnap = userDoc ? await userDoc.ref.collection('dog').doc('profile').get() : null;
    const dogName = dogProfileSnap?.data()?.name || user?.dogName || 'seu cão';
    await sendEmail({ to: email, ...buildEmail(dogName) });
  } catch (error) {
    console.error('[stripe-webhook] lifecycle email failed', error);
  }
}

async function handleSubscriptionEvent(stripe, subscription, fallbackStatus, { notifyCancellation } = {}) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id;
  const email = await getCustomerEmail(stripe, customerId);
  await upsertClaim(subscriptionPayload({ email, customerId, subscription, fallbackStatus }));

  if (notifyCancellation) {
    await sendLifecycleEmailSafely(email, (dogName) =>
      subscriptionCanceledEmail({ dogName, actionUrl: `${APP_URL}/assinatura` }));
  }
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

  await sendLifecycleEmailSafely(email, (dogName) =>
    paymentFailedEmail({ dogName, actionUrl: `${APP_URL}/assinatura` }));
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

  try {
    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = extractEmailFromSession(session);
      if (!email) {
        res.status(200).json({ received: true, skipped: 'missing_email' });
        return;
      }

      let subscription = null;
      if (session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription);
      }

      await upsertClaim(claimPayload({ email, session, subscription }));
    }

    if (event.type === 'customer.subscription.updated') {
      await handleSubscriptionEvent(stripe, event.data.object);
    }

    if (event.type === 'customer.subscription.deleted') {
      await handleSubscriptionEvent(stripe, event.data.object, 'canceled', { notifyCancellation: true });
    }

    if (event.type === 'invoice.payment_failed') {
      await handleInvoicePaymentFailed(stripe, event.data.object);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] failed', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}
