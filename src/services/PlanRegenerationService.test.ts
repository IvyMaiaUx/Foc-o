import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanRegenerationService } from './PlanRegenerationService';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { DogProfile, CurrentPlan } from '@/src/types';

const profile = {
  id: 'profile', name: 'Rex', breed: 'SRD', age: '2 anos', weight: '10kg',
  routine: [], energyLevel: 'medium', personalityTraits: [], behaviorIssues: ['pulling'],
  trainingBase: 'intermediate', knownCommands: [], goals: [], createdAt: 0, updatedAt: 0,
} as DogProfile;

const answers = { energyLevel: 'high', personalityTraits: ['Agitado'], rewardPreference: 'treats' };

describe('PlanRegenerationService.regenerate', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(DogRepository, 'getDogProfile').mockResolvedValue(profile);
    vi.spyOn(DogRepository, 'saveDogProfile').mockResolvedValue('profile');
    vi.spyOn(TrainingRepository, 'getTrainingLogs').mockResolvedValue([{ trainingId: 'b2-t2' }]);
    vi.spyOn(TrainingRepository, 'saveCurrentPlan').mockResolvedValue(undefined);
  });

  it('salva os campos de personality no perfil', async () => {
    await PlanRegenerationService.regenerate('u1', answers);
    expect(DogRepository.saveDogProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
      energyLevel: 'high',
      personalityTraits: ['Agitado'],
      rewardPreference: 'treats',
    }));
  });

  it('exclui os treinos concluídos do novo plano', async () => {
    const plan = await PlanRegenerationService.regenerate('u1', answers);
    expect(plan.tasks.some(t => t.id === 'b2-t2')).toBe(false);
  });

  it('carimba o plano salvo como intelligent', async () => {
    const plan = await PlanRegenerationService.regenerate('u1', answers);
    expect(plan.engine).toBe('intelligent');
    const saved = (TrainingRepository.saveCurrentPlan as any).mock.calls[0][1] as CurrentPlan;
    expect(saved.engine).toBe('intelligent');
  });

  it('lança se o perfil do cão não existir', async () => {
    vi.spyOn(DogRepository, 'getDogProfile').mockResolvedValue(null);
    await expect(PlanRegenerationService.regenerate('u1', answers)).rejects.toThrow();
  });
});
