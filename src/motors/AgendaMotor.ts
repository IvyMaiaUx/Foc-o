import { DogProfile, CurrentPlan, TrainingTask } from '@/src/types';
import { EvolutionSummary } from '@/src/repositories/EvolutionRepository';
import { CheckinData } from '@/src/repositories/CheckinRepository';
import { VaccineData } from '@/src/repositories/VaccineRepository';
import { NutritionMotor } from './NutritionMotor';

export interface UpcomingDay {
   label: string; // 'Amanhã', 'Quarta', etc.
   dateValue: Date;
   hasTraining: boolean;
   hasCheckin: boolean;
   hasVaccine: boolean;
   isReportDay: boolean; // Sunday usually
}

export interface AgendaState {
  todayAlert: string | null;
  hasCheckedInToday: boolean;
  hasCompletedTrainingToday: boolean;
  activeTask: TrainingTask | null;
  
  nutritionIsPending: boolean;
  nutritionIsFallback: boolean;
  nutritionText: string;
  
  upcomingTasks: TrainingTask[];
  weeklyPreview: UpcomingDay[];
  
  upcomingVaccine: VaccineData | null;
  reportAvailable: boolean;
  trialEndingSoon: boolean;
}

export class AgendaMotor {
  static calculateState(
    dogProfile: DogProfile | null,
    plan: CurrentPlan | null,
    latestCheckin: CheckinData | null,
    sessionsCount: number,
    completedTrainingToday: boolean,
    vaccines: VaccineData[],
    isTrialActive: boolean,
    trialDaysLeft: number
  ): AgendaState {
    
    // Setup Dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Checkin
    let hasCheckedInToday = false;
    if (latestCheckin?.date) {
      const [y, m, d] = (latestCheckin.date as string).split('-');
      const checkinDate = new Date(Number(y), Number(m) - 1, Number(d));
      if (checkinDate.getTime() === today.getTime()) {
        hasCheckedInToday = true;
      }
    }

    // Training
    let upcomingTasks: TrainingTask[] = [];
    let activeTask: TrainingTask | null = null;
    if (plan && plan.tasks.length > 0) {
       const startIdx = plan.currentTaskIndex || 0;
       activeTask = plan.tasks[startIdx] || null;
       upcomingTasks = plan.tasks.slice(startIdx + 1, startIdx + 5);
    }

    // Nutrition
    const nutritionInfo = NutritionMotor.calculateFood(dogProfile);
    const nutritionIsFallback = nutritionInfo.fallsback;
    const nutritionIsPending = !dogProfile?.foodBrand;
    let nutritionText = `${nutritionInfo.daily}g/dia configurado`;
    if (nutritionIsPending) {
       nutritionText = 'Configuração pendente';
    } else if (nutritionIsFallback) {
       nutritionText = 'Plano alimentar configurado';
    }

    // Vaccines
    let upcomingVaccine: VaccineData | null = null;
    if (vaccines.length > 0) {
       const sorted = [...vaccines]
         .filter(v => v.nextDose && new Date(v.nextDose).getTime() >= today.getTime())
         .sort((a,b) => new Date(a.nextDose as string).getTime() - new Date(b.nextDose as string).getTime());
       if (sorted.length > 0) {
          upcomingVaccine = sorted[0];
       }
    }

    // Weekly Preview
    const weeklyPreview: UpcomingDay[] = [];
    const daysArr = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for(let i=1; i<=4; i++) {
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + i);
        
        let label = daysArr[nextDay.getDay()];
        if (i === 1) label = 'Amanhã';

        let hasVaccineNextDay = false;
        if (upcomingVaccine && upcomingVaccine.nextDose) {
           const [y, m, d] = upcomingVaccine.nextDose.split('-');
           const vDate = new Date(Number(y), Number(m)-1, Number(d));
           if (vDate.getTime() === nextDay.getTime()) {
              hasVaccineNextDay = true;
           }
        }

        weeklyPreview.push({
           label,
           dateValue: nextDay,
           hasTraining: plan ? true : false,
           hasCheckin: true,
           hasVaccine: hasVaccineNextDay,
           isReportDay: nextDay.getDay() === 0 // Sunday
        });
    }

    // Alerts and States
    const reportAvailable = sessionsCount >= 3;
    const trialEndingSoon = isTrialActive && trialDaysLeft <= 2;

    let todayAlert = null;
    if (trialEndingSoon) {
       todayAlert = `Seu período grátis termina em ${trialDaysLeft} dias. Para continuar de onde pararam, é só ativar o plano.`;
    }

    return {
      todayAlert,
      hasCheckedInToday,
      hasCompletedTrainingToday: completedTrainingToday,
      activeTask,
      nutritionIsPending,
      nutritionIsFallback,
      nutritionText,
      upcomingTasks,
      weeklyPreview,
      upcomingVaccine,
      reportAvailable,
      trialEndingSoon
    };
  }
}
