import { describe, it, expect, vi, beforeEach } from 'vitest';

const constructEvent = vi.fn();
const refundsCreate = vi.fn();
const handleRefundWebhookEvent = vi.fn(async () => ({ status: 'refunded' }));

vi.mock('stripe', () => ({
  default: class FakeStripe {
    constructor() {
      this.webhooks = { constructEvent };
      this.refunds = { create: refundsCreate };
      this.subscriptions = { retrieve: vi.fn() };
      this.customers = { retrieve: vi.fn() };
    }
  },
}));

vi.mock('./_firebase.js', () => ({
  admin: { auth: () => ({ verifyIdToken: vi.fn() }) },
  getDb: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) }),
  emailKey: (email) => email,
}));

vi.mock('./_rawBody.js', () => ({
  readRawBody: vi.fn(async () => Buffer.from('{"corpo":"bruto"}')),
}));

vi.mock('./_email.js', () => ({
  sendEmail: vi.fn(),
  paymentFailedEmail: vi.fn(),
  subscriptionCanceledEmail: vi.fn(),
}));

vi.mock('./_refunds.js', () => ({ handleRefundWebhookEvent }));

const { default: stripeWebhook } = await import('./stripe-webhook.js');
const { readRawBody } = await import('./_rawBody.js');

function makeRes() {
  return {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    send(payload) { this.body = payload; return this; },
  };
}

function makeReq(signature = 'assinatura-valida') {
  return { method: 'POST', headers: { 'stripe-signature': signature } };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
});

describe('webhook da Stripe — eventos de reembolso', () => {
  it('rejeita assinatura inválida sem processar nada', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = makeRes();
    await stripeWebhook(makeReq('assinatura-forjada'), res);

    expect(res.statusCode).toBe(400);
    expect(handleRefundWebhookEvent).not.toHaveBeenCalled();
  });

  it('valida a assinatura com o corpo BRUTO e o segredo do ambiente', async () => {
    constructEvent.mockReturnValue({ id: 'evt_1', type: 'refund.updated', data: { object: {} } });

    await stripeWebhook(makeReq(), makeRes());

    expect(readRawBody).toHaveBeenCalled();
    const [rawBody, signature, secret] = constructEvent.mock.calls[0];
    expect(Buffer.isBuffer(rawBody)).toBe(true);
    expect(signature).toBe('assinatura-valida');
    expect(secret).toBe('whsec_fake');
  });

  it('encaminha os eventos de reembolso e NUNCA cria reembolso a partir do webhook', async () => {
    for (const type of ['refund.created', 'refund.updated', 'refund.failed', 'charge.refunded', 'charge.refund.updated']) {
      constructEvent.mockReturnValue({ id: `evt_${type}`, type, data: { object: {} } });
      const res = makeRes();
      await stripeWebhook(makeReq(), res);
      expect(res.statusCode).toBe(200);
    }

    expect(handleRefundWebhookEvent).toHaveBeenCalledTimes(5);
    expect(refundsCreate).not.toHaveBeenCalled();
  });

  it('ignora eventos que não são de reembolso', async () => {
    constructEvent.mockReturnValue({ id: 'evt_x', type: 'payment_intent.succeeded', data: { object: {} } });

    const res = makeRes();
    await stripeWebhook(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(handleRefundWebhookEvent).not.toHaveBeenCalled();
  });

  it('recusa método diferente de POST', async () => {
    const res = makeRes();
    await stripeWebhook({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('não processa nada se o ambiente da Stripe não estiver configurado', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = makeRes();
    await stripeWebhook(makeReq(), res);
    expect(res.statusCode).toBe(500);
    expect(handleRefundWebhookEvent).not.toHaveBeenCalled();
  });
});
