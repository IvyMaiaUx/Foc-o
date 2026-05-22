import Stripe from 'stripe';
import { getDb, emailKey } from './_firebase.js';
import { readRawBody } from './_rawBody.js';

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

function claimPayload({ email, session, subscription }) {
  const status = subscription?.status || 'active';
  const isTrialing = status === 'trialing';
  const isActive = status === 'active' || isTrialing;
  const trialEndsAt = secondsToMs(subscription?.trial_end) || (isTrialing ? nowMs() + 7 * DAY_MS : undefined);
  const currentPeriodEnd = secondsToMs(subscription?.current_period_end);

  return {
    email,
    plan: isTrialing ? 'trial' : 'premium',
    status: isTrialing ? 'trialing' : isActive ? 'active' : status,
    premiumAccess: isActive,
    trialEndsAt: trialEndsAt || null,
    currentPeriodEnd: currentPeriodEnd || null,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
    stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : subscription?.id || null,
    stripeCheckoutSessionId: session.id,
    source: 'stripe_email_claim',
    claimed: false,
    createdAt: nowMs(),
    updatedAt: nowMs(),
  };
}

async function upsertClaim(payload) {
  const db = getDb();
  const key = emailKey(payload.email);
  const claimRef = db.collection('premiumClaims').doc(key);
  await claimRef.set(payload, { merge: true });

  const usersSnap = await db.collection('users')
    .where('email', '==', payload.email)
    .limit(1)
    .get();

  if (!usersSnap.empty) {
    const userDoc = usersSnap.docs[0];
    await userDoc.ref.set({
      subscriptionTier: payload.plan,
      trialEndsAt: payload.trialEndsAt || 0,
      subscription: {
        plan: payload.plan,
        status: payload.status,
        premiumAccess: payload.premiumAccess,
        trialEndsAt: payload.trialEndsAt || null,
        currentPeriodEnd: payload.currentPeriodEnd || null,
        stripeCustomerId: payload.stripeCustomerId || null,
        stripeSubscriptionId: payload.stripeSubscriptionId || null,
        accessSource: payload.source,
        updatedAt: nowMs(),
      },
      updatedAt: nowMs(),
    }, { merge: true });

    await claimRef.set({
      claimed: true,
      claimedUid: userDoc.id,
      claimedAt: nowMs(),
      updatedAt: nowMs(),
    }, { merge: true });
  }
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

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[stripe-webhook] failed', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}
