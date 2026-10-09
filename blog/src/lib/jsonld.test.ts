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
