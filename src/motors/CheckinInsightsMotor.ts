import { CheckinData } from '../repositories/CheckinRepository';
import { TrainingSession, CustomEvent } from '../types';
import { toLocalDateKey } from '../lib/dateKeys';

export interface CheckinInsights {
  energyPattern: 'high' | 'low' | 'balanced' | 'unknown';
  behaviorAfterTraining: 'better' | 'same' | 'worse' | 'unknown';
  insightText: string;
  hasEnoughData: boolean;
}

export class CheckinInsightsMotor {
  static analyze(
    checkins: CheckinData[], 
    trainingLogs: TrainingSession[],
    customEvents: CustomEvent[] = [],
    completionsHistory: Record<string, Record<string, boolean>> = {}
  ): CheckinInsights {
    const hasEnoughData = checkins.length >= 3;

    if (checkins.length === 0) {
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
    if (highCount > checkins.length / 2) {
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

      const dateStr = toLocalDateKey(log.completedAt);
      const matchCheckin = checkins.find(c => c.date === dateStr);

      if (matchCheckin) {
        const incidents = matchCheckin.context?.incidents ?? [];

        if (
          incidents.length === 0 &&
          (matchCheckin.comportamento === 'Dia excelente, sem problemas' || matchCheckin.comportamento === 'Passeio tranquilo')
        ) {
          betterCount++;
        } else if (
          incidents.length > 0 ||
          matchCheckin.comportamento === 'Reagiu a outros cães' ||
          matchCheckin.comportamento === 'Ansiedade ao ficar só'
        ) {
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

    // 3. Analyze Custom Events correlation (Routine Insights)
    let uncompletedWalkCorrelation = false;
    let regularFeedChecked = false;
    let medsMissed = false;

    const walkEvents = customEvents.filter(e => e.type === 'walk');
    const feedEvents = customEvents.filter(e => e.type === 'feed');
    const medsEvents = customEvents.filter(e => e.type === 'meds');

    let walkedCheckinMissedCount = 0;

    for (const c of checkins) {
      if (!c.date) continue;
      
      const checkinDate = new Date(c.date + 'T00:00:00');
      const dayOfWeek = checkinDate.getDay();

      const walkScheduledToday = walkEvents.some(event => {
        if (event.frequency === 'daily') return true;
        if (event.frequency === 'weekly') return event.daysOfWeek?.includes(dayOfWeek) ?? false;
        if (event.frequency === 'once') return event.date === c.date;
        return false;
      });

      if (walkScheduledToday) {
        const completedIdsForDay = completionsHistory[c.date] || {};
        const walkEventsToday = walkEvents.filter(event => {
          if (event.frequency === 'daily') return true;
          if (event.frequency === 'weekly') return event.daysOfWeek?.includes(dayOfWeek) ?? false;
          if (event.frequency === 'once') return event.date === c.date;
          return false;
        });

        const anyWalkCompleted = walkEventsToday.some(event => completedIdsForDay[event.id] === true);
        
        if (!anyWalkCompleted && c.energia === 'Agitado e sem foco') {
          walkedCheckinMissedCount++;
        }
      }
    }

    if (walkedCheckinMissedCount > 0) {
      uncompletedWalkCorrelation = true;
    }

    // Check if any medication event was missed
    for (const c of checkins) {
      if (!c.date) continue;
      const checkinDate = new Date(c.date + 'T00:00:00');
      const dayOfWeek = checkinDate.getDay();

      const medScheduledToday = medsEvents.some(event => {
        if (event.frequency === 'daily') return true;
        if (event.frequency === 'weekly') return event.daysOfWeek?.includes(dayOfWeek) ?? false;
        if (event.frequency === 'once') return event.date === c.date;
        return false;
      });

      if (medScheduledToday) {
        const completedIdsForDay = completionsHistory[c.date] || {};
        const medEventsToday = medsEvents.filter(event => {
          if (event.frequency === 'daily') return true;
          if (event.frequency === 'weekly') return event.daysOfWeek?.includes(dayOfWeek) ?? false;
          if (event.frequency === 'once') return event.date === c.date;
          return false;
        });

        const allMedsCompleted = medEventsToday.every(event => completedIdsForDay[event.id] === true);
        if (!allMedsCompleted) {
          medsMissed = true;
        }
      }
    }

    // Check if feeding was done regularly
    if (feedEvents.length > 0) {
      let completedFeedCount = 0;
      let feedDaysScheduled = 0;

      for (const c of checkins) {
        if (!c.date) continue;
        const checkinDate = new Date(c.date + 'T00:00:00');
        const dayOfWeek = checkinDate.getDay();

        const feedScheduledToday = feedEvents.some(event => {
          if (event.frequency === 'daily') return true;
          if (event.frequency === 'weekly') return event.daysOfWeek?.includes(dayOfWeek) ?? false;
          if (event.frequency === 'once') return event.date === c.date;
          return false;
        });

        if (feedScheduledToday) {
          feedDaysScheduled++;
          const completedIdsForDay = completionsHistory[c.date] || {};
          const feedEventsToday = feedEvents.filter(event => {
            if (event.frequency === 'daily') return true;
            if (event.frequency === 'weekly') return event.daysOfWeek?.includes(dayOfWeek) ?? false;
            if (event.frequency === 'once') return event.date === c.date;
            return false;
          });

          const allFeedCompleted = feedEventsToday.every(event => completedIdsForDay[event.id] === true);
          if (allFeedCompleted) {
            completedFeedCount++;
          }
        }
      }

      if (feedDaysScheduled > 0 && completedFeedCount === feedDaysScheduled) {
        regularFeedChecked = true;
      }
    }

    // 4. Generate Insight Text
    let insightText = 'Continue registrando para refinar as recomendações do plano.';

    if (uncompletedWalkCorrelation) {
      insightText = 'Percebemos um padrão: nos dias com passeio, seu cão tende a ficar mais calmo e focado. Vale proteger esse horário na agenda.';
    } else if (medsMissed) {
      insightText = 'Algumas doses de remédio ficaram sem confirmação. Se já foram dadas, é só marcar — e, se precisar, o lembrete de horário ajuda a manter a rotina.';
    } else if (behaviorAfterTraining === 'better') {
      insightText = 'Nos dias em que vocês treinaram, o comportamento de seu cão melhorou. A consistência está funcionando.';
    } else if (behaviorAfterTraining === 'worse' && energyPattern === 'high') {
      insightText = 'Seu cão demonstra energia alta nos dias de treino. Sessões mais curtas e frequentes podem funcionar melhor.';
    } else if (regularFeedChecked) {
      insightText = 'A consistência na marcação das refeições mostra uma rotina alimentar exemplar. Isso ajuda a estabilizar os níveis de energia ao longo do dia.';
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
