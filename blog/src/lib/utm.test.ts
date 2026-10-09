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
