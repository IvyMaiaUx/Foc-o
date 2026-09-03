import React from 'react';
import { LEGAL_VALORES } from '../config/legal';

/**
 * Renderiza os documentos legais escritos em markdown (src/content/legal/).
 *
 * É um renderizador propositalmente pequeno: cobre só o que os três documentos
 * usam — títulos, parágrafos, listas, tabelas, citação, linha divisória, negrito,
 * itálico, link e código. Manter o texto em markdown em vez de JSX é o que
 * permite revisar o documento com um advogado sem mexer em componente.
 */

/** Troca os `{{marcadores}}` pelos valores de src/config/legal.ts. */
function preencher(texto: string): string {
  return texto.replace(/\{\{(\w+)\}\}/g, (original, chave: string) => {
    const valor = LEGAL_VALORES[chave];
    return valor === undefined ? original : valor;
  });
}

/** Negrito, itálico, código e link dentro de uma linha de texto. */
function inline(texto: string, chaveBase: string): React.ReactNode[] {
  const partes: React.ReactNode[] = [];
  const padrao = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*([^*]+)\*/g;
  let cursor = 0;
  let achado: RegExpExecArray | null;
  let i = 0;

  while ((achado = padrao.exec(texto)) !== null) {
    if (achado.index > cursor) partes.push(texto.slice(cursor, achado.index));
    const chave = `${chaveBase}-${i++}`;

    if (achado[1] !== undefined) {
      partes.push(<strong key={chave} className="font-bold text-[#1a1a1a]">{achado[1]}</strong>);
    } else if (achado[2] !== undefined) {
      const href = achado[3];
      const externo = /^https?:\/\//.test(href) && !href.includes('focaoapp.com.br');
      partes.push(
        <a
          key={chave}
          href={href}
          {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-[#055A43] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#055A43]"
        >
          {achado[2]}
        </a>,
      );
    } else if (achado[4] !== undefined) {
      partes.push(
        <code key={chave} className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.88em]">
          {achado[4]}
        </code>,
      );
    } else if (achado[5] !== undefined) {
      partes.push(<em key={chave}>{achado[5]}</em>);
    }
    cursor = achado.index + achado[0].length;
  }
  if (cursor < texto.length) partes.push(texto.slice(cursor));
  return partes;
}

function celulas(linha: string): string[] {
  return linha.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

/** Uma tabela de markdown, com rolagem horizontal própria no celular. */
function Tabela({ linhas, chave }: { linhas: string[]; chave: string }) {
  const cabecalho = celulas(linhas[0]);
  const corpo = linhas.slice(2).map(celulas);

  return (
    <div className="-mx-1 mb-6 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[13.5px]">
        <thead>
          <tr>
            {cabecalho.map((titulo, i) => (
              <th
                key={`${chave}-th-${i}`}
                className="whitespace-nowrap border-b border-[#055A43]/25 px-3 py-2 text-left font-bold text-[#055A43]"
              >
                {inline(titulo, `${chave}-th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corpo.map((linha, l) => (
            <tr key={`${chave}-tr-${l}`}>
              {linha.map((celula, c) => (
                <td
                  key={`${chave}-td-${l}-${c}`}
                  className="border-b border-black/5 px-3 py-2 align-top leading-[1.55] text-[#3a3a3a]"
                >
                  {inline(celula, `${chave}-td-${l}-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Quebra o markdown em blocos separados por linha em branco e renderiza cada um. */
function blocos(markdown: string): React.ReactNode[] {
  const saida: React.ReactNode[] = [];
  const grupos = markdown.split(/\n{2,}/);

  grupos.forEach((grupo, g) => {
    const bruto = grupo.trim();
    if (!bruto) return;
    const chave = `b${g}`;
    const linhas = bruto.split('\n');

    if (bruto.startsWith('# ')) {
      saida.push(
        <h1 key={chave} className="mb-3 font-serif text-[30px] leading-[1.12] tracking-tight text-[#055A43]">
          {inline(bruto.slice(2), chave)}
        </h1>,
      );
      return;
    }
    if (bruto.startsWith('## ')) {
      saida.push(
        <h2 key={chave} className="mb-3 mt-10 font-serif text-[21px] leading-tight text-[#055A43]">
          {inline(bruto.slice(3), chave)}
        </h2>,
      );
      return;
    }
    if (bruto.startsWith('### ')) {
      saida.push(
        <h3 key={chave} className="mb-2 mt-6 text-[15px] font-bold text-[#1a1a1a]">
          {inline(bruto.slice(4), chave)}
        </h3>,
      );
      return;
    }
    if (/^-{3,}$/.test(bruto)) {
      saida.push(<hr key={chave} className="my-9 border-t border-black/10" />);
      return;
    }
    if (linhas[0].startsWith('|')) {
      saida.push(
        <React.Fragment key={chave}>
          <Tabela linhas={linhas} chave={chave} />
        </React.Fragment>,
      );
      return;
    }
    if (linhas[0].startsWith('> ')) {
      saida.push(
        <blockquote
          key={chave}
          className="mb-5 rounded-lg border-l-[3px] border-[#055A43] bg-[#055A43]/[0.06] px-4 py-3 text-[14.5px] leading-[1.6] text-[#3a3a3a]"
        >
          {inline(linhas.map((l) => l.replace(/^> ?/, '')).join(' '), chave)}
        </blockquote>,
      );
      return;
    }
    if (linhas[0].startsWith('- ')) {
      saida.push(
        <ul key={chave} className="mb-5 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.7] text-[#3a3a3a]">
          {linhas.map((linha, i) => (
            <li key={`${chave}-li-${i}`}>{inline(linha.replace(/^- /, ''), `${chave}-li-${i}`)}</li>
          ))}
        </ul>,
      );
      return;
    }
    saida.push(
      <p key={chave} className="mb-4 text-[15px] leading-[1.7] text-[#3a3a3a]">
        {inline(linhas.join(' '), chave)}
      </p>,
    );
  });

  return saida;
}

export function LegalDoc({ markdown }: { markdown: string }) {
  return <div className="legal-doc">{blocos(preencher(markdown))}</div>;
}
