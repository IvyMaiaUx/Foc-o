// Fonte única dos objetivos do onboarding (ids) + rótulos em português.
// Precisa ficar em sincronia com as opções de src/pages/onboarding/Goals.tsx.
// Um teste de CI (goalLabels.test.ts) garante que todo id tem rótulo — assim um
// objetivo sem tradução quebra o build, não vaza a chave crua no PDF do tutor.

export const GOAL_IDS = [
  'obedience',
  'walks',
  'focus',
  'anxiety_alone',
  'barking',
  'destruction',
  'routine',
  'other',
] as const;

export type GoalId = (typeof GOAL_IDS)[number];

const GOAL_LABELS: Record<GoalId, string> = {
  obedience: 'Melhorar a obediência básica',
  walks: 'Melhorar os passeios na guia',
  focus: 'Aumentar o foco e a atenção',
  anxiety_alone: 'Reduzir a ansiedade ao ficar sozinho',
  barking: 'Reduzir os latidos',
  destruction: 'Evitar destruição de objetos',
  routine: 'Criar uma rotina melhor',
  other: 'Objetivo personalizado',
};

/** Sem rótulo em português? Retorna null — o chamador omite o item (nunca imprime a chave crua do enum). */
export function goalLabel(goal: string): string | null {
  return GOAL_LABELS[goal as GoalId] ?? null;
}

// ---- Nível de treino (dogProfile.trainingBase) — mesmo padrão, mesmo risco de vazamento. ----

export const TRAINING_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type TrainingLevelId = (typeof TRAINING_LEVELS)[number];

const TRAINING_LEVEL_LABELS: Record<TrainingLevelId, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

/** Nunca retorna a chave crua: sem rótulo → 'Não informado'. */
export function trainingLevelLabel(level?: string): string {
  return TRAINING_LEVEL_LABELS[level as TrainingLevelId] ?? 'Não informado';
}
