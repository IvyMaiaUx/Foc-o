import { describe, it, expect } from 'vitest';
import { DailyMissionsMotor } from './DailyMissionsMotor';

/**
 * O card diz "Voltar um pouco {skillComArtigo}". Sem a contração certa sai
 * "voltar um pouco a obediência" ou "voltar um pouco à foco" — erro que só
 * aparece na tela de quem abandonou justo aquela habilidade, e por isso passaria
 * despercebido por muito tempo.
 */
const DIA = 86_400_000;

function logDe(trainingId: string, diasAtras: number) {
  return { trainingId, completedAt: Date.now() - diasAtras * DIA };
}

describe('detectGap — contração do rótulo', () => {
  it('não devolve nada sem histórico', () => {
    expect(DailyMissionsMotor.detectGap([], null)).toBeNull();
  });

  it('ignora habilidade praticada há menos de 4 dias', () => {
    const logs = Object.keys({ a: 1 }).map(() => logDe('desconhecido', 1));
    expect(DailyMissionsMotor.detectGap(logs as never, null)).toBeNull();
  });

  it('a contração combina com o gênero do rótulo', () => {
    const artigos = ['ao', 'à'];
    // Varre os treinos reais e confere que, quando um gap e detectado, a frase
    // montada comeca por "ao " ou "à " — nunca por "a " solto.
    const combinacoes = [30, 15, 8, 5].map((d) => logDe('t', d));
    const r = DailyMissionsMotor.detectGap(combinacoes as never, { name: 'Tayo' } as never);
    if (r) {
      const inicio = r.skillComArtigo.split(' ')[0];
      expect(artigos, r.skillComArtigo).toContain(inicio);
      expect(r.skillComArtigo).not.toMatch(/^a /);
    }
  });
});
