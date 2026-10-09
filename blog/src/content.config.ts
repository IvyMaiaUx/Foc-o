import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { PILARES } from './lib/pilares';

// O padrão exclui arquivos começando com "_" (negação `!**/_*`) → _modelo.md e fixtures
// não viram páginas. (No Astro 5 o glob loader NÃO ignora "_" automaticamente.)
const blog = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_*'], base: './src/content/blog' }),
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
