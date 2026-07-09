import { toLocalDateKey } from './dateKeys';

export interface ReportRequirement {
  key: 'activeDays' | 'checkins' | 'trainings';
  label: string;
  current: number;
  target: number;
  met: boolean;
}

export interface WeeklyReportGateResult {
  unlocked: boolean;
  overallPct: number; // 0-100
  requirements: ReportRequirement[];
}

export const WEEKLY_REPORT_TARGETS = { activeDays: 3, checkins: 3, trainings: 2 };

/**
 * Avalia se o relatório semanal pode ser liberado, a partir dos check-ins e
 * treinos JÁ buscados para a janela de 7 dias (sem query nova).
 *
 * - "Dia ativo" = um dia distinto com pelo menos um registro (check-in OU treino).
 * - overallPct = média das razões de cada requisito, clampadas a 100%.
 */
export function evaluateWeeklyReportGate(
  checkins: Array<{ date?: string }> = [],
  trainingLogs: Array<{ completedAt?: number }> = []
): WeeklyReportGateResult {
  const checkinCount = checkins.length;
  const trainingCount = trainingLogs.length;

  const activeDates = new Set<string>();
  for (const c of checkins) {
    if (c?.date) activeDates.add(String(c.date));
  }
  for (const log of trainingLogs) {
    if (log?.completedAt) activeDates.add(toLocalDateKey(log.completedAt));
  }
  const activeDays = activeDates.size;

  const requirements: ReportRequirement[] = [
    {
      key: 'activeDays',
      label: 'Dias ativos',
      current: activeDays,
      target: WEEKLY_REPORT_TARGETS.activeDays,
      met: activeDays >= WEEKLY_REPORT_TARGETS.activeDays,
    },
    {
      key: 'checkins',
      label: 'Check-ins',
      current: checkinCount,
      target: WEEKLY_REPORT_TARGETS.checkins,
      met: checkinCount >= WEEKLY_REPORT_TARGETS.checkins,
    },
    {
      key: 'trainings',
      label: 'Treinos',
      current: trainingCount,
      target: WEEKLY_REPORT_TARGETS.trainings,
      met: trainingCount >= WEEKLY_REPORT_TARGETS.trainings,
    },
  ];

  const overallPct = Math.round(
    (requirements.reduce((sum, r) => sum + Math.min(r.current / r.target, 1), 0) / requirements.length) * 100
  );

  return {
    unlocked: requirements.every((r) => r.met),
    overallPct,
    requirements,
  };
}
