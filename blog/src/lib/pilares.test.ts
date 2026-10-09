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
