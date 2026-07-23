import { DogProfile, CurrentPlan, UserProfile, hasPremiumAccess } from '../types';
import { EvolutionSummary } from '../repositories/EvolutionRepository';
import { CheckinData } from '../repositories/CheckinRepository';
import { VaccineData } from '../repositories/VaccineRepository';
import { NutritionMotor } from './NutritionMotor';
import { TRAINING_TEMPLATES } from '../lib/trainingTemplates';
import { getDailyTrainingLimit, countTrainingSessionsToday } from '../lib/trainingLimits';


export interface HomeState {
  hasCompletedTrainingToday: boolean;
  hasCheckedInToday: boolean;
  upcomingVaccine: VaccineData | null;
  nutritionIsPending: boolean;
  isNewUser: boolean;
  
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  
  priorityAction: 'training' | 'checkin' | 'nutrition' | 'vaccine' | 'all_done';
  priorityAlert: string | null;

  isTrialActive: boolean;
  trialDaysLeft: number;
  isPremiumLocked: boolean;

  mainInsight: string;
  emotionalMessage: string;
  primaryCTA: string;
  secondaryCTA: string;
}

export class HomeMotor {
  static calculateState(
    userProfile: UserProfile | null,
    dogProfile: DogProfile | null,
    currentPlan: CurrentPlan | null,
    evolution: EvolutionSummary | null,
    trainingLogs: any[],
    checkinToday: CheckinData | null,
    vaccines: VaccineData[]
  ): HomeState {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const hasCheckedInToday = !!checkinToday;
    const art = dogProfile?.gender === 'female' ? 'da' : 'do';
    const pronoun = dogProfile?.gender === 'female' ? 'dela' : 'dele';
    
    // Check if today's training quota is used up (premium gets more sessions/day than free)
    const dailyTrainingLimit = getDailyTrainingLimit(hasPremiumAccess(userProfile));
    const trainingSessionsToday = countTrainingSessionsToday(trainingLogs, todayStart.getTime());
    const hasCompletedTrainingToday = trainingSessionsToday >= dailyTrainingLimit;
    
    // Check trial
    const isTrialActive = userProfile?.subscription?.status === 'trialing'
      || userProfile?.subscriptionTier === 'trial';
    const rawTrialEnd = userProfile?.subscription?.trialEndsAt ?? userProfile?.trialEndsAt ?? 0;
    const trialDaysLeft = isTrialActive && rawTrialEnd
      ? Math.ceil((rawTrialEnd - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Check for upcoming vaccines (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(todayStart.getDate() + 30);
    
    let upcomingVaccine: VaccineData | null = null;
    for (const v of vaccines) {
      if (v.nextDose) {
        const nextDate = new Date(v.nextDose);
        const [y, m, d] = v.nextDose.split('-');
        if (y) {
           const parsedNextDate = new Date(Number(y), Number(m) - 1, Number(d));
           if (parsedNextDate >= todayStart && parsedNextDate <= thirtyDaysFromNow) {
             upcomingVaccine = v;
             break;
           }
        }
      }
    }

    // Check nutrition
    const nutritionIsPending = !dogProfile?.foodBrand;

    // Check if new user
    const totalSessions = evolution?.totalSessions || 0;
    const isNewUser = totalSessions === 0 && trainingLogs.length === 0;

    let priorityAction: 'training' | 'checkin' | 'nutrition' | 'vaccine' | 'all_done' = 'all_done';
    let priorityAlert: string | null = null;
    let isPremiumLocked = !hasPremiumAccess(userProfile);

    if (isPremiumLocked) {
       priorityAlert = 'Seu período premium ou de teste expirou. Escolha um plano para liberar os próximos treinos.';
    } else if (isTrialActive && trialDaysLeft <= 3) {
       priorityAlert = `Seu período grátis termina em ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'}. Para continuar de onde pararam, é só ativar o plano.`;
    }

    if (!hasCompletedTrainingToday) {
       priorityAction = 'training';
    } else if (!hasCheckedInToday) {
       priorityAction = 'checkin';
       if (!priorityAlert) {
         priorityAlert = 'Treino do dia concluído! Registre o check-in para analisarmos o comportamento.';
       }
    } else if (upcomingVaccine) {
       priorityAction = 'vaccine';
       if (!priorityAlert) {
         priorityAlert = `Lembrete: Vacina "${upcomingVaccine.name}" agendada para os próximos dias.`;
       }
    } else if (nutritionIsPending) {
       priorityAction = 'nutrition';
       if (!priorityAlert) {
         priorityAlert = 'Aproveite para cadastrar a ração real do seu cão para ajustar a porção diária ideal.';
       }
    } else {
       priorityAction = 'all_done';
    }

    const activeTask = currentPlan?.tasks[currentPlan?.currentTaskIndex || 0];
    const objectiveText = activeTask?.title ? `focar em ${activeTask.title.toLowerCase()}` : 'manter a rotina';
    
    let heroTitle = activeTask?.title || 'Plano concluído';
    let heroSubtitle = TRAINING_TEMPLATES[activeTask?.id || '']?.objective || 'Sem pendências.';
    let heroCta = 'Começar agora';
    
    let mainInsight = '';
    let emotionalMessage = '';
    let primaryCTA = 'Começar treino';
    let secondaryCTA = 'Registrar check-in';

    if (isPremiumLocked) {
       heroCta = 'Assinar Premium';
       mainInsight = 'Sua jornada está guardada e pronta para continuar. Reative o acesso para retomar de onde pararam.';
       emotionalMessage = `Acompanhar a rotina ${pronoun} é o primeiro passo para o comportamento ideal.`;
       primaryCTA = 'Ver planos';
       secondaryCTA = 'Continuar Free';
    } else if (isNewUser) {
       heroTitle = 'Primeiro passo do plano';
       heroSubtitle = 'Ative sua primeira sessão de treinamento.';
       mainInsight = `A jornada de ${dogProfile?.name || 'seu cão'} começa pelos primeiros registros. Comece pelo treino de hoje ou registre o primeiro check-in.`;
       emotionalMessage = 'Cada pequeno registro hoje molda as recomendações de amanhã.';
       primaryCTA = 'Começar treino';
       secondaryCTA = 'Fazer check-in';
    } else if (hasCompletedTrainingToday) {
       heroTitle = 'Sessão concluída';
       heroSubtitle = 'Hoje vocês deram mais um passo. Amanhã seguimos com a próxima etapa.';
       heroCta = 'Ver evolução';
       if (!hasCheckedInToday) {
         mainInsight = `O treino ${art} ${dogProfile?.name || 'seu cão'} já foi feito hoje. Como está o comportamento ${pronoun} agora?`;
         emotionalMessage = 'Entender o reflexo do treino na rotina é o que cria a verdadeira consistência.';
         primaryCTA = 'Fazer check-in';
         secondaryCTA = 'Ver evolução';
       } else {
         mainInsight = `Dia completo! Vocês treinaram e acompanharam a rotina ${art} ${dogProfile?.name || 'seu cão'}.`;
         emotionalMessage = 'Dia após dia, o comportamento que você espera toma forma.';
         primaryCTA = 'Ver relatório';
         secondaryCTA = 'Explorar dicas';
       }
    } else {
       if (!activeTask) {
          heroSubtitle = 'Estamos preparando o próximo plano de treinos. Já já ele aparece por aqui.';
          mainInsight = 'Vocês concluíram a etapa programada. Estamos preparando a continuidade.';
          emotionalMessage = 'A pausa também faz parte do aprendizado.';
          primaryCTA = 'Ver histórico';
          secondaryCTA = 'Revisar nutrição';
       } else {
          mainInsight = `Hoje o objetivo ${art} ${dogProfile?.name || 'seu cão'} é ${objectiveText}.`;
          emotionalMessage = 'Consistência é mais importante do que intensidade. Alguns minutos hoje já fazem a diferença.';
          primaryCTA = 'Começar treino';
          secondaryCTA = 'Fazer check-in';
       }
    }

    return {
      hasCompletedTrainingToday,
      hasCheckedInToday,
      upcomingVaccine,
      nutritionIsPending,
      isNewUser,
      heroTitle,
      heroSubtitle,
      heroCta,
      priorityAction,
      priorityAlert,
      isTrialActive,
      trialDaysLeft,
      isPremiumLocked,
      mainInsight,
      emotionalMessage,
      primaryCTA,
      secondaryCTA
    };
  }
}
