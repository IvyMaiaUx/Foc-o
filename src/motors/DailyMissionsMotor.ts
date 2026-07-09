import { DogProfile, TrainingTask } from '@/src/types';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';

export interface DailyMission {
  id: string;
  text: string;
  duration: string;
  when: 'hoje' | 'amanhã' | 'depois';
  category: 'treino' | 'passeio' | 'vínculo' | 'calma';
}

export interface GapDirective {
  skillLabel: string;
  daysSince: number;
  suggestion: string;
}

interface TrainingLogEntry {
  trainingId?: string;
  completedAt?: number | { toMillis?: () => number; seconds?: number };
}

const OBJECTIVE_TAG_LABELS: Record<string, string> = {
  foco: 'foco',
  obediencia: 'obediência',
  passeio: 'passeio com guia',
  calma: 'calma e autocontrole',
  socializacao: 'socialização',
  rotina: 'rotina',
  convivencia: 'convivência',
  independencia: 'permanência',
  vinculo: 'vínculo',
};

const OBJECTIVE_TAG_SUGGESTION: Record<string, (name: string) => string> = {
  foco:          (name) => `Chame ${name} pelo nome 5 vezes com recompensa — 3 minutos bastam`,
  obediencia:    (name) => `Pratique "senta" e "fica" com ${name} em 5 repetições com recompensa`,
  passeio:       (name) => `Faça 10 minutos de caminhada tranquila com ${name}, foco na guia frouxa`,
  calma:         (name) => `Peça que ${name} descanse em um local fixo por 2 minutos sem interação`,
  socializacao:  (name) => `Leve ${name} a um ambiente diferente por 5 minutos, sem pressão`,
  rotina:        (name) => `Mantenha o horário de saída de hoje consistente — rotina é treino`,
  convivencia:   (name) => `Pratique "fica" com ${name} enquanto outras pessoas estão por perto`,
  independencia: (name) => `Deixe ${name} sozinho em outro cômodo com a porta aberta por 1 minuto`,
  vinculo:       (name) => `Reserve 5 minutos só para brincar com ${name} sem comandos — puro vínculo`,
};

const GAP_THRESHOLD_DAYS = 4;

function toMs(completedAt: TrainingLogEntry['completedAt']): number | null {
  if (!completedAt) return null;
  if (typeof completedAt === 'number') return completedAt;
  if (typeof completedAt === 'object') {
    if (typeof (completedAt as any).toMillis === 'function') return (completedAt as any).toMillis();
    if (typeof (completedAt as any).seconds === 'number') return (completedAt as any).seconds * 1000;
  }
  return null;
}

export interface MissionSignals {
  /** Houve passeio no check-in de hoje (context.walked === true). */
  walkedToday?: boolean;
  /** O treino do dia foi concluído (há trainingLog de hoje não-falho). */
  trainingDoneToday?: boolean;
}

export class DailyMissionsMotor {
  /**
   * Missões que são concluídas AUTOMATICAMENTE a partir de ações reais do dia,
   * sem o usuário precisar tocar no card:
   *  - `daily_walk`    → quando o check-in registra passeio (walkedToday)
   *  - `daily_training`→ quando o treino do dia é concluído (trainingDoneToday)
   *
   * O resto das missões (prática extra: senta, recall, permanência...) continua
   * sendo marcado manualmente e persistido no Firestore via MissionsRepository.
   */
  static autoCompletedIds(missions: DailyMission[], signals: MissionSignals): string[] {
    const done: string[] = [];
    for (const m of missions) {
      if (signals.walkedToday && m.id === 'daily_walk') done.push(m.id);
      if (signals.trainingDoneToday && m.id === 'daily_training') done.push(m.id);
    }
    return done;
  }

  static detectGap(
    trainingLogs: TrainingLogEntry[],
    dogProfile: DogProfile | null
  ): GapDirective | null {
    if (!trainingLogs.length) return null;

    const lastPracticed: Record<string, number> = {};

    for (const log of trainingLogs) {
      if (!log.trainingId) continue;
      const template = TRAINING_TEMPLATES[log.trainingId];
      if (!template?.objectiveTags?.length) continue;
      const ms = toMs(log.completedAt);
      if (!ms) continue;
      for (const tag of template.objectiveTags) {
        if (!OBJECTIVE_TAG_LABELS[tag]) continue;
        if (!lastPracticed[tag] || ms > lastPracticed[tag]) lastPracticed[tag] = ms;
      }
    }

    const nowMs = Date.now();
    let biggestGapTag: string | null = null;
    let biggestGapDays = 0;

    for (const [tag, lastMs] of Object.entries(lastPracticed)) {
      const daysSince = Math.floor((nowMs - lastMs) / 86_400_000);
      if (daysSince > biggestGapDays) {
        biggestGapDays = daysSince;
        biggestGapTag = tag;
      }
    }

    if (!biggestGapTag || biggestGapDays < GAP_THRESHOLD_DAYS) return null;

    const name = dogProfile?.name || 'seu cão';
    return {
      skillLabel: OBJECTIVE_TAG_LABELS[biggestGapTag],
      daysSince: biggestGapDays,
      suggestion:
        OBJECTIVE_TAG_SUGGESTION[biggestGapTag]?.(name) ??
        `Retome o treino de ${OBJECTIVE_TAG_LABELS[biggestGapTag]} com ${name} — mesmo 5 minutos fazem diferença`,
    };
  }

  static generateMissions(
    dogProfile: DogProfile | null,
    currentTask: TrainingTask | null
  ): DailyMission[] {
    const name = dogProfile?.name || 'seu cão';
    const issues = dogProfile?.behaviorIssues ?? [];
    const energy = dogProfile?.energyLevel ?? 'medium';

    const m1: DailyMission = currentTask
      ? {
          id: 'daily_training',
          text: `Pratique "${currentTask.title}" por 5 minutos`,
          duration: '5 min',
          when: 'hoje',
          category: 'treino',
        }
      : {
          id: 'daily_recall',
          text: `Chame ${name} pelo nome 5 vezes e recompense cada resposta`,
          duration: '3 min',
          when: 'hoje',
          category: 'vínculo',
        };

    let m2: DailyMission;
    if (issues.includes('pulling') || issues.includes('puxa_na_guia')) {
      m2 = {
        id: 'daily_leash',
        text: `Pratique caminhar ao lado d${dogProfile?.gender === 'female' ? 'a' : 'o'} ${name} por 3 minutos sem puxar`,
        duration: '3 min',
        when: 'amanhã',
        category: 'passeio',
      };
    } else if (issues.includes('barking') || issues.includes('latidos')) {
      m2 = {
        id: 'daily_calm',
        text: `Pratique "ignora" com ${name}: fique indiferente a latidos por 2 minutos`,
        duration: '2 min',
        when: 'amanhã',
        category: 'calma',
      };
    } else if (issues.includes('separation_anxiety') || issues.includes('ansiedade')) {
      m2 = {
        id: 'daily_stay',
        text: `Peça que ${name} fique em outro cômodo por 1 minuto com a porta aberta`,
        duration: '2 min',
        when: 'amanhã',
        category: 'calma',
      };
    } else if (issues.includes('reactive') || issues.includes('reatividade')) {
      m2 = {
        id: 'daily_focus',
        text: `Pratique contato visual com ${name} em ambiente calmo: 10 repetições`,
        duration: '5 min',
        when: 'amanhã',
        category: 'treino',
      };
    } else {
      m2 = {
        id: 'daily_sit',
        text: `Pratique o comando "senta" com ${name}: 5 repetições com recompensa`,
        duration: '5 min',
        when: 'amanhã',
        category: 'treino',
      };
    }

    const walkMinutes = energy === 'high' ? 20 : energy === 'low' ? 10 : 15;
    const m3: DailyMission = {
      id: 'daily_walk',
      text: `Faça um passeio calmo de ${walkMinutes} minutos com ${name}, sem pressão`,
      duration: `${walkMinutes} min`,
      when: 'depois',
      category: 'passeio',
    };

    return [m1, m2, m3];
  }
}
