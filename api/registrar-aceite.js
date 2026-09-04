import { admin, getDb } from './_firebase.js';
import { clientIp, withinRateLimit } from './_rateLimit.js';

/**
 * Registra o aceite dos documentos legais.
 *
 * Existe como endpoint, e não como escrita direta do app no Firestore, por causa
 * do IP: valor mandado pelo navegador é forjável e não serve como prova. Aqui o
 * IP sai do header da requisição, resolvido pela borda.
 *
 * As três versões são gravadas em campos separados de propósito. Uma string
 * concatenada obrigaria a fazer parsing depois para responder "essa pessoa
 * aceitou qual versão dos Termos?", e o dia em que só um documento mudar, o
 * histórico fica ilegível.
 */

const ORIGENS = new Set(['cadastro', 'nova_versao']);
const VERSAO = /^\d+\.\d+$/;

function setCors(req, res) {
  const allowedOrigins = new Set([
    'https://focao.web.app',
    'https://focao-beta.web.app',
    'https://focaoapp.com.br',
    'https://app.focaoapp.com.br',
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

export default async function registrarAceite(req, res) {
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

    const ip = clientIp(req);
    if (!(await withinRateLimit('aceite', ip, 20, 60 * 60 * 1000))) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }

    const { origem, termos_versao, privacidade_versao, cookies_versao } = req.body || {};

    if (!ORIGENS.has(origem)) {
      res.status(400).json({ error: 'origem_invalida' });
      return;
    }
    // As versões vêm do app porque o que importa como prova é o que a pessoa viu
    // na tela, não o que o servidor acha que está publicado — os dois podem
    // divergir por alguns minutos numa janela de deploy.
    for (const versao of [termos_versao, privacidade_versao, cookies_versao]) {
      if (typeof versao !== 'string' || !VERSAO.test(versao)) {
        res.status(400).json({ error: 'versao_invalida' });
        return;
      }
    }

    const db = getDb();
    // Coleção de topo, não subcoleção do usuário: a política de privacidade
    // retém registro de consentimento por 5 anos como prova do aceite, e a
    // exclusão de conta apaga tudo que está sob /users/{uid}. Guardar aqui é o
    // que faz a prova sobreviver à exclusão, como o documento declara.
    const aceiteRef = db.collection('aceitesLegais').doc();
    await aceiteRef.set({
      uid: decoded.uid,
      origem,
      termos_versao,
      privacidade_versao,
      cookies_versao,
      aceito_em: Date.now(),
      ip,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 200),
    });

    // Espelha o aceite mais recente no documento do usuário: é o que o app lê no
    // login para decidir se precisa pedir aceite de uma versão nova, sem varrer a
    // subcoleção a cada abertura.
    await db.collection('users').doc(decoded.uid).set(
      {
        aceiteAtual: { termos_versao, privacidade_versao, cookies_versao, aceito_em: Date.now() },
        updatedAt: Date.now(),
      },
      { merge: true },
    );

    res.status(200).json({ success: true, id: aceiteRef.id });
  } catch (error) {
    console.error('[registrar-aceite] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
