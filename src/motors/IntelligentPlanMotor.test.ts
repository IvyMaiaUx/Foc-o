import { describe, it, expect } from 'vitest';
import { IntelligentPlanMotor } from './IntelligentPlanMotor';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { DogProfile } from '@/src/types';

function profile(over: Partial<DogProfile> = {}): DogProfile {
  return {
    name: 'Rex', breed: 'SRD', age: '2 anos', weight: '10kg',
    routine: [], housingType: 'apartment', energyLevel: 'medium',
    personalityTraits: [], behaviorIssues: [], trainingBase: 'beginner',
    knownCommands: [], goals: [], createdAt: 0, updatedAt: 0,
    ...over,
  } as DogProfile;
}

const levelOf = (id: string) => (TRAINING_TEMPLATES as any)[id].levelTag as string;
const blockOf = (id: string) => (TRAINING_TEMPLATES as any)[id].blockId as string;

describe('IntelligentPlanMotor.generatePlan', () => {
  it('sempre retorna um plano não-vazio com índice 0', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile());
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.currentTaskIndex).toBe(0);
    expect(typeof plan.focus).toBe('string');
  });

  it('cão iniciante não recebe treino avancado', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ trainingBase: 'beginner' }));
    expect(plan.tasks.every(t => levelOf(t.id) !== 'avancado')).toBe(true);
  });

  it('exclui treinos de comandos já dominados', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ knownCommands: ['Senta'], trainingBase: 'intermediate' }));
    expect(plan.tasks.some(t => t.id === 'b2-t1')).toBe(false);
  });

  it('front-loada o treino do problema (puxa-guia => bloco b4 na primeira metade)', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ behaviorIssues: ['pulling'] }));
    const firstHalf = plan.tasks.slice(0, Math.ceil(plan.tasks.length / 2));
    expect(firstHalf.some(t => blockOf(t.id) === 'b4')).toBe(true);
    expect(plan.focus).toContain('passeio');
  });

  it('respeita pré-requisitos (nenhum treino aparece antes do seu prereq presente no plano)', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ trainingBase: 'advanced' }));
    const pos = new Map(plan.tasks.map((t, i) => [t.id, i]));
    for (const t of plan.tasks) {
      const prereqs = (TRAINING_TEMPLATES as any)[t.id].prerequisites || [];
      for (const p of prereqs) {
        if (pos.has(p)) expect(pos.get(p)!).toBeLessThan(pos.get(t.id)!);
      }
    }
  });

  it('anexa reason e priority às tasks', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ behaviorIssues: ['pulling'] }));
    expect(plan.tasks.every(t => typeof t.reason === 'string' && t.reason!.length > 0)).toBe(true);
    expect(plan.tasks.some(t => t.priority === 'alta')).toBe(true);
  });

  it('filhote sem problemas ainda recebe o núcleo (b1/b2 presentes)', () => {
    const plan = IntelligentPlanMotor.generatePlan(profile({ age: '3 meses', behaviorIssues: [], trainingBase: 'beginner' }));
    const blocks = new Set(plan.tasks.map(t => blockOf(t.id)));
    expect(blocks.has('b1')).toBe(true);
    expect(blocks.has('b2')).toBe(true);
  });
});
