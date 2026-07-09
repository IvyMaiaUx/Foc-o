import { WhatsAppNotificationService } from '@/src/services/WhatsAppNotificationService';

type WeeklyReportStats = {
  trainings: number;
  checkins: number;
  evolutionScore: number;
};

type MonthlyReportStats = {
  totalTrainings: number;
  completedBlocks: number;
  topSkill: string;
  evolutionScore: number;
};

export async function notifyPremiumActivated(uid: string) {
  return WhatsAppNotificationService.enqueueNotification({
    userId: uid,
    type: 'premium_activated',
    templateName: 'premium_activated',
    payload: {
      link_app: 'https://focao.web.app',
    },
  });
}

export async function notifyTrainingReminder(uid: string, dogName: string, trainingTitle: string) {
  return WhatsAppNotificationService.enqueueNotification({
    userId: uid,
    dogName,
    type: 'training_reminder',
    templateName: 'focao_training_reminder',
    payload: {
      dogName,
      trainingTitle,
      nome_cao: dogName,
      titulo_treino: trainingTitle,
      link_treino_especifico: 'https://focao.web.app/plano',
    },
    variables: [dogName, trainingTitle],
  });
}

export async function notifyVaccineReminder(
  uid: string,
  dogName: string,
  vaccineName: string,
  dueDate: string,
  daysUntil: number
) {
  return WhatsAppNotificationService.enqueueNotification({
    userId: uid,
    dogName,
    type: 'vaccine_reminder',
    templateName: 'focao_vaccine_reminder',
    payload: {
      dogName,
      vaccineName,
      dueDate,
      daysUntil,
      nome_cao: dogName,
      nome_vacina: vaccineName,
      data_vacina: dueDate,
      dias_restantes: daysUntil,
      link_vacinas_app: 'https://focao.web.app/vacinas',
    },
    variables: [dogName, vaccineName, dueDate, String(daysUntil)],
  });
}

export async function notifyWeeklyReport(uid: string, dogName: string, stats: WeeklyReportStats) {
  return WhatsAppNotificationService.enqueueNotification({
    userId: uid,
    dogName,
    type: 'weekly_report',
    templateName: 'focao_weekly_report_ready',
    payload: {
      dogName,
      ...stats,
      nome_cao: dogName,
      numero_treinos: stats.trainings,
      link_relatorio_semanal: 'https://focao.web.app/relatorio',
    },
    variables: [dogName, String(stats.trainings), String(stats.checkins), String(stats.evolutionScore)],
  });
}

export async function notifyMonthlyReport(uid: string, dogName: string, month: string, stats: MonthlyReportStats) {
  return WhatsAppNotificationService.enqueueNotification({
    userId: uid,
    dogName,
    type: 'monthly_report',
    templateName: 'focao_monthly_report_ready',
    payload: {
      dogName,
      month,
      ...stats,
      nome_cao: dogName,
      total_treinos: stats.totalTrainings,
      pontuacao_evolucao: stats.evolutionScore,
      link_relatorio_mensal: 'https://focao.web.app/relatorio',
    },
    variables: [
      dogName,
      month,
      String(stats.totalTrainings),
      String(stats.completedBlocks),
      stats.topSkill,
      String(stats.evolutionScore),
    ],
  });
}
