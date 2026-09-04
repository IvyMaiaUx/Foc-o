import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * O plano Hobby da Vercel publica no máximo 12 funções serverless, e este projeto
 * vive exatamente nesse teto.
 *
 * Este teste existe porque a falha é silenciosa nos três lugares onde alguém olharia:
 * o build PASSA (a quebra é no passo `patchBuild`, ao publicar), o e-mail da Vercel diz
 * "build error", e `vercel inspect --logs` termina em "Deploying outputs..." sem dizer o
 * motivo. Só a API REST devolve `exceeded_serverless_functions_per_deployment`.
 *
 * Já aconteceu duas vezes: com `api/process-referral.js` e com `api/registrar-aceite.js`.
 * Nas duas, a saída foi a mesma — mover a lógica para um helper `api/_nome.js` (o prefixo
 * `_` não vira função), despachar de dentro de uma função existente por `?mode=`, e
 * preservar a rota pública com uma rewrite no `vercel.json`.
 *
 * Se este teste quebrou, você acabou de criar a 13ª função. Ou aplica o padrão acima,
 * ou o plano deixou de ser Hobby — e aí é este número que muda.
 */

const LIMITE_HOBBY = 12;

describe('limite de funções serverless da Vercel', () => {
  it(`não passa de ${LIMITE_HOBBY} funções em api/`, () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const funcoes = readdirSync(dir)
      .filter((nome) => nome.endsWith('.js'))
      // `_*.js` são helpers e `*.test.js` são testes: a Vercel não transforma
      // nenhum dos dois em função.
      .filter((nome) => !nome.startsWith('_') && !nome.endsWith('.test.js'));

    expect(funcoes.length, `funções encontradas: ${funcoes.join(', ')}`).toBeLessThanOrEqual(
      LIMITE_HOBBY,
    );
  });
});
