import { describe, it, expect } from 'vitest';
import { behaviorTrendHeadline } from './trendGuards';
import { CheckinData } from '@/src/repositories/CheckinRepository';

// Check-in mínimo: só data + os flags comportamentais que a tendência lê.
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
  it('nunca afirma tendência quando a metade recente é rala demais (viés de amostragem lido como sinal)', () => {
    // recente (3 mais novos) espalhados por ~1 mês; antiga (3) em dias consecutivos.
    // Sem a guarda, isto afirmaria "mais latidos" — a versão comportamental do viés.
    const recentSparse = [
      ck('2026-07-10', { barked: true }),
      ck('2026-06-25', { barked: true }),
      ck('2026-06-11', { barked: true }),
      ck('2026-06-03'),
      ck('2026-06-02'),
      ck('2026-06-01'),
    ];
    expect(behaviorTrendHeadline(recentSparse).kind).toBe('insufficient');
  });

  it('property: para várias distribuições com metade recente esparsa, o resultado NUNCA é tendência', () => {
    for (const gapDays of [10, 20, 40, 90]) {
      const recentA = new Date(2026, 6, 10).getTime();
      const d = (offset: number) => new Date(recentA - offset * 86_400_000).toISOString().slice(0, 10);
      const list = [
        ck(d(0)), ck(d(gapDays)), ck(d(gapDays * 2)), // recente esparsa
        ck(d(gapDays * 2 + 1)), ck(d(gapDays * 2 + 2)), ck(d(gapDays * 2 + 3)), // antiga densa
      ];
      expect(behaviorTrendHeadline(list).kind).not.toBe('trend');
    }
  });

  it('poucos check-ins em uma das metades → insuficiente', () => {
    expect(behaviorTrendHeadline([ck('2026-07-03'), ck('2026-07-02'), ck('2026-07-01')]).kind).toBe('insufficient');
  });
});

describe('behaviorTrendHeadline — número só quando a amostra sustenta', () => {
  it('n pequeno (3 por metade, densidade comparável): direção sim, % não', () => {
    const small = [
      ck('2026-07-11'), ck('2026-07-10'), ck('2026-07-09', { barked: true }),
      ck('2026-07-03', { barked: true }), ck('2026-07-02', { barked: true }), ck('2026-07-01', { barked: true }),
    ];
    const r = behaviorTrendHeadline(small, 'Tayo', 'o');
    expect(r.kind).toBe('trend');
    if (r.kind === 'trend') {
      expect(r.withPercent).toBe(false);
      expect(r.text).not.toContain('%');
      expect(r.text).toContain('seus registros'); // sujeito é o registro, não o cão
    }
  });

  it('n suficiente (6 por metade, densidade comparável): o % aparece', () => {
    const big: CheckinData[] = [];
    for (let day = 12; day >= 7; day--) big.push(ck(`2026-07-${String(day).padStart(2, '0')}`)); // recente, sem latido
    for (let day = 6; day >= 1; day--) big.push(ck(`2026-07-${String(day).padStart(2, '0')}`, { barked: true })); // antiga, com latido
    const r = behaviorTrendHeadline(big, 'Tayo', 'o');
    expect(r.kind).toBe('trend');
    if (r.kind === 'trend') {
      expect(r.withPercent).toBe(true);
      expect(r.text).toContain('%');
    }
  });
});
