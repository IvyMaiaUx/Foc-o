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
