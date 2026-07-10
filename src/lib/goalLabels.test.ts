import { describe, it, expect } from 'vitest';
import { GOAL_IDS, goalLabel } from './goalLabels';

describe('goalLabels', () => {
  it('todo objetivo do onboarding tem rótulo em português', () => {
    for (const id of GOAL_IDS) {
      // Se algum objetivo ficar sem rótulo, quebra AQUI no CI — não no PDF do tutor.
      expect(goalLabel(id)).toBeTruthy();
    }
  });

  it('chave desconhecida retorna null (nunca imprime a chave crua)', () => {
    expect(goalLabel('chave_inexistente')).toBeNull();
    expect(goalLabel('')).toBeNull();
  });
});
