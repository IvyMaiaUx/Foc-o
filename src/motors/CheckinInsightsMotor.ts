import { CheckinData } from '../repositories/CheckinRepository';
import { TrainingSession } from '../types';

export interface CheckinInsights {
  energyPattern: 'high' | 'low' | 'balanced' | 'unknown';
  behaviorAfterTraining: 'better' | 'same' | 'worse' | 'unknown';
  insightText: string;
  hasEnoughData: boolean;
}

export class CheckinInsightsMotor {
  static analyze(checkins: CheckinData[], trainingLogs: TrainingSession[]): CheckinInsights {
    const hasEnoughData = checkins.length >= 3 && trainingLogs.length >= 2;

    if (!hasEnoughData) {
      return {
        energyPattern: 'unknown',
        behaviorAfterTraining: 'unknown',
        insightText: 'Registre mais check-ins para revelar os padrões do seu cão.',
        hasEnoughData: false
      };
    }

    // 1. Analyze energy pattern
    let highCount = 0;
    let lowCount = 0;

    for (const c of checkins) {
      if (c.energia === 'Agitado e sem foco') {
        highCount++;
      } else if (c.energia === 'Calmo e relaxado') {
        lowCount++;
      }
    }

    let energyPattern: 'high' | 'low' | 'balanced' | 'unknown' = 'balanced';
    if (checkins.length === 0) {
      energyPattern = 'unknown';
    } else if (highCount > checkins.length / 2) {
      energyPattern = 'high';
    } else if (lowCount > checkins.length / 2) {
      energyPattern = 'low';
    }

    // 2. Behavior after training
    let betterCount = 0;
    let worseCount = 0;
    let sameCount = 0;

    for (const log of trainingLogs) {
      if (log.feedback === 'failed') continue;

      const dateStr = new Date(log.completedAt).toISOString().split('T')[0];
      const matchCheckin = checkins.find(c => c.date === dateStr);

      if (matchCheckin) {
        if (matchCheckin.comportamento === 'Dia excelente, sem problemas' || matchCheckin.comportamento === 'Passeio tranquilo') {
          betterCount++;
        } else if (matchCheckin.comportamento === 'Reagiu a outros cães' || matchCheckin.comportamento === 'Ansiedade ao ficar só') {
          worseCount++;
        } else {
          sameCount++;
        }
      }
    }

    let behaviorAfterTraining: 'better' | 'same' | 'worse' | 'unknown' = 'unknown';
    if (betterCount === 0 && worseCount === 0 && sameCount === 0) {
      behaviorAfterTraining = 'unknown';
    } else if (betterCount > worseCount && betterCount > sameCount) {
      behaviorAfterTraining = 'better';
    } else if (worseCount > betterCount && worseCount > sameCount) {
      behaviorAfterTraining = 'worse';
    } else {
      behaviorAfterTraining = 'same';
    }

    // 3. Insight Text
    let insightText = 'Continue registrando para refinar as recomendações do plano.';
    if (behaviorAfterTraining === 'better') {
      insightText = 'Nos dias em que vocês treinaram, o comportamento de seu cão melhorou. A consistência está funcionando.';
    } else if (behaviorAfterTraining === 'worse' && energyPattern === 'high') {
      insightText = 'Seu cão demonstra energia alta nos dias de treino. Sessões mais curtas e frequentes podem funcionar melhor.';
    } else if (behaviorAfterTraining === 'worse') {
      insightText = 'Alguns dias após o treino registraram mais agitação. Considere ajustar o horário ou a intensidade.';
    } else if (energyPattern === 'high') {
      insightText = 'Seu cão tem demonstrado energia elevada com frequência. Treinos de foco e autocontrole ajudam a canalizar isso.';
    } else if (energyPattern === 'low') {
      insightText = 'Seu cão tem aparecido mais calmo nos check-ins. Mantenha o ritmo de treinos leves e consistentes.';
    }

    return {
      energyPattern,
      behaviorAfterTraining,
      insightText,
      hasEnoughData
    };
  }
}
