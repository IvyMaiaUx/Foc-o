import { DogProfile, TrainingTask, CurrentPlan } from '../types';
import { generateTrainingPlan } from '@/src/lib/adaptivePlanMotor';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { BLOCKS } from '@/src/lib/trainingTree';

export class AdaptivePlanMotor {
  static generatePlan(dogProfile: DogProfile, trainingLogs?: any[]): CurrentPlan {
    const sequenceIds = generateTrainingPlan(dogProfile, trainingLogs);
    
    let focus = 'Obediência básica e vínculo';
    if (dogProfile.behaviorIssues?.includes('pulling')) {
       focus = 'Melhorar os passeios e foco externo';
    } else if (dogProfile.behaviorIssues?.includes('separation_anxiety') || dogProfile.behaviorIssues?.includes('destructive')) {
       focus = 'Controle de ansiedade e relaxamento';
    } else if (dogProfile.trainingBase === 'advanced') {
       focus = 'Refinamento e Truques Avançados';
    }

    const tasks: TrainingTask[] = sequenceIds.map(id => {
      const t = TRAINING_TEMPLATES[id];
      const b = BLOCKS[t.blockId];
      return {
        id: t.id,
        title: t.name,
        duration: t.duration,
        module: b.id.replace('b', ''),
        moduleName: b.name,
        description: t.objective,
        steps: t.steps
      };
    });

    return {
      tasks,
      currentTaskIndex: 0,
      generatedAt: Date.now(),
      focus,
    };
  }
}
