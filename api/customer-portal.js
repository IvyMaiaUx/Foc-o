import Stripe from 'stripe';
import { admin, getDb } from './_firebase.js';
import {
  REFUND_REASONS,
  REFUND_WINDOW_DAYS,
  RefundError,
  approveRefundRequest,
  cancelRefundRequest,
  createRefundRequest,
  getUserRefundRequest,
  getUserRequestsByCharge,
  guardRefundRate,
  listUserRefundRequests,
  listUserCharges,
  markUnderReview,
  rejectRefundRequest,
  requestMoreInformation,
  resolveAdminActor,
  setRefundCors,
} from './_refunds.js';

// Este arquivo concentra TUDO que é billing (portal da Stripe, histórico de cobranças e
// reembolsos) porque o projeto está no limite de 12 funções serverless do plano Hobby da
// Vercel. As rotas bonitas (/api/billing-charges, /api/refund-request, /api/admin-refund)
// são rewrites em vercel.json apontando pra cá com ?mode=, igual ao /api/process-referral.
function setCors(req, res) {
  setRefundCors(req, res);
}

// Token ausente, expirado ou forjado tem o mesmo desfecho: 401, sem virar erro 500.
async function verifyUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

function getStripe(res) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({ error: 'Stripe is not configured.' });
    return null;
  }
  return new Stripe(secretKey);
}

function sendRefundError(res, error, context) {
  if (error instanceof RefundError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  console.error(`[${context}] failed`, error);
  res.status(500).json({ error: 'Internal error' });
}

// --- Portal de cobrança da Stripe (comportamento original deste endpoint) -------------

async function handleBillingPortal(req, res, decoded) {
  const db = getDb();
  const userDoc = await db.collection('users').doc(decoded.uid).get();
  if (!userDoc.exists) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const customerId = userDoc.data()?.subscription?.stripeCustomerId;
  if (!customerId) {
    res.status(400).json({ error: 'No Stripe customer associated with this account.' });
    return;
  }

  const stripe = getStripe(res);
  if (!stripe) return;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: req.body.returnUrl || 'https://focao.web.app/assinatura',
  });

  res.status(200).json({ url: session.url });
}

// --- Histórico de cobranças do próprio usuário ---------------------------------------

async function handleCharges(req, res, decoded) {
  const db = getDb();
  const userDoc = await db.collection('users').doc(decoded.uid).get();
  if (!userDoc.exists) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const customerId = userDoc.data()?.subscription?.stripeCustomerId;
  if (!customerId) {
    res.status(200).json({ charges: [], reasons: REFUND_REASONS, refundWindowDays: REFUND_WINDOW_DAYS });
    return;
  }

  const stripe = getStripe(res);
  if (!stripe) return;

  const [charges, requestsByCharge] = await Promise.all([
    listUserCharges(stripe, customerId),
    getUserRequestsByCharge(db, decoded.uid),
  ]);

  res.status(200).json({
    refundWindowDays: REFUND_WINDOW_DAYS,
    reasons: REFUND_REASONS,
    charges: charges.map((charge) => {
      const request = requestsByCharge.get(charge.chargeId) || null;
      // Só o que a tela precisa: nada de id de cliente, invoice ou payment intent.
      return {
        chargeId: charge.chargeId,
        amount: charge.amount,
        currency: charge.currency,
        createdAt: charge.createdAt,
        paid: charge.paid,
        refunded: charge.refunded,
        cardBrand: charge.cardBrand,
        cardLast4: charge.cardLast4,
        description: charge.description,
        eligible: charge.eligible && !request,
        ineligibleReason: request ? 'has_request' : charge.ineligibleReason,
        request,
      };
    }),
  });
}

// --- Ações do usuário sobre a própria solicitação -------------------------------------

async function handleUserRefundAction(req, res, decoded) {
  const db = getDb();
  const action = req.body?.action || 'create';

  if (action === 'get') {
    const result = await getUserRefundRequest(db, decoded.uid, String(req.body?.protocol || ''));
    res.status(200).json(result);
    return;
  }

  if (action === 'list') {
    res.status(200).json({ requests: await listUserRefundRequests(db, decoded.uid) });
    return;
  }

  if (action === 'cancel') {
    const result = await cancelRefundRequest(db, String(req.body?.protocol || ''), { uid: decoded.uid });
    res.status(200).json({ protocol: result.protocol, status: result.status });
    return;
  }

  if (action !== 'create') {
    res.status(400).json({ error: 'Ação inválida.' });
    return;
  }

  const allowed = await guardRefundRate(req, decoded.uid);
  if (!allowed) {
    res.status(429).json({ error: 'Muitas solicitações em pouco tempo. Tente de novo mais tarde.' });
    return;
  }

  const stripe = getStripe(res);
  if (!stripe) return;

  const result = await createRefundRequest({
    db,
    stripe,
    user: { uid: decoded.uid, email: decoded.email },
    chargeId: req.body?.chargeId,
    reason: req.body?.reason,
    description: req.body?.description,
  });

  res.status(201).json(result);
}

// --- Ações do admin -------------------------------------------------------------------

async function handleAdminRefundAction(req, res) {
  const db = getDb();
  const actor = await resolveAdminActor(req, db);
  if (!actor) {
    res.status(403).json({ error: 'Acesso restrito.' });
    return;
  }

  const protocol = String(req.body?.protocol || '');
  if (!protocol) {
    res.status(400).json({ error: 'Protocolo obrigatório.' });
    return;
  }

  switch (req.body?.action) {
    case 'approve': {
      // Mexer em dinheiro é exclusivo de Super Admin — validado aqui, não na tela.
      if (!actor.isSuperAdmin) {
        res.status(403).json({ error: 'Só um Super Admin pode aprovar reembolsos.' });
        return;
      }
      const stripe = getStripe(res);
      if (!stripe) return;
      const result = await approveRefundRequest({ db, stripe, protocol, actor });
      res.status(200).json(result);
      return;
    }
    case 'reject': {
      const result = await rejectRefundRequest(db, protocol, actor, req.body?.rejectionReason);
      res.status(200).json({ protocol, status: result.status });
      return;
    }
    case 'request_info': {
      const result = await requestMoreInformation(db, protocol, actor, req.body?.note);
      res.status(200).json({ protocol, status: result.status });
      return;
    }
    case 'under_review': {
      const result = await markUnderReview(db, protocol, actor);
      res.status(200).json({ protocol, status: result.status });
      return;
    }
    default:
      res.status(400).json({ error: 'Ação inválida.' });
  }
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

  const mode = String(req.query?.mode || '');

  try {
    if (mode === 'admin-refund') {
      await handleAdminRefundAction(req, res);
      return;
    }

    const decoded = await verifyUser(req);
    if (!decoded?.uid) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }

    if (mode === 'charges') {
      await handleCharges(req, res, decoded);
      return;
    }
    if (mode === 'refund-request') {
      await handleUserRefundAction(req, res, decoded);
      return;
    }

    await handleBillingPortal(req, res, decoded);
  } catch (error) {
    sendRefundError(res, error, mode ? `customer-portal:${mode}` : 'customer-portal');
  }
}
