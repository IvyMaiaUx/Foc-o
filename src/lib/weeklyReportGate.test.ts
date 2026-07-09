import { describe, it, expect } from 'vitest';
import { evaluateWeeklyReportGate } from './weeklyReportGate';

// timestamps em horário LOCAL (mês 0-indexado) para casar com toLocalDateKey
const ts = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();

describe('evaluateWeeklyReportGate', () => {
  it('desbloqueia com 3 dias, 3 check-ins e 2 treinos', () => {
    const checkins = [{ date: '2026-06-10' }, { date: '2026-06-11' }, { date: '2026-06-12' }];
    const logs = [{ completedAt: ts(2026, 6, 10) }, { completedAt: ts(2026, 6, 11) }];
    const r = evaluateWeeklyReportGate(checkins, logs);
    expect(r.unlocked).toBe(true);
    expect(r.requirements.every((x) => x.met)).toBe(true);
  });

  it('bloqueia faltando 1 treino', () => {
    const checkins = [{ date: '2026-06-10' }, { date: '2026-06-11' }, { date: '2026-06-12' }];
    const logs = [{ completedAt: ts(2026, 6, 10) }];
    const r = evaluateWeeklyReportGate(checkins, logs);
    expect(r.unlocked).toBe(false);
    expect(r.requirements.find((x) => x.key === 'trainings')!.met).toBe(false);
  });

  it('calcula overallPct (2 dias, 3 check-ins, 1 treino => 72)', () => {
    const checkins = [{ date: '2026-06-10' }, { date: '2026-06-10' }, { date: '2026-06-11' }];
    const logs = [{ completedAt: ts(2026, 6, 10) }];
    const r = evaluateWeeklyReportGate(checkins, logs);
    expect(r.overallPct).toBe(72);
  });

  it('conta dia ativo único quando check-in e treino no mesmo dia', () => {
    const r = evaluateWeeklyReportGate([{ date: '2026-06-10' }], [{ completedAt: ts(2026, 6, 10) }]);
    expect(r.requirements.find((x) => x.key === 'activeDays')!.current).toBe(1);
  });

  it('zero registros => bloqueado e 0%', () => {
    const r = evaluateWeeklyReportGate([], []);
    expect(r.unlocked).toBe(false);
    expect(r.overallPct).toBe(0);
  });
});
