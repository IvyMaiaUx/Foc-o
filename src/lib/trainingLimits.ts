export const FREE_DAILY_TRAINING_LIMIT = 1;
export const PREMIUM_DAILY_TRAINING_LIMIT = 6;

export function getDailyTrainingLimit(isPremium: boolean): number {
  return isPremium ? PREMIUM_DAILY_TRAINING_LIMIT : FREE_DAILY_TRAINING_LIMIT;
}

export function countTrainingSessionsToday(logs: { completedAt: number; feedback?: string }[], todayStartMs: number): number {
  return logs.filter(log => log.completedAt >= todayStartMs && log.feedback !== 'failed').length;
}
