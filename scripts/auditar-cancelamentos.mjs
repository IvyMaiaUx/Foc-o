/**
 * Cruza a coleção `cancellations` com o estado real das assinaturas na Stripe.
 *
 * Existe porque o pedido de cancelamento feito no app NÃO cancela nada na Stripe:
 * `api/cancel-subscription.js` só grava um registro, e alguém precisa cancelar à
 * mão. Enquanto isso não acontece, a pessoa clicou em cancelar, viu confirmação
 * e continua sendo cobrada.
 *
 * Este script é SOMENTE LEITURA. Ele não cancela nem estorna nada — apenas
 * mostra quem pediu cancelamento e segue ativo, e quanto foi cobrado depois do
 * pedido.
 *
 * Como rodar:
 *   1. Tenha um arquivo .env com STRIPE_SECRET_KEY e FIREBASE_SERVICE_ACCOUNT_JSON
 *      (dá para puxar da Vercel com: vercel env pull .env --environment=production)
 *   2. node --env-file=.env scripts/auditar-cancelamentos.mjs
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const FALTANDO = ['STRIPE_SECRET_KEY', 'FIREBASE_SERVICE_ACCOUNT_JSON'].filter((k) => !process.env[k]);
if (FALTANDO.length) {
  console.error(`Faltam variáveis de ambiente: ${FALTANDO.join(', ')}`);
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
  });
}
const db = getFirestore(
  admin.app(),
  process.env.FIRESTORE_DATABASE_ID || 'ai-studio-ececf2d5-e671-43f3-8f2c-ce258672a8e7',
);

const brl = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (ms) => new Date(ms).toLocaleDateString('pt-BR');

const snap = await db.collection('cancellations').orderBy('createdAt', 'desc').get();
console.log(`\n${snap.size} pedido(s) de cancelamento registrados.\n`);

const problemas = [];
let totalIndevido = 0;

for (const doc of snap.docs) {
  const pedido = doc.data();
  const linha = {
    email: pedido.userEmail || pedido.userId,
    pedidoEm: pedido.createdAt,
    subId: pedido.stripeSubscriptionId,
  };

  if (!linha.subId) {
    problemas.push({ ...linha, status: 'sem stripeSubscriptionId no registro', cobrado: 0, cobrancas: 0 });
    continue;
  }

  let assinatura;
  try {
    assinatura = await stripe.subscriptions.retrieve(linha.subId);
  } catch (erro) {
    problemas.push({ ...linha, status: `nao encontrada na Stripe (${erro.code || erro.message})`, cobrado: 0, cobrancas: 0 });
    continue;
  }

  const aindaAtiva = ['active', 'trialing', 'past_due', 'unpaid'].includes(assinatura.status);
  const vaiCancelar = assinatura.cancel_at_period_end === true;

  // Cobranças que passaram DEPOIS do pedido: é o dinheiro que saiu indevidamente.
  const faturas = await stripe.invoices.list({
    subscription: linha.subId,
    created: { gte: Math.floor(pedido.createdAt / 1000) },
    limit: 100,
  });
  const pagas = faturas.data.filter((f) => f.status === 'paid' && f.amount_paid > 0);
  const cobrado = pagas.reduce((soma, f) => soma + f.amount_paid, 0);

  if (aindaAtiva && !vaiCancelar) {
    totalIndevido += cobrado;
    problemas.push({
      ...linha,
      status: `ATIVA na Stripe (${assinatura.status})`,
      cobrado,
      cobrancas: pagas.length,
    });
  } else if (cobrado > 0) {
    totalIndevido += cobrado;
    problemas.push({
      ...linha,
      status: `cancelada, mas houve cobranca apos o pedido (${assinatura.status})`,
      cobrado,
      cobrancas: pagas.length,
    });
  }
}

if (!problemas.length) {
  console.log('Nenhum pedido de cancelamento sem cancelamento correspondente. Nada a fazer.\n');
} else {
  console.log('PEDIDOS SEM CANCELAMENTO CORRESPONDENTE\n');
  for (const p of problemas) {
    console.log(`  ${p.email}`);
    console.log(`    pedido em ....... ${data(p.pedidoEm)}`);
    console.log(`    assinatura ...... ${p.subId || '-'}`);
    console.log(`    situacao ........ ${p.status}`);
    console.log(`    cobrado depois .. ${p.cobrancas} fatura(s), ${brl(p.cobrado)}`);
    console.log('');
  }
  console.log(`  TOTAL cobrado apos pedido de cancelamento: ${brl(totalIndevido)}`);
  console.log('\n  Nenhuma acao foi tomada por este script. Cancelar e estornar na Stripe.\n');
}

process.exit(0);
