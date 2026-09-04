/**
 * Cópia de segurança do Firestore para um arquivo local.
 *
 * Existe porque o backup gerenciado do Google (agendado e com recuperação
 * pontual) exige o plano Blaze, e o projeto está no Spark. Isto não substitui
 * aquele: não dá para voltar a um instante específico, e restaurar é manual.
 * Substitui, sim, o cenário em que não existe cópia nenhuma.
 *
 * SOMENTE LEITURA. Não escreve, não apaga e não altera nada no banco.
 *
 * Custo: zero em dinheiro. Consome cota de leitura do Firestore, a mesma que o
 * app usa — por isso o agendamento roda de madrugada, quando não disputa com
 * ninguém.
 *
 * ATENÇÃO: o arquivo gerado contém DADOS PESSOAIS dos assinantes (nome, e-mail,
 * telefone). Trate como dado sensível: não sobe pra nuvem pública, não manda por
 * mensageiro, não commita. A Política de Privacidade descreve essa cópia.
 *
 * Como rodar:
 *   node scripts/backup-firestore.mjs
 *
 * Onde as coisas ficam (pode mudar por variável de ambiente):
 *   credencial -> FOCAO_BACKUP_CRED   (padrão: ~/focao-backup/credencial.json)
 *   saída      -> FOCAO_BACKUP_DIR    (padrão: ~/focao-backup/dumps)
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CRED = process.env.FOCAO_BACKUP_CRED || join(homedir(), 'focao-backup', 'credencial.json');
const DEST = process.env.FOCAO_BACKUP_DIR || join(homedir(), 'focao-backup', 'dumps');
// O banco de produção NÃO é o "(default)". O projeto tem três bancos de nome
// quase igual, todos `ai-studio-...`; omitir este id faz o script abrir um banco
// vazio e gravar um backup de nada, sem erro nenhum.
const DB_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-ececf2d5-e671-43f3-8f2c-ce258672a8e7';
const MANTER = Number(process.env.FOCAO_BACKUP_MANTER || 14);
const PARALELO = Number(process.env.FOCAO_BACKUP_PARALELO || 20);

let credencial;
try {
  credencial = JSON.parse(readFileSync(CRED, 'utf8'));
} catch {
  console.error(`\nNão achei a credencial em:\n  ${CRED}\n`);
  console.error('Baixe em: Console do Firebase > Configurações do projeto > Contas de serviço');
  process.exit(1);
}

if (credencial.project_id !== 'gen-lang-client-0545403021') {
  console.error(`Credencial é do projeto "${credencial.project_id}", esperado gen-lang-client-0545403021.`);
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(credencial) });
const db = getFirestore(admin.app(), DB_ID);

let documentos = 0;
let colecoes = 0;

/**
 * Executa `tarefa` sobre cada item, no máximo `limite` ao mesmo tempo.
 *
 * Sem isto o backup é sequencial e gasta uma ida ao servidor por documento, uma
 * de cada vez: na primeira execução real foram 1.580 documentos em 9 minutos. O
 * gargalo não é volume de dados, é latência somada — com 100 usuários passaria de
 * uma hora. O limite existe para não abrir centenas de conexões simultâneas e
 * levar rate limit.
 */
async function emParalelo(itens, limite, tarefa) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      resultados[i] = await tarefa(itens[i], i);
    }
  });
  await Promise.all(trabalhadores);
  return resultados;
}

/** Lê uma coleção inteira e desce em cada subcoleção que existir. */
async function lerColecao(ref, caminho) {
  colecoes += 1;
  const snap = await ref.get();
  const saida = {};

  const itens = await emParalelo(snap.docs, PARALELO, async (doc) => {
    documentos += 1;
    const item = { _dados: doc.data() };

    // Descobrir subcoleções em vez de assumir uma lista fixa: no dia em que o app
    // criar uma subcoleção nova, ela entra no backup sozinha, sem ninguém lembrar
    // de atualizar este arquivo.
    const subs = await doc.ref.listCollections();
    for (const sub of subs) {
      item[`_sub_${sub.id}`] = await lerColecao(sub, `${caminho}/${doc.id}/${sub.id}`);
    }
    return [doc.id, item];
  });

  for (const [id, item] of itens) saida[id] = item;

  if (snap.size) console.log(`  ${caminho}: ${snap.size} doc(s)`);
  return saida;
}

const inicio = Date.now();
console.log(`\nLendo o banco ${DB_ID}\n`);

const raizes = await db.listCollections();
const dump = {
  _gerado_em: new Date().toISOString(),
  _banco: DB_ID,
  _projeto: credencial.project_id,
  colecoes: {},
};

for (const c of raizes) {
  dump.colecoes[c.id] = await lerColecao(c, c.id);
}

mkdirSync(DEST, { recursive: true });
const carimbo = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const arquivo = join(DEST, `focao-${carimbo}.json`);
writeFileSync(arquivo, JSON.stringify(dump, null, 1), 'utf8');

const mb = (statSync(arquivo).size / 1024 / 1024).toFixed(2);
console.log(`\n${documentos} documentos em ${colecoes} coleções`);
console.log(`${mb} MB salvos em ${arquivo}`);
console.log(`Levou ${((Date.now() - inicio) / 1000).toFixed(1)}s`);

// Rotação: sem isto a pasta cresce para sempre e um dia enche o disco.
const antigos = readdirSync(DEST)
  .filter((n) => n.startsWith('focao-') && n.endsWith('.json'))
  .sort()
  .slice(0, -MANTER);
for (const n of antigos) unlinkSync(join(DEST, n));
if (antigos.length) console.log(`${antigos.length} backup(s) antigo(s) removido(s); mantendo os ${MANTER} mais recentes.`);

console.log('\nPronto.\n');
process.exit(0);
