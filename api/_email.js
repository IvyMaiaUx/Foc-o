import { getDb } from './_firebase.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Focão <contato@focaoapp.com.br>';

const BRAND = {
  paper: '#F4F2EB',
  card: '#FBFAF5',
  rule: '#d9d4c6',
  ink: '#1A1A17',
  inkSoft: '#5a564c',
  muted: '#8A837A',
  emerald: '#0B6E57',
  emeraldDeep: '#0a5945',
};

/**
 * Envia um e-mail transacional via API REST do Resend (sem SDK — evita adicionar
 * dependência só pra um POST). Exige RESEND_API_KEY configurada no ambiente (Vercel).
 */
export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend request failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Evita reenvio em rajada (ex.: usuário clicando "reenviar" várias vezes) — reserva um
 * slot de envio por e-mail+tipo com cooldown, via transação no Firestore (coleção
 * `emailDispatches`, só acessível pelo Admin SDK — não tem regra pública no
 * firestore.rules, então cai no `match /{document=**} { allow read, write: if false }`).
 * Retorna true se pode enviar agora, false se ainda está dentro do cooldown.
 * Falha de infra → permite o envio (não trava o fluxo de auth por causa disso).
 */
export async function reserveDispatch({ email, kind, cooldownMs }) {
  const db = getDb();
  const id = `${kind}_${Buffer.from(String(email).trim().toLowerCase()).toString('base64url')}`;
  const ref = db.collection('emailDispatches').doc(id);

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const lastSentAt = snap.exists ? snap.data().lastSentAt || 0 : 0;
      if (now - lastSentAt < cooldownMs) return false;
      tx.set(ref, { email, kind, lastSentAt: now, updatedAt: now }, { merge: true });
      return true;
    });
  } catch (e) {
    console.warn('[_email] reserveDispatch failed, allowing send:', e.message);
    return true;
  }
}

function emailShell(bodyHtml) {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:32px 16px;background:${BRAND.paper};font-family:Georgia,'Newsreader',serif;color:${BRAND.ink};">
    <div style="max-width:480px;margin:0 auto;background:${BRAND.card};border:1px solid ${BRAND.rule};border-radius:18px;padding:32px 28px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-family:Georgia,serif;font-weight:400;font-size:22px;letter-spacing:.22em;color:${BRAND.emerald};">FOCÃO</span>
      </div>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:${BRAND.muted};">
        Focão — Rotina, treinos e evolução para cães<br />
        Dúvidas? <a href="mailto:contato@focaoapp.com.br" style="color:${BRAND.emerald};">contato@focaoapp.com.br</a>
      </p>
    </div>
  </body>
</html>`;
}

function ctaButton(label, actionUrl) {
  return `<p style="text-align:center;margin:28px 0;">
    <a href="${actionUrl}" style="display:inline-block;background:${BRAND.emeraldDeep};color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-family:Arial,sans-serif;font-size:15px;">${label}</a>
  </p>
  <p style="font-size:12px;color:${BRAND.muted};word-break:break-all;">Ou copie e cole este link no navegador:<br /><a href="${actionUrl}" style="color:${BRAND.emerald};">${actionUrl}</a></p>`;
}

export function verificationEmail({ actionUrl }) {
  return {
    subject: 'Confirme seu e-mail — Focão',
    html: emailShell(`
      <h1 style="font-size:22px;margin:0 0 16px;">Confirme seu e-mail</h1>
      <p style="font-size:16px;line-height:1.5;color:${BRAND.inkSoft};">Falta pouco. Clique no botão abaixo pra confirmar seu e-mail e ativar sua conta no Focão.</p>
      ${ctaButton('Confirmar e-mail', actionUrl)}
      <p style="font-size:13px;color:${BRAND.muted};">Se você não criou uma conta no Focão, pode ignorar este e-mail.</p>
    `),
    text: `Confirme seu e-mail no Focão: ${actionUrl}`,
  };
}

export function passwordResetEmail({ actionUrl }) {
  return {
    subject: 'Redefinir senha — Focão',
    html: emailShell(`
      <h1 style="font-size:22px;margin:0 0 16px;">Redefinir sua senha</h1>
      <p style="font-size:16px;line-height:1.5;color:${BRAND.inkSoft};">Recebemos um pedido pra redefinir sua senha. Clique no botão abaixo pra escolher uma nova.</p>
      ${ctaButton('Redefinir senha', actionUrl)}
      <p style="font-size:13px;color:${BRAND.muted};">Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.</p>
    `),
    text: `Redefina sua senha no Focão: ${actionUrl}`,
  };
}
