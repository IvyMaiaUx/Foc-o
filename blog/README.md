# Blog do Focão — como publicar

Cada artigo é um arquivo na pasta `src/content/blog/`. Para publicar um artigo novo,
você **não precisa mexer em código**: basta adicionar um arquivo e subir.

## Passo a passo

1. Copie `src/content/blog/_modelo.md`.
2. Renomeie para o slug do artigo, ex.: `ansiedade-de-separacao.md`.
3. Coloque a imagem de capa em `src/assets/blog/` e aponte o campo `imagemCapa` para ela.
4. Preencha o frontmatter (campos entre `---`) e escreva o texto embaixo.
5. Salve e suba (commit/push). O site rebuilda e publica em `focaoapp.com.br/blog/<slug>`.

## O que cada campo significa

- **title**: título que aparece na página (H1).
- **seoTitle**: título para o Google.
- **description**: meta descrição (~155 caracteres).
- **slug**: endereço na URL.
- **pilar**: tema do artigo (um dos 7 valores listados no modelo).
- **tipo**: `pilar` (guia principal do tema), `apoio` (artigo comum) ou `plano` (passo a passo).
- **respostaRapida**: aparece numa caixa no topo do artigo.
- **ctaIntermediario**: `quiz` (preencha `quizId`) ou `ebook` (link para os e-books).
- **relacionados**: slugs de outros artigos (opcional; sem isso, usa os do mesmo pilar).

Tudo o mais — SEO, imagem otimizada, sitemap, rota — é automático.

## Rodar localmente (opcional)

```bash
cd blog
npm install
npm run dev     # abre em http://localhost:4321/blog
```

> Para usar passos numerados (`<Etapas>`/`<Etapa>`) dentro do texto, o arquivo precisa ter
> extensão `.mdx` em vez de `.md`.
