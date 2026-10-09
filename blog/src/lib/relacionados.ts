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
