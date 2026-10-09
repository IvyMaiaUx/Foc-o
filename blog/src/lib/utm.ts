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
