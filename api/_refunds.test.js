import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFakeDb, docsUnder } from './_fakeFirestore.js';

vi.mock('./_firebase.js', () => ({
  admin: { auth: () => ({ verifyIdToken: vi.fn() }) },
  getDb: () => createFakeDb(),
}));

vi.mock('./_email.js', () => ({
  sendEmail: vi.fn(async () => ({ id: 'email_1' })),
  refundRequestedEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
  refundStatusEmail: vi.fn(() => ({ subject: 's', html: 'h' })),
}));

vi.mock('./_rateLimit.js', () => ({
  clientIp: () => '1.2.3.4',
  withinRateLimit: vi.fn(async () => true),
}));

const {
  REFUND_STATUS,
  approveRefundRequest,
  cancelRefundRequest,
  createRefundRequest,
  generateProtocol,
  getUserRefundRequest,
  handleRefundWebhookEvent,
  isWithinRefundWindow,
  rejectRefundRequest,
  requestMoreInformation,
  toUserView,
} = await import('./_refunds.js');

const { sendEmail } = await import('./_email.js');

const DAY_MS = 24 * 60 * 60 * 1000;
const OWNER = { uid: 'uid-1', email: 'tutor@exemplo.com' };

function makeCharge(overrides = {}) {
  return {
    id: 'ch_valida',
    customer: 'cus_1',
    payment_intent: 'pi_1',
    invoice: 'in_1',
    amount: 4700,
    amount_refunded: 0,
    currency: 'brl',
    created: Math.floor((Date.now() - DAY_MS) / 1000),
    description: 'Focão Premium',
    paid: true,
    status: 'succeeded',
    refunded: false,
    payment_method_details: { card: { brand: 'visa', last4: '4242' } },
    ...overrides,
  };
}

function makeDb() {
  return createFakeDb({
    'users/uid-1': {
      email: 'tutor@exemplo.com',
      name: 'Tutor Exemplo',
      subscription: { stripeCustomerId: 'cus_1', stripeSubscriptionId: 'sub_1' },
    },
    'users/uid-2': {
      email: 'outro@exemplo.com',
      name: 'Outra Pessoa',
      subscription: { stripeCustomerId: 'cus_2' },
    },
  });
}

function makeStripe(charge = makeCharge(), refund = { id: 're_1', status: 'pending' }) {
  return {
    charges: { retrieve: vi.fn(async () => charge) },
    refunds: { create: vi.fn(async () => refund) },
  };
}

async function seedRequest(db, stripe = makeStripe()) {
  return createRefundRequest({
    db,
    stripe,
    user: OWNER,
    chargeId: 'ch_valida',
    reason: 'not_as_expected',
    description: 'Não era o que eu esperava.',
  });
}

const SUPER_ADMIN = { uid: 'admin-1', email: 'focaosupport@gmail.com', isAdmin: true, isSuperAdmin: true };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('protocolo', () => {
  it('segue o formato FOC-AAAAMMDD-XXXXX, sem sequência e sem dado pessoal', () => {
    const protocol = generateProtocol(new Date('2026-08-18T15:00:00Z'));
    expect(protocol).toMatch(/^FOC-\d{8}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/);
    expect(protocol).not.toBe(generateProtocol(new Date('2026-08-18T15:00:00Z')));
  });

  it('respeita a janela de 7 dias', () => {
    expect(isWithinRefundWindow(Date.now() - 6 * DAY_MS)).toBe(true);
    expect(isWithinRefundWindow(Date.now() - 8 * DAY_MS)).toBe(false);
  });
});

describe('usuário cria solicitação', () => {
  it('registra o pedido como "requested", com valor vindo da Stripe e evento no histórico', async () => {
    const db = makeDb();
    const result = await seedRequest(db);

    expect(result.status).toBe(REFUND_STATUS.REQUESTED);
    const saved = db.store.get(`refundRequests/${result.protocol}`);
    expect(saved).toMatchObject({
      userId: 'uid-1',
      status: 'requested',
      amount: 4700,
      currency: 'brl',
      stripeChargeId: 'ch_valida',
      stripePaymentIntentId: 'pi_1',
      stripeRefundId: null,
      cardLast4: '4242',
    });
    expect(docsUnder(db, `refundRequests/${result.protocol}/events/`)).toHaveLength(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('ignora valor mandado pelo cliente — o amount é sempre o da cobrança na Stripe', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const result = await createRefundRequest({
      db,
      stripe,
      user: OWNER,
      chargeId: 'ch_valida',
      reason: 'other',
      description: '',
      amount: 999999,
    });
    expect(db.store.get(`refundRequests/${result.protocol}`).amount).toBe(4700);
  });

  it('recusa cobrança de outra conta', async () => {
    const db = makeDb();
    const stripe = makeStripe(makeCharge({ customer: 'cus_2' }));
    await expect(seedRequest(db, stripe)).rejects.toMatchObject({ status: 403, code: 'charge_not_owned' });
    expect(docsUnder(db, 'refundRequests/')).toHaveLength(0);
  });

  it('recusa cobrança fora do prazo', async () => {
    const db = makeDb();
    const stripe = makeStripe(makeCharge({ created: Math.floor((Date.now() - 10 * DAY_MS) / 1000) }));
    await expect(seedRequest(db, stripe)).rejects.toMatchObject({ code: 'window_expired' });
  });

  it('impede duas solicitações ativas para a mesma cobrança', async () => {
    const db = makeDb();
    await seedRequest(db);
    await expect(seedRequest(db)).rejects.toMatchObject({ status: 409, code: 'duplicate_request' });
  });

  it('recusa motivo fora da lista', async () => {
    const db = makeDb();
    await expect(
      createRefundRequest({ db, stripe: makeStripe(), user: OWNER, chargeId: 'ch_valida', reason: 'inventado' }),
    ).rejects.toMatchObject({ code: 'invalid_reason' });
  });
});

describe('usuário acompanha a solicitação', () => {
  it('vê protocolo, status e histórico', async () => {
    const db = makeDb();
    const { protocol } = await seedRequest(db);
    const view = await getUserRefundRequest(db, 'uid-1', protocol);

    expect(view.request.protocol).toBe(protocol);
    expect(view.request.status).toBe('requested');
    expect(view.events).toHaveLength(1);
    expect(view.events[0].toStatus).toBe('requested');
  });

  it('rejeita protocolo com formato inválido antes de tocar no banco', async () => {
    const db = makeDb();
    await expect(getUserRefundRequest(db, 'uid-1', 'refundRequests/../users/uid-2')).rejects.toMatchObject({
      status: 400,
      code: 'invalid_protocol',
    });
  });

  it('não enxerga a solicitação de outra conta', async () => {
    const db = makeDb();
    const { protocol } = await seedRequest(db);
    await expect(getUserRefundRequest(db, 'uid-2', protocol)).rejects.toMatchObject({ status: 404 });
  });

  it('não recebe dado interno do painel', () => {
    const view = toUserView('FOC-20260818-AAAAA', {
      status: 'processing',
      amount: 4700,
      adminEmail: 'focaosupport@gmail.com',
      adminId: 'admin-1',
      stripeRefundId: 're_1',
      stripeChargeId: 'ch_valida',
      stripeCustomerId: 'cus_1',
      idempotencyKey: 'refund_request_FOC-20260818-AAAAA',
      lastError: 'stack interno',
    });

    expect(view).not.toHaveProperty('adminEmail');
    expect(view).not.toHaveProperty('adminId');
    expect(view).not.toHaveProperty('stripeRefundId');
    expect(view).not.toHaveProperty('stripeChargeId');
    expect(view).not.toHaveProperty('stripeCustomerId');
    expect(view).not.toHaveProperty('idempotencyKey');
    expect(view).not.toHaveProperty('lastError');
  });

  it('deixa o usuário cancelar a própria solicitação, mas não a dos outros', async () => {
    const db = makeDb();
    const { protocol } = await seedRequest(db);

    await expect(cancelRefundRequest(db, protocol, { uid: 'uid-2' })).rejects.toMatchObject({ status: 404 });
    const canceled = await cancelRefundRequest(db, protocol, { uid: 'uid-1' });
    expect(canceled.status).toBe('canceled');
  });
});

describe('admin recusa', () => {
  it('exige motivo', async () => {
    const db = makeDb();
    const { protocol } = await seedRequest(db);
    await expect(rejectRefundRequest(db, protocol, SUPER_ADMIN, '   ')).rejects.toMatchObject({
      status: 400,
      code: 'reason_required',
    });
    expect(db.store.get(`refundRequests/${protocol}`).status).toBe('requested');
  });

  it('grava o motivo, resolve a solicitação e NÃO chama a Stripe', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await seedRequest(db, stripe);

    await rejectRefundRequest(db, protocol, SUPER_ADMIN, 'Fora da política de reembolso.');

    const saved = db.store.get(`refundRequests/${protocol}`);
    expect(saved.status).toBe('rejected');
    expect(saved.rejectionReason).toBe('Fora da política de reembolso.');
    expect(saved.resolvedAt).toBeTruthy();
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });

  it('não recusa uma solicitação já enviada à Stripe', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await seedRequest(db, stripe);
    await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });

    await expect(rejectRefundRequest(db, protocol, SUPER_ADMIN, 'mudei de ideia')).rejects.toMatchObject({
      code: 'invalid_status',
    });
  });
});

describe('admin aprova', () => {
  it('cria o reembolso na Stripe uma única vez, com chave de idempotência da solicitação', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await seedRequest(db, stripe);

    const result = await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });

    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
    const [params, options] = stripe.refunds.create.mock.calls[0];
    expect(params).toMatchObject({ payment_intent: 'pi_1', reason: 'requested_by_customer' });
    expect(params.amount).toBeUndefined(); // reembolso integral
    expect(options).toEqual({ idempotencyKey: `refund_request_${protocol}` });

    // Nunca vai direto para "refunded": isso é papel do webhook.
    expect(result.status).toBe(REFUND_STATUS.PROCESSING);
    const saved = db.store.get(`refundRequests/${protocol}`);
    expect(saved).toMatchObject({ status: 'processing', stripeRefundId: 're_1', adminEmail: SUPER_ADMIN.email });
  });

  it('marca cobrança duplicada com o motivo `duplicate` da Stripe', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await createRefundRequest({
      db,
      stripe,
      user: OWNER,
      chargeId: 'ch_valida',
      reason: 'duplicate_charge',
    });

    await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });
    expect(stripe.refunds.create.mock.calls[0][0].reason).toBe('duplicate');
  });

  it('não aprova duas vezes', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await seedRequest(db, stripe);

    await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });
    await expect(approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN })).rejects.toMatchObject({
      status: 409,
      code: 'already_refunded',
    });

    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
  });

  it('não aprova uma solicitação já recusada', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await seedRequest(db, stripe);
    await rejectRefundRequest(db, protocol, SUPER_ADMIN, 'fora da política');

    await expect(approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN })).rejects.toMatchObject({
      code: 'invalid_status',
    });
    expect(stripe.refunds.create).not.toHaveBeenCalled();
  });

  it('erro da Stripe deixa a solicitação em `failed`, com o erro registrado', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    stripe.refunds.create.mockRejectedValueOnce(new Error('charge_already_refunded'));
    const { protocol } = await seedRequest(db, stripe);

    await expect(approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN })).rejects.toMatchObject({
      status: 502,
      code: 'stripe_error',
    });

    const saved = db.store.get(`refundRequests/${protocol}`);
    expect(saved.status).toBe('failed');
    expect(saved.lastError).toContain('charge_already_refunded');
    expect(saved.stripeRefundId).toBeNull();
  });

  it('nova tentativa depois da falha usa uma chave de idempotência diferente', async () => {
    const db = makeDb();
    const stripe = makeStripe();
    stripe.refunds.create.mockRejectedValueOnce(new Error('rede caiu'));
    const { protocol } = await seedRequest(db, stripe);

    await expect(approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN })).rejects.toBeTruthy();
    await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });

    expect(stripe.refunds.create.mock.calls[0][1]).toEqual({ idempotencyKey: `refund_request_${protocol}` });
    expect(stripe.refunds.create.mock.calls[1][1]).toEqual({ idempotencyKey: `refund_request_${protocol}_r2` });
  });

  it('usa o charge quando a cobrança não tem payment intent', async () => {
    const db = makeDb();
    const stripe = makeStripe(makeCharge({ payment_intent: null }));
    const { protocol } = await seedRequest(db, stripe);

    await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });
    expect(stripe.refunds.create.mock.calls[0][0]).toMatchObject({ charge: 'ch_valida' });
  });
});

describe('admin pede mais informações', () => {
  it('exige a nota e leva a solicitação para needs_information', async () => {
    const db = makeDb();
    const { protocol } = await seedRequest(db);

    await expect(requestMoreInformation(db, protocol, SUPER_ADMIN, '')).rejects.toMatchObject({
      code: 'note_required',
    });

    await requestMoreInformation(db, protocol, SUPER_ADMIN, 'Manda o print da cobrança.');
    const saved = db.store.get(`refundRequests/${protocol}`);
    expect(saved.status).toBe('needs_information');
    expect(saved.pendingInformation).toBe('Manda o print da cobrança.');
  });
});

describe('webhook de reembolso', () => {
  async function approved() {
    const db = makeDb();
    const stripe = makeStripe();
    const { protocol } = await seedRequest(db, stripe);
    await approveRefundRequest({ db, stripe, protocol, actor: SUPER_ADMIN });
    return { db, protocol };
  }

  function refundEvent(type, overrides = {}) {
    return {
      id: 'evt_1',
      type,
      data: { object: { id: 're_1', status: 'succeeded', charge: 'ch_valida', payment_intent: 'pi_1', ...overrides } },
    };
  }

  it('sucesso marca como concluído e registra o evento', async () => {
    const { db, protocol } = await approved();
    await handleRefundWebhookEvent(db, refundEvent('refund.updated'));

    const saved = db.store.get(`refundRequests/${protocol}`);
    expect(saved.status).toBe('refunded');
    expect(saved.resolvedAt).toBeTruthy();
    expect(db.store.has(`refundRequests/${protocol}/events/stripe_evt_1`)).toBe(true);
  });

  it('o mesmo evento entregue de novo não duplica nada', async () => {
    const { db, protocol } = await approved();
    await handleRefundWebhookEvent(db, refundEvent('refund.updated'));
    const eventsAfterFirst = docsUnder(db, `refundRequests/${protocol}/events/`).length;

    const second = await handleRefundWebhookEvent(db, refundEvent('refund.updated'));

    expect(second.skipped).toBe('duplicate_event');
    expect(docsUnder(db, `refundRequests/${protocol}/events/`)).toHaveLength(eventsAfterFirst);
    expect(db.store.get(`refundRequests/${protocol}`).status).toBe('refunded');
  });

  it('falha marca como `failed` e mantém o caso tratável', async () => {
    const { db, protocol } = await approved();
    await handleRefundWebhookEvent(db, refundEvent('refund.failed', { status: 'failed' }));

    const saved = db.store.get(`refundRequests/${protocol}`);
    expect(saved.status).toBe('failed');
    expect(saved.lastError).toContain('refund.failed');
  });

  it('evento atrasado não rebaixa uma solicitação já concluída', async () => {
    const { db, protocol } = await approved();
    await handleRefundWebhookEvent(db, refundEvent('refund.updated'));

    const late = await handleRefundWebhookEvent(db, {
      id: 'evt_2',
      type: 'refund.created',
      data: { object: { id: 're_1', status: 'pending', charge: 'ch_valida', payment_intent: 'pi_1' } },
    });

    expect(late.skipped).toBe('already_final');
    expect(db.store.get(`refundRequests/${protocol}`).status).toBe('refunded');
  });

  it('charge.refunded também confirma o estorno', async () => {
    const { db, protocol } = await approved();
    await handleRefundWebhookEvent(db, {
      id: 'evt_3',
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_valida',
          payment_intent: 'pi_1',
          refunded: true,
          refunds: { data: [{ id: 're_1', status: 'succeeded' }] },
        },
      },
    });

    expect(db.store.get(`refundRequests/${protocol}`).status).toBe('refunded');
  });

  it('reembolso feito direto na Stripe, sem solicitação nossa, é ignorado sem erro', async () => {
    const db = makeDb();
    const result = await handleRefundWebhookEvent(db, {
      id: 'evt_4',
      type: 'refund.updated',
      data: { object: { id: 're_desconhecido', status: 'succeeded', charge: 'ch_x' } },
    });
    expect(result.skipped).toBe('no_request');
  });
});
