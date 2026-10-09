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
