import { CheckinData } from '../repositories/CheckinRepository';
import { TrainingSession } from '../types';
import { EvolutionSummary } from '../repositories/EvolutionRepository';

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
  maturityLevel: 'empty' | 'initial' | 'partial' | 'strong';
}

export class WeeklyReportMotor {
  static generateReport(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: TrainingSession[]
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
      // Behavior average
      if (c.comportamento === 'Dia excelente, sem problemas' || c.comportamento === 'Passeio tranquilo') {
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
      if (c.comportamento === 'Passeio tranquilo') {
        walkedDays += 1;
      }

      // Attention
      if (
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
          const reactiveCount = checkins.filter(c => c.comportamento === 'Reagiu a outros cães').length;
          const anxietyCount = checkins.filter(c => c.comportamento === 'Ansiedade ao ficar só').length;
          
          if (reactiveCount >= anxietyCount && reactiveCount > 0) {
             attentionPoint = 'Notamos maior sensibilidade e reação a estímulos externos durante os passeios.';
             nextWeekSuggestion = 'Vale realizar exercícios de foco rápido antes e durante os passeios para diminuir a reatividade.';
          } else if (anxietyCount > 0) {
             attentionPoint = 'Houve sinais de ansiedade ou agitação em momentos de separação.';
             nextWeekSuggestion = 'Introduza treinos curtos do comando "Fica" e prêmios para reforçar a independência.';
          } else {
             attentionPoint = 'Identificamos alguns picos de energia agitada e falta de foco.';
             nextWeekSuggestion = 'Considere adicionar pequenas sessões de gasto mental com brinquedos recheáveis.';
          }
       } else if (totalTrainings === 0) {
          attentionPoint = 'A semana passou quase sem treinos direcionados registrados.';
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

    return {
      totalTrainings,
      totalCheckins,
      activeDays,
      streak: summary?.streak || 0,
      weeklyActivityScore,
      averageDailyScore: Number(averageDailyScore.toFixed(1)),
      behaviorAverage,
      predominantMood,
      walkedDays,
      attentionDays,
      mainImprovement,
      attentionPoint,
      nextWeekSuggestion,
      maturityLevel
    };
  }
}
