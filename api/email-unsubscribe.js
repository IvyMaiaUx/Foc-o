import { getDb } from './_firebase.js';
import { verifyUnsubscribeToken } from './_email.js';

// Link de 1 clique nos e-mails de ciclo de vida (inatividade/trial/progresso).
// Sem login — a validação é o HMAC (uid+EMAIL_UNSUB_SECRET), então só quem recebeu
// o e-mail (ou tem o secret) consegue descadastrar aquele uid específico.
function page(title, message) {
  return `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${title} — Focão</title></head>
  <body style="margin:0;padding:48px 20px;background:#F4F2EB;font-family:Georgia,'Newsreader',serif;color:#1A1A17;text-align:center;">
    <div style="max-width:420px;margin:0 auto;">
      <p style="font-family:Georgia,serif;font-size:20px;letter-spacing:.22em;color:#0B6E57;margin-bottom:24px;">FOCÃO</p>
      <h1 style="font-size:22px;margin:0 0 12px;">${title}</h1>
      <p style="font-size:16px;color:#5a564c;line-height:1.5;">${message}</p>
    </div>
  </body>
</html>`;
}

export default async function emailUnsubscribe(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const uid = String(req.query?.uid || '');
  const token = String(req.query?.token || '');

  if (!uid || !verifyUnsubscribeToken(uid, token)) {
    res.status(400).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(page('Link inválido', 'Esse link de descadastro não é válido ou expirou.'));
    return;
  }

  try {
    await getDb().collection('users').doc(uid).set(
      { emailOptOut: true, emailOptOutAt: Date.now() },
      { merge: true },
    );
  } catch (error) {
    console.error('[email-unsubscribe] failed', error);
    res.status(500).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(page('Algo deu errado', 'Não conseguimos processar agora. Tente de novo em instantes.'));
    return;
  }

  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(page('Você foi descadastrado', 'Não vamos mais te mandar esses avisos por e-mail. Continua tudo certo no seu plano.'));
}
