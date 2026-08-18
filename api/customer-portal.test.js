import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyIdToken = vi.fn();
const approveRefundRequest = vi.fn(async () => ({ protocol: 'FOC-1', status: 'processing' }));
const rejectRefundRequest = vi.fn(async () => ({ status: 'rejected' }));
const resolveAdminActor = vi.fn();
const createRefundRequest = vi.fn(async () => ({ protocol: 'FOC-1', status: 'requested' }));

vi.mock('stripe', () => ({
  default: class FakeStripe {
    constructor() {
      this.refunds = { create: vi.fn() };
      this.billingPortal = { sessions: { create: vi.fn(async () => ({ url: 'https://portal' })) } };
    }
  },
}));

vi.mock('./_firebase.js', () => ({
  admin: { auth: () => ({ verifyIdToken }) },
  getDb: () => ({}),
}));

vi.mock('./_refunds.js', async () => {
  const actual = await vi.importActual('./_refunds.js');
  return {
    ...actual,
    approveRefundRequest,
    rejectRefundRequest,
    resolveAdminActor,
    createRefundRequest,
    guardRefundRate: vi.fn(async () => true),
  };
});

const { default: customerPortal } = await import('./customer-portal.js');

function makeRes() {
  return {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

function makeReq({ mode, body = {}, token = 'token-valido' } = {}) {
  return {
    method: 'POST',
    query: mode ? { mode } : {},
    headers: { authorization: token ? `Bearer ${token}` : '', origin: 'https://focaoapp.com.br' },
    body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  verifyIdToken.mockResolvedValue({ uid: 'uid-1', email: 'tutor@exemplo.com' });
  resolveAdminActor.mockResolvedValue(null);
});

describe('permissões dos endpoints de reembolso', () => {
  it('exige login para pedir reembolso', async () => {
    const res = makeRes();
    await customerPortal(makeReq({ mode: 'refund-request', token: '' }), res);
    expect(res.statusCode).toBe(401);
    expect(createRefundRequest).not.toHaveBeenCalled();
  });

  it('token inválido no histórico de cobranças responde 401, não erro interno', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('token inválido'));
    const res = makeRes();
    await customerPortal(makeReq({ mode: 'charges' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('bloqueia quem não é admin nas ações do painel', async () => {
    const res = makeRes();
    await customerPortal(makeReq({ mode: 'admin-refund', body: { action: 'approve', protocol: 'FOC-1' } }), res);

    expect(res.statusCode).toBe(403);
    expect(approveRefundRequest).not.toHaveBeenCalled();
  });

  it('admin comum não aprova reembolso (só Super Admin)', async () => {
    resolveAdminActor.mockResolvedValue({ uid: 'admin-2', email: 'suporte@focao', isAdmin: true, isSuperAdmin: false });

    const res = makeRes();
    await customerPortal(makeReq({ mode: 'admin-refund', body: { action: 'approve', protocol: 'FOC-1' } }), res);

    expect(res.statusCode).toBe(403);
    expect(approveRefundRequest).not.toHaveBeenCalled();
  });

  it('admin comum pode recusar', async () => {
    resolveAdminActor.mockResolvedValue({ uid: 'admin-2', email: 'suporte@focao', isAdmin: true, isSuperAdmin: false });

    const res = makeRes();
    await customerPortal(
      makeReq({ mode: 'admin-refund', body: { action: 'reject', protocol: 'FOC-1', rejectionReason: 'fora da política' } }),
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(rejectRefundRequest).toHaveBeenCalledTimes(1);
  });

  it('Super Admin aprova e a chamada de reembolso sai do backend', async () => {
    resolveAdminActor.mockResolvedValue({
      uid: 'admin-1',
      email: 'focaosupport@gmail.com',
      isAdmin: true,
      isSuperAdmin: true,
    });

    const res = makeRes();
    await customerPortal(makeReq({ mode: 'admin-refund', body: { action: 'approve', protocol: 'FOC-1' } }), res);

    expect(res.statusCode).toBe(200);
    expect(approveRefundRequest).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({ status: 'processing' });
  });

  it('protocolo é obrigatório nas ações do painel', async () => {
    resolveAdminActor.mockResolvedValue({ uid: 'admin-1', email: 'a@b', isAdmin: true, isSuperAdmin: true });
    const res = makeRes();
    await customerPortal(makeReq({ mode: 'admin-refund', body: { action: 'approve' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('só aceita POST', async () => {
    const res = makeRes();
    await customerPortal({ ...makeReq({ mode: 'charges' }), method: 'GET' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('devolve o erro de negócio com o status certo', async () => {
    const { RefundError } = await vi.importActual('./_refunds.js');
    createRefundRequest.mockRejectedValueOnce(new RefundError(409, 'duplicate_request', 'Já existe uma solicitação.'));

    const res = makeRes();
    await customerPortal(makeReq({ mode: 'refund-request', body: { action: 'create', chargeId: 'ch_1' } }), res);

    expect(res.statusCode).toBe(409);
    expect(res.body).toMatchObject({ code: 'duplicate_request' });
  });
});
