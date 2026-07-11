import { describe, it, expect } from 'vitest';
import { GOAL_IDS, goalLabel, TRAINING_LEVELS, trainingLevelLabel, FOOD_TYPES, foodTypeLabel, TRAINING_FEEDBACKS, sessionFeedbackLabel } from './goalLabels';

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

describe('foodTypeLabel', () => {
  it('todo tipo de alimentação tem rótulo', () => {
    for (const t of FOOD_TYPES) expect(foodTypeLabel(t)).toBeTruthy();
  });

  it('sem valor → null (nunca a chave crua; o render mostra o convite)', () => {
    expect(foodTypeLabel(undefined)).toBeNull();
    expect(foodTypeLabel('xyz')).toBeNull();
  });
});

describe('sessionFeedbackLabel', () => {
  it('todo feedback de treino tem rótulo', () => {
    for (const f of TRAINING_FEEDBACKS) expect(sessionFeedbackLabel(f)).toBeTruthy();
  });

  it('"failed" nunca vira "Concluído" — um treino que falhou não foi concluído', () => {
    expect(sessionFeedbackLabel('failed')).not.toBe('Concluído');
  });

  it('valor desconhecido vira "Registrado", nunca "Concluído"', () => {
    expect(sessionFeedbackLabel('xyz')).toBe('Registrado');
  });
});
