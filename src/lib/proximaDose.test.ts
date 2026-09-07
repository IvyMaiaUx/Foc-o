import { describe, it, expect } from 'vitest';

/**
 * Regra: só a dose MAIS RECENTE de cada vacina disputa "Próximas doses".
 *
 * Existe porque não há editar nem excluir vacina — registrar é a única ação. Sem
 * o agrupamento, quem toma a dose atrasada e registra a nova fica com duas
 * entradas da mesma vacina, e a antiga acusa atraso para sempre.
 */
type Registro = { name: string; dateApplied: string; nextDose?: string };

function proximasDoses(vacinas: Registro[]): Registro[] {
  const recente = new Map<string, Registro>();
  for (const v of vacinas) {
    if (!v.nextDose) continue;
    const atual = recente.get(v.name);
    if (!atual || new Date(v.dateApplied) > new Date(atual.dateApplied)) recente.set(v.name, v);
  }
  return [...recente.values()];
}

describe('próximas doses', () => {
  it('a dose nova dá baixa na atrasada da mesma vacina', () => {
    const r = proximasDoses([
      { name: 'Antirrábica', dateApplied: '2025-08-01', nextDose: '2026-08-01' }, // vencida
      { name: 'Antirrábica', dateApplied: '2026-09-06', nextDose: '2027-09-06' }, // recém tomada
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].nextDose).toBe('2027-09-06');
  });

  it('vacinas diferentes convivem', () => {
    const r = proximasDoses([
      { name: 'Antirrábica', dateApplied: '2026-09-06', nextDose: '2027-09-06' },
      { name: 'V10', dateApplied: '2026-08-06', nextDose: '2027-08-06' },
    ]);
    expect(r).toHaveLength(2);
  });

  it('atrasada continua aparecendo enquanto ninguém registra a nova', () => {
    const r = proximasDoses([{ name: 'Giárdia', dateApplied: '2025-04-07', nextDose: '2026-04-07' }]);
    expect(r).toHaveLength(1);
  });

  it('registro sem próxima dose não entra na lista', () => {
    expect(proximasDoses([{ name: 'V8', dateApplied: '2026-01-01' }])).toHaveLength(0);
  });
});
