import crypto from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFakeDb } from './_fakeFirestore.js';

// Uma instância só de banco por teste, compartilhada entre o que o teste inspeciona e o
// que o handler pega por getDb().
let db = createFakeDb();

vi.mock('./_firebase.js', () => ({
  admin: { auth: () => ({ verifyIdToken: vi.fn() }) },
  getDb: () => db,
}));

vi.mock('./_email.js', () => ({
  BRAND: {
    paper: '#F4F2EB', card: '#FBFAF5', rule: '#d9d4c6',
    ink: '#1A1A17', inkSoft: '#5a564c', muted: '#8A837A',
    emerald: '#0B6E57', emeraldDeep: '#0a5945',
  },
  sendEmail: vi.fn(async () => ({ id: 'resend_out_1' })),
}));

const {
  INBOXES,
  findThreadId,
  handleResendInbound,
  normalizeSubject,
  parseAddress,
  parseReferences,
  persistInboundEmail,
  resolveInbox,
  sanitizeOutgoingAttachments,
  sendThreadReply,
  verifyResendSignature,
} = await import('./_inbox.js');

const { sendEmail } = await import('./_email.js');

const SECRET_BYTES = Buffer.from('segredo-de-teste-do-webhook-resend');
const WEBHOOK_SECRET = `whsec_${SECRET_BYTES.toString('base64')}`;

const GERAL = INBOXES.find((inbox) => inbox.id === 'geral');
const SUPORTE = INBOXES.find((inbox) => inbox.id === 'suporte');
const FINANCEIRO = INBOXES.find((inbox) => inbox.id === 'financeiro');

function signedRequest(payload, { id = 'msg_1', timestamp = Math.floor(Date.now() / 1000) } = {}) {
  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  const signature = crypto
    .createHmac('sha256', SECRET_BYTES)
    .update(`${id}.${timestamp}.${raw.toString('utf8')}`)
    .digest('base64');
  return {
    req: {
      headers: {
        'svix-id': id,
        'svix-timestamp': String(timestamp),
        'svix-signature': `v1,${signature}`,
      },
      query: { mode: 'resend-inbound' },
    },
    raw,
  };
}

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function receivedEvent(overrides = {}) {
  return {
    type: 'email.received',
    created_at: new Date().toISOString(),
    data: {
      email_id: 'inb_1',
      created_at: new Date().toISOString(),
      from: 'Tutora Ana <ana@exemplo.com>',
      to: [SUPORTE.address],
      cc: [],
      bcc: [],
      received_for: [SUPORTE.address],
      message_id: '<ana-1@mail.exemplo.com>',
      subject: 'Meu cão não faz o comando',
      attachments: [],
      ...overrides,
    },
  };
}

function receivedDetail(overrides = {}) {
  return {
    object: 'email',
    id: 'inb_1',
    to: [SUPORTE.address],
    from: 'Tutora Ana <ana@exemplo.com>',
    created_at: new Date().toISOString(),
    subject: 'Meu cão não faz o comando',
    bcc: null,
    cc: null,
    reply_to: null,
    received_for: [SUPORTE.address],
    html: '<p>Oi, tudo bem?</p>',
    text: 'Oi, tudo bem?',
    headers: { 'Message-ID': '<ana-1@mail.exemplo.com>' },
    message_id: '<ana-1@mail.exemplo.com>',
    attachments: [],
    ...overrides,
  };
}

beforeEach(() => {
  db = createFakeDb();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  process.env.RESEND_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.RESEND_API_KEY = 're_teste';
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => receivedDetail() })));
});

describe('roteamento de caixa', () => {
  it('manda cada endereço mapeado para a sua caixa', () => {
    expect(resolveInbox({ to: ['contato@focaoapp.com.br'] })?.id).toBe('geral');
    expect(resolveInbox({ to: ['suporte@focaoapp.com.br'] })?.id).toBe('suporte');
    expect(resolveInbox({ to: ['financeiro@focaoapp.com.br'] })?.id).toBe('financeiro');
    expect(resolveInbox({ to: ['parcerias@focaoapp.com.br'] })?.id).toBe('parcerias');
    expect(resolveInbox({ to: ['privacidade@focaoapp.com.br'] })?.id).toBe('privacidade');
  });

  // A Política de Privacidade publica esse endereço como canal da encarregada (art. 41
  // da LGPD). Se ele sair da allowlist, pedido de titular passa a cair no vazio.
  it('privacidade@ responde pelo endereço da própria caixa', () => {
    const inbox = resolveInbox({ receivedFor: ['privacidade@focaoapp.com.br'] });
    expect(inbox?.address).toBe('privacidade@focaoapp.com.br');
    expect(inbox?.fromName).toBe('Focão Privacidade');
  });

  it('ignora noreply@ — e-mail de sistema não vira atendimento', () => {
    expect(resolveInbox({ to: ['noreply@focaoapp.com.br'] })).toBeNull();
    expect(resolveInbox({ receivedFor: ['noreply@focaoapp.com.br'] })).toBeNull();
  });

  it('ignora endereço do domínio que não está no mapa', () => {
    expect(resolveInbox({ to: ['qualquercoisa@focaoapp.com.br'] })).toBeNull();
    expect(resolveInbox({ to: ['ana@exemplo.com'] })).toBeNull();
  });

  it('prefere received_for ao To: (sobrevive a encaminhamento)', () => {
    const inbox = resolveInbox({
      receivedFor: ['financeiro@focaoapp.com.br'],
      to: ['outra-pessoa@gmail.com'],
    });
    expect(inbox?.id).toBe('financeiro');
  });

  it('lê o endereço dentro de "Nome <e-mail>"', () => {
    expect(parseAddress('Focão Suporte <SUPORTE@FocaoApp.com.BR>')).toEqual({
      name: 'Focão Suporte',
      email: 'suporte@focaoapp.com.br',
    });
  });
});

describe('assinatura do webhook', () => {
  it('aceita a assinatura correta', () => {
    const payload = receivedEvent();
    const { req, raw } = signedRequest(payload);
    expect(verifyResendSignature(req, raw).ok).toBe(true);
  });

  it('rejeita corpo adulterado depois de assinado', () => {
    const { req } = signedRequest(receivedEvent());
    const adulterado = Buffer.from(JSON.stringify(receivedEvent({ from: 'golpe@mal.com' })), 'utf8');
    expect(verifyResendSignature(req, adulterado)).toMatchObject({ ok: false, reason: 'signature_mismatch' });
  });

  it('rejeita assinatura válida porém velha (replay)', () => {
    const antiga = Math.floor(Date.now() / 1000) - 60 * 60;
    const { req, raw } = signedRequest(receivedEvent(), { timestamp: antiga });
    expect(verifyResendSignature(req, raw)).toMatchObject({ ok: false, reason: 'stale_timestamp' });
  });

  it('rejeita requisição sem os headers de assinatura', () => {
    const raw = Buffer.from('{}', 'utf8');
    expect(verifyResendSignature({ headers: {} }, raw)).toMatchObject({ ok: false, reason: 'missing_headers' });
  });

  it('em produção sem segredo configurado, rejeita', () => {
    delete process.env.RESEND_WEBHOOK_SECRET;
    const anterior = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = 'production';
    const { req, raw } = signedRequest(receivedEvent());
    expect(verifyResendSignature(req, raw)).toMatchObject({ ok: false, reason: 'missing_secret' });
    process.env.VERCEL_ENV = anterior;
  });
});

describe('normalização de assunto', () => {
  it('tira Re:/Fwd:/Enc: encadeados', () => {
    expect(normalizeSubject('Re: Fwd: Enc: Dúvida sobre o plano')).toBe('dúvida sobre o plano');
    expect(normalizeSubject('RES: RE: Cobrança')).toBe('cobrança');
  });

  it('mantém o assunto quando não há prefixo', () => {
    expect(normalizeSubject('  Parceria   comercial ')).toBe('parceria comercial');
  });

  it('lê todos os ids de um header References', () => {
    expect(parseReferences('<a@x> <b@y>')).toEqual(['a@x', 'b@y']);
  });
});

describe('agrupamento em threads', () => {
  it('cria thread nova para a primeira mensagem', async () => {
    const result = await persistInboundEmail(db, {
      detail: receivedDetail(),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    expect(result.matchedBy).toBe('none');
    expect(result.isNew).toBe(true);

    const thread = await db.collection('emailThreads').doc(result.threadId).get();
    expect(thread.data()).toMatchObject({
      inbox: 'suporte',
      participantEmail: 'ana@exemplo.com',
      participantName: 'Tutora Ana',
      status: 'open',
      unreadCount: 1,
      messageCount: 1,
    });
  });

  it('tira o nome do remetente do header From, não do campo `from`', async () => {
    // A API do Resend devolve `from` só com o endereço; o nome fica no header.
    const { threadId } = await persistInboundEmail(db, {
      detail: receivedDetail({
        from: 'ana@exemplo.com',
        headers: { 'Message-ID': '<ana-1@mail.exemplo.com>', From: '"Tutora Ana" <ana@exemplo.com>' },
      }),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    const thread = await db.collection('emailThreads').doc(threadId).get();
    expect(thread.data()).toMatchObject({ participantName: 'Tutora Ana', participantEmail: 'ana@exemplo.com' });
  });

  it('cai no endereço quando não há nome nenhum', async () => {
    const { threadId } = await persistInboundEmail(db, {
      detail: receivedDetail({ from: 'ana@exemplo.com', headers: { 'Message-ID': '<ana-1@x>' } }),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    const thread = await db.collection('emailThreads').doc(threadId).get();
    expect(thread.data().participantName).toBe('ana@exemplo.com');
  });

  it('agrupa a resposta pelo In-Reply-To, mesmo com assunto diferente', async () => {
    const primeira = await persistInboundEmail(db, {
      detail: receivedDetail(),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });

    const segunda = await persistInboundEmail(db, {
      detail: receivedDetail({
        id: 'inb_2',
        message_id: '<ana-2@mail.exemplo.com>',
        subject: 'assunto completamente outro',
        headers: {
          'Message-ID': '<ana-2@mail.exemplo.com>',
          'In-Reply-To': '<ana-1@mail.exemplo.com>',
          References: '<ana-1@mail.exemplo.com>',
        },
      }),
      event: receivedEvent({ email_id: 'inb_2' }).data,
      inbox: SUPORTE,
    });

    expect(segunda.matchedBy).toBe('message_id');
    expect(segunda.threadId).toBe(primeira.threadId);

    const thread = await db.collection('emailThreads').doc(primeira.threadId).get();
    expect(thread.data().unreadCount).toBe(2);
    expect(thread.data().messageCount).toBe(2);
  });

  it('NÃO junta pessoas diferentes que escreveram o mesmo assunto', async () => {
    const ana = await persistInboundEmail(db, {
      detail: receivedDetail({ subject: 'Dúvida' }),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    const bruno = await persistInboundEmail(db, {
      detail: receivedDetail({
        id: 'inb_9',
        from: 'Bruno <bruno@exemplo.com>',
        subject: 'Dúvida',
        message_id: '<bruno-1@mail.exemplo.com>',
        headers: { 'Message-ID': '<bruno-1@mail.exemplo.com>' },
      }),
      event: receivedEvent({ email_id: 'inb_9' }).data,
      inbox: SUPORTE,
    });
    expect(bruno.threadId).not.toBe(ana.threadId);
  });

  it('NÃO junta a mesma pessoa escrevendo para caixas diferentes', async () => {
    const suporte = await persistInboundEmail(db, {
      detail: receivedDetail({ subject: 'Dúvida' }),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    const financeiro = await persistInboundEmail(db, {
      detail: receivedDetail({ id: 'inb_7', subject: 'Dúvida', message_id: '<ana-7@x>', headers: { 'Message-ID': '<ana-7@x>' } }),
      event: receivedEvent({ email_id: 'inb_7' }).data,
      inbox: FINANCEIRO,
    });
    expect(financeiro.threadId).not.toBe(suporte.threadId);
  });

  it('usa o fallback assunto+remetente quando o cliente não manda In-Reply-To', async () => {
    const primeira = await persistInboundEmail(db, {
      detail: receivedDetail({ subject: 'Dúvida sobre o plano' }),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    const segunda = await persistInboundEmail(db, {
      detail: receivedDetail({
        id: 'inb_3',
        subject: 'Re: Dúvida sobre o plano',
        message_id: '<ana-3@x>',
        headers: { 'Message-ID': '<ana-3@x>' },
      }),
      event: receivedEvent({ email_id: 'inb_3' }).data,
      inbox: SUPORTE,
    });
    expect(segunda.matchedBy).toBe('subject_participant');
    expect(segunda.threadId).toBe(primeira.threadId);
  });

  it('não ressuscita conversa excluída de vez', async () => {
    const primeira = await persistInboundEmail(db, {
      detail: receivedDetail(),
      event: receivedEvent().data,
      inbox: SUPORTE,
    });
    await db.collection('emailThreads').doc(primeira.threadId).delete();

    const encontrada = await findThreadId(db, {
      inboxId: 'suporte',
      participantEmail: 'ana@exemplo.com',
      subject: 'Meu cão não faz o comando',
      inReplyTo: '<ana-1@mail.exemplo.com>',
      references: '',
    });
    expect(encontrada.threadId).toBeNull();
  });
});

describe('webhook inbound', () => {
  it('registra a mensagem e responde 200', async () => {
    const payload = receivedEvent();
    const { req, raw } = signedRequest(payload);
    const res = fakeRes();

    await handleResendInbound(req, res, raw);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ ok: true, inbox: 'suporte' });
    const thread = await db.collection('emailThreads').doc(res.body.threadId).get();
    expect(thread.exists).toBe(true);
  });

  it('não processa o mesmo evento duas vezes', async () => {
    const payload = receivedEvent();
    const { req, raw } = signedRequest(payload, { id: 'msg_repetida' });

    const primeira = fakeRes();
    await handleResendInbound(req, primeira, raw);
    const segunda = fakeRes();
    await handleResendInbound(req, segunda, raw);

    expect(segunda.body).toMatchObject({ skipped: 'duplicate_event' });
    const threads = [...db.store.keys()].filter((path) => /^emailThreads\/[^/]+$/.test(path));
    expect(threads).toHaveLength(1);
  });

  it('reentrega do MESMO e-mail com id de evento novo não duplica a mensagem', async () => {
    const payload = receivedEvent();
    const primeira = signedRequest(payload, { id: 'ev_a' });
    await handleResendInbound(primeira.req, fakeRes(), primeira.raw);

    // Id de evento diferente escapa da trava de idempotência do ledger; quem segura a
    // duplicata aqui é o id do documento da mensagem ser o email_id do Resend.
    const segunda = signedRequest(payload, { id: 'ev_b' });
    const res = fakeRes();
    await handleResendInbound(segunda.req, res, segunda.raw);

    const mensagens = [...db.store.keys()].filter((path) => path.includes('/messages/'));
    expect(mensagens).toHaveLength(1);
    const thread = await db.collection('emailThreads').doc(res.body.threadId).get();
    expect(thread.data().unreadCount).toBe(1);
  });

  it('ignora evento que não é email.received', async () => {
    const { req, raw } = signedRequest({ type: 'email.delivered', data: { email_id: 'x' } });
    const res = fakeRes();
    await handleResendInbound(req, res, raw);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ skipped: 'event_type' });
  });

  it('ignora e-mail endereçado a noreply@', async () => {
    const payload = receivedEvent({
      to: ['noreply@focaoapp.com.br'],
      received_for: ['noreply@focaoapp.com.br'],
    });
    const { req, raw } = signedRequest(payload);
    const res = fakeRes();
    await handleResendInbound(req, res, raw);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ skipped: 'inbox_not_mapped' });
    expect([...db.store.keys()]).toHaveLength(0);
  });

  it('rejeita assinatura inválida com 401 e não grava nada', async () => {
    const { req } = signedRequest(receivedEvent());
    const res = fakeRes();
    await handleResendInbound(req, res, Buffer.from('{"type":"email.received"}', 'utf8'));
    expect(res.statusCode).toBe(401);
    expect([...db.store.keys()]).toHaveLength(0);
  });

  it('grava o metadado mesmo quando a API do Resend falha ao devolver o corpo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500, text: async () => 'boom' })));
    const { req, raw } = signedRequest(receivedEvent());
    const res = fakeRes();
    await handleResendInbound(req, res, raw);

    expect(res.statusCode).toBe(200);
    const thread = await db.collection('emailThreads').doc(res.body.threadId).get();
    expect(thread.data().subject).toBe('Meu cão não faz o comando');
  });
});

describe('resposta', () => {
  async function criarThread(inbox = SUPORTE) {
    const { threadId } = await persistInboundEmail(db, {
      detail: receivedDetail({ received_for: [inbox.address], to: [inbox.address] }),
      event: receivedEvent().data,
      inbox,
    });
    return threadId;
  }

  it('responde pelo endereço da caixa, nunca por noreply@', async () => {
    const threadId = await criarThread(FINANCEIRO);
    await sendThreadReply(db, {
      threadId,
      text: 'Olá! Já verificamos sua cobrança.',
      actor: { email: 'admin@focao.com' },
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const payload = sendEmail.mock.calls[0][0];
    expect(payload.from).toBe('Focão Financeiro <financeiro@focaoapp.com.br>');
    expect(payload.from).not.toContain('noreply');
    expect(payload.to).toBe('ana@exemplo.com');
  });

  it('usa o nome certo em cada caixa', async () => {
    await sendThreadReply(db, { threadId: await criarThread(GERAL), text: 'oi', actor: {} });
    expect(sendEmail.mock.calls[0][0].from).toBe('Focão <contato@focaoapp.com.br>');
  });

  it('encadeia In-Reply-To, References e um Message-ID próprio', async () => {
    const threadId = await criarThread();
    await sendThreadReply(db, { threadId, text: 'Resposta', actor: {} });

    const { headers, subject } = sendEmail.mock.calls[0][0];
    expect(headers['In-Reply-To']).toBe('<ana-1@mail.exemplo.com>');
    expect(headers.References).toContain('<ana-1@mail.exemplo.com>');
    expect(headers['Message-ID']).toMatch(/^<focao-[0-9a-f-]+@focaoapp\.com\.br>$/);
    expect(subject).toBe('Re: Meu cão não faz o comando');
  });

  it('indexa o Message-ID próprio, para a réplica cair na mesma thread', async () => {
    const threadId = await criarThread();
    await sendThreadReply(db, { threadId, text: 'Resposta', actor: {} });
    const ownId = sendEmail.mock.calls[0][0].headers['Message-ID'];

    const encontrada = await findThreadId(db, {
      inboxId: 'suporte',
      participantEmail: 'ana@exemplo.com',
      subject: 'outro assunto qualquer',
      inReplyTo: ownId,
      references: '',
    });
    expect(encontrada).toMatchObject({ threadId, matchedBy: 'message_id' });
  });

  it('zera as não lidas e registra a mensagem enviada', async () => {
    const threadId = await criarThread();
    await sendThreadReply(db, { threadId, text: 'Resposta', actor: { email: 'admin@focao.com' } });

    const thread = await db.collection('emailThreads').doc(threadId).get();
    expect(thread.data()).toMatchObject({
      unreadCount: 0,
      lastMessageDirection: 'outbound',
      messageCount: 2,
    });
  });

  it('recusa resposta vazia', async () => {
    const threadId = await criarThread();
    await expect(sendThreadReply(db, { threadId, text: '   ', actor: {} })).rejects.toMatchObject({ status: 400 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('recusa thread inexistente', async () => {
    await expect(sendThreadReply(db, { threadId: 'nao-existe', text: 'oi', actor: {} })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('recusa anexos acima de 4 MB antes de chamar o Resend', async () => {
    const threadId = await criarThread();
    const gigante = 'A'.repeat(6 * 1024 * 1024);
    await expect(
      sendThreadReply(db, { threadId, text: 'segue', attachments: [{ filename: 'x.pdf', content: gigante }], actor: {} }),
    ).rejects.toMatchObject({ status: 413 });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('repassa anexo dentro do limite no formato do Resend', () => {
    const anexos = sanitizeOutgoingAttachments([
      { filename: 'recibo.pdf', content: 'AAAA', contentType: 'application/pdf' },
    ]);
    expect(anexos).toEqual([{ filename: 'recibo.pdf', content: 'AAAA', content_type: 'application/pdf' }]);
  });
});
