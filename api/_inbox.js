import crypto from 'node:crypto';
import { getDb } from './_firebase.js';
import { BRAND, sendEmail } from './_email.js';

/**
 * Central de Atendimento por e-mail — recebimento (webhook inbound do Resend),
 * agrupamento em threads e resposta pelo mesmo endereço da caixa.
 *
 * Por que a lógica mora num helper `_inbox.js` e não numa função própria em `api/`:
 * o plano Hobby da Vercel publica no máximo 12 Serverless Functions e esta pasta está
 * no teto (ver api/README.md). As rotas públicas existem por rewrite no vercel.json:
 *   POST /api/resend-inbound → /api/whatsapp-webhook?mode=resend-inbound
 *   POST /api/admin-inbox    → /api/send-auth-email?type=admin_inbox
 */

const RESEND_API = 'https://api.resend.com';
const DOMAIN = 'focaoapp.com.br';

// ---------------------------------------------------------------------------
// Caixas
// ---------------------------------------------------------------------------

/**
 * Mapa endereço → caixa. É a ÚNICA porta de entrada: e-mail para qualquer outro
 * endereço do domínio (noreply@, aliases antigos, spam para caixas inexistentes) é
 * descartado no webhook. Como o MX da raiz aponta pro Resend, tudo que chega em
 * @focaoapp.com.br passa por aqui — sem essa allowlist, bounce e resposta automática
 * a e-mail de sistema virariam conversa na central.
 */
export const INBOXES = [
  { id: 'geral', label: 'Geral', localPart: 'contato', fromName: 'Focão' },
  { id: 'suporte', label: 'Suporte', localPart: 'suporte', fromName: 'Focão Suporte' },
  { id: 'financeiro', label: 'Financeiro', localPart: 'financeiro', fromName: 'Focão Financeiro' },
  { id: 'parcerias', label: 'Parcerias', localPart: 'parcerias', fromName: 'Focão Parcerias' },
  // privacidade@ é o canal de LGPD que a Política publica como contato da encarregada
  // (art. 41) — ver src/config/legal.ts. Tem caixa própria porque pedido de titular tem
  // prazo legal de resposta: misturado no Geral, ele some no meio de newsletter.
  { id: 'privacidade', label: 'Privacidade', localPart: 'privacidade', fromName: 'Focão Privacidade' },
].map((inbox) => ({ ...inbox, address: `${inbox.localPart}@${DOMAIN}` }));

const INBOX_BY_ID = new Map(INBOXES.map((inbox) => [inbox.id, inbox]));
const INBOX_BY_ADDRESS = new Map(INBOXES.map((inbox) => [inbox.address, inbox]));

export function inboxById(id) {
  return INBOX_BY_ID.get(String(id || '')) || null;
}

/** "Fulano <a@b.com>" → { name: 'Fulano', email: 'a@b.com' }. */
export function parseAddress(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, '').trim(),
      email: match[2].trim().toLowerCase(),
    };
  }
  return { name: '', email: raw.toLowerCase() };
}

/**
 * Descobre a caixa a partir dos destinatários. `received_for` é o que o Resend diz ter
 * recebido de fato (sobrevive a encaminhamento, onde o To: é outro endereço), então vem
 * primeiro; To: e Cc: são fallback. Sem correspondência → null, e a mensagem é ignorada.
 */
export function resolveInbox({ receivedFor, to, cc } = {}) {
  const candidates = [
    ...(Array.isArray(receivedFor) ? receivedFor : []),
    ...(Array.isArray(to) ? to : []),
    ...(Array.isArray(cc) ? cc : []),
  ];
  for (const candidate of candidates) {
    const { email } = parseAddress(candidate);
    const inbox = INBOX_BY_ADDRESS.get(email);
    if (inbox) return inbox;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Assinatura do webhook (Svix / standard-webhooks)
// ---------------------------------------------------------------------------

function header(req, ...names) {
  for (const name of names) {
    const value = req.headers?.[name];
    if (value) return Array.isArray(value) ? value[0] : String(value);
  }
  return '';
}

const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * O Resend assina no padrão Svix: HMAC-SHA256 de `${id}.${timestamp}.${corpo cru}` com o
 * segredo `whsec_<base64>` decodificado. O header traz uma lista "v1,<b64> v1,<b64>"
 * (durante rotação de segredo vem mais de uma) — basta uma bater.
 *
 * Sem RESEND_WEBHOOK_SECRET configurado: aceita fora de produção (pra testar local com
 * curl), rejeita em produção. Mesmo critério do whatsapp-webhook.
 */
export function verifyResendSignature(req, rawBuf) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || '';
  if (!secret) {
    const isProd = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    return { ok: !isProd, reason: isProd ? 'missing_secret' : 'no_secret_dev' };
  }

  const id = header(req, 'svix-id', 'webhook-id');
  const timestamp = header(req, 'svix-timestamp', 'webhook-timestamp');
  const signatureHeader = header(req, 'svix-signature', 'webhook-signature');
  if (!id || !timestamp || !signatureHeader) return { ok: false, reason: 'missing_headers' };

  // Replay: assinatura velha não vale, mesmo sendo válida.
  const sentAt = Number(timestamp) * 1000;
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > SIGNATURE_TOLERANCE_MS) {
    return { ok: false, reason: 'stale_timestamp' };
  }

  let key;
  try {
    key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  } catch {
    return { ok: false, reason: 'invalid_secret' };
  }

  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBuf.toString('utf8')}`)
    .digest('base64');
  const expectedBuf = Buffer.from(expected);

  const provided = signatureHeader
    .split(' ')
    .map((part) => part.split(',').slice(1).join(','))
    .filter(Boolean);

  for (const candidate of provided) {
    const candidateBuf = Buffer.from(candidate);
    if (candidateBuf.length === expectedBuf.length && crypto.timingSafeEqual(candidateBuf, expectedBuf)) {
      return { ok: true, eventId: id };
    }
  }
  return { ok: false, reason: 'signature_mismatch' };
}

// ---------------------------------------------------------------------------
// Threading
// ---------------------------------------------------------------------------

/** `<abc@host>` → `abc@host`. Message-ID é case-insensitive na prática. */
export function normalizeMessageId(value) {
  return String(value || '').trim().replace(/^<|>$/g, '').trim().toLowerCase();
}

/** Extrai todos os `<...>` de um header References/In-Reply-To. */
export function parseReferences(value) {
  if (Array.isArray(value)) return value.map(normalizeMessageId).filter(Boolean);
  const raw = String(value || '');
  const found = raw.match(/<[^>]+>/g);
  if (found) return found.map(normalizeMessageId).filter(Boolean);
  return raw.split(/\s+/).map(normalizeMessageId).filter(Boolean);
}

/** Tira Re:/Fwd:/Enc:/Res: repetidos e normaliza espaço/caixa. */
export function normalizeSubject(subject) {
  let value = String(subject || '').trim();
  let previous;
  do {
    previous = value;
    value = value.replace(/^\s*(re|res|ref|fw|fwd|enc|encaminhada|encaminhado)\s*(\[\d+\])?\s*:\s*/i, '');
  } while (value !== previous);
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function sha1(value) {
  return crypto.createHash('sha1').update(String(value)).digest('hex');
}

/** Chave do índice de fallback: mesma caixa + mesma pessoa + mesmo assunto normalizado. */
function threadIndexKey(inboxId, participantEmail, subject) {
  return `${inboxId}_${sha1(`${participantEmail}|${normalizeSubject(subject)}`)}`;
}

const FALLBACK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Acha a thread da mensagem. Ordem de confiança:
 *   1. In-Reply-To / References → índice `emailMessageIndex` (é prova: o cliente de
 *      e-mail está dizendo a qual mensagem está respondendo).
 *   2. Fallback: mesma caixa + mesmo remetente + mesmo assunto normalizado nos últimos
 *      30 dias. Nunca só por assunto — "dúvida" de duas pessoas são duas conversas.
 *   3. Nada bateu → thread nova.
 *
 * Os dois índices são documentos de lookup (id determinístico) em vez de query: assim
 * não é preciso criar índice composto no Firestore, e a busca é O(1).
 *
 * Índice apontando pra thread que já foi excluída de vez é tratado como se não
 * existisse — senão uma resposta antiga ressuscitaria uma conversa apagada.
 */
export async function findThreadId(db, { inboxId, participantEmail, subject, inReplyTo, references }) {
  const candidates = [];
  if (inReplyTo) candidates.push(...parseReferences(inReplyTo));
  if (references) candidates.push(...parseReferences(references));

  for (const messageId of candidates.reverse()) {
    const snap = await db.collection('emailMessageIndex').doc(sha1(messageId)).get();
    const threadId = snap.exists ? snap.data()?.threadId : null;
    if (threadId && (await db.collection('emailThreads').doc(threadId).get()).exists) {
      return { threadId, matchedBy: 'message_id' };
    }
  }

  const key = threadIndexKey(inboxId, participantEmail, subject);
  const fallback = await db.collection('emailThreadIndex').doc(key).get();
  if (fallback.exists) {
    const data = fallback.data() || {};
    const fresh = Date.now() - Number(data.updatedAt || 0) < FALLBACK_WINDOW_MS;
    if (fresh && data.threadId && (await db.collection('emailThreads').doc(data.threadId).get()).exists) {
      return { threadId: data.threadId, matchedBy: 'subject_participant' };
    }
  }

  return { threadId: null, matchedBy: 'none' };
}

async function indexMessageId(db, messageId, threadId) {
  const normalized = normalizeMessageId(messageId);
  if (!normalized) return;
  await db.collection('emailMessageIndex').doc(sha1(normalized)).set({
    messageId: normalized,
    threadId,
    createdAt: Date.now(),
  });
}

async function indexThreadFallback(db, { inboxId, participantEmail, subject, threadId }) {
  await db
    .collection('emailThreadIndex')
    .doc(threadIndexKey(inboxId, participantEmail, subject))
    .set({ threadId, inboxId, participantEmail, updatedAt: Date.now() }, { merge: true });
}

// ---------------------------------------------------------------------------
// API do Resend (recebimento)
// ---------------------------------------------------------------------------

/**
 * Leitura do inbound aceita uma chave própria. A RESEND_API_KEY que já estava no ambiente
 * é a de ENVIO: se ela tiver escopo "sending access", GET /emails/receiving devolve 403 e
 * as mensagens chegariam sem corpo. Separar evita ter que trocar a chave dos e-mails
 * transacionais só para ler a caixa.
 */
async function resendGet(path) {
  const apiKey = process.env.RESEND_INBOUND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_INBOUND_API_KEY/RESEND_API_KEY is not configured.');
  const res = await fetch(`${RESEND_API}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend GET ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * O payload do webhook só traz metadado (from/to/subject/anexos). Corpo, headers e
 * Message-ID vêm daqui. `html_format=data_uri` embute imagem inline como data: URI —
 * sem isso o HTML viria com `<img src="cid:...">`, que não renderiza no painel.
 */
export function fetchReceivedEmail(emailId) {
  return resendGet(`/emails/receiving/${encodeURIComponent(emailId)}?html_format=data_uri`);
}

/** URL assinada e temporária de um anexo recebido. Gerada na hora do clique. */
export function fetchAttachmentUrl(emailId, attachmentId) {
  return resendGet(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments/${encodeURIComponent(attachmentId)}`,
  );
}

// ---------------------------------------------------------------------------
// Persistência
// ---------------------------------------------------------------------------

function previewFrom(text, html) {
  const source = text || String(html || '').replace(/<[^>]+>/g, ' ');
  return String(source || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function mapAttachments(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => ({
    id: String(item?.id || ''),
    filename: String(item?.filename || 'anexo'),
    contentType: String(item?.content_type || 'application/octet-stream'),
    size: Number(item?.size || 0),
    contentId: item?.content_id || null,
    inline: String(item?.content_disposition || '') === 'inline',
  }));
}

function headerLookup(headers) {
  const map = new Map(
    Object.entries(headers && typeof headers === 'object' ? headers : {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );
  return (name) => map.get(name) || '';
}

/**
 * Grava a mensagem recebida. Idempotente por construção: o id do documento é o
 * `email_id` do Resend, então reprocessar o mesmo evento reescreve o mesmo documento em
 * vez de duplicar — e o contador de não lidas só sobe quando o documento é novo.
 */
export async function persistInboundEmail(db, { detail, event, inbox }) {
  const now = Date.now();
  const emailId = String(detail?.id || event?.email_id || '');
  const from = parseAddress(detail?.from || event?.from);
  const headerValue = headerLookup(detail?.headers);

  const subject = String(detail?.subject || event?.subject || '(sem assunto)');
  const messageId = normalizeMessageId(detail?.message_id || event?.message_id || `${emailId}@resend`);
  const inReplyTo = headerValue('in-reply-to');
  const references = headerValue('references');

  const found = await findThreadId(db, {
    inboxId: inbox.id,
    participantEmail: from.email,
    subject,
    inReplyTo,
    references,
  });

  const threadRef = found.threadId
    ? db.collection('emailThreads').doc(found.threadId)
    : db.collection('emailThreads').doc();
  const threadId = threadRef.id;

  const messageRef = threadRef.collection('messages').doc(emailId);
  const existing = await messageRef.get();
  const isNew = !existing.exists;

  await messageRef.set(
    {
      direction: 'inbound',
      resendEmailId: emailId,
      messageId,
      inReplyTo: parseReferences(inReplyTo)[0] || null,
      references: parseReferences(references),
      fromEmail: from.email,
      fromName: from.name || from.email,
      toEmail: inbox.address,
      cc: Array.isArray(detail?.cc) ? detail.cc : [],
      subject,
      text: detail?.text || null,
      html: detail?.html || null,
      attachments: mapAttachments(detail?.attachments || event?.attachments),
      readAt: existing.exists ? existing.data()?.readAt ?? null : null,
      createdAt: existing.exists ? existing.data()?.createdAt ?? now : now,
    },
    { merge: true },
  );

  const threadSnap = await threadRef.get();
  const previous = threadSnap.exists ? threadSnap.data() || {} : {};

  await threadRef.set(
    {
      inbox: inbox.id,
      subject: previous.subject || subject,
      participantEmail: from.email,
      participantName: previous.participantName || from.name || from.email,
      // Resposta nova reabre a conversa: arquivada volta pra caixa, mas o que está na
      // lixeira fica na lixeira (senão não dá pra se livrar de remetente insistente).
      status: previous.status === 'trash' ? 'trash' : 'open',
      lastMessageAt: now,
      lastMessagePreview: previewFrom(detail?.text, detail?.html),
      lastMessageDirection: 'inbound',
      unreadCount: (Number(previous.unreadCount) || 0) + (isNew ? 1 : 0),
      messageCount: (Number(previous.messageCount) || 0) + (isNew ? 1 : 0),
      createdAt: previous.createdAt || now,
      updatedAt: now,
    },
    { merge: true },
  );

  await indexMessageId(db, messageId, threadId);
  await indexThreadFallback(db, {
    inboxId: inbox.id,
    participantEmail: from.email,
    subject,
    threadId,
  });

  return { threadId, messageId: emailId, isNew, matchedBy: found.matchedBy };
}

// ---------------------------------------------------------------------------
// Webhook inbound
// ---------------------------------------------------------------------------

/**
 * Reserva o evento antes de processar. `create` falha se o documento já existe, então
 * duas entregas simultâneas do mesmo evento não passam as duas. Falha de infra libera
 * o processamento — a gravação da mensagem é idempotente de qualquer jeito.
 */
async function reserveEvent(db, eventId) {
  if (!eventId) return true;
  try {
    await db.collection('emailInboundEvents').doc(sha1(eventId)).create({
      eventId,
      receivedAt: Date.now(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    return true;
  } catch (error) {
    if (error?.code === 6 || /ALREADY_EXISTS/i.test(error?.message || '')) return false;
    console.warn('[inbox] reserveEvent falhou, seguindo:', error?.message);
    return true;
  }
}

/**
 * Handler do POST /api/resend-inbound.
 *
 * Só devolve status de erro quando faz sentido o Resend tentar de novo. Assinatura
 * inválida → 401 (não é pra reentregar lixo). Evento repetido, de outro tipo, ou para
 * endereço fora do mapeamento devolve 200 com um motivo: reprocessar não mudaria nada e
 * retry infinito não ajuda ninguém. Falha real de gravação → 500, aí sim vale retry.
 */
export async function handleResendInbound(req, res, rawBuf) {
  const verification = verifyResendSignature(req, rawBuf);
  if (!verification.ok) {
    console.warn('[resend-inbound] assinatura rejeitada:', verification.reason);
    res.status(401).json({ error: 'invalid_signature' });
    return;
  }

  let payload;
  try {
    payload = rawBuf.length ? JSON.parse(rawBuf.toString('utf8')) : {};
  } catch {
    res.status(400).json({ error: 'invalid_json' });
    return;
  }

  if (payload?.type !== 'email.received') {
    res.status(200).json({ ok: true, skipped: 'event_type', type: payload?.type || null });
    return;
  }

  const event = payload.data || {};
  const emailId = String(event.email_id || '');
  if (!emailId) {
    res.status(200).json({ ok: true, skipped: 'missing_email_id' });
    return;
  }

  const inbox = resolveInbox({ receivedFor: event.received_for, to: event.to, cc: event.cc });
  if (!inbox) {
    // noreply@ e qualquer endereço fora do mapa param aqui. É esperado e frequente
    // (bounce, autorresposta), então é log de informação, não de erro.
    console.log('[resend-inbound] destinatário fora da central, ignorado:', {
      emailId,
      to: event.to,
      receivedFor: event.received_for,
    });
    res.status(200).json({ ok: true, skipped: 'inbox_not_mapped' });
    return;
  }

  const db = getDb();
  const eventId = verification.eventId || `email:${emailId}`;
  if (!(await reserveEvent(db, eventId))) {
    res.status(200).json({ ok: true, skipped: 'duplicate_event' });
    return;
  }

  try {
    // Corpo completo vem da API; se ela falhar, ainda dá pra registrar o metadado do
    // evento — melhor uma conversa sem corpo do que uma mensagem perdida em silêncio.
    let detail = null;
    try {
      detail = await fetchReceivedEmail(emailId);
    } catch (error) {
      console.error('[resend-inbound] falha ao buscar corpo da mensagem', emailId, error?.message);
    }

    const result = await persistInboundEmail(db, {
      detail: detail || { id: emailId, from: event.from, subject: event.subject, cc: event.cc },
      event,
      inbox,
    });

    console.log('[resend-inbound] mensagem registrada', {
      emailId,
      inbox: inbox.id,
      threadId: result.threadId,
      novo: result.isNew,
      agrupadaPor: result.matchedBy,
      corpo: detail ? 'ok' : 'indisponivel',
    });
    res.status(200).json({ ok: true, threadId: result.threadId, inbox: inbox.id });
  } catch (error) {
    console.error('[resend-inbound] falha ao processar', emailId, error);
    // 500 faz o Resend reentregar; a reserva do evento já foi feita, então libera ela
    // pra que o retry não caia como duplicado.
    await db.collection('emailInboundEvents').doc(sha1(eventId)).delete().catch(() => {});
    res.status(500).json({ error: 'processing_failed' });
  }
}

// ---------------------------------------------------------------------------
// Resposta pelo painel
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;',
  }[char]));
}

/**
 * Casca da resposta de atendimento. Deliberadamente mais sóbria que a dos e-mails de
 * ciclo de vida (`emailShell` em _email.js): isso aqui é gente respondendo gente, não
 * campanha — sem botão de CTA, sem rodapé de descadastro.
 */
function replyHtml(text, inbox) {
  const body = escapeHtml(text)
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND.ink};">${paragraph.replace(/\n/g, '<br />')}</p>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px 16px;background:${BRAND.paper};font-family:Georgia,'Newsreader',serif;color:${BRAND.ink};">
    <div style="max-width:520px;margin:0 auto;background:${BRAND.card};border:1px solid ${BRAND.rule};border-radius:16px;padding:28px 26px;">
      ${body}
      <p style="margin:26px 0 0;padding-top:16px;border-top:1px solid ${BRAND.rule};font-size:12px;color:${BRAND.muted};">
        ${escapeHtml(inbox.fromName)} — Focão<br />
        <a href="mailto:${inbox.address}" style="color:${BRAND.emerald};">${inbox.address}</a>
      </p>
    </div>
  </body>
</html>`;
}

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export function sanitizeOutgoingAttachments(list) {
  if (!Array.isArray(list) || list.length === 0) return [];
  let total = 0;
  return list.slice(0, 10).map((item) => {
    const content = String(item?.content || '');
    // base64 → bytes reais; o teto é o corpo de request da Vercel (4,5 MB).
    total += Math.floor((content.length * 3) / 4);
    if (total > MAX_ATTACHMENT_BYTES) {
      const error = new Error('Os anexos somam mais de 4 MB.');
      error.status = 413;
      throw error;
    }
    return {
      filename: String(item?.filename || 'anexo').slice(0, 180),
      content,
      ...(item?.contentType ? { content_type: String(item.contentType) } : {}),
    };
  });
}

function base64Bytes(content) {
  return Math.floor((String(content || '').length * 3) / 4);
}

/**
 * Envia a resposta pelo MESMO endereço da caixa (nunca por noreply@ — o remetente sai do
 * documento da thread, não do que o painel mandar) e registra a mensagem enviada.
 *
 * Gera um Message-ID próprio em vez de deixar o Resend criar: sem ele, a resposta que a
 * pessoa mandar de volta traria um In-Reply-To que não existe no nosso índice e abriria
 * conversa nova. Com ele, o ciclo fecha.
 */
export async function sendThreadReply(db, { threadId, text, attachments, actor }) {
  const threadRef = db.collection('emailThreads').doc(String(threadId || ''));
  const threadSnap = await threadRef.get();
  if (!threadSnap.exists) {
    const error = new Error('Conversa não encontrada.');
    error.status = 404;
    throw error;
  }

  const thread = threadSnap.data() || {};
  const inbox = inboxById(thread.inbox);
  if (!inbox) {
    const error = new Error('A caixa desta conversa é inválida.');
    error.status = 400;
    throw error;
  }

  const body = String(text || '').trim();
  if (!body) {
    const error = new Error('A resposta está vazia.');
    error.status = 400;
    throw error;
  }

  const outgoing = sanitizeOutgoingAttachments(attachments);

  // O último recebido é a mensagem a que estamos respondendo — dele saem In-Reply-To e
  // o encadeamento de References.
  const lastInbound = await threadRef
    .collection('messages')
    .where('direction', '==', 'inbound')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()
    .catch(() => null);
  const parent = lastInbound && !lastInbound.empty ? lastInbound.docs[0].data() : null;

  const baseSubject = thread.subject || '(sem assunto)';
  const subject = /^re:/i.test(baseSubject.trim()) ? baseSubject : `Re: ${baseSubject}`;
  const ownMessageId = `focao-${crypto.randomUUID()}@${DOMAIN}`;
  const references = [...(parent?.references || []), parent?.messageId].filter(Boolean);

  const headers = { 'Message-ID': `<${ownMessageId}>` };
  if (parent?.messageId) headers['In-Reply-To'] = `<${parent.messageId}>`;
  if (references.length) headers.References = references.map((id) => `<${id}>`).join(' ');

  const delivery = await sendEmail({
    from: `${inbox.fromName} <${inbox.address}>`,
    to: thread.participantEmail,
    subject,
    text: body,
    html: replyHtml(body, inbox),
    headers,
    attachments: outgoing,
  });

  const now = Date.now();
  const messageRef = threadRef.collection('messages').doc();
  await messageRef.set({
    direction: 'outbound',
    resendEmailId: delivery?.id || null,
    messageId: ownMessageId,
    inReplyTo: parent?.messageId || null,
    references,
    fromEmail: inbox.address,
    fromName: inbox.fromName,
    toEmail: thread.participantEmail,
    cc: [],
    subject,
    text: body,
    html: null,
    // Só o metadado: o arquivo já foi entregue pelo Resend e não fica guardado por nós.
    attachments: outgoing.map((item) => ({
      id: null,
      filename: item.filename,
      contentType: item.content_type || 'application/octet-stream',
      size: base64Bytes(item.content),
      contentId: null,
      inline: false,
    })),
    sentByEmail: actor?.email || null,
    readAt: now,
    createdAt: now,
  });

  await threadRef.set(
    {
      status: thread.status === 'trash' ? 'trash' : 'open',
      lastMessageAt: now,
      lastMessagePreview: previewFrom(body, null),
      lastMessageDirection: 'outbound',
      unreadCount: 0,
      messageCount: (Number(thread.messageCount) || 0) + 1,
      updatedAt: now,
    },
    { merge: true },
  );

  await indexMessageId(db, ownMessageId, threadId);

  return { threadId, messageId: messageRef.id, resendEmailId: delivery?.id || null, from: inbox.address };
}

/** URL assinada de um anexo recebido, conferindo antes que ele é mesmo daquela mensagem. */
export async function resolveAttachmentUrl(db, { threadId, messageId, attachmentId }) {
  const messageSnap = await db
    .collection('emailThreads')
    .doc(String(threadId || ''))
    .collection('messages')
    .doc(String(messageId || ''))
    .get();
  if (!messageSnap.exists) {
    const error = new Error('Mensagem não encontrada.');
    error.status = 404;
    throw error;
  }

  const message = messageSnap.data() || {};
  const attachment = (message.attachments || []).find((item) => item.id === attachmentId);
  if (!attachment || !message.resendEmailId) {
    const error = new Error('Anexo não encontrado.');
    error.status = 404;
    throw error;
  }

  const data = await fetchAttachmentUrl(message.resendEmailId, attachmentId);
  return { url: data?.download_url || null, expiresAt: data?.expires_at || null, filename: attachment.filename };
}
