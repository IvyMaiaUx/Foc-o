/**
 * Restaura um dump gerado por `backup-firestore.mjs` para dentro de um banco.
 *
 * Existe porque backup que nunca foi restaurado é hipótese, não garantia. O
 * arquivo pode estar lá, íntegro e inútil — e só se descobre no pior dia.
 *
 * ESTE SCRIPT ESCREVE NO BANCO. É o único da pasta que escreve, e por isso tem
 * trava:
 *
 *   - `--destino` é obrigatório. Não há padrão: escolher o banco tem que ser um
 *     ato consciente, ainda mais num projeto com três bancos de nome quase igual.
 *   - Sem `--confirmar` ele só SIMULA e mostra o que faria.
 *   - Escrever no banco de PRODUÇÃO exige, além disso, `--sobrescrever-producao`.
 *     Restaurar por cima de dados vivos é a última coisa que se faz, não a
 *     primeira, e nunca deve acontecer por engano de digitação.
 *
 * Para TESTAR a restauração sem risco nenhum, use um dos bancos vazios que
 * sobraram do AI Studio no mesmo projeto:
 *
 *   node scripts/restaurar-firestore.mjs \
 *     --arquivo "C:\Users\Ivy Maia\focao-backup\dumps\focao-....json" \
 *     --destino ai-studio-1b8f2ae1-7182-4c5a-8500-9b5e7094db07 \
 *     --confirmar
 */
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PRODUCAO = 'ai-studio-ececf2d5-e671-43f3-8f2c-ce258672a8e7';
const CRED = process.env.FOCAO_BACKUP_CRED || join(homedir(), 'focao-backup', 'credencial.json');
const DUMPS = process.env.FOCAO_BACKUP_DIR || join(homedir(), 'focao-backup', 'dumps');

function arg(nome) {
  const i = process.argv.indexOf(`--${nome}`);
  return i === -1 ? null : process.argv[i + 1];
}
const tem = (nome) => process.argv.includes(`--${nome}`);

const destino = arg('destino');
const confirmar = tem('confirmar');
const liberouProducao = tem('sobrescrever-producao');

if (!destino) {
  console.error('\nFalta --destino <id-do-banco>.\n');
  console.error('Para testar sem risco, use um banco vazio do projeto:');
  console.error('  --destino ai-studio-1b8f2ae1-7182-4c5a-8500-9b5e7094db07\n');
  process.exit(1);
}

if (destino === PRODUCAO && !liberouProducao) {
  console.error('\nO destino é o banco de PRODUÇÃO.\n');
  console.error('Restaurar aqui sobrescreve dados de assinantes reais.');
  console.error('Se é mesmo isso, repita com --sobrescrever-producao.\n');
  process.exit(1);
}

// Sem --arquivo, pega o dump mais recente.
let arquivo = arg('arquivo');
if (!arquivo) {
  const nomes = readdirSync(DUMPS).filter((n) => n.startsWith('focao-') && n.endsWith('.json')).sort();
  if (!nomes.length) {
    console.error(`Nenhum dump em ${DUMPS}`);
    process.exit(1);
  }
  arquivo = join(DUMPS, nomes[nomes.length - 1]);
}

const dump = JSON.parse(readFileSync(arquivo, 'utf8'));
console.log(`\nArquivo : ${arquivo}`);
console.log(`Gerado  : ${dump._gerado_em}`);
console.log(`Origem  : ${dump._banco}`);
console.log(`Destino : ${destino}${destino === PRODUCAO ? '  *** PRODUÇÃO ***' : ''}`);
console.log(confirmar ? 'Modo    : GRAVANDO\n' : 'Modo    : SIMULAÇÃO (use --confirmar para gravar)\n');

const credencial = JSON.parse(readFileSync(CRED, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(credencial) });
const db = getFirestore(admin.app(), destino);

// Datas viram objeto {_seconds,_nanoseconds} no JSON. Sem desfazer isso, o campo
// volta como mapa comum e qualquer consulta por data para de funcionar.
function reidratar(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) return valor.map(reidratar);
  const chaves = Object.keys(valor);
  if (chaves.length === 2 && chaves.includes('_seconds') && chaves.includes('_nanoseconds')) {
    return new admin.firestore.Timestamp(valor._seconds, valor._nanoseconds);
  }
  const saida = {};
  for (const [k, v] of Object.entries(valor)) saida[k] = reidratar(v);
  return saida;
}

let escritos = 0;
let lote = db.batch();
let noLote = 0;

async function fecharLote() {
  if (!noLote) return;
  if (confirmar) await lote.commit();
  lote = db.batch();
  noLote = 0;
}

async function gravar(ref, dados) {
  lote.set(ref, reidratar(dados));
  escritos += 1;
  noLote += 1;
  // O Firestore aceita no máximo 500 operações por lote.
  if (noLote >= 400) await fecharLote();
}

async function restaurar(colecaoRef, docs, caminho) {
  for (const [id, item] of Object.entries(docs)) {
    await gravar(colecaoRef.doc(id), item._dados || {});
    for (const [chave, sub] of Object.entries(item)) {
      if (!chave.startsWith('_sub_')) continue;
      const nome = chave.slice(5);
      await restaurar(colecaoRef.doc(id).collection(nome), sub, `${caminho}/${id}/${nome}`);
    }
  }
  console.log(`  ${caminho}: ${Object.keys(docs).length} doc(s)`);
}

for (const [nome, docs] of Object.entries(dump.colecoes)) {
  await restaurar(db.collection(nome), docs, nome);
}
await fecharLote();

console.log(`\n${escritos} documentos ${confirmar ? 'gravados' : 'seriam gravados'}.`);
if (!confirmar) console.log('Nada foi escrito. Repita com --confirmar.\n');
else console.log('Restauração concluída.\n');
process.exit(0);
