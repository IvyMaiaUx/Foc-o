import { admin, getDb } from './_firebase.js';

function setCors(req, res) {
  const allowedOrigins = new Set([
    'https://focao.web.app',
    'https://focao-beta.web.app',
    'https://focaoadm.web.app',
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

export default async function cancelSubscription(req, res) {
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

    const { reason, feedback } = req.body;

    const db = getDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const stripeSubscriptionId = userData?.subscription?.stripeSubscriptionId;
    const email = userData?.email || decoded.email || '';
    
    // Fetch dog profile name from subcollection to enrich the cancellation log
    let dogName = userData?.dogProfile?.name || userData?.dogName || '';
    if (!dogName) {
      try {
        const dogProfileSnap = await db.collection('users').doc(decoded.uid).collection('dog').doc('profile').get();
        if (dogProfileSnap.exists) {
          dogName = dogProfileSnap.data()?.name || '';
        } else {
          const dogsSnap = await db.collection('users').doc(decoded.uid).collection('dogs').limit(1).get();
          if (!dogsSnap.empty) {
            dogName = dogsSnap.docs[0].data()?.name || '';
          }
        }
      } catch (err) {
        console.error('Error fetching dog name for cancellation log:', err);
      }
    }
    
    const userName = userData?.name || userData?.userName || 'Sem nome';

    // Record the cancellation request in the cancellations collection.
    // This does NOT touch Stripe or the user's access — an admin reviews the
    // request in the painel admin and cancels manually (Stripe stays source of truth).
    const cancellationRef = db.collection('cancellations').doc();
    await cancellationRef.set({
      userId: decoded.uid,
      userEmail: email,
      userName: userName,
      dogName: dogName || 'Sem nome',
      reason: reason || 'Não informado',
      feedback: feedback || '',
      stripeSubscriptionId: stripeSubscriptionId || null,
      createdAt: Date.now(),
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[cancel-subscription] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
