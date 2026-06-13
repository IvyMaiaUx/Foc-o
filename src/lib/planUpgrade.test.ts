import { describe, it, expect } from 'vitest';
import { isPlanUpgradeEligible } from './planUpgrade';
import { CurrentPlan, DogProfile } from '../types';

const dog = { name: 'Rex' } as DogProfile;
const basePlan = (over: Partial<CurrentPlan> = {}): CurrentPlan =>
  ({ tasks: [], currentTaskIndex: 0, generatedAt: 0, focus: 'x', ...over });

describe('isPlanUpgradeEligible', () => {
  it('elegível quando o plano não tem carimbo intelligent', () => {
    expect(isPlanUpgradeEligible(dog, basePlan())).toBe(true);
  });
  it('não elegível quando o plano já é intelligent', () => {
    expect(isPlanUpgradeEligible(dog, basePlan({ engine: 'intelligent' }))).toBe(false);
  });
  it('não elegível sem perfil ou sem plano', () => {
    expect(isPlanUpgradeEligible(null, basePlan())).toBe(false);
    expect(isPlanUpgradeEligible(dog, null)).toBe(false);
  });
});
