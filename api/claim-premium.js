import { admin, getDb, emailKey } from './_firebase.js';

function nowMs() {
  return Date.now();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function setCors(req, res) {
  const allowedOrigins = new Set([
    'https://focao.web.app',
    'https://foc-o.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function verifyUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  return admin.auth().verifyIdToken(token);
}

export default async function claimPremium(req, res) {
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
    if (!decoded?.uid || !decoded.email) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    const email = normalizeEmail(decoded.email);
    const db = getDb();
    const claimRef = db.collection('premiumClaims').doc(emailKey(email));
    const claimSnap = await claimRef.get();

    if (!claimSnap.exists) {
      res.status(200).json({ claimed: false });
      return;
    }

    const claim = claimSnap.data();
    if (!claim?.premiumAccess) {
      res.status(200).json({ claimed: false });
      return;
    }

    await db.collection('users').doc(decoded.uid).set({
      subscriptionTier: claim.plan,
      trialEndsAt: claim.trialEndsAt || 0,
      subscription: {
        plan: claim.plan,
        status: claim.status,
        premiumAccess: true,
        trialEndsAt: claim.trialEndsAt || null,
        currentPeriodEnd: claim.currentPeriodEnd || null,
        stripeCustomerId: claim.stripeCustomerId || null,
        stripeSubscriptionId: claim.stripeSubscriptionId || null,
        accessSource: claim.source || 'stripe_email_claim',
        updatedAt: nowMs(),
      },
      updatedAt: nowMs(),
    }, { merge: true });

    await claimRef.set({
      claimed: true,
      claimedUid: decoded.uid,
      claimedAt: nowMs(),
      updatedAt: nowMs(),
    }, { merge: true });

    res.status(200).json({ claimed: true });
  } catch (error) {
    console.error('[claim-premium] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
