import { DogProfile, CurrentPlan } from '../types';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { IntelligentPlanMotor } from '@/src/motors/IntelligentPlanMotor';

export interface PersonalityAnswers {
  energyLevel: string;
  personalityTraits: string[];
  rewardPreference: string;
}

export class PlanRegenerationService {
  /**
   * Recalcula o plano de um usuário existente: mescla as respostas de
   * Personality no perfil, exclui os treinos já concluídos e gera um novo
   * plano inteligente. Não-destrutivo: só atualiza os campos de Personality + o plano.
   */
  static async regenerate(userId: string, answers: PersonalityAnswers): Promise<CurrentPlan> {
    const profile = await DogRepository.getDogProfile(userId);
    if (!profile) {
      throw new Error('Perfil do cão não encontrado para recalcular o plano.');
    }

    const personalityUpdate = {
      energyLevel: answers.energyLevel || profile.energyLevel,
      personalityTraits: answers.personalityTraits,
      personality: answers.personalityTraits,
      rewardPreference: answers.rewardPreference,
    };

    await DogRepository.saveDogProfile(userId, personalityUpdate);

    const mergedProfile: DogProfile = { ...profile, ...personalityUpdate };

    const logs = await TrainingRepository.getTrainingLogs(userId);
    const completedIds = Array.from(
      new Set(logs.map((log: any) => log?.trainingId).filter(Boolean) as string[])
    );

    const plan = IntelligentPlanMotor.generatePlan(mergedProfile, completedIds);
    await TrainingRepository.saveCurrentPlan(userId, plan);
    return plan;
  }
}
