import { describe, it, expect } from 'vitest';
import { generateDogTagsFromOnboarding, scoreTrainingForDog } from './TrainingTags';
import { DogProfile } from '../types';

function baseProfile(over: Partial<DogProfile> = {}): DogProfile {
  return {
    name: 'Rex', breed: 'SRD', age: '2 anos', weight: '10kg',
    routine: [], energyLevel: 'medium', behaviorIssues: [],
    trainingBase: 'beginner', knownCommands: [], goals: [],
    createdAt: 0, updatedAt: 0,
    ...over,
  } as DogProfile;
}

describe('generateDogTagsFromOnboarding - level tag', () => {
  it('emite "iniciante" para trainingBase beginner', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'beginner' }))).toContain('iniciante');
  });
  it('emite "intermediario" para trainingBase intermediate', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'intermediate' }))).toContain('intermediario');
  });
  it('emite "avancado" para trainingBase advanced', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'advanced' }))).toContain('avancado');
  });
  it('mapeia behaviorIssue agitation para a tag de perfil agitado', () => {
    expect(generateDogTagsFromOnboarding(baseProfile({ behaviorIssues: ['agitation'] }))).toContain('agitado');
  });
});

describe('scoreTrainingForDog - nível', () => {
  const dogTags = generateDogTagsFromOnboarding(baseProfile({ trainingBase: 'beginner' }));
  it('dá +2 a um treino iniciante para um cão iniciante', () => {
    const t = { id: 'x', tags: [], problemTags: [], objectiveTags: [], profileTags: [], levelTag: 'iniciante' };
    expect(scoreTrainingForDog(t, dogTags).score).toBe(2);
  });
  it('penaliza (-5) um treino avancado para um cão iniciante', () => {
    const t = { id: 'y', tags: [], problemTags: [], objectiveTags: [], profileTags: [], levelTag: 'avancado' };
    expect(scoreTrainingForDog(t, dogTags).score).toBe(-5);
  });
});
