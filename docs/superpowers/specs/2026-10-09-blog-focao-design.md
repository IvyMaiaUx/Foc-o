# Blog do Focão — Design

**Data:** 2026-10-09
**Branch:** `feat/blog` (worktree isolado a partir de `origin/main` do repo `restored-focao` / `github.com/IvyMaiaUx/Foc-o`)
**Autor do spec:** Claude + Ivy

## 1. Objetivo

Blog educativo sobre comportamento canino, escrito pela adestradora (Ivy), servido em
`focaoapp.com.br/blog` (subpasta, **não** subdomínio, por SEO). Meta: tráfego orgânico do
Google → levar tutores ao quiz e ao teste grátis de 7 dias do app. Publicação por quem
escreve = adicionar um arquivo Markdown, sem mexer em código.

## 2. Estado atual do site (investigação)

- **Stack:** Vite 6 + React 19 + React Router 7 + Tailwind v4 (SPA). Repo `restored-focao`.
- **Hospedagem:** Firebase Hosting, site `focao`, publica a pasta `dist/`. API/serverless no
  Vercel (`foc-o.vercel.app`). Dados no Firestore + Storage.
- **Roteamento (`firebase.json` em `origin/main`):** o Firebase serve arquivo estático antes
  de aplicar rewrites. Há rewrites explícitos para URLs limpas de funil/e-book (sem `.html`):
  `/ansiedade`, `/quiz-ansiedade`, `/ebook`, `/ebook-volta-sem-estresse`, `/ebook-adestre-7-dias`,
  `/ebook-ansiedade-separacao-7-dias`, `/ebook-primeiros-90-dias`, `/upsell`, `/obrigado`,
  `/vsl-ansiedade`, `/landing` → `index.html`, `/ebooks` → `focao-ebooks.html`, e o catch-all
  **`**` → `/app.html`** (a SPA). **Não há `cleanUrls` nem `trailingSlash` configurados** — as
  URLs limpas são feitas pelos rewrites nomeados.
- **Páginas públicas estáticas existentes** (em `public/`, viram `dist/` no build): `index.html`,
  `app.html`, `focao-ebooks.html`, `ebook.html`, `ebook-adestre-7-dias.html`,
  `ebook-ansiedade-separacao-7-dias.html`, `ebook-primeiros-90-dias.html`, `obrigado.html`,
  `upsell.html`, `vsl-ansiedade.html`, `quiz-ansiedade.html`, `preview-email-fim-da-culpa.html`,
  `google17e62209296bb86d.html` (verificação Search Console), além de `robots.txt` e `sitemap.xml`.
- **Rotas client-side da SPA** (em `app.html`/`App.tsx`): `/welcome`, `/ebook-comportamento-e-rotina`,
  `/presell`, `/rotina-cachorro`, `/register`, `/login`, `/privacidade`, `/beta`, e a área
  autenticada (`/inicio`, `/onboarding/*`, `/plano`, etc. — bloqueada por `RequireAuth` e
  `Disallow` no robots).
- **Consentimento / analytics / pixel:** `public/consent.js` (incluído no fim do `<body>` das
  páginas estáticas) carrega Meta Pixel (`1623631332266427`) + pixel próprio FCT
  (`track-up.vercel.app`, `FCT-6A28F5`) **somente após** consentimento de marketing gravado em
  `localStorage['lgpd_consent']` — mesma chave do app React, então o consentimento é unificado no
  domínio. `consent.js` também redireciona hosts legados (`focao.firebaseapp.com`,
  `app.focaoapp.com.br`) para `focaoapp.com.br`.
- **Identidade visual:** paleta unificada — verde da marca `#055A43`, fundo off-white `#F7F5EF`,
  tinta `#2E3830`, secundários em `src/index.css` (`@theme`). **Divergência de fontes:** o app SPA
  usa DM Sans / Fraunces / Abril Fatface; as páginas estáticas de funil (ex.: `focao-ebooks.html`)
  usam **Plus Jakarta Sans + Lora**. O blog deve casar com o visual **público** do site — a
  decisão exata de fontes será confirmada contra a home real no momento da implementação (ver §13).
- **Engine (quiz):** `engine.focaoapp.com.br` e `quiz.focaoapp.com.br` hoje respondem com
  `X-Frame-Options: DENY` e CSP sem `frame-ancestors` → **não podem ser embutidos em iframe**.
  Habilitar o embed exige mudança no repo `engine-focao` (Vercel) — ver §9.

### Alertas operacionais (importantes)

- O working tree local de `restored-focao` está **sujo** (88 arquivos modificados) na branch
  `fix/whatsapp-admin-notifications` e **atrás de `origin/main`**. Por isso o blog é desenvolvido
  num **git worktree separado** a partir de `origin/main`, sem tocar nesse trabalho em andamento.
- Qualquer deploy do blog deve sair de uma árvore **sincronizada com `origin/main`** (o worktree
  está), para não regredir arquivos que só existem em produção/`origin/main`.

## 3. Decisões aprovadas

1. **Astro** gera o blog como HTML estático, na mesma pasta do site, deploy no mesmo Firebase.
2. Código no repo `restored-focao`, branch `feat/blog` (worktree).
3. CTA intermediário do quiz: **ID por artigo** no frontmatter (`quizId`), iframe
   `engine.focaoapp.com.br/q/[quizId]`; sem `quizId` → fallback para e-books.
4. CTA final do teste de 7 dias aponta para `app.focaoapp.com.br` (cadastro/início do teste).
5. Página de e-books (fallback): `https://focaoapp.com.br/focao-ebooks.html` (servida limpa em
   `/ebooks`) — **confirmado** que o arquivo existe em `origin/main`.
6. Autora: um arquivo de config + placeholder de foto; conteúdo preenchido depois.
7. Imagens de capa versionadas no repo (otimizadas pelo Astro).

## 4. Arquitetura

- Projeto Astro em subpasta do repo: `blog/` (raiz do Astro).
- `astro.config`: `site: 'https://focaoapp.com.br'`, `base: '/blog'`, `outDir: '../dist/blog'`,
  `build.format: 'directory'`, `trailingSlash` conforme §6. Integrações: `@astrojs/sitemap`,
  `@astrojs/mdx`, `astro:assets` (nativo) para imagens.
- **Build combinado:** o `build` do site passa a rodar `vite build` (gera `dist/`) e **depois**
  `astro build` (gera `dist/blog/`). Garantir que o `astro build` só limpa/escreve `dist/blog` e
  que o `vite build` não apague `dist/blog` (ordem: Vite primeiro, Astro por último; conferir
  `emptyOutDir`). Deploy inalterado: `firebase deploy --only hosting` do site `focao`.
- Firebase serve `dist/blog/**` como arquivos estáticos antes do catch-all `** → /app.html`,
  então o blog tem precedência natural sobre a SPA.

## 5. Conteúdo e frontmatter

- **Content collection** `blog` (Astro valida o frontmatter no build via schema Zod; build falha
  com mensagem clara se faltar/estiver errado um campo).
- Artigos: `blog/src/content/blog/<slug>.md` (ou `.mdx`).
- **Schema do frontmatter:** `title`, `seoTitle`, `description`, `slug`, `pilar` (enum),
  `tipo` (`pilar` | `apoio` | `plano`), `autora`, `publicadoEm` (data), `atualizadoEm` (data),
  `imagemCapa` (ref de imagem no repo), `respostaRapida` (texto), `ctaIntermediario`
  (`quiz` | `ebook`), `quizId` (string, opcional), `relacionados` (array de slugs, opcional).
- **Pilares** (enum validado + config central com nome amigável e a "pergunta do tutor"):
  `ficar-sozinho`, `xixi-no-lugar`, `filhotes`, `agitacao`, `comandos-basicos`,
  `rotina-e-limites`, `adocao-e-racas`.
- Imagens de capa em `blog/src/assets/blog/`, referenciadas no frontmatter; Astro gera webp +
  tamanhos responsivos + lazy + `alt`.

## 6. Rotas, URLs e padrão de barra final

Páginas geradas:
- `/blog` — home do blog
- `/blog/tema/[pilar]` — página de pilar (7 páginas)
- `/blog/[slug]` — artigo
- `/blog/autora` — página da autora

**Padrão único de barra final (requisito):** adotar **sem barra final** (`trailingSlash: 'never'`),
coerente com as URLs limpas já usadas no site (`/ebooks`, `/ansiedade`). O mesmo padrão é usado em
**canonical**, **sitemap** e **links internos**. Para servir os arquivos de diretório do Astro
(`/blog/<slug>/index.html`) em URLs sem barra e sem `.html`, e para garantir 301 do formato
alternativo:

- **Plano de `firebase.json` (em etapa verificada):** antes de mexer, inventariar **todas** as
  URLs atuais (home `/`, `/landing`, `/ebooks`, `/ebook`, `/ebook-*`, `/ansiedade`,
  `/quiz-ansiedade`, `/upsell`, `/obrigado`, `/vsl-ansiedade`, `/presell`, `/rotina-cachorro`,
  `/privacidade`, `/beta`, `/register`, `/login`, `focao-ebooks.html`, arquivos `.html` diretos,
  verificação do Search Console, `robots.txt`, `sitemap.xml`) e confirmar ao vivo que continuam
  200 após a mudança.
- **Abordagem recomendada:** habilitar `"cleanUrls": true` + `"trailingSlash": false`
  globalmente → URLs limpas sem `.html` em todo o domínio (inclui o blog), com **redirects 301**
  explícitos onde a forma antiga mudar (ex.: `/foo.html` → `/foo`), preservando os rewrites
  nomeados existentes. **Alternativa de menor risco** (se a verificação acusar regressão): não
  mexer nas flags globais e deixar o blog com barra final (`trailingSlash: 'always'`, servido
  nativamente pelo Firebase como índice de diretório), mantendo o padrão único *dentro* do blog.
- A escolha final entre as duas é travada na etapa de verificação do plano (listar URLs →
  aplicar → conferir 200/301 ao vivo).

## 7. Páginas (detalhe)

**Home `/blog`:**
- Topo: pergunta "O que está acontecendo com o seu cão?" + botões nas palavras do tutor, cada um
  → pilar correspondente: "Chora quando eu saio" → `ficar-sozinho`; "Faz xixi fora do lugar" →
  `xixi-no-lugar`; "Pula em todo mundo" → `agitacao`; "Filhote morde tudo" → `filhotes`;
  "Não vem quando chamo" → `comandos-basicos`; "Late para a campainha" → `agitacao` (ajustável).
- Destaque "Comece por aqui" com o guia pilar principal.
- Caixa do quiz ("Não sabe qual é o caso do seu cão?").
- Artigos recentes.
- Faixa com foto + frase da autora.

**Pilar `/blog/tema/[pilar]`:** guia pilar (`tipo: pilar`) em destaque + lista dos artigos de
apoio (`tipo: apoio`/`plano`) do pilar.

**Artigo `/blog/[slug]`:** ver §8.

**Autora `/blog/autora`:** bio, formação, foto, método + JSON-LD `Person`. Conteúdo de um arquivo
de config único (placeholder até a autora enviar).

## 8. Componentes da página de artigo

- Breadcrumb (Blog / Pilar / Artigo) + JSON-LD `BreadcrumbList`.
- Cabeçalho: H1 único (título), foto + nome da autora + "adestradora" + "atualizado em" (data).
- Caixa **Resposta rápida** logo no início (do frontmatter `respostaRapida`).
- Componente de **etapas numeradas** reutilizável no corpo (para artigos `tipo: plano`; em MDX).
- **CTA intermediário** no meio do texto: se `ctaIntermediario: quiz` e `quizId` presente →
  iframe do quiz (§9); senão → link para a página de e-books.
- **CTA final** (teste de 7 dias) → `app.focaoapp.com.br`, **sempre** com as condições: cartão
  necessário, R$67/mês depois, cancelamento pelo app.
- **Barra fixa** no rodapé, discreta, **só no mobile**, com o botão do teste grátis.
- Bloco "Sobre a autora" + aviso: "Este conteúdo é educativo e não substitui a avaliação de um
  médico-veterinário."
- Artigos relacionados do mesmo pilar (usa `relacionados` ou, na falta, os do mesmo `pilar`).
- JSON-LD `Article` com `author` como `Person`.

## 9. Embed do quiz (dependência cross-repo: `engine-focao`)

Para o iframe `engine.focaoapp.com.br/q/[quizId]` funcionar dentro de `focaoapp.com.br`:

1. **No repo `engine-focao` (Vercel):** nas rotas de quiz (`/q/[id]` e, se usado, `/s/[slug]`),
   **remover `X-Frame-Options: DENY`** e definir CSP `frame-ancestors 'self' https://focaoapp.com.br`.
   Manter o painel/login da engine **não** embutíveis (anti-clickjacking).
2. **Auto-altura:** a página do quiz (engine) emite a altura via `postMessage`; um wrapper leve no
   blog escuta e ajusta a altura do iframe.
3. **UTM:** o blog repassa os parâmetros UTM (§11) para a `src` do iframe do quiz.
4. **CSP do site/blog (`firebase.json`):** adicionar `frame-src https://engine.focaoapp.com.br`
   (hoje é `frame-src 'self' https://www.google.com`), senão o próprio site bloqueia o iframe.

**Desacoplamento:** o blog entra no ar com o **fallback de e-book** funcionando sem essas
mudanças; o embed do quiz é ligado quando o deploy da engine com os cabeçalhos ajustados subir.

## 10. SEO (requisitos obrigatórios)

- Páginas 100% estáticas (Astro SSG), rápidas no mobile.
- Por página: `title`, meta `description`, `canonical`, Open Graph e Twitter card.
- JSON-LD: `Article` (com `author` como `Person`) nos artigos, `BreadcrumbList` nos artigos,
  `Person` na página da autora.
- `sitemap.xml` do blog via `@astrojs/sitemap` (todas as páginas do blog). **Não sobrescrever** o
  `sitemap.xml` da raiz: gerar um sitemap do blog em caminho próprio (ex.: `/blog/sitemap-index.xml`)
  e referenciá-lo no `robots.txt` da raiz **adicionando** uma linha `Sitemap:` (a existente do
  site permanece). O `robots.txt` da raiz continua o atual, só ganha a referência ao sitemap do
  blog.
- URLs limpas, sem `.html` (§6). Um único H1 por página, hierarquia correta de títulos.
- Imagens otimizadas (webp, responsivas, lazy, `alt`).

## 11. Rastreio (UTM)

Helper central monta **todo** link externo (quiz, e-books, checkout/app) com:
`utm_source=blog`, `utm_medium=artigo`, `utm_campaign=[pilar]`, `utm_content=[slug]`.
Aplicado a: CTA final (app), CTA intermediário (quiz via `src` do iframe e link de e-book).

## 12. Consentimento / analytics / pixel

O blog reutiliza o **mesmo** `/consent.js` do site (incluído no fim do `<body>` das páginas do
blog), que faz o gate dos pixels Meta + FCT por `localStorage['lgpd_consent']` e renderiza o banner
de cookies. Como é o mesmo domínio e a mesma chave, o consentimento é unificado automaticamente.
(Confirmar na implementação se o banner é renderizado pelo próprio `consent.js` ou por markup à
parte nas páginas estáticas, e replicar o que faltar.)

## 13. Identidade visual

- Reusar os **tokens** de `src/index.css` (`@theme`): verde `#055A43`, fundo `#F7F5EF`, tinta
  `#2E3830` e demais variáveis; logo/Wordmark; Tailwind v4.
- Recriar header e rodapé em componentes Astro que casem **pixel a pixel** com o visual público
  do site. Confirmar contra a home real `focaoapp.com.br/` qual conjunto de fontes é o público
  (app usa DM Sans/Fraunces/Abril; estáticas usam Plus Jakarta Sans/Lora) e usar o mesmo no blog,
  para que "quem clica do blog para o site não sinta que mudou de lugar".
- Mobile-first, largura de leitura ~70 caracteres, contraste e foco visível (acessibilidade).

## 14. Link "Blog" no menu do site

No site principal, **apenas** adicionar o link "Blog" (→ `/blog`) no menu/navegação pública.
Nenhuma outra mudança na landing. (Local exato do componente de navegação pública a confirmar na
implementação — candidatos: header da home/Welcome e `MainLayout`/`LegalFooter`.)

## 15. Publicação (entregáveis para a autora)

- Arquivo **modelo** de artigo: `blog/src/content/blog/_modelo.md` com todo o frontmatter
  comentado e um corpo de exemplo (incluindo o componente de etapas, resposta rápida, relacionados).
- **README curto** (`blog/README.md`): como publicar — copiar o modelo, preencher o frontmatter,
  nomear o arquivo com o `slug`, colocar a imagem de capa em `src/assets/blog/`, salvar e subir;
  o resto (SEO, sitemap, imagem otimizada, rotas) é automático. Explicar os valores de `pilar`,
  `tipo` e `ctaIntermediario`.

## 16. Pré-requisitos e riscos

- **Dependência `engine-focao`** para o embed do quiz (§9) — blog funciona sem, com fallback.
- **Sincronização de repo:** desenvolver/deployar a partir de `origin/main` (worktree), nunca da
  branch local suja.
- **`firebase.json`:** mudanças de `cleanUrls`/`trailingSlash` só após inventário + verificação ao
  vivo (§6), com 301 onde mudar.
- **Não sobrescrever** `robots.txt` nem `sitemap.xml` da raiz (§10).
- **Build combinado:** garantir que Vite e Astro não apaguem a saída um do outro (§4).

## 17. Fora de escopo

- Escrever os artigos (a autora entrega; o 1º será "ansiedade de separação" como teste).
- CMS/admin de postagem (publicação é por arquivo no repo).
- Comentários, busca no blog, newsletter (YAGNI por ora).

## 18. Suposições confirmadas

- E-book fallback: `focaoapp.com.br/focao-ebooks.html` (`/ebooks`) — existe em `origin/main`. ✅
- Autora: config + placeholders. ✅
- Imagens de capa no repo. ✅
