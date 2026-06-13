import { CurrentPlan, DogProfile } from '../types';

/**
 * Um usuário é elegível ao recálculo inteligente quando tem perfil e plano,
 * mas o plano ainda não foi gerado pelo motor inteligente (sem o carimbo).
 */
export function isPlanUpgradeEligible(
  profile: DogProfile | null,
  plan: CurrentPlan | null
): boolean {
  if (!profile || !plan) return false;
  return plan.engine !== 'intelligent';
}
