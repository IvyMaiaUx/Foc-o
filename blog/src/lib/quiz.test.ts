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
