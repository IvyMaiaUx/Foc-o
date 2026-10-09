# Blog do Focão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar um blog educativo estático em `focaoapp.com.br/blog`, onde cada artigo é um Markdown/MDX com frontmatter, com SEO completo e a identidade do site.

**Architecture:** Projeto Astro em `blog/` dentro do repo `restored-focao`, compila Markdown → HTML estático em `../dist/blog`. O `build` do site roda Vite (gera `dist/`) e depois Astro (gera `dist/blog/`). O Firebase Hosting serve `dist/blog/**` como arquivos estáticos antes do catch-all da SPA. Helpers puros (UTM, quiz, pilares, JSON-LD, relacionados) têm testes unitários (Vitest); páginas são verificadas por build + navegador.

**Tech Stack:** Astro 5, `@astrojs/mdx`, `@astrojs/sitemap`, `astro:assets`, Tailwind (via `@astrojs/tailwind` ou CSS com os mesmos tokens), Vitest. Deploy: Firebase Hosting (site `focao`). Node 24 / npm 11.

**Workspace:** worktree `feat/blog` em `~/Documents/New project/restored-focao--feat-blog` (saído de `origin/main`). Todos os caminhos abaixo são relativos à raiz desse worktree, salvo nota.

**Spec:** `docs/superpowers/specs/2026-10-09-blog-focao-design.md`.

---

## Convenções deste plano

- Comandos rodam a partir da raiz do worktree, salvo indicação `cd blog`.
- Commits frequentes, um por task (ou por par teste→impl).
- Testes unitários dos helpers rodam em `blog/` com `npm --prefix blog run test`.

---

## Task 0: Scaffold do projeto Astro em `blog/`

**Files:**
- Create: `blog/package.json`
- Create: `blog/astro.config.mjs`
- Create: `blog/tsconfig.json`
- Create: `blog/vitest.config.ts`
- Create: `blog/.gitignore`
- Create: `blog/src/env.d.ts`

- [ ] **Step 1: Criar `blog/package.json`**

```json
{
  "name": "focao-blog",
  "type": "module",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@astrojs/mdx": "^4.0.0",
    "@astrojs/sitemap": "^3.4.0",
    "astro": "^5.8.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  }
}
```

(Se `npm install` reclamar de versão, aceitar a última estável compatível de cada pacote.)

- [ ] **Step 2: Criar `blog/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// base '/blog' → todas as rotas e assets ficam sob /blog.
// outDir '../dist/blog' → entra na pasta publicada pelo Firebase.
// trailingSlash 'never' + format 'directory' → URLs limpas sem barra final.
export default defineConfig({
  site: 'https://focaoapp.com.br',
  base: '/blog',
  outDir: '../dist/blog',
  trailingSlash: 'never',
  build: { format: 'directory' },
  integrations: [mdx(), sitemap()],
});
```

- [ ] **Step 3: Criar `blog/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Criar `blog/vitest.config.ts`**

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Criar `blog/.gitignore`**

```
dist/
.astro/
node_modules/
```

- [ ] **Step 6: Criar `blog/src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
```

- [ ] **Step 7: Instalar dependências**

Run: `cd blog && npm install`
Expected: instala sem erro; cria `blog/node_modules` e `blog/package-lock.json`.

- [ ] **Step 8: Commit**

```bash
git add blog/package.json blog/package-lock.json blog/astro.config.mjs blog/tsconfig.json blog/vitest.config.ts blog/.gitignore blog/src/env.d.ts
git commit -m "chore(blog): scaffold do projeto Astro"
```

---

## Task 1: Helper de UTM (TDD)

**Files:**
- Create: `blog/src/lib/utm.ts`
- Test: `blog/src/lib/utm.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`blog/src/lib/utm.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { withUtm } from './utm';

describe('withUtm', () => {
  it('adiciona os 4 parâmetros UTM fixos do blog', () => {
    const out = withUtm('https://app.focaoapp.com.br', { pilar: 'ficar-sozinho', slug: 'ansiedade-de-separacao' });
    const url = new URL(out);
    expect(url.searchParams.get('utm_source')).toBe('blog');
    expect(url.searchParams.get('utm_medium')).toBe('artigo');
    expect(url.searchParams.get('utm_campaign')).toBe('ficar-sozinho');
    expect(url.searchParams.get('utm_content')).toBe('ansiedade-de-separacao');
  });

  it('preserva query existente e caminho', () => {
    const out = withUtm('https://engine.focaoapp.com.br/q/abc?x=1', { pilar: 'filhotes', slug: 's1' });
    const url = new URL(out);
    expect(url.pathname).toBe('/q/abc');
    expect(url.searchParams.get('x')).toBe('1');
    expect(url.searchParams.get('utm_campaign')).toBe('filhotes');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix blog run test`
Expected: FAIL — `Cannot find module './utm'`.

- [ ] **Step 3: Implementar `blog/src/lib/utm.ts`**

```ts
export interface UtmContext {
  pilar: string;
  slug: string;
}

/** Adiciona os UTMs fixos do blog a qualquer URL de saída (quiz, e-books, app). */
export function withUtm(baseUrl: string, { pilar, slug }: UtmContext): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', 'blog');
  url.searchParams.set('utm_medium', 'artigo');
  url.searchParams.set('utm_campaign', pilar);
  url.searchParams.set('utm_content', slug);
  return url.toString();
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm --prefix blog run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add blog/src/lib/utm.ts blog/src/lib/utm.test.ts
git commit -m "feat(blog): helper withUtm com testes"
```

---

## Task 2: Config de destinos + builder do quiz (TDD)

**Files:**
- Create: `blog/src/lib/destinos.ts`
- Create: `blog/src/lib/quiz.ts`
- Test: `blog/src/lib/quiz.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`blog/src/lib/quiz.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { quizEmbedUrl } from './quiz';

describe('quizEmbedUrl', () => {
  it('monta a URL do iframe na engine com o id e UTMs', () => {
    const out = quizEmbedUrl('abc123', { pilar: 'agitacao', slug: 'pula-nas-pessoas' });
    const url = new URL(out);
    expect(url.origin).toBe('https://engine.focaoapp.com.br');
    expect(url.pathname).toBe('/q/abc123');
    expect(url.searchParams.get('utm_source')).toBe('blog');
    expect(url.searchParams.get('utm_campaign')).toBe('agitacao');
    expect(url.searchParams.get('utm_content')).toBe('pula-nas-pessoas');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix blog run test`
Expected: FAIL — `Cannot find module './quiz'`.

- [ ] **Step 3: Implementar `blog/src/lib/destinos.ts`**

```ts
/** URLs de saída do blog. Todo link externo passa pelo withUtm (ver utm.ts). */
export const APP_URL = 'https://app.focaoapp.com.br';
export const EBOOKS_URL = 'https://focaoapp.com.br/focao-ebooks.html';
export const ENGINE_URL = 'https://engine.focaoapp.com.br';

/** Condições do teste de 7 dias, exibidas sempre junto do CTA final. */
export const TESTE_CONDICOES =
  'Precisa de cartão. R$67/mês depois dos 7 dias. Cancela quando quiser, pelo app.';
```

- [ ] **Step 4: Implementar `blog/src/lib/quiz.ts`**

```ts
import { withUtm, type UtmContext } from './utm';
import { ENGINE_URL } from './destinos';

/** URL do quiz embutido (engine.focaoapp.com.br/q/[id]) com UTMs repassados. */
export function quizEmbedUrl(quizId: string, ctx: UtmContext): string {
  return withUtm(`${ENGINE_URL}/q/${quizId}`, ctx);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm --prefix blog run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add blog/src/lib/destinos.ts blog/src/lib/quiz.ts blog/src/lib/quiz.test.ts
git commit -m "feat(blog): destinos e quizEmbedUrl com testes"
```

---

## Task 3: Config dos pilares + botões da home (TDD)

**Files:**
- Create: `blog/src/lib/pilares.ts`
- Test: `blog/src/lib/pilares.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`blog/src/lib/pilares.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { PILARES, PILAR_INFO, BOTOES_TUTOR } from './pilares';

describe('pilares', () => {
  it('tem os 7 pilares', () => {
    expect(PILARES).toHaveLength(7);
    expect(PILARES).toContain('ficar-sozinho');
    expect(PILARES).toContain('adocao-e-racas');
  });

  it('todo pilar tem nome amigável', () => {
    for (const p of PILARES) {
      expect(PILAR_INFO[p].nome.length).toBeGreaterThan(0);
    }
  });

  it('todo botão da home aponta para um pilar válido', () => {
    for (const b of BOTOES_TUTOR) {
      expect(PILARES).toContain(b.pilar);
      expect(b.texto.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix blog run test`
Expected: FAIL — `Cannot find module './pilares'`.

- [ ] **Step 3: Implementar `blog/src/lib/pilares.ts`**

```ts
export const PILARES = [
  'ficar-sozinho',
  'xixi-no-lugar',
  'filhotes',
  'agitacao',
  'comandos-basicos',
  'rotina-e-limites',
  'adocao-e-racas',
] as const;

export type Pilar = (typeof PILARES)[number];

export interface PilarInfo {
  nome: string;
  descricao: string;
}

export const PILAR_INFO: Record<Pilar, PilarInfo> = {
  'ficar-sozinho': { nome: 'Ficar sozinho', descricao: 'Ansiedade de separação, chorar e destruir quando você sai.' },
  'xixi-no-lugar': { nome: 'Xixi no lugar', descricao: 'Ensinar o lugar certo e parar os acidentes em casa.' },
  'filhotes': { nome: 'Filhotes', descricao: 'Mordidas, socialização e os primeiros dias em casa.' },
  'agitacao': { nome: 'Agitação', descricao: 'Pular nas pessoas, latir e não conseguir se acalmar.' },
  'comandos-basicos': { nome: 'Comandos básicos', descricao: 'Senta, fica, vem e os comandos do dia a dia.' },
  'rotina-e-limites': { nome: 'Rotina e limites', descricao: 'Organizar o dia do cão e colocar limites com carinho.' },
  'adocao-e-racas': { nome: 'Adoção e raças', descricao: 'Escolher, adotar e entender o temperamento de cada cão.' },
};

/** Botões "nas palavras do tutor" no topo da home. */
export const BOTOES_TUTOR: { texto: string; pilar: Pilar }[] = [
  { texto: 'Chora quando eu saio', pilar: 'ficar-sozinho' },
  { texto: 'Faz xixi fora do lugar', pilar: 'xixi-no-lugar' },
  { texto: 'Pula em todo mundo', pilar: 'agitacao' },
  { texto: 'Filhote morde tudo', pilar: 'filhotes' },
  { texto: 'Não vem quando chamo', pilar: 'comandos-basicos' },
  { texto: 'Late para a campainha', pilar: 'agitacao' },
];
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm --prefix blog run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add blog/src/lib/pilares.ts blog/src/lib/pilares.test.ts
git commit -m "feat(blog): config de pilares e botões da home com testes"
```

---

## Task 4: Collection de conteúdo + schema do frontmatter

**Files:**
- Create: `blog/src/content.config.ts`
- Create: `blog/src/content/blog/_exemplo-teste.md` (fixture para o build; prefixo `_` não vira página)
- Create: `blog/src/assets/blog/.gitkeep`

- [ ] **Step 1: Implementar `blog/src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { PILARES } from './lib/pilares';

// glob loader ignora arquivos começando com "_" → _modelo.md e fixtures não viram páginas.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      seoTitle: z.string(),
      description: z.string(),
      slug: z.string(),
      pilar: z.enum(PILARES),
      tipo: z.enum(['pilar', 'apoio', 'plano']),
      autora: z.string(),
      publicadoEm: z.coerce.date(),
      atualizadoEm: z.coerce.date(),
      imagemCapa: image(),
      respostaRapida: z.string(),
      ctaIntermediario: z.enum(['quiz', 'ebook']),
      quizId: z.string().optional(),
      relacionados: z.array(z.string()).optional(),
    }),
});

export const collections = { blog };
```

- [ ] **Step 2: Criar a imagem de capa de exemplo**

Run:
```bash
mkdir -p blog/src/assets/blog
# imagem placeholder 1200x630 (gerar ou copiar uma existente do repo):
cp "public/og-image.png" "blog/src/assets/blog/_exemplo-teste.png" 2>/dev/null || :
```
Se `public/og-image.png` não existir no worktree, criar um PNG qualquer 1200x630 em `blog/src/assets/blog/_exemplo-teste.png`.
Também criar `blog/src/assets/blog/.gitkeep` (vazio).

- [ ] **Step 3: Criar fixture `blog/src/content/blog/_exemplo-teste.md`**

```markdown
---
title: Artigo de exemplo (fixture)
seoTitle: Artigo de exemplo | Focão
description: Fixture usado só para validar o build. Não vira página.
slug: exemplo-teste
pilar: ficar-sozinho
tipo: apoio
autora: Ivy
publicadoEm: 2026-10-09
atualizadoEm: 2026-10-09
imagemCapa: ../../assets/blog/_exemplo-teste.png
respostaRapida: Esta é a resposta rápida do artigo de exemplo.
ctaIntermediario: ebook
relacionados: []
---

Corpo de exemplo.
```

- [ ] **Step 4: Verificar que o Astro valida o schema**

Run: `cd blog && npm run build`
Expected: build PASS (o fixture `_exemplo-teste.md` é ignorado pelo loader por começar com `_`; nenhuma página gerada ainda além do que existir). Se o schema estiver quebrado, o build falha com mensagem clara.

- [ ] **Step 5: Commit**

```bash
git add blog/src/content.config.ts "blog/src/content/blog/_exemplo-teste.md" blog/src/assets/blog
git commit -m "feat(blog): collection e schema do frontmatter"
```

---

## Task 5: Seletor de artigos relacionados (TDD)

**Files:**
- Create: `blog/src/lib/relacionados.ts`
- Test: `blog/src/lib/relacionados.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`blog/src/lib/relacionados.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { escolherRelacionados } from './relacionados';

type Art = { slug: string; pilar: string; relacionados?: string[] };
const base: Art = { slug: 'a', pilar: 'filhotes' };
const todos: Art[] = [
  base,
  { slug: 'b', pilar: 'filhotes' },
  { slug: 'c', pilar: 'filhotes' },
  { slug: 'd', pilar: 'agitacao' },
];

describe('escolherRelacionados', () => {
  it('usa a lista explícita quando existir', () => {
    const art = { ...base, relacionados: ['c', 'd'] };
    const out = escolherRelacionados(art, todos, 3);
    expect(out.map((a) => a.slug)).toEqual(['c', 'd']);
  });

  it('cai no mesmo pilar quando não há lista, sem incluir o próprio artigo', () => {
    const out = escolherRelacionados(base, todos, 3);
    expect(out.map((a) => a.slug)).toEqual(['b', 'c']);
  });

  it('respeita o limite', () => {
    const out = escolherRelacionados(base, todos, 1);
    expect(out).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix blog run test`
Expected: FAIL — `Cannot find module './relacionados'`.

- [ ] **Step 3: Implementar `blog/src/lib/relacionados.ts`**

```ts
export interface ArtigoRef {
  slug: string;
  pilar: string;
  relacionados?: string[];
}

/** Relacionados: lista explícita do frontmatter; senão, outros do mesmo pilar. */
export function escolherRelacionados<T extends ArtigoRef>(
  atual: T,
  todos: T[],
  limite: number,
): T[] {
  if (atual.relacionados && atual.relacionados.length > 0) {
    const porSlug = new Map(todos.map((a) => [a.slug, a]));
    return atual.relacionados
      .map((s) => porSlug.get(s))
      .filter((a): a is T => Boolean(a))
      .slice(0, limite);
  }
  return todos
    .filter((a) => a.pilar === atual.pilar && a.slug !== atual.slug)
    .slice(0, limite);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm --prefix blog run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add blog/src/lib/relacionados.ts blog/src/lib/relacionados.test.ts
git commit -m "feat(blog): seletor de artigos relacionados com testes"
```

---

## Task 6: Builders de JSON-LD (TDD)

**Files:**
- Create: `blog/src/lib/jsonld.ts`
- Test: `blog/src/lib/jsonld.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`blog/src/lib/jsonld.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { articleJsonLd, breadcrumbJsonLd, personJsonLd } from './jsonld';

describe('jsonld', () => {
  it('Article tem author como Person', () => {
    const o = articleJsonLd({
      title: 'T', description: 'D', url: 'https://focaoapp.com.br/blog/x',
      image: 'https://focaoapp.com.br/blog/x.png',
      publicadoEm: new Date('2026-01-01'), atualizadoEm: new Date('2026-02-01'),
      autoraNome: 'Ivy', autoraUrl: 'https://focaoapp.com.br/blog/autora',
    });
    expect(o['@type']).toBe('Article');
    expect(o.author['@type']).toBe('Person');
    expect(o.author.name).toBe('Ivy');
    expect(o.datePublished).toBe('2026-01-01T00:00:00.000Z');
  });

  it('BreadcrumbList numera as posições', () => {
    const o = breadcrumbJsonLd([
      { name: 'Blog', url: 'https://focaoapp.com.br/blog' },
      { name: 'Ficar sozinho', url: 'https://focaoapp.com.br/blog/tema/ficar-sozinho' },
    ]);
    expect(o.itemListElement[0].position).toBe(1);
    expect(o.itemListElement[1].position).toBe(2);
    expect(o.itemListElement[1].item).toBe('https://focaoapp.com.br/blog/tema/ficar-sozinho');
  });

  it('Person tem nome', () => {
    const o = personJsonLd({ name: 'Ivy', url: 'https://focaoapp.com.br/blog/autora', jobTitle: 'Adestradora' });
    expect(o['@type']).toBe('Person');
    expect(o.name).toBe('Ivy');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm --prefix blog run test`
Expected: FAIL — `Cannot find module './jsonld'`.

- [ ] **Step 3: Implementar `blog/src/lib/jsonld.ts`**

```ts
export function articleJsonLd(a: {
  title: string; description: string; url: string; image: string;
  publicadoEm: Date; atualizadoEm: Date; autoraNome: string; autoraUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    image: a.image,
    mainEntityOfPage: { '@type': 'WebPage', '@id': a.url },
    datePublished: a.publicadoEm.toISOString(),
    dateModified: a.atualizadoEm.toISOString(),
    author: { '@type': 'Person', name: a.autoraNome, url: a.autoraUrl },
    publisher: {
      '@type': 'Organization',
      name: 'Focão',
      logo: { '@type': 'ImageObject', url: 'https://focaoapp.com.br/favicon-32x32.png' },
    },
  } as const;
}

export function breadcrumbJsonLd(itens: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function personJsonLd(p: { name: string; url: string; jobTitle: string; image?: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p.name,
    url: p.url,
    jobTitle: p.jobTitle,
    ...(p.image ? { image: p.image } : {}),
    ...(p.description ? { description: p.description } : {}),
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm --prefix blog run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add blog/src/lib/jsonld.ts blog/src/lib/jsonld.test.ts
git commit -m "feat(blog): builders de JSON-LD com testes"
```

---

## Task 7: Tokens visuais + fontes + CSS base

**Files:**
- Create: `blog/src/styles/global.css`
- Create: `blog/src/config/autora.ts`

**Nota de identidade:** confirmar contra `focaoapp.com.br/` (home pública) qual conjunto de fontes é o público. Este CSS usa os tokens de `src/index.css` do site (verde `#055A43`, fundo `#F7F5EF`, tinta `#2E3830`). Para as fontes, usar as das páginas de marketing estáticas (Plus Jakarta Sans + Lora), que são as páginas públicas mais próximas do blog. Ajustar no passo de verificação visual (Task 17).

- [ ] **Step 1: Criar `blog/src/styles/global.css`**

```css
/* Tokens espelhados de src/index.css do site (paleta unificada). */
:root {
  --color-brand: #055A43;
  --color-background: #F7F5EF;
  --color-surface: #FFFEFB;
  --color-surface-soft: #EAF0E8;
  --color-ink: #2E3830;
  --color-ink-soft: #6B7A6E;
  --color-ink-faint: #8A9589;
  --color-line: #E4E1D6;
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-serif: 'Lora', Georgia, serif;
  --leitura: 70ch;
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--color-background);
  color: var(--color-ink);
  font-family: var(--font-sans);
  line-height: 1.65;
  font-size: 1.0625rem;
}
.container { width: 100%; max-width: 72rem; margin: 0 auto; padding: 0 1.25rem; }
.prose { max-width: var(--leitura); }
.prose h2, .prose h3 { font-family: var(--font-serif); color: var(--color-ink); line-height: 1.25; }
a { color: var(--color-brand); }
:focus-visible { outline: 3px solid var(--color-brand); outline-offset: 2px; }
img { max-width: 100%; height: auto; }
```

- [ ] **Step 2: Criar `blog/src/config/autora.ts` (placeholders)**

```ts
/** Dados da autora — preencher quando a Ivy enviar bio/formação/foto/método. */
export const AUTORA = {
  nome: 'Ivy',
  cargo: 'Adestradora',
  formacao: 'Adestradora formada. (Preencher formação.)',
  bio: 'Bio da autora. (Preencher.)',
  metodo: 'Método da autora. (Preencher.)',
  // Coloque a foto em blog/src/assets/autora.jpg e importe na página; placeholder por ora.
  fotoAlt: 'Foto de Ivy, adestradora do Focão',
  url: 'https://focaoapp.com.br/blog/autora',
};
```

- [ ] **Step 3: Commit**

```bash
git add blog/src/styles/global.css blog/src/config/autora.ts
git commit -m "feat(blog): tokens visuais, fontes e config da autora"
```

---

## Task 8: Componente SEO (`<head>`)

**Files:**
- Create: `blog/src/components/Seo.astro`

- [ ] **Step 1: Criar `blog/src/components/Seo.astro`**

```astro
---
interface Props {
  title: string;        // vai no <title> (usar seoTitle quando houver)
  description: string;
  canonical: string;    // URL absoluta, sem barra final
  image?: string;       // URL absoluta
  type?: 'website' | 'article';
}
const { title, description, canonical, image = 'https://focaoapp.com.br/og-image.png', type = 'website' } = Astro.props;
---
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonical} />

<meta property="og:type" content={type} />
<meta property="og:site_name" content="Focão" />
<meta property="og:locale" content="pt_BR" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={image} />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={image} />
```

- [ ] **Step 2: Commit**

```bash
git add blog/src/components/Seo.astro
git commit -m "feat(blog): componente Seo para o head"
```

---

## Task 9: Layout base (header + rodapé + consent)

**Files:**
- Create: `blog/src/layouts/BaseLayout.astro`
- Create: `blog/src/components/SiteHeader.astro`
- Create: `blog/src/components/SiteFooter.astro`

**Nota:** `SiteHeader`/`SiteFooter` reconstroem o header/rodapé públicos do site. Usam o logo de `public/` do site (ex.: `/favicon.svg` ou `/assets/focao-logo.png`, que já existem no domínio). O `<script src="/consent.js">` reaproveita o mesmo gate de pixel + banner do site (mesma origem, mesma chave `lgpd_consent`).

- [ ] **Step 1: Criar `blog/src/components/SiteHeader.astro`**

```astro
---
const base = import.meta.env.BASE_URL; // '/blog'
---
<header style="background:var(--color-surface);border-bottom:1px solid var(--color-line);">
  <div class="container" style="height:64px;display:flex;align-items:center;justify-content:space-between;">
    <a href="/" aria-label="Focão" style="display:flex;align-items:center;gap:.5rem;text-decoration:none;color:var(--color-brand);font-weight:700;">
      <img src="/assets/focao-logo.png" alt="Focão" width="104" height="28" style="display:block;" onerror="this.replaceWith(document.createTextNode('Focão'))" />
    </a>
    <nav aria-label="Blog">
      <a href={base} style="color:var(--color-ink);text-decoration:none;font-weight:500;">Blog</a>
    </nav>
  </div>
</header>
```

- [ ] **Step 2: Criar `blog/src/components/SiteFooter.astro`**

```astro
---
---
<footer style="background:var(--color-surface);border-top:1px solid var(--color-line);margin-top:3rem;">
  <div class="container" style="padding:2rem 1.25rem;color:var(--color-ink-soft);font-size:.9rem;">
    <p style="margin:0 0 .5rem;">© Focão — app de adestramento para cachorros.</p>
    <nav aria-label="Rodapé" style="display:flex;gap:1rem;flex-wrap:wrap;">
      <a href="/">Site</a>
      <a href="/privacidade">Privacidade</a>
      <a href="/focao-ebooks.html">E-books</a>
    </nav>
  </div>
</footer>
```

- [ ] **Step 3: Criar `blog/src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Seo from '../components/Seo.astro';
import SiteHeader from '../components/SiteHeader.astro';
import SiteFooter from '../components/SiteFooter.astro';

interface Props {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: 'website' | 'article';
  jsonLd?: object[];
}
const { title, description, canonical, image, type, jsonLd = [] } = Astro.props;
---
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
      rel="stylesheet"
    />
    <Seo title={title} description={description} canonical={canonical} image={image} type={type} />
    {jsonLd.map((obj) => (
      <script type="application/ld+json" set:html={JSON.stringify(obj)} />
    ))}
  </head>
  <body>
    <SiteHeader />
    <main>
      <slot />
    </main>
    <SiteFooter />
    <!-- Mesmo gate de consentimento + banner + pixels do site (origem/chave unificadas). -->
    <script src="/consent.js" is:inline></script>
  </body>
</html>
```

- [ ] **Step 4: Verificar build**

Run: `cd blog && npm run build`
Expected: build PASS (ainda sem páginas de rota; o objetivo é compilar os componentes sem erro de sintaxe).

- [ ] **Step 5: Commit**

```bash
git add blog/src/layouts/BaseLayout.astro blog/src/components/SiteHeader.astro blog/src/components/SiteFooter.astro
git commit -m "feat(blog): layout base com header, rodapé e consent.js"
```

---

## Task 10: Componentes reutilizáveis do artigo

**Files:**
- Create: `blog/src/components/RespostaRapida.astro`
- Create: `blog/src/components/Etapas.astro`
- Create: `blog/src/components/Etapa.astro`
- Create: `blog/src/components/CtaFinal.astro`
- Create: `blog/src/components/QuizEmbed.astro`
- Create: `blog/src/components/CtaIntermediario.astro`
- Create: `blog/src/components/MobileStickyBar.astro`
- Create: `blog/src/components/AutoraBox.astro`
- Create: `blog/src/components/Breadcrumb.astro`

- [ ] **Step 1: `RespostaRapida.astro`**

```astro
---
interface Props { texto: string; }
const { texto } = Astro.props;
---
<aside aria-label="Resposta rápida" style="background:var(--color-surface-soft);border:1px solid var(--color-line);border-radius:14px;padding:1rem 1.25rem;margin:1.5rem 0;">
  <strong style="display:block;color:var(--color-brand);margin-bottom:.35rem;">Resposta rápida</strong>
  <p style="margin:0;">{texto}</p>
</aside>
```

- [ ] **Step 2: `Etapas.astro` e `Etapa.astro` (passos numerados em MDX)**

`Etapas.astro`:
```astro
---
---
<ol style="list-style:none;counter-reset:etapa;padding:0;margin:1.5rem 0;display:grid;gap:1rem;">
  <slot />
</ol>
```

`Etapa.astro`:
```astro
---
interface Props { titulo: string; }
const { titulo } = Astro.props;
---
<li style="counter-increment:etapa;display:flex;gap:.9rem;align-items:flex-start;">
  <span aria-hidden="true" style="flex:0 0 auto;width:2rem;height:2rem;border-radius:50%;background:var(--color-brand);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">
    <span style="font-size:.95rem;" data-num></span>
  </span>
  <div>
    <strong style="display:block;">{titulo}</strong>
    <div><slot /></div>
  </div>
</li>
<script is:inline>
  // numera as etapas em ordem (counter CSS não imprime texto em todos os browsers de forma acessível)
  document.querySelectorAll('ol [data-num]').forEach((el, i) => { el.textContent = String(i + 1); });
</script>
```

- [ ] **Step 3: `CtaFinal.astro` (teste de 7 dias, sempre com condições)**

```astro
---
import { APP_URL, TESTE_CONDICOES } from '../lib/destinos';
import { withUtm } from '../lib/utm';
interface Props { pilar: string; slug: string; }
const { pilar, slug } = Astro.props;
const href = withUtm(APP_URL, { pilar, slug });
---
<section style="background:var(--color-brand);color:#F7F5EF;border-radius:18px;padding:1.75rem;margin:2.5rem 0;text-align:center;">
  <h2 style="margin:0 0 .5rem;color:#fff;font-family:var(--font-serif);">Teste o Focão por 7 dias</h2>
  <p style="margin:0 0 1.25rem;opacity:.9;">Plano de treino personalizado para o seu cão, passo a passo.</p>
  <a href={href} style="display:inline-block;background:#F2F5F3;color:#033B2B;padding:.9rem 1.6rem;border-radius:50px;font-weight:600;text-decoration:none;">Começar teste grátis</a>
  <p style="margin:1rem 0 0;font-size:.8rem;opacity:.85;">{TESTE_CONDICOES}</p>
</section>
```

- [ ] **Step 4: `QuizEmbed.astro` (iframe + auto-altura via postMessage)**

```astro
---
import { quizEmbedUrl } from '../lib/quiz';
interface Props { quizId: string; pilar: string; slug: string; }
const { quizId, pilar, slug } = Astro.props;
const src = quizEmbedUrl(quizId, { pilar, slug });
---
<div style="margin:2.5rem 0;">
  <iframe
    data-quiz
    src={src}
    title="Quiz do Focão"
    loading="lazy"
    style="width:100%;border:0;border-radius:16px;min-height:520px;"
  ></iframe>
</div>
<script is:inline>
  // A engine (quiz) emite { type: 'focao-quiz-height', height } via postMessage.
  // Só aceita mensagens da origem da engine.
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://engine.focaoapp.com.br') return;
    const d = e.data;
    if (d && d.type === 'focao-quiz-height' && typeof d.height === 'number') {
      const f = document.querySelector('iframe[data-quiz]');
      if (f) f.style.height = d.height + 'px';
    }
  });
</script>
```

- [ ] **Step 5: `CtaIntermediario.astro` (quiz embutido OU link de e-book)**

```astro
---
import QuizEmbed from './QuizEmbed.astro';
import { EBOOKS_URL } from '../lib/destinos';
import { withUtm } from '../lib/utm';
interface Props { ctaIntermediario: 'quiz' | 'ebook'; quizId?: string; pilar: string; slug: string; }
const { ctaIntermediario, quizId, pilar, slug } = Astro.props;
const usaQuiz = ctaIntermediario === 'quiz' && !!quizId;
const ebookHref = withUtm(EBOOKS_URL, { pilar, slug });
---
{usaQuiz ? (
  <QuizEmbed quizId={quizId!} pilar={pilar} slug={slug} />
) : (
  <aside style="background:var(--color-surface-soft);border:1px solid var(--color-line);border-radius:14px;padding:1.25rem;margin:2.5rem 0;text-align:center;">
    <p style="margin:0 0 .75rem;"><strong>Não sabe qual é o caso do seu cão?</strong></p>
    <a href={ebookHref} style="display:inline-block;background:var(--color-brand);color:#fff;padding:.75rem 1.4rem;border-radius:50px;text-decoration:none;font-weight:600;">Ver os e-books gratuitos</a>
  </aside>
)}
```

- [ ] **Step 6: `MobileStickyBar.astro` (barra fixa, só mobile)**

```astro
---
import { APP_URL, TESTE_CONDICOES } from '../lib/destinos';
import { withUtm } from '../lib/utm';
interface Props { pilar: string; slug: string; }
const { pilar, slug } = Astro.props;
const href = withUtm(APP_URL, { pilar, slug });
---
<div class="sticky-mobile" style="position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--color-surface);border-top:1px solid var(--color-line);padding:.6rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:.75rem;">
  <span style="font-size:.78rem;color:var(--color-ink-soft);">{TESTE_CONDICOES}</span>
  <a href={href} style="flex:0 0 auto;background:var(--color-brand);color:#fff;padding:.6rem 1rem;border-radius:50px;text-decoration:none;font-weight:600;font-size:.85rem;">Teste grátis</a>
</div>
<style>
  .sticky-mobile { display: flex; }
  @media (min-width: 768px) { .sticky-mobile { display: none; } }
  main { padding-bottom: 5rem; }
  @media (min-width: 768px) { main { padding-bottom: 0; } }
</style>
```

- [ ] **Step 7: `AutoraBox.astro` (sobre a autora + aviso veterinário)**

```astro
---
import { AUTORA } from '../config/autora';
interface Props { base: string; }
const { base } = Astro.props;
---
<section style="background:var(--color-surface);border:1px solid var(--color-line);border-radius:16px;padding:1.5rem;margin:2.5rem 0;">
  <h2 style="margin:0 0 .5rem;font-family:var(--font-serif);">Sobre a autora</h2>
  <p style="margin:0 0 .5rem;"><strong>{AUTORA.nome}</strong> — {AUTORA.cargo}. {AUTORA.bio}</p>
  <a href={`${base}/autora`} style="font-weight:600;">Conhecer a autora e o método →</a>
  <p style="margin:1rem 0 0;font-size:.82rem;color:var(--color-ink-soft);">
    Este conteúdo é educativo e não substitui a avaliação de um médico-veterinário.
  </p>
</section>
```

- [ ] **Step 8: `Breadcrumb.astro`**

```astro
---
interface Props { itens: { nome: string; href: string }[]; }
const { itens } = Astro.props;
---
<nav aria-label="Breadcrumb" style="font-size:.85rem;color:var(--color-ink-soft);margin:1rem 0;">
  {itens.map((it, i) => (
    <>
      {i > 0 && <span aria-hidden="true"> / </span>}
      {i < itens.length - 1 ? <a href={it.href}>{it.nome}</a> : <span>{it.nome}</span>}
    </>
  ))}
</nav>
```

- [ ] **Step 9: Verificar build**

Run: `cd blog && npm run build`
Expected: PASS (componentes compilam).

- [ ] **Step 10: Commit**

```bash
git add blog/src/components/
git commit -m "feat(blog): componentes do artigo (resposta rápida, etapas, CTAs, quiz, sticky, autora, breadcrumb)"
```

---

## Task 11: Página do artigo `/blog/[slug]`

**Files:**
- Create: `blog/src/pages/[slug].astro`

- [ ] **Step 1: Criar `blog/src/pages/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import { getImage } from 'astro:assets';
import BaseLayout from '../layouts/BaseLayout.astro';
import Breadcrumb from '../components/Breadcrumb.astro';
import RespostaRapida from '../components/RespostaRapida.astro';
import CtaIntermediario from '../components/CtaIntermediario.astro';
import CtaFinal from '../components/CtaFinal.astro';
import MobileStickyBar from '../components/MobileStickyBar.astro';
import AutoraBox from '../components/AutoraBox.astro';
import Etapas from '../components/Etapas.astro';
import Etapa from '../components/Etapa.astro';
import { PILAR_INFO } from '../lib/pilares';
import { escolherRelacionados } from '../lib/relacionados';
import { articleJsonLd, breadcrumbJsonLd } from '../lib/jsonld';
import { AUTORA } from '../config/autora';

export async function getStaticPaths() {
  const artigos = await getCollection('blog');
  return artigos.map((artigo) => ({
    params: { slug: artigo.data.slug },
    props: { artigo, todos: artigos },
  }));
}

const { artigo, todos } = Astro.props;
const d = artigo.data;
const base = import.meta.env.BASE_URL; // '/blog'
const site = 'https://focaoapp.com.br';
const canonical = `${site}${base}/${d.slug}`;
const pilarInfo = PILAR_INFO[d.pilar];

const capa = await getImage({ src: d.imagemCapa, width: 1200, format: 'webp' });
const capaAbs = `${site}${capa.src}`;

const relacionados = escolherRelacionados(
  { slug: d.slug, pilar: d.pilar, relacionados: d.relacionados },
  todos.map((a) => ({ slug: a.data.slug, pilar: a.data.pilar })),
  3,
).map((r) => todos.find((a) => a.data.slug === r.slug)!);

const crumbs = [
  { nome: 'Blog', href: base },
  { nome: pilarInfo.nome, href: `${base}/tema/${d.pilar}` },
  { nome: d.title, href: `${base}/${d.slug}` },
];

const jsonLd = [
  articleJsonLd({
    title: d.title, description: d.description, url: canonical, image: capaAbs,
    publicadoEm: d.publicadoEm, atualizadoEm: d.atualizadoEm,
    autoraNome: d.autora, autoraUrl: `${site}${base}/autora`,
  }),
  breadcrumbJsonLd(crumbs.map((c) => ({ name: c.nome, url: `${site}${c.href}` }))),
];

const { Content } = await render(artigo);
const fmtData = (dt: Date) => dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
---
<BaseLayout
  title={d.seoTitle}
  description={d.description}
  canonical={canonical}
  image={capaAbs}
  type="article"
  jsonLd={jsonLd}
>
  <div class="container">
    <Breadcrumb itens={crumbs} />
    <article class="prose" style="margin:0 auto;">
      <h1 style="font-family:var(--font-serif);line-height:1.15;">{d.title}</h1>
      <p style="color:var(--color-ink-soft);font-size:.9rem;margin:.25rem 0 1.25rem;">
        {d.autora} · adestradora · atualizado em {fmtData(d.atualizadoEm)}
      </p>

      <RespostaRapida texto={d.respostaRapida} />

      <Content components={{ Etapas, Etapa }} />

      <CtaIntermediario ctaIntermediario={d.ctaIntermediario} quizId={d.quizId} pilar={d.pilar} slug={d.slug} />
      <CtaFinal pilar={d.pilar} slug={d.slug} />
      <AutoraBox base={base} />

      {relacionados.length > 0 && (
        <section style="margin:2.5rem 0;">
          <h2 style="font-family:var(--font-serif);">Leia também em {pilarInfo.nome}</h2>
          <ul>
            {relacionados.map((r) => (
              <li><a href={`${base}/${r.data.slug}`}>{r.data.title}</a></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  </div>
  <MobileStickyBar pilar={d.pilar} slug={d.slug} />
</BaseLayout>
```

- [ ] **Step 2: Verificar que o CTA intermediário quiz recebe o id via MDX**

(Nota: o passo de etapas `<Etapas>`/`<Etapa>` só funciona em arquivos `.mdx`. Artigos `.md` usam listas comuns. O `render` + `components` passa os componentes ao MDX.)

- [ ] **Step 3: Verificar build (ainda sem artigo real → pode gerar 0 páginas de slug; ok)**

Run: `cd blog && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add blog/src/pages/[slug].astro
git commit -m "feat(blog): página do artigo com SEO, CTAs, relacionados e sticky mobile"
```

---

## Task 12: Página de pilar `/blog/tema/[pilar]`

**Files:**
- Create: `blog/src/pages/tema/[pilar].astro`

- [ ] **Step 1: Criar `blog/src/pages/tema/[pilar].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Breadcrumb from '../../components/Breadcrumb.astro';
import { PILARES, PILAR_INFO } from '../../lib/pilares';
import { breadcrumbJsonLd } from '../../lib/jsonld';

export async function getStaticPaths() {
  return PILARES.map((pilar) => ({ params: { pilar } }));
}

const { pilar } = Astro.params;
const info = PILAR_INFO[pilar as keyof typeof PILAR_INFO];
const base = import.meta.env.BASE_URL;
const site = 'https://focaoapp.com.br';
const canonical = `${site}${base}/tema/${pilar}`;

const artigos = (await getCollection('blog')).filter((a) => a.data.pilar === pilar);
const guia = artigos.find((a) => a.data.tipo === 'pilar');
const apoios = artigos.filter((a) => a.data.tipo !== 'pilar');

const crumbs = [
  { nome: 'Blog', href: base },
  { nome: info.nome, href: `${base}/tema/${pilar}` },
];
const jsonLd = [breadcrumbJsonLd(crumbs.map((c) => ({ name: c.nome, url: `${site}${c.href}` })))];
---
<BaseLayout
  title={`${info.nome} | Blog do Focão`}
  description={info.descricao}
  canonical={canonical}
  jsonLd={jsonLd}
>
  <div class="container">
    <Breadcrumb itens={crumbs} />
    <h1 style="font-family:var(--font-serif);">{info.nome}</h1>
    <p style="color:var(--color-ink-soft);max-width:var(--leitura);">{info.descricao}</p>

    {guia && (
      <a href={`${base}/${guia.data.slug}`} style="display:block;background:var(--color-surface);border:1px solid var(--color-line);border-radius:16px;padding:1.5rem;margin:1.5rem 0;text-decoration:none;color:var(--color-ink);">
        <span style="color:var(--color-brand);font-weight:600;font-size:.8rem;">COMECE POR AQUI</span>
        <strong style="display:block;font-size:1.25rem;font-family:var(--font-serif);margin-top:.25rem;">{guia.data.title}</strong>
        <span style="color:var(--color-ink-soft);">{guia.data.description}</span>
      </a>
    )}

    {apoios.length > 0 && (
      <section>
        <h2 style="font-family:var(--font-serif);">Artigos deste tema</h2>
        <ul>
          {apoios.map((a) => (
            <li><a href={`${base}/${a.data.slug}`}>{a.data.title}</a></li>
          ))}
        </ul>
      </section>
    )}

    {!guia && apoios.length === 0 && (
      <p style="background:var(--color-surface-soft);border-radius:12px;padding:1rem;">Ainda não há artigos neste tema. Em breve!</p>
    )}
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verificar build**

Run: `cd blog && npm run build`
Expected: PASS; gera 7 páginas `tema/*`.

- [ ] **Step 3: Commit**

```bash
git add "blog/src/pages/tema/[pilar].astro"
git commit -m "feat(blog): página de pilar (guia em destaque + apoios)"
```

---

## Task 13: Home do blog `/blog`

**Files:**
- Create: `blog/src/pages/index.astro`

- [ ] **Step 1: Criar `blog/src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { BOTOES_TUTOR, PILAR_INFO } from '../lib/pilares';
import { AUTORA } from '../config/autora';

const base = import.meta.env.BASE_URL;
const site = 'https://focaoapp.com.br';
const canonical = `${site}${base}`;

const artigos = (await getCollection('blog')).sort(
  (a, b) => b.data.publicadoEm.getTime() - a.data.publicadoEm.getTime(),
);
const guiaPrincipal = artigos.find((a) => a.data.tipo === 'pilar');
const recentes = artigos.slice(0, 6);
---
<BaseLayout
  title="Blog do Focão — comportamento e rotina canina"
  description="Guias práticos de comportamento canino escritos por adestradora: ansiedade de separação, xixi no lugar, filhotes, agitação, comandos e rotina."
  canonical={canonical}
  type="website"
>
  <div class="container">
    <section style="padding:2rem 0 1rem;">
      <h1 style="font-family:var(--font-serif);">O que está acontecendo com o seu cão?</h1>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-top:1.25rem;">
        {BOTOES_TUTOR.map((b) => (
          <a href={`${base}/tema/${b.pilar}`} style="background:var(--color-surface);border:1px solid var(--color-line);border-radius:14px;padding:1rem 1.25rem;text-decoration:none;color:var(--color-ink);font-weight:500;">
            {b.texto}
          </a>
        ))}
      </div>
    </section>

    {guiaPrincipal && (
      <a href={`${base}/${guiaPrincipal.data.slug}`} style="display:block;background:var(--color-brand);color:#F7F5EF;border-radius:18px;padding:1.75rem;margin:1.5rem 0;text-decoration:none;">
        <span style="font-size:.8rem;opacity:.85;">COMECE POR AQUI</span>
        <strong style="display:block;font-size:1.4rem;font-family:var(--font-serif);margin-top:.25rem;color:#fff;">{guiaPrincipal.data.title}</strong>
        <span style="opacity:.9;">{guiaPrincipal.data.description}</span>
      </a>
    )}

    <aside style="background:var(--color-surface-soft);border-radius:16px;padding:1.5rem;margin:1.5rem 0;text-align:center;">
      <strong>Não sabe qual é o caso do seu cão?</strong>
      <p style="margin:.5rem 0 1rem;color:var(--color-ink-soft);">Faça o quiz e descubra por onde começar.</p>
      <a href={`${base}/${guiaPrincipal?.data.slug ?? ''}`} style="display:inline-block;background:var(--color-brand);color:#fff;padding:.75rem 1.4rem;border-radius:50px;text-decoration:none;font-weight:600;">Fazer o quiz</a>
    </aside>

    {recentes.length > 0 && (
      <section style="margin:2rem 0;">
        <h2 style="font-family:var(--font-serif);">Artigos recentes</h2>
        <ul>
          {recentes.map((a) => (
            <li><a href={`${base}/${a.data.slug}`}>{a.data.title}</a> <span style="color:var(--color-ink-faint);">· {PILAR_INFO[a.data.pilar].nome}</span></li>
          ))}
        </ul>
      </section>
    )}

    <section style="background:var(--color-surface);border:1px solid var(--color-line);border-radius:16px;padding:1.5rem;margin:2rem 0;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;">
      <div style="flex:1;min-width:220px;">
        <strong style="font-family:var(--font-serif);font-size:1.1rem;">{AUTORA.nome}, {AUTORA.cargo}</strong>
        <p style="margin:.5rem 0 0;color:var(--color-ink-soft);">{AUTORA.bio}</p>
        <a href={`${base}/autora`} style="font-weight:600;">Sobre a autora →</a>
      </div>
    </section>
  </div>
</BaseLayout>
```

(Nota: quando o quiz existir, trocar o link "Fazer o quiz" por embed/destino do quiz. Por ora leva ao guia pilar.)

- [ ] **Step 2: Verificar build**

Run: `cd blog && npm run build`
Expected: PASS; gera `/blog`.

- [ ] **Step 3: Commit**

```bash
git add blog/src/pages/index.astro
git commit -m "feat(blog): home do blog (perguntas do tutor, comece por aqui, quiz, recentes, autora)"
```

---

## Task 14: Página da autora `/blog/autora`

**Files:**
- Create: `blog/src/pages/autora.astro`

- [ ] **Step 1: Criar `blog/src/pages/autora.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Breadcrumb from '../components/Breadcrumb.astro';
import { AUTORA } from '../config/autora';
import { personJsonLd, breadcrumbJsonLd } from '../lib/jsonld';

const base = import.meta.env.BASE_URL;
const site = 'https://focaoapp.com.br';
const canonical = `${site}${base}/autora`;
const crumbs = [
  { nome: 'Blog', href: base },
  { nome: 'Autora', href: `${base}/autora` },
];
const jsonLd = [
  personJsonLd({ name: AUTORA.nome, url: canonical, jobTitle: AUTORA.cargo, description: AUTORA.bio }),
  breadcrumbJsonLd(crumbs.map((c) => ({ name: c.nome, url: `${site}${c.href}` }))),
];
---
<BaseLayout
  title={`${AUTORA.nome}, ${AUTORA.cargo} | Blog do Focão`}
  description={AUTORA.bio}
  canonical={canonical}
  jsonLd={jsonLd}
>
  <div class="container">
    <Breadcrumb itens={crumbs} />
    <article class="prose" style="margin:0 auto;">
      <h1 style="font-family:var(--font-serif);">{AUTORA.nome}</h1>
      <p style="color:var(--color-ink-soft);">{AUTORA.cargo}</p>
      <h2>Formação</h2>
      <p>{AUTORA.formacao}</p>
      <h2>Método</h2>
      <p>{AUTORA.metodo}</p>
      <p style="margin-top:2rem;font-size:.82rem;color:var(--color-ink-soft);">
        Este conteúdo é educativo e não substitui a avaliação de um médico-veterinário.
      </p>
    </article>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verificar build**

Run: `cd blog && npm run build`
Expected: PASS; gera `/blog/autora`.

- [ ] **Step 3: Commit**

```bash
git add blog/src/pages/autora.astro
git commit -m "feat(blog): página da autora com JSON-LD Person"
```

---

## Task 15: Artigo-modelo (template) + README de publicação

**Files:**
- Create: `blog/src/content/blog/_modelo.md`
- Create: `blog/README.md`

- [ ] **Step 1: Criar `blog/src/content/blog/_modelo.md`**

```markdown
---
# Copie este arquivo, renomeie para o slug do artigo (ex.: ansiedade-de-separacao.md)
# e preencha os campos. Arquivos começando com "_" NÃO viram páginas.
title: Título que aparece como H1 na página
seoTitle: Título para o Google (pode ser diferente do title)
description: Meta descrição, ~155 caracteres, aparece no Google e nas redes
slug: slug-da-url            # vira focaoapp.com.br/blog/slug-da-url
pilar: ficar-sozinho         # ficar-sozinho | xixi-no-lugar | filhotes | agitacao | comandos-basicos | rotina-e-limites | adocao-e-racas
tipo: apoio                  # pilar (guia principal do tema) | apoio | plano (passo a passo)
autora: Ivy
publicadoEm: 2026-10-09
atualizadoEm: 2026-10-09
imagemCapa: ../../assets/blog/nome-da-imagem.jpg   # coloque a imagem em src/assets/blog/
respostaRapida: Uma ou duas frases respondendo direto a dúvida do tutor.
ctaIntermediario: ebook      # quiz (precisa de quizId) | ebook
quizId:                      # id do quiz na engine (/q/[id]); deixe vazio para cair no e-book
relacionados: []             # lista de slugs, ex.: [outro-artigo, mais-um]
---

Primeiro parágrafo introdutório.

## Um subtítulo

Texto do artigo. Linhas de leitura confortável.

<!-- Para artigos tipo "plano", use passos numerados (só em arquivos .mdx):
import Etapas from '../../components/Etapas.astro';
import Etapa from '../../components/Etapa.astro';

<Etapas>
  <Etapa titulo="Primeiro passo">Descrição do passo.</Etapa>
  <Etapa titulo="Segundo passo">Descrição do passo.</Etapa>
</Etapas>
-->
```

- [ ] **Step 2: Criar `blog/README.md`**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add "blog/src/content/blog/_modelo.md" blog/README.md
git commit -m "docs(blog): artigo-modelo e README de publicação"
```

---

## Task 16: Build combinado (Vite + Astro) no repo do site

**Files:**
- Modify: `package.json` (raiz) — script `build`
- Modify: `.gitignore` (raiz) — garantir que `dist/` siga ignorado (já está)

- [ ] **Step 1: Alterar o script `build` em `package.json` (raiz)**

De:
```json
    "build": "vite build",
```
Para:
```json
    "build": "vite build && npm --prefix blog ci && npm --prefix blog run build",
```
(`npm --prefix blog ci` garante deps do blog no CI; localmente pode usar `npm --prefix blog install`.)

- [ ] **Step 2: Rodar o build combinado e checar a saída**

Run (da raiz): `npm run build`
Expected: `dist/` com o site (index/app.html, funis) **e** `dist/blog/` com `index.html`, `tema/<pilar>/index.html`, `autora/index.html`, `sitemap-index.xml`. O `astro build` só esvazia `dist/blog` (seu `outDir`), não o resto de `dist`.

Verificação:
```bash
ls dist/blog
ls dist/blog/tema
test -f dist/blog/index.html && echo "home blog OK"
test -f dist/index.html && echo "site index preservado OK"
test -f dist/focao-ebooks.html && echo "ebooks preservado OK"
```
Expected: todos "OK".

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build(blog): build combinado do site (Vite) + blog (Astro) em dist/blog"
```

---

## Task 17: Roteamento Firebase — inventário, URLs limpas e CSP do iframe

> **Atenção (requisito do cliente):** antes de mexer em `cleanUrls`/`trailingSlash`, inventariar e
> verificar ao vivo todas as URLs atuais; 301 onde mudar; um único padrão de barra, igual no
> canonical e no sitemap.

**Files:**
- Modify: `firebase.json` (raiz)

- [ ] **Step 1: Inventariar as URLs atuais (antes de mudar)**

Run:
```bash
for u in "" landing ebooks ebook ebook-adestre-7-dias ebook-ansiedade-separacao-7-dias \
  ebook-primeiros-90-dias ebook-volta-sem-estresse ansiedade quiz-ansiedade upsell obrigado \
  vsl-ansiedade presell rotina-cachorro privacidade beta register login \
  focao-ebooks.html robots.txt sitemap.xml; do
  printf "%-36s " "/$u"; curl -sS -o /dev/null -w "%{http_code}\n" "https://focaoapp.com.br/$u"; done
```
Anotar os códigos atuais (esperado: 200 para páginas, 200 para robots/sitemap). Guardar como baseline.

- [ ] **Step 2: Editar `firebase.json` — URLs limpas + CSP do iframe + 301**

Aplicar, dentro de `hosting`:

a) Adicionar no mesmo nível de `rewrites`:
```json
    "cleanUrls": true,
    "trailingSlash": false,
```

b) Adicionar bloco `redirects` (301) para preservar links diretos a `.html` que mudam de forma com `cleanUrls` (lista baseada no inventário — incluir os `.html` públicos):
```json
    "redirects": [
      { "source": "/focao-ebooks.html", "destination": "/ebooks", "type": 301 },
      { "source": "/ebook.html", "destination": "/ebook", "type": 301 },
      { "source": "/upsell.html", "destination": "/upsell", "type": 301 },
      { "source": "/obrigado.html", "destination": "/obrigado", "type": 301 },
      { "source": "/vsl-ansiedade.html", "destination": "/vsl-ansiedade", "type": 301 },
      { "source": "/quiz-ansiedade.html", "destination": "/quiz-ansiedade", "type": 301 },
      { "source": "/ebook-adestre-7-dias.html", "destination": "/ebook-adestre-7-dias", "type": 301 },
      { "source": "/ebook-ansiedade-separacao-7-dias.html", "destination": "/ebook-ansiedade-separacao-7-dias", "type": 301 },
      { "source": "/ebook-primeiros-90-dias.html", "destination": "/ebook-primeiros-90-dias", "type": 301 }
    ],
```

c) No header `Content-Security-Policy` (source `**`), **adicionar ao final da diretiva `frame-src`** o host da engine, para o iframe do quiz carregar:
De:
```
frame-src 'self' https://www.google.com
```
Para:
```
frame-src 'self' https://www.google.com https://engine.focaoapp.com.br
```

> Não alterar os `rewrites` existentes nem o catch-all `** → /app.html`. Os arquivos de
> `dist/blog/**` são servidos como estáticos antes do catch-all. Com `cleanUrls:true`,
> `/blog/<slug>` serve `dist/blog/<slug>/index.html`.

- [ ] **Step 3: Validar config do Firebase localmente**

Run: `npx firebase-tools hosting:channel:deploy preview-blog --only hosting --project <PROJETO>` *(ou)* um build + `npx firebase-tools serve --only hosting` para testar local.
Expected: serve sem erro de schema do `firebase.json`.

> Se não houver credencial/projeto à mão, pular para a verificação ao vivo após o deploy (Task 20) e, se o inventário acusar qualquer regressão de 200→não-200, reverter para a **alternativa de menor risco**: remover `cleanUrls/trailingSlash` globais e, no `astro.config.mjs`, usar `trailingSlash: 'always'` (blog servido com barra final; canonical/sitemap do blog passam a usar barra). Documentar a escolha.

- [ ] **Step 4: Commit**

```bash
git add firebase.json
git commit -m "chore(hosting): URLs limpas (cleanUrls), 301 dos .html e frame-src da engine p/ o quiz"
```

---

## Task 18: Sitemap do blog + robots.txt da raiz (sem sobrescrever)

**Files:**
- Modify: `public/robots.txt` (raiz) — adicionar 1 linha `Sitemap:`
- (Astro já gera o sitemap do blog em `dist/blog/sitemap-index.xml` via `@astrojs/sitemap`.)

- [ ] **Step 1: Confirmar o sitemap gerado pelo Astro**

Run: `npm run build && ls dist/blog/sitemap*.xml`
Expected: `dist/blog/sitemap-index.xml` (e `sitemap-0.xml`). URLs internas com `https://focaoapp.com.br/blog/...` e **sem barra final** (coerente com o canonical).

- [ ] **Step 2: Adicionar a referência no `public/robots.txt`**

Localizar a linha existente:
```
Sitemap: https://focaoapp.com.br/sitemap.xml
```
e **adicionar logo abaixo** (não remover a existente):
```
Sitemap: https://focaoapp.com.br/blog/sitemap-index.xml
```

- [ ] **Step 3: Verificar que o `sitemap.xml` da raiz não foi tocado**

Run: `git status -s public/sitemap.xml`
Expected: **sem** modificação em `public/sitemap.xml` (só `robots.txt` muda).

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt
git commit -m "chore(seo): robots.txt aponta sitemap do blog sem sobrescrever o da raiz"
```

---

## Task 19: Link "Blog" no menu do site

> O site público não tem um menu multi-link clássico: a entrada é o splash `Welcome.tsx` (com
> botões de ação) e o marketing tem um `Navbar` de CTA único. **Default:** adicionar um link
> discreto "Blog" ao splash `Welcome`. **Confirmar com a Ivy** se ela prefere outro ponto (ex.:
> rodapé público). Nenhuma outra mudança na landing.

**Files:**
- Modify: `src/pages/auth/Welcome.tsx`

- [ ] **Step 1: Ler a região dos links de ação do `Welcome.tsx`**

Abrir `src/pages/auth/Welcome.tsx` e localizar o bloco com os botões/links de ação (classes `welcome-item ... text-[#A8BDB4] text-sm`, perto da linha 82).

- [ ] **Step 2: Adicionar o link "Blog"**

Logo após o último link de ação existente (o `<a ... text-[#A8BDB4] text-sm ...>`), adicionar:
```tsx
<a
  href="/blog"
  className="welcome-item welcome-secondary-action text-[#A8BDB4] text-sm font-medium"
>
  Blog
</a>
```
(`href` absoluto `/blog` — sai da SPA e vai para o blog estático, que o Firebase serve direto.)

- [ ] **Step 3: Verificar que a SPA ainda builda**

Run (da raiz): `npm run build`
Expected: PASS; `dist/app.html` gerado normalmente.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth/Welcome.tsx
git commit -m "feat(site): link Blog na entrada pública (Welcome)"
```

---

## Task 20: Dependência cross-repo — embed do quiz na engine (`engine-focao`)

> Repo separado: `~/engine-focao` (Vercel). **Opcional para o lançamento** — o blog entra no ar
> com o fallback de e-book; o embed do quiz liga quando este deploy subir. Fazer em branch própria
> do `engine-focao`.

**Files (no repo `engine-focao`):**
- Modify: `vercel.json` (ou headers por rota) — permitir frame só nas rotas de quiz
- Modify: a página do quiz (`app/q/[id]/page.tsx`) — emitir altura via `postMessage`

- [ ] **Step 1: Permitir embed só nas rotas de quiz**

No `engine-focao`, hoje os headers globais mandam `X-Frame-Options: DENY` e CSP sem `frame-ancestors`. Adicionar override para `/q/(.*)` (e `/s/(.*)` se usado) em `vercel.json`:
```json
{
  "source": "/q/(.*)",
  "headers": [
    { "key": "X-Frame-Options", "value": "" },
    { "key": "Content-Security-Policy", "value": "frame-ancestors 'self' https://focaoapp.com.br" }
  ]
}
```
(Garantir que esse bloco venha com precedência sobre o global para essas rotas; se o Vercel não permitir header vazio para remover, mover o `X-Frame-Options: DENY` para só as rotas NÃO-quiz.)

- [ ] **Step 2: Emitir altura via postMessage na página do quiz**

Adicionar um efeito client-side na página do quiz que, a cada mudança de conteúdo, faz:
```ts
// envia a altura para o pai (blog) ajustar o iframe
const post = () =>
  window.parent?.postMessage(
    { type: 'focao-quiz-height', height: document.documentElement.scrollHeight },
    'https://focaoapp.com.br',
  );
const ro = new ResizeObserver(post);
ro.observe(document.documentElement);
post();
```

- [ ] **Step 3: Deploy da engine e teste**

Run: deploy do `engine-focao` no Vercel (branch → preview).
Expected: `curl -sSI https://engine.focaoapp.com.br/q/<id>` **não** mais `X-Frame-Options: DENY` e com `frame-ancestors` incluindo `focaoapp.com.br`.

- [ ] **Step 4: Commit (no repo engine-focao)**

```bash
git -C ~/engine-focao add vercel.json app/q/[id]/page.tsx
git -C ~/engine-focao commit -m "feat(quiz): permitir embed em focaoapp.com.br/blog + auto-altura postMessage"
```

---

## Task 21: Verificação final (build + navegador + SEO)

**Files:** nenhum (verificação).

- [ ] **Step 1: Rodar todos os testes unitários**

Run: `npm --prefix blog run test`
Expected: todos PASS (utm, quiz, pilares, relacionados, jsonld).

- [ ] **Step 2: Criar um artigo de teste real e buildar**

Criar `blog/src/content/blog/artigo-teste.md` (copiando o `_modelo.md`, slug `artigo-teste`, `pilar: ficar-sozinho`, `tipo: pilar`, `ctaIntermediario: ebook`, imagem em `src/assets/blog/`), depois:
Run (da raiz): `npm run build`
Expected: gera `dist/blog/artigo-teste/index.html`, `dist/blog/index.html`, `dist/blog/tema/ficar-sozinho/index.html`, `dist/blog/autora/index.html`.

- [ ] **Step 3: Servir e inspecionar no navegador (Playwright/preview)**

Run: `cd blog && npm run preview` (ou `npx firebase-tools serve` da raiz para testar os rewrites).
Verificar em `http://localhost:4321/blog`:
- Home: botões do tutor → levam a `/blog/tema/<pilar>`.
- Artigo: H1 único; caixa Resposta rápida; CTA intermediário (e-book) com UTMs; CTA final com as condições (cartão, R$67/mês, cancelamento no app); barra fixa só no mobile (reduzir viewport); bloco autora + aviso veterinário; breadcrumb.
- `/blog/autora`: bio/formação/método.

- [ ] **Step 4: Conferir SEO no HTML gerado**

Run:
```bash
grep -l "application/ld+json" dist/blog/artigo-teste/index.html
grep -o '"@type":"Article"' dist/blog/artigo-teste/index.html
grep -o '"@type":"Person"' dist/blog/artigo-teste/index.html
grep -o '"@type":"BreadcrumbList"' dist/blog/artigo-teste/index.html
grep -o 'rel="canonical"[^>]*' dist/blog/artigo-teste/index.html
grep -o 'property="og:title"' dist/blog/artigo-teste/index.html
grep -o 'name="twitter:card"' dist/blog/artigo-teste/index.html
grep -c "<h1" dist/blog/artigo-teste/index.html   # deve ser 1
```
Expected: Article + Person + BreadcrumbList presentes; canonical sem barra final; OG/Twitter presentes; exatamente 1 `<h1`.

- [ ] **Step 5: Conferir UTMs nos links de saída**

Run:
```bash
grep -o 'utm_source=blog[^"]*' dist/blog/artigo-teste/index.html | head
```
Expected: links do app/e-book com `utm_source=blog&utm_medium=artigo&utm_campaign=ficar-sozinho&utm_content=artigo-teste`.

- [ ] **Step 6: Remover o artigo de teste**

Run: `rm blog/src/content/blog/artigo-teste.md` e a imagem de teste.
(Mantém o repo limpo para o primeiro artigo real da Ivy.)

- [ ] **Step 7: Commit (se restou algo) e abrir PR**

```bash
git add -A
git commit -m "test(blog): verificação final do blog (SEO, UTM, páginas)" || echo "nada a commitar"
```

---

## Self-review (feito pelo autor do plano)

**Cobertura do spec:**
- Astro + build + deploy → Tasks 0, 16. ✅
- Frontmatter/collection/pilares → Tasks 3, 4. ✅
- Rotas/URLs/padrão de barra/firebase/301 → Task 17. ✅
- Home / pilar / artigo / autora → Tasks 11–14. ✅
- Componentes do artigo (resposta rápida, etapas, CTAs, quiz, sticky, autora+aviso, relacionados, breadcrumb) → Task 10, 11. ✅
- Quiz iframe (embed, postMessage, UTM, CSP, X-Frame) → Tasks 10 (QuizEmbed), 17 (frame-src), 20 (engine). ✅
- SEO (title/desc/canonical/OG/Twitter/JSON-LD/sitemap/robots/URLs limpas/imagens/1 H1) → Tasks 8, 11–14, 17, 18, 21. ✅
- Rastreio UTM → Tasks 1, 2, usado em 10/11. ✅
- Consentimento/pixel → Task 9 (consent.js). ✅
- Identidade visual → Tasks 7, 9 (+ verificação na 21). ✅
- Link Blog no menu → Task 19. ✅
- Template + README → Task 15. ✅
- Não sobrescrever robots/sitemap da raiz → Task 18. ✅
- Repo sync/worktree → preâmbulo + já operando no worktree. ✅

**Placeholders:** os campos da autora são placeholders intencionais (conteúdo da Ivy), não lacunas do plano. A escolha cleanUrls vs barra final está decidida (cleanUrls) com fallback explícito gated por verificação.

**Consistência de tipos:** `withUtm`/`UtmContext`, `quizEmbedUrl`, `escolherRelacionados`, `articleJsonLd/breadcrumbJsonLd/personJsonLd`, `PILARES/PILAR_INFO/BOTOES_TUTOR`, `AUTORA` — nomes usados de forma idêntica entre definição e consumo. ✅
