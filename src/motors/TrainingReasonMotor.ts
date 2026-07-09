import { DogProfile, TrainingTask } from '@/src/types';
import { CheckinData } from '@/src/repositories/CheckinRepository';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';

export interface TrainingReason {
  reasonTitle: string;
  reasonText: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  phase: string;
  focus: string;
}

function getPronoun(dog: { gender?: string } | null): { art: string; pronoun: string } {
  if (dog?.gender === 'female') return { art: 'a', pronoun: 'ela' };
  return { art: 'o', pronoun: 'ele' };
}

// CheckinBehaviors field → problemTag used in training templates
const CHECKIN_TO_PROBLEM: Record<string, string> = {
  barked: 'latidos',
  pulledLeash: 'puxa_na_guia',
  destroyed: 'destruicao',
  reactivity: 'reatividade',
  exitAgitation: 'agitado',
  peeWrongPlace: 'xixi_em_lugar_errado',
  biting: 'mordidas',
};

// dogProfile.behaviorIssues values → problemTag
const PROFILE_ISSUE_TO_PROBLEM: Record<string, string> = {
  pulling: 'puxa_na_guia',
  jumping: 'pula_em_pessoas',
  barking: 'latidos',
  biting: 'mordidas',
  anxiety: 'ansiedade',
  anxious: 'ansiedade',
  reactive: 'reatividade',
  reactivity: 'reatividade',
  focus: 'falta_de_foco',
  destruction: 'destruicao',
  pee: 'xixi_em_lugar_errado',
  bathroom: 'xixi_em_lugar_errado',
};

type ReasonBuilder = (name: string, art: string, count: number, total: number) => string;

const PROBLEM_TAG_REASONS: Record<string, ReasonBuilder> = {
  latidos: (name, art, count, total) =>
    count >= 2
      ? `Notamos que ${name} latiu em ${count} dos últimos ${total} registros — este treino trabalha o autocontrole e reduz essa reação de forma gradual.`
      : `${name} tem tendência a latir em certas situações — este treino desenvolve a calma e o autocontrole necessários.`,
  puxa_na_guia: (name, art, count, total) =>
    count >= 2
      ? `Nos últimos ${total} registros, ${name} puxou na guia ${count} ${count === 1 ? 'vez' : 'vezes'} — este treino trabalha passeios com mais leveza e atenção mútua.`
      : `Um dos objetivos é melhorar o passeio d${art} ${name} — este treino é o próximo passo para uma guia mais solta.`,
  reatividade: (name, art, count, total) =>
    count >= 2
      ? `Notamos reatividade d${art} ${name} em ${count} registros recentes — este treino constrói respostas mais calmas e seguras diante de estímulos.`
      : `${name} apresenta algum nível de reatividade — este treino ajuda a criar tranquilidade diante do que antes provocava reação.`,
  destruicao: (name, art, count, _total) =>
    count >= 1
      ? `Registramos comportamentos destrutivos recentes d${art} ${name} — este treino trabalha o redirecionamento de energia de forma positiva.`
      : `Este treino ajuda ${name} a canalizar energia de forma construtiva e evitar destruição.`,
  mordidas: (name, art, count, _total) =>
    count >= 1
      ? `Notamos episódios de mordidas nos últimos registros — este treino ensina ${name} a controlar o impulso e respeitar limites.`
      : `Este treino desenvolve o autocontrole d${art} ${name} em relação a mordidas e pressão de boca.`,
  agitado: (name, art, count, _total) =>
    count >= 2
      ? `${name} esteve agitad${art === 'a' ? 'a' : 'o'} na hora de sair em registros recentes — este treino ensina a controlar essa excitação antes do passeio.`
      : `Este treino ajuda ${name} a desenvolver calma na rotina de saída, tornando os passeios mais tranquilos desde o início.`,
  xixi_em_lugar_errado: (name, _art, count, _total) =>
    count >= 1
      ? `Registramos acidentes dentro de casa nos últimos dias — este treino reforça a rotina de fazer xixi na rua de forma consistente.`
      : `Este treino estabelece uma rotina clara para ${name} aprender a fazer xixi sempre no lugar certo.`,
  pula_em_pessoas: (name, _art, _count, _total) =>
    `${name} tem o hábito de pular em pessoas — este treino ensina a cumprimentar com os quatro pés no chão, de forma gentil.`,
  ansiedade: (name, art, _count, _total) =>
    `Notamos sinais de ansiedade no perfil d${art} ${name} — este treino trabalha a segurança emocional e a confiança de forma progressiva.`,
  falta_de_foco: (name, art, _count, _total) =>
    `Este treino desenvolve o foco e a atenção d${art} ${name} — habilidades que são a base para todos os outros comandos.`,
  medo: (name, art, _count, _total) =>
    `${name} apresenta algum nível de insegurança — este treino fortalece a confiança de forma gradual, sem pressão.`,
  social: (name, art, _count, _total) =>
    `Este treino melhora a sociabilidade d${art} ${name} com pessoas e outros animais, de forma segura e positiva.`,
};

const PROBLEM_FOCUS_LABEL: Record<string, string> = {
  latidos: 'Autocontrole de latidos',
  puxa_na_guia: 'Passeio com guia solta',
  reatividade: 'Reações mais calmas',
  destruicao: 'Redirecionamento de energia',
  mordidas: 'Controle de mordida',
  agitado: 'Controle de agitação',
  xixi_em_lugar_errado: 'Rotina de xixi na rua',
  pula_em_pessoas: 'Cumprimentos calmos',
  ansiedade: 'Segurança emocional',
  falta_de_foco: 'Foco e atenção',
  medo: 'Confiança e segurança',
  social: 'Socialização',
};

function countBehavior(checkins: CheckinData[], key: string): number {
  return checkins.filter(c => c.behaviors && (c.behaviors as unknown as Record<string, boolean>)[key]).length;
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
        focus: 'Aguardando dados',
      };
    }

    const { art } = getPronoun(dogProfile);
    const dogName = dogProfile?.name || 'seu cão';

    let phase = 'Base do plano';
    if (totalSessions <= 3) phase = 'Fase inicial da jornada';
    else if (totalSessions <= 10) phase = 'Construção de consistência';
    else phase = 'Refinamento da rotina';

    // Training's declared problem tags
    const template = TRAINING_TEMPLATES[currentTask.id];
    const trainingProblemTags: string[] = template?.problemTags ?? [];

    // Count each behavior observed across recent check-ins
    const observedCounts: Record<string, number> = {};
    for (const [behaviorKey, problemTag] of Object.entries(CHECKIN_TO_PROBLEM)) {
      const count = countBehavior(recentCheckins, behaviorKey);
      if (count > 0) observedCounts[problemTag] = (observedCounts[problemTag] ?? 0) + count;
    }

    // Profile issues mapped to problem tags
    const profileProblemTags = new Set<string>(
      (dogProfile?.behaviorIssues ?? []).map(
        issue => PROFILE_ISSUE_TO_PROBLEM[issue.toLowerCase()] ?? issue.toLowerCase()
      )
    );

    // Pick the best matching tag: observed behavior that also matches training
    let bestTag: string | null = null;
    let bestCount = 0;

    for (const tag of trainingProblemTags) {
      const count = observedCounts[tag] ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestTag = tag;
      }
    }

    // Fallback to profile issue that matches training
    if (!bestTag) {
      for (const tag of trainingProblemTags) {
        if (profileProblemTags.has(tag)) {
          bestTag = tag;
          break;
        }
      }
    }

    // Fallback to first training problem tag
    if (!bestTag && trainingProblemTags.length > 0) {
      bestTag = trainingProblemTags[0];
    }

    const focus = bestTag ? (PROBLEM_FOCUS_LABEL[bestTag] ?? 'Foco e consistência') : 'Foco e consistência';

    let reasonText = '';
    let confidence: 'low' | 'medium' | 'high' = 'low';

    if (bestTag && PROBLEM_TAG_REASONS[bestTag]) {
      reasonText = PROBLEM_TAG_REASONS[bestTag](dogName, art, bestCount, recentCheckins.length);
      confidence = bestCount >= 2 ? 'high' : profileProblemTags.has(bestTag) ? 'high' : 'medium';
    } else {
      // Energy-based fallback
      const latestCheckin = recentCheckins[0];
      const highEnergy = latestCheckin &&
        ['high', 'Agitado', 'Agitado e sem foco'].includes(latestCheckin.energia ?? '');
      const lowEnergy = latestCheckin &&
        ['Baixa', 'Muito calmo'].includes(latestCheckin.energia ?? '');

      if (highEnergy) {
        reasonText = `Notamos que a energia d${art} ${dogName} estava alta nos últimos registros — este treino ajuda a canalizar esse entusiasmo com foco.`;
        confidence = 'medium';
      } else if (lowEnergy) {
        reasonText = `Este treino respeita o ritmo d${art} ${dogName}, propondo estímulos de forma suave e no tempo certo.`;
        confidence = 'medium';
      } else if (totalSessions <= 2) {
        reasonText = `Como ${art} ${dogName} está no início da jornada, este treino cria a base para uma convivência mais calma e conectada.`;
        if (dogProfile?.goals?.[0]) {
          reasonText += ` Ele conversa diretamente com a principal meta cadastrada.`;
        }
        confidence = 'medium';
      } else {
        reasonText = `Estamos personalizando a rotina com base nos registros recentes. Este treino é o próximo passo natural na evolução d${art} ${dogName}.`;
        confidence = 'medium';
      }
    }

    // Append reward preference tip if available
    const rewardPref = dogProfile?.rewardPreference;
    const REWARD_TIPS: Record<string, string> = {
      treats: 'Use petiscos pequenos como recompensa — funciona muito bem para o aprendizado.',
      toys: 'Ofereça o brinquedo favorito como recompensa ao final de cada acerto.',
      praise: 'Elogie com entusiasmo a cada acerto — voz animada é a melhor recompensa.',
      play: 'Uma breve brincadeira é uma ótima recompensa depois de cada tentativa bem-sucedida.',
      food: 'Use a própria ração como recompensa — pratico e eficiente.',
    };
    const rewardTip = rewardPref ? REWARD_TIPS[rewardPref] : null;
    if (rewardTip) reasonText += ` ${rewardTip}`;

    return {
      reasonTitle: 'Por que este treino?',
      reasonText,
      confidenceLevel: confidence,
      phase,
      focus,
    };
  }
}
