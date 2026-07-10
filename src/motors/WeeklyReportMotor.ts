import { CheckinData } from '../repositories/CheckinRepository';
import { TrainingSession } from '../types';
import { EvolutionRepository, EvolutionSummary } from '../repositories/EvolutionRepository';
import { toLocalDateKey } from '../lib/dateKeys';

export interface WeeklyActivity {
  totalTrainings: number;
  totalCheckins: number;
  activeDays: number;
  streak: number;
  weeklyActivityScore: number;
  averageDailyScore: number;
  behaviorAverage: number;
  predominantMood: string | null;
  walkedDays: number;
  attentionDays: number; // barking, reacting, anxiety, pulling, destruction
  mainImprovement: string | null;
  attentionPoint: string | null;
  nextWeekSuggestion: string | null;
  comparison: {
    hasPreviousWeekData: boolean;
    currentActiveDays: number;
    previousActiveDays: number;
    currentCheckins: number;
    previousCheckins: number;
    currentTrainings: number;
    previousTrainings: number;
    headline: string;
    detail: string;
  };
  recurringPattern: string | null;
  maturityLevel: 'empty' | 'initial' | 'partial' | 'strong';
}

export class WeeklyReportMotor {
  static generateReport(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: TrainingSession[],
    previousCheckins: CheckinData[] = [],
    previousTrainingLogs: TrainingSession[] = []
  ): WeeklyActivity {
    const totalRecords = checkins.length + trainingLogs.length;
    
    let maturityLevel: 'empty' | 'initial' | 'partial' | 'strong' = 'empty';
    if (totalRecords === 0) maturityLevel = 'empty';
    else if (totalRecords <= 2) maturityLevel = 'initial';
    else if (totalRecords <= 4) maturityLevel = 'partial';
    else maturityLevel = 'strong';

    const totalTrainings = trainingLogs.length;
    const totalCheckins = checkins.length;
    
    // Group activity by day to calculate activeDays and scores
    const activityByDay = new Map<string, { trainings: number, checkins: number, failedTrainings: number }>();
    
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    // Helper to get relative day key (0 to 6)
    const getDayKey = (timestamp: number) => {
      const date = new Date(timestamp);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const diffDays = Math.floor((todayStart - startOfDay) / oneDay);
      return diffDays >= 0 && diffDays < 7 ? diffDays.toString() : null;
    };

    checkins.forEach(c => {
      if (!c.date) return;
      const [y, m, d] = c.date.split('-');
      const cDate = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
      const key = getDayKey(cDate);
      if (key) {
        const current = activityByDay.get(key) || { trainings: 0, checkins: 0, failedTrainings: 0 };
        current.checkins += 1;
        activityByDay.set(key, current);
      }
    });

    trainingLogs.forEach(log => {
      if (!log.completedAt) return;
      const key = getDayKey(log.completedAt);
      if (key) {
        const current = activityByDay.get(key) || { trainings: 0, checkins: 0, failedTrainings: 0 };
        if (log.feedback === 'failed') {
           current.failedTrainings += 1;
        } else {
           current.trainings += 1;
        }
        activityByDay.set(key, current);
      }
    });

    const activeDays = activityByDay.size;
    const previousActiveDays = this.countActiveDays(previousCheckins, previousTrainingLogs);
    
    let weeklyActivityScore = 0;
    activityByDay.forEach(day => {
      let dayScore = (day.trainings * 1.0) + (day.checkins * 0.5) + (day.failedTrainings * 0.25);
      if (dayScore > 3.0) dayScore = 3.0;
      weeklyActivityScore += dayScore;
    });

    const averageDailyScore = activeDays > 0 ? (weeklyActivityScore / 7) : 0; // Average over 7 days

    // Behavioral analysis
    let positiveBehaviors = 0;
    let walkedDays = 0;
    let attentionDays = 0;
    let calmEnergyDays = 0;
    
    const moodCounts = new Map<string, number>();

    checkins.forEach(c => {
      const incidents = c.context?.incidents ?? [];

      // Behavior average
      if (
        incidents.length === 0 &&
        (c.comportamento === 'Dia excelente, sem problemas' || c.comportamento === 'Passeio tranquilo')
      ) {
        positiveBehaviors += 1;
      }
      
      // Moods
      if (c.energia) {
        const count = moodCounts.get(c.energia) || 0;
        moodCounts.set(c.energia, count + 1);
        if (c.energia === 'Calmo e relaxado' || c.energia === 'Equilibrado') {
           calmEnergyDays += 1;
        }
      }

      // Walks
      if (c.context?.walked === true || c.comportamento === 'Passeio tranquilo') {
        walkedDays += 1;
      }

      // Attention
      if (
        incidents.length > 0 ||
        c.comportamento === 'Reagiu a outros cães' || 
        c.comportamento === 'Ansiedade ao ficar só' || 
        c.energia === 'Agitado e sem foco'
      ) {
        attentionDays += 1;
      }
    });

    const behaviorAverage = totalCheckins > 0 ? Math.round((positiveBehaviors / totalCheckins) * 100) : 0;
    
    let predominantMood = null;
    if (totalCheckins > 0) {
       let maxCount = 0;
       moodCounts.forEach((count, mood) => {
         if (count > maxCount) {
           maxCount = count;
           predominantMood = mood;
         }
       });
    }

    // Smart Analysis Strings
    let mainImprovement: string | null = null;
    let attentionPoint: string | null = null;
    let nextWeekSuggestion: string | null = null;

    if (maturityLevel === 'empty') {
      // No strings needed
    } else if (maturityLevel === 'initial') {
       if (totalTrainings > 0 && totalCheckins > 0) {
         mainImprovement = 'Vocês deram os primeiros passos registrando treinos e check-ins no diário.';
       } else if (totalTrainings > 0) {
         mainImprovement = 'Os primeiros treinos da semana foram registrados.';
       } else {
         mainImprovement = 'O diário já começou a ser preenchido.';
       }
       nextWeekSuggestion = 'Continue registrando o humor do seu cão nos check-ins para montarmos um histórico.';
    } else {
       // Partial or Strong
       if (calmEnergyDays > totalCheckins / 2) {
         mainImprovement = 'A energia se manteve mais equilibrada e relaxada na maior parte da semana.';
       } else if (positiveBehaviors >= totalCheckins / 2) {
         mainImprovement = 'O comportamento geral mostrou-se bastante estável.';
       } else if (totalTrainings >= 3) {
         mainImprovement = 'A consistência nos treinos foi excelente, o que ajuda na rotina e no foco.';
       } else {
         mainImprovement = 'O engajamento com a rotina foi o destaque desta semana.';
       }

       if (attentionDays >= 2) {
          const reactiveCount = checkins.filter(c =>
            c.comportamento === 'Reagiu a outros cães' || c.context?.incidents?.includes('reactivity')
          ).length;
          const anxietyCount = checkins.filter(c =>
            c.comportamento === 'Ansiedade ao ficar só' || c.context?.incidents?.includes('exit_agitation')
          ).length;
          const pullingCount = checkins.filter(c => c.context?.incidents?.includes('leash_pulling')).length;
          const destructionCount = checkins.filter(c => c.context?.incidents?.includes('destruction')).length;
          
          if (reactiveCount >= anxietyCount && reactiveCount > 0) {
             attentionPoint = 'Notamos maior sensibilidade e reação a estímulos externos durante os passeios.';
             nextWeekSuggestion = 'Vale realizar exercícios de foco rápido antes e durante os passeios para diminuir a reatividade.';
          } else if (anxietyCount > 0) {
             attentionPoint = 'Houve sinais de ansiedade ou agitação em momentos de separação.';
             nextWeekSuggestion = 'Introduza treinos curtos do comando "Fica" e prêmios para reforçar a independência.';
          } else if (pullingCount > 0) {
             attentionPoint = 'Os registros indicam dificuldade recorrente em manter um passeio mais calmo.';
             nextWeekSuggestion = 'Reforce treinos curtos de atenção e condução antes de aumentar a duração dos passeios.';
          } else if (destructionCount > 0) {
             attentionPoint = 'Houve registros de destruição de objetos durante a semana.';
             nextWeekSuggestion = 'Combine gasto mental curto com manejo do ambiente nos períodos de maior agitação.';
          } else {
             attentionPoint = 'Identificamos alguns picos de energia agitada e falta de foco.';
             nextWeekSuggestion = 'Considere adicionar pequenas sessões de gasto mental com brinquedos recheáveis.';
          }
       } else if (totalTrainings === 0) {
          attentionPoint = 'Esta semana teve poucos treinos registrados — acontece.';
          nextWeekSuggestion = 'Retome com treinos de 3 a 5 minutos diários de obediência básica para aquecer.';
       } else {
          // No apparent issues
          const failedTrainings = activityByDay.size > 0 ? Array.from(activityByDay.values()).reduce((acc, curr) => acc + curr.failedTrainings, 0) : 0;
          if (failedTrainings > 0) {
             attentionPoint = 'Alguns treinos pareceram mais difíceis ou não puderam ser concluídos.';
             nextWeekSuggestion = 'Divida os comandos que não saíram tão perfeitos em etapas menores e aumente as recompensas.';
          } else {
             nextWeekSuggestion = 'Mantenha o ritmo atual, a evolução da comunicação entre vocês está fluindo de forma excelente!';
          }
       }
    }

    // Adjust messages for partial maturity
    if (maturityLevel === 'partial') {
      if (mainImprovement && !attentionPoint) {
         attentionPoint = 'Continue preenchendo os check-ins para mapearmos melhor os desafios.';
      }
    }

    const previousTotalRecords = previousCheckins.length + previousTrainingLogs.length;
    const hasPreviousWeekData = previousTotalRecords > 0;
    const activityDelta = activeDays - previousActiveDays;
    const comparison = {
      hasPreviousWeekData,
      currentActiveDays: activeDays,
      previousActiveDays,
      currentCheckins: totalCheckins,
      previousCheckins: previousCheckins.length,
      currentTrainings: totalTrainings,
      previousTrainings: previousTrainingLogs.length,
      headline: !hasPreviousWeekData
        ? 'A comparação entre semanas começará com os próximos registros.'
        : activityDelta > 0
          ? 'A rotina ganhou mais presença nesta semana.'
          : activityDelta < 0
            ? 'O ritmo de registros diminuiu em relação à semana anterior — normal em semanas cheias.'
            : 'A frequência de acompanhamento se manteve estável.',
      detail: !hasPreviousWeekData
        ? 'Ainda não há registros suficientes da semana anterior para medir tendência com segurança.'
        : `${activeDays} dia(s) ativos nesta semana e ${previousActiveDays} na semana anterior. Foram ${totalTrainings} treino(s) e ${totalCheckins} check-in(s) no período atual.`,
    };

    const recurringPattern = this.findRecurringPattern(checkins, previousCheckins);

    return {
      totalTrainings,
      totalCheckins,
      activeDays,
      streak: EvolutionRepository.liveStreak(summary),
      weeklyActivityScore,
      averageDailyScore: Number(averageDailyScore.toFixed(1)),
      behaviorAverage,
      predominantMood,
      walkedDays,
      attentionDays,
      mainImprovement,
      attentionPoint,
      nextWeekSuggestion,
      comparison,
      recurringPattern,
      maturityLevel
    };
  }

  private static countActiveDays(checkins: CheckinData[], trainingLogs: TrainingSession[]): number {
    const dates = new Set<string>();
    checkins.forEach((checkin) => {
      if (checkin.date) dates.add(checkin.date);
    });
    trainingLogs.forEach((log) => {
      if (!log.completedAt) return;
      dates.add(toLocalDateKey(new Date(log.completedAt)));
    });
    return dates.size;
  }

  private static findRecurringPattern(current: CheckinData[], previous: CheckinData[]): string | null {
    const allCheckins = [...current, ...previous];
    if (allCheckins.length < 4) return null;

    const recurringTrigger = [
      { value: 'doorbell', label: 'campainha' },
      { value: 'visitors', label: 'chegada de visitas' },
      { value: 'dogs_nearby', label: 'presença de outros cães' },
      { value: 'street_noise', label: 'barulhos da rua' },
      { value: 'being_alone', label: 'momentos em que ficou sozinho' },
      { value: 'leaving_home', label: 'hora de sair de casa' },
      { value: 'routine_change', label: 'mudanças na rotina' },
    ]
      .map((trigger) => ({
        ...trigger,
        count: allCheckins.filter((checkin) => checkin.context?.triggers?.includes(trigger.value as any)).length,
      }))
      .sort((a, b) => b.count - a.count)[0];

    if (recurringTrigger?.count >= 2) {
      return `O gatilho mais recorrente nos registros recentes foi ${recurringTrigger.label}. Observe se os episódios diminuem quando esse contexto é antecipado com mais previsibilidade.`;
    }

    const patterns = [
      {
        count: allCheckins.filter((checkin) => checkin.context?.incidents?.includes('leash_pulling')).length,
        text: 'A dificuldade em manter um passeio calmo apareceu de forma recorrente. Vale priorizar exercícios curtos de atenção antes de sair.'
      },
      {
        count: allCheckins.filter((checkin) => checkin.context?.incidents?.includes('excessive_barking')).length,
        text: 'Os latidos excessivos apareceram em mais de um registro recente. Observe quais estímulos antecedem esses episódios.'
      },
      {
        count: allCheckins.filter((checkin) => checkin.context?.incidents?.includes('reactivity')).length,
        text: 'A reatividade a estímulos externos se repetiu nos registros recentes. Trabalhe distância segura e foco em ambientes mais simples.'
      },
      {
        count: allCheckins.filter((checkin) => checkin.context?.incidents?.includes('destruction')).length,
        text: 'A destruição de objetos apareceu de forma recorrente. Combine manejo do ambiente com atividades curtas de gasto mental.'
      },
      {
        count: allCheckins.filter((checkin) => checkin.energia === 'Agitado e sem foco').length,
        text: 'A energia elevada e a dificuldade de foco apareceram com frequência. Sessões mais curtas e previsíveis podem funcionar melhor.'
      },
    ].sort((a, b) => b.count - a.count);

    return patterns[0].count >= 2 ? patterns[0].text : null;
  }
}
