import Stripe from 'stripe';
import { admin, getDb } from './_firebase.js';

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

export default async function customerPortal(req, res) {
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

    const db = getDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const customerId = userData?.subscription?.stripeCustomerId;

    if (!customerId) {
      res.status(400).json({ error: 'No Stripe customer associated with this account.' });
      return;
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      res.status(500).json({ error: 'Stripe is not configured.' });
      return;
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: req.body.returnUrl || 'https://focao.web.app/assinatura',
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('[customer-portal] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
