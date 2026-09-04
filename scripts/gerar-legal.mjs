/**
 * Gera os módulos de conteúdo dos documentos legais.
 *
 *   docs/legal/*.md  ->  src/content/legal/*.ts
 *
 * O texto vive em markdown para poder ser revisado por alguém de fora sem tocar
 * em componente; o módulo TS existe só porque o app precisa importar a string.
 * Os `{{marcadores}}` não são resolvidos aqui — quem substitui é o LegalDoc, em
 * tempo de renderização, lendo os valores de src/config/legal.ts.
 *
 * Rode com: npm run legal
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DOCS = ['termos', 'privacidade', 'cookies'];

const CRASE = String.fromCharCode(96);
const BARRA = String.fromCharCode(92);

/** Escapa o que quebraria a template string do TS. */
function escapar(texto) {
  return texto
    .split(BARRA).join(BARRA + BARRA)
    .split(CRASE).join(BARRA + CRASE)
    .split('${').join(BARRA + '${');
}

let mudou = 0;

for (const id of DOCS) {
  const origem = `docs/legal/${id}.md`;
  const destino = `src/content/legal/${id}.ts`;

  const markdown = readFileSync(origem, 'utf8');

  const sobrando = markdown.match(/\[[^\]]{1,80}\](?!\()/g) || [];
  if (sobrando.length) {
    console.warn(`  aviso  ${origem}: placeholder em colchetes ainda no texto -> ${sobrando.join(', ')}`);
  }

  const conteudo =
    `/* GERADO por scripts/gerar-legal.mjs a partir de ${origem}. Nao editar aqui. */\n` +
    `export const ${id.toUpperCase()} = ${CRASE}${escapar(markdown)}${CRASE};\n`;

  const anterior = (() => {
    try {
      return readFileSync(destino, 'utf8');
    } catch {
      return null;
    }
  })();

  if (anterior === conteudo) {
    console.log(`  igual   ${destino}`);
    continue;
  }

  writeFileSync(destino, conteudo);
  mudou += 1;
  console.log(`  gerado  ${destino}  ${markdown.length} caracteres`);
}

console.log(mudou ? `\n${mudou} arquivo(s) atualizado(s).` : '\nNada mudou.');
