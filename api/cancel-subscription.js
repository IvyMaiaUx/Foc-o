import Stripe from 'stripe';
import { admin, getDb } from './_firebase.js';

function setCors(req, res) {
  const allowedOrigins = new Set([
    'https://focao.web.app',
    'https://focao-beta.web.app',
    'https://focaoadm.web.app',
    'https://focaoapp.com.br',
    'https://app.focaoapp.com.br', // domínio antigo do front, agora é a própria API — mantido por segurança na transição
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

    // Cancela de fato na Stripe. Antes daqui isto só gravava um pedido e alguém
    // precisava cancelar à mão no painel — quem clicava em cancelar via a
    // confirmação e continuava sendo cobrado até alguém lembrar de olhar. O
    // Decreto 11.034/2022 exige cancelamento pelo mesmo meio da contratação, e é
    // isso que os Termos §11.1 afirmam.
    //
    // cancel_at_period_end em vez de cancelamento imediato: os Termos §11.3 dizem
    // que o acesso continua até o fim do período já pago, e tirar na hora seria
    // retirar acesso que a pessoa pagou.
    let canceladoNaStripe = false;
    let erroStripe = null;

    if (stripeSubscriptionId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const assinatura = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: { comment: reason || 'Cancelamento solicitado pelo app' },
        });
        canceladoNaStripe = assinatura.cancel_at_period_end === true;

        await db.collection('users').doc(decoded.uid).set(
          {
            subscription: {
              cancelAtPeriodEnd: true,
              canceledAt: Date.now(),
              currentPeriodEnd: assinatura.current_period_end
                ? assinatura.current_period_end * 1000
                : userData?.subscription?.currentPeriodEnd || null,
            },
            updatedAt: Date.now(),
          },
          { merge: true },
        );
      } catch (err) {
        // Não engolir: se a Stripe recusou, a pessoa NÃO está cancelada e
        // precisa saber disso em vez de ver uma confirmação falsa.
        erroStripe = err?.message || 'falha ao cancelar na Stripe';
        console.error('[cancel-subscription] Stripe update falhou', err);
      }
    } else if (!stripeSubscriptionId) {
      erroStripe = 'usuário sem stripeSubscriptionId';
    } else {
      erroStripe = 'STRIPE_SECRET_KEY não configurada';
    }

    // A coleção continua existindo como registro e trilha de auditoria — ela só
    // deixou de ser o mecanismo do cancelamento.
    const cancellationRef = db.collection('cancellations').doc();
    await cancellationRef.set({
      userId: decoded.uid,
      userEmail: email,
      userName: userName,
      dogName: dogName || 'Sem nome',
      reason: reason || 'Não informado',
      feedback: feedback || '',
      stripeSubscriptionId: stripeSubscriptionId || null,
      canceladoNaStripe,
      erroStripe,
      createdAt: Date.now(),
    });

    if (!canceladoNaStripe) {
      res.status(502).json({
        error: 'stripe_cancel_failed',
        message: 'Registramos seu pedido, mas não conseguimos concluir o cancelamento agora. '
          + 'Nossa equipe vai finalizar e confirmar por e-mail.',
      });
      return;
    }

    res.status(200).json({ success: true, cancelAtPeriodEnd: true });
  } catch (error) {
    console.error('[cancel-subscription] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
