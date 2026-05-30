import { DogProfile, CurrentPlan, TrainingTask } from '@/src/types';
import { CheckinData } from '@/src/repositories/CheckinRepository';

export interface TrainingReason {
  reasonTitle: string;
  reasonText: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  phase: string;
  focus: string;
}

const GOAL_LABELS: Record<string, string> = {
  obedience: 'obediência básica',
  obediencia: 'obediência básica',
  'obediencia basica': 'obediência básica',
  bond: 'fortalecimento de vínculo',
  vinculo: 'fortalecimento de vínculo',
  leash: 'passeios mais tranquilos',
  anxiety: 'mais segurança e autonomia',
  barking: 'latidos com mais autocontrole',
  reactivity: 'reações mais tranquilas',
  reactive: 'reações mais tranquilas',
  behavior: 'melhora de comportamento',
  routine: 'rotina mais equilibrada',
  focus: 'foco e atenção',
  confidence: 'confiança',
  socialization: 'socialização',
  fear: 'segurança emocional',
  aggression: 'manejo de reatividade',
  training: 'treino de base',
};

function normalizeKey(value?: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function humanGoal(value?: string): string {
  const key = normalizeKey(value);
  if (!key) return 'rotina mais equilibrada';
  return GOAL_LABELS[key] || value || 'rotina mais equilibrada';
}

/** Retorna o artigo definido e pronome correto com base no sexo do cão */
function getPronoun(dog: { gender?: string } | null): { art: string; pronoun: string; adj: string } {
  if (dog?.gender === 'female') return { art: 'a', pronoun: 'Ela', adj: 'pronta' };
  return { art: 'o', pronoun: 'Ele', adj: 'pronto' };
}

export class TrainingReasonMotor {
  static explainTrainingChoice(
    dogProfile: DogProfile | null,
    currentTask: TrainingTask | null,
    recentCheckins: CheckinData[],
    totalSessions: number
  ): TrainingReason {
    if (!currentTask) {
      return {
         reasonTitle: 'Próxima Etapa',
         reasonText: 'O plano está sendo preparado para as próximas evoluções.',
         confidenceLevel: 'low',
         phase: 'Aguardando dados',
         focus: 'Aguardando dados'
      };
    }

    const title = 'Por que este treino?';
    let text = '';
    let phase = 'Base do plano';
    let focus = 'Rotina e bem-estar';
    let confidence: 'low' | 'medium' | 'high' = 'low';

    // Fase
    if (totalSessions <= 3) {
      phase = 'Fase inicial da jornada';
    } else if (totalSessions <= 10) {
      phase = 'Construção de consistência';
    } else {
      phase = 'Refinamento da rotina';
    }

    // Foco atual (Mapped from behavior issues or default)
    const BEHAVIOR_LABELS: Record<string, string> = {
      pulling: 'Passeio com mais calma',
      jumping: 'Ensinar limites e controle',
      barking: 'Latidos e autocontrole',
      biting: 'Parar mordiscadas',
      anxiety: 'Segurança e autonomia',
      reactive: 'Socialização tranquila',
      focus: 'Foco e atenção plena'
    };

    if (dogProfile?.behaviorIssues && dogProfile.behaviorIssues.length > 0) {
      const rawIssue = dogProfile.behaviorIssues[0];
      focus = BEHAVIOR_LABELS[rawIssue] || 'Foco e consistência';
    } else if (dogProfile?.goals && dogProfile.goals.length > 0) {
      focus = `Foco: ${humanGoal(dogProfile.goals[0])}`;
    }

    // Por que este treino
    const { art, pronoun } = getPronoun(dogProfile);
    const dogName = dogProfile?.name || 'seu cão';

    if (totalSessions <= 2) {
      text = `Como ${art} ${dogName} está no início da jornada, este treino cria a base para uma convivência mais calma e conectada.`;
      if (dogProfile?.goals && dogProfile.goals.length > 0) {
        text += ` ${pronoun} também conversa com a meta principal cadastrada: ${humanGoal(dogProfile.goals[0])}.`;
      }
      confidence = 'medium';
    } else {
      text = `Estamos personalizando a rotina com base nos últimos registros. Este passo é essencial para evoluir os comandos atuais d${art} ${dogName}.`;
      confidence = 'high';
      
      const lastCheckin = recentCheckins.length > 0 ? recentCheckins[0] : null;

      if (lastCheckin) {
        if (lastCheckin.energia === 'high' || lastCheckin.energia === 'Agitado' || lastCheckin.energia === 'Agitado e sem foco') {
          text = `Notamos que a energia d${art} ${dogName} estava alta nos últimos registros. Este treino vai ajudar a canalizar essa energia com foco.`;
        } else if (lastCheckin.energia === 'Baixa' || lastCheckin.energia === 'Muito calmo') {
          text = `Este treino respeita o ritmo d${art} ${dogName}, propondo estímulos de forma suave e cadenciada.`;
        }
      }
    }

    if (totalSessions === 0 && !dogProfile?.name) {
       text = 'Estamos começando a personalizar a jornada com base nos seus primeiros registros. Siga este passo para começar.';
    }

    return {
      reasonTitle: title,
      reasonText: text,
      confidenceLevel: confidence,
      phase,
      focus
    };
  }
}
