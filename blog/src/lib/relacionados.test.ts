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
