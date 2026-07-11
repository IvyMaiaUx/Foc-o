import { describe, it, expect } from 'vitest';
import { GOAL_IDS, goalLabel, TRAINING_LEVELS, trainingLevelLabel } from './goalLabels';

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

describe('trainingLevelLabel', () => {
  it('todo nível de treino tem rótulo e nunca é a chave crua', () => {
    for (const level of TRAINING_LEVELS) {
      const label = trainingLevelLabel(level);
      expect(label).toBeTruthy();
      expect(label).not.toBe(level);
    }
  });

  it('nível desconhecido vira "Não informado", nunca a chave crua', () => {
    expect(trainingLevelLabel('xyz')).toBe('Não informado');
    expect(trainingLevelLabel(undefined)).toBe('Não informado');
  });
});
