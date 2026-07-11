import { describe, it, expect } from 'vitest';
import { behaviorTrendHeadline } from './trendGuards';
import { CheckinData } from '@/src/repositories/CheckinRepository';

function ck(
  date: string,
  over: Partial<Record<'barked' | 'pulledLeash' | 'reactivity' | 'exitAgitation' | 'peeWrongPlace', boolean>> = {}
): CheckinData {
  return {
    date,
    energia: '',
    alimentacao: '',
    comportamento: '',
    behaviors: {
      walked: false, bathroom: false, barked: false, pulledLeash: false, destroyed: false,
      reactivity: false, exitAgitation: false, peeWrongPlace: false, biting: false, ...over,
    },
  } as CheckinData;
}

describe('behaviorTrendHeadline — Guarda 1 (densidade) não pode ser burlada', () => {
  it('nunca afirma tendência quando a metade recente é rala demais (viés de amostragem)', () => {
    const recentSparse = [
      ck('2026-07-10', { barked: true }), ck('2026-06-25', { barked: true }), ck('2026-06-11', { barked: true }),
      ck('2026-06-03'), ck('2026-06-02'), ck('2026-06-01'),
    ];
    expect(behaviorTrendHeadline(recentSparse).kind).toBe('insufficient');
  });

  it('property: várias distribuições com metade recente esparsa → nunca tendência', () => {
    for (const gapDays of [10, 20, 40, 90]) {
      const base = new Date(2026, 6, 10).getTime();
      const d = (o: number) => new Date(base - o * 86_400_000).toISOString().slice(0, 10);
      const list = [
        ck(d(0)), ck(d(gapDays)), ck(d(gapDays * 2)),
        ck(d(gapDays * 2 + 1)), ck(d(gapDays * 2 + 2)), ck(d(gapDays * 2 + 3)),
      ];
      expect(behaviorTrendHeadline(list).kind).not.toBe('trend');
    }
  });

  it('poucos check-ins em uma das metades → insuficiente', () => {
    expect(behaviorTrendHeadline([ck('2026-07-03'), ck('2026-07-02'), ck('2026-07-01')]).kind).toBe('insufficient');
  });
});

describe('behaviorTrendHeadline — direção + dado cru + janela datada (sem %)', () => {
  const big: CheckinData[] = [];
  for (let day = 12; day >= 7; day--) big.push(ck(`2026-07-${String(day).padStart(2, '0')}`)); // recente, sem latido
  for (let day = 6; day >= 1; day--) big.push(ck(`2026-07-${String(day).padStart(2, '0')}`, { barked: true })); // antiga, com latido
  const r = behaviorTrendHeadline(big, 'Tayo', 'o');

  it('mostra direção, sem percentual em lugar nenhum', () => {
    expect(r.kind).toBe('trend');
    if (r.kind === 'trend') {
      expect(r.headline).toContain('menos latidos');
      expect(r.headline).not.toContain('%');
      expect(r.support).not.toContain('%');
      expect(r.window).not.toContain('%');
    }
  });

  it('o dado cru traz contagem e denominador para o tutor conferir', () => {
    if (r.kind === 'trend') {
      expect(r.support).toContain('0 dos 6 check-ins recentes');
      expect(r.support).toContain('6 dos 6 anteriores');
    }
  });

  it('a janela é datada e explícita (não se confunde com a semana)', () => {
    if (r.kind === 'trend') {
      expect(r.window).toMatch(/\d{2}\/\d{2} a \d{2}\/\d{2}/);
      expect(r.window).toContain('12 check-ins');
    }
  });

  it('o sujeito é o registro do tutor, não o cão', () => {
    if (r.kind === 'trend') expect(r.headline).toContain('seus registros');
  });
});
