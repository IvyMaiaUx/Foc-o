import { CheckinData } from '@/src/repositories/CheckinRepository';

/**
 * CORTES PROVISÓRIOS — palpites iniciais, NÃO MEDIDOS.
 *
 * Decidem quando o app pode afirmar uma tendência de comportamento a partir dos check-ins.
 * NÃO foram calibrados com dado. Ficam nomeados aqui, num lugar só, para que a instrumentação
 * do item 3 (Metabase + distribuição real de muitos cães) os ENCONTRE e recalibre.
 * Ver a memória focao-metodo-e-pendencias.
 */
export const TREND_MIN_CHECKINS_PER_HALF = 3; // mínimo de check-ins em cada metade — provisório
export const TREND_MIN_DENSITY_RATIO = 0.5;   // metade recente ≥ 50% da densidade da antiga — provisório
export const TREND_MIN_CHANGE_PP = 10;        // mudança mínima (pontos %) p/ um sinal ser mencionado — provisório

/*
 * NOTA (v0.7.1): o percentual absoluto ("↓29%") foi REMOVIDO. Com 7 check-ins por metade,
 * uma ocorrência a mais/menos movia vários pontos — precisão que a amostra não sustenta.
 * No lugar, a manchete mostra DIREÇÃO ("menos latidos") + o DADO CRU que o tutor confere
 * ("em 2 dos 7 check-ins recentes, contra 5 dos 7 anteriores"). O % só volta quando houver
 * volume real pra calibrar significância — não por palpite.
 */

interface Signal {
  key: keyof NonNullable<CheckinData['behaviors']>;
  noun: string;
  goodDir: 'down' | 'up';
}

const SIGNALS: Signal[] = [
  { key: 'barked', noun: 'latidos', goodDir: 'down' },
  { key: 'pulledLeash', noun: 'puxões na guia', goodDir: 'down' },
  { key: 'reactivity', noun: 'reações a estímulos', goodDir: 'down' },
  { key: 'exitAgitation', noun: 'agitação ao ficar só', goodDir: 'down' },
  { key: 'peeWrongPlace', noun: 'xixis fora do lugar', goodDir: 'down' },
];

/**
 * Duas camadas explícitas: a manchete NÃO é "esta semana". É a leitura AO LONGO DO TEMPO,
 * datada (`window`), separada do bloco semanal. O sujeito é "nos seus registros", não "o cão".
 */
export type BehaviorTrend =
  | { kind: 'insufficient'; text: string }
  | { kind: 'trend'; headline: string; support: string; window: string };

function checkinMs(c: CheckinData): number {
  const [y, m, d] = (c.date || '').split('-').map(Number);
  return y ? new Date(y, m - 1, d).getTime() : 0;
}

function spanDays(list: CheckinData[]): number {
  const times = list.map(checkinMs).filter((t) => t > 0);
  if (times.length <= 1) return 1;
  return Math.max(1, (Math.max(...times) - Math.min(...times)) / 86_400_000 + 1);
}

function fmtDM(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * A ÚNICA porta para uma conclusão de tendência comportamental. A Guarda 1 (densidade
 * comparável entre as metades) está DENTRO — nenhum caminho produz `kind: 'trend'` sem
 * passar por ela. O property test em trendGuards.test.ts trava isso.
 */
export function behaviorTrendHeadline(
  checkins: CheckinData[],
  dogName = 'seu cão',
  art: 'o' | 'a' = 'o'
): BehaviorTrend {
  const withDate = checkins.filter((c) => c.date);
  const half = Math.floor(withDate.length / 2);
  const recent = withDate.slice(0, half); // check-ins vêm do mais novo para o mais antigo
  const older = withDate.slice(half);

  // --- Guarda 1: densidade comparável (protege contra viés de amostragem) ---
  if (older.length < TREND_MIN_CHECKINS_PER_HALF || recent.length < TREND_MIN_CHECKINS_PER_HALF) {
    return { kind: 'insufficient', text: 'Ainda não há check-ins suficientes para uma leitura ao longo do tempo.' };
  }
  const olderDensity = older.length / spanDays(older);
  const recentDensity = recent.length / spanDays(recent);
  if (recentDensity < olderDensity * TREND_MIN_DENSITY_RATIO) {
    return { kind: 'insufficient', text: 'Poucos registros recentes para comparar com o início.' };
  }

  // Janela DATADA e explícita — a manchete não se confunde com a semana do relatório.
  const times = withDate.map(checkinMs).filter((t) => t > 0);
  const window = `${fmtDM(Math.min(...times))} a ${fmtDM(Math.max(...times))} · ${withDate.length} check-ins`;
  const artWord = art === 'a' ? 'a' : 'o';

  const moves = SIGNALS.map((s) => {
    const recentCount = recent.filter((c) => c.behaviors?.[s.key]).length;
    const olderCount = older.filter((c) => c.behaviors?.[s.key]).length;
    const oldRate = olderCount / older.length;
    const newRate = recentCount / recent.length;
    return { ...s, recentCount, olderCount, oldRate, newRate, mag: Math.abs(Math.round((newRate - oldRate) * 100)) };
  })
    .filter((m) => (m.oldRate > 0 || m.newRate > 0) && m.mag >= TREND_MIN_CHANGE_PP)
    .sort((a, b) => b.mag - a.mag)
    .slice(0, 2);

  if (moves.length === 0) {
    return {
      kind: 'trend',
      headline: `Nos seus registros, o comportamento ${art === 'a' ? 'da' : 'do'} ${dogName} se manteve estável.`,
      support: '',
      window,
    };
  }

  const lead = moves.map((m) => `${m.newRate < m.oldRate ? 'menos' : 'mais'} ${m.noun}`).join(' e ');
  const headline = `Nos seus registros, ${artWord} ${dogName} apareceu com ${lead}.`;

  // Dado cru, com denominador, para o tutor conferir — em vez de um % que parece medido.
  const raw = moves
    .map((m) => `${m.noun} em ${m.recentCount} dos ${recent.length} check-ins recentes, contra ${m.olderCount} dos ${older.length} anteriores`)
    .join('; ');
  const support = raw.charAt(0).toUpperCase() + raw.slice(1) + '.';

  return { kind: 'trend', headline, support, window };
}
