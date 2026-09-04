import { clientIp, withinRateLimit } from './_rateLimit.js';

/**
 * Aceite dos documentos legais.
 *
 * Mora aqui, e não em api/registrar-aceite.js, porque um arquivo próprio em api/
 * vira a 13ª função serverless e o plano Hobby só publica 12 — o deploy inteiro
 * falha em `patchBuild` com `exceeded_serverless_functions_per_deployment`, sem
 * erro nenhum no log de build. É a mesma razão pela qual /api/process-referral
 * mora dentro de create-user-profile.js. A rota pública segue sendo
 * /api/registrar-aceite, via rewrite no vercel.json.
 *
 * Continua sendo servidor, e não escrita direta do app no Firestore, por causa do
 * IP: valor mandado pelo navegador é forjável e não serve como prova. Aqui o IP
 * sai do header da requisição, resolvido pela borda.
 *
 * As três versões são gravadas em campos separados de propósito. Uma string
 * concatenada obrigaria a fazer parsing depois para responder "essa pessoa
 * aceitou qual versão dos Termos?", e o dia em que só um documento mudar, o
 * histórico fica ilegível.
 */

const ORIGENS = new Set(['cadastro', 'nova_versao']);
const VERSAO = /^\d+\.\d+$/;

export async function registrarAceite(req, res, db, uid) {
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

  // Coleção de topo, não subcoleção do usuário: a política de privacidade retém
  // registro de consentimento por 5 anos como prova do aceite, e a exclusão de
  // conta apaga tudo que está sob /users/{uid}. Guardar aqui é o que faz a prova
  // sobreviver à exclusão, como o documento declara.
  //
  // Id determinístico (uid + as três versões), e `create()` em vez de `set()`. O
  // botão do modal volta a ficar clicável depois de um erro, e o endpoint pode
  // responder falha DEPOIS de já ter gravado — com id aleatório, cada nova tentativa
  // viraria mais um registro do mesmo aceite. A coleção existe para ser consultada
  // como prova; uma pessoa com seis linhas idênticas é uma prova pior, não melhor.
  //
  // Quando já existe, o registro antigo é mantido de propósito: o que vale como
  // prova é a primeira vez que a pessoa aceitou aquelas versões, não a última
  // tentativa de gravar. Por isso `create()`, que falha, e não `set()`, que
  // sobrescreveria data, IP e user-agent originais.
  const docId = `${uid}_${[termos_versao, privacidade_versao, cookies_versao]
    .map((v) => v.replace(/\./g, '-'))
    .join('_')}`;
  const aceiteRef = db.collection('aceitesLegais').doc(docId);

  let aceito_em = Date.now();
  try {
    await aceiteRef.create({
      uid,
      origem,
      termos_versao,
      privacidade_versao,
      cookies_versao,
      aceito_em,
      ip,
      user_agent: String(req.headers['user-agent'] || '').slice(0, 200),
    });
  } catch (error) {
    // 6 = ALREADY_EXISTS. Repetição não é erro: a pessoa já aceitou essas versões,
    // e o chamador precisa ver sucesso — senão o modal continua barrando alguém
    // cujo aceite já está gravado.
    if (error?.code !== 6) throw error;
    const existente = await aceiteRef.get();
    // O espelho passa a apontar para a data do registro que vale, não para agora.
    aceito_em = existente.data()?.aceito_em ?? aceito_em;
  }

  // Espelha o aceite mais recente no documento do usuário: é o que o app lê no
  // login para decidir se precisa pedir aceite de uma versão nova, sem varrer a
  // coleção a cada abertura.
  await db.collection('users').doc(uid).set(
    {
      aceiteAtual: { termos_versao, privacidade_versao, cookies_versao, aceito_em },
      updatedAt: aceito_em,
    },
    { merge: true },
  );

  res.status(200).json({ success: true, id: aceiteRef.id });
}
