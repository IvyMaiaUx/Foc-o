import { CheckinData } from '@/src/repositories/CheckinRepository';

/**
 * CORTES PROVISÓRIOS — palpites iniciais, NÃO MEDIDOS.
 *
 * Estes números decidem quando o app pode afirmar uma tendência de comportamento a partir
 * dos check-ins. Eles NÃO foram calibrados com dado — são o melhor palpite disponível hoje.
 * Ficam nomeados aqui, num lugar só, exatamente para que a instrumentação do item 3
 * (Metabase + distribuição real de muitos cães) os ENCONTRE e recalibre — não enterrados
 * inline num `if`. Ver a memória focao-metodo-e-pendencias.
 */
export const TREND_MIN_CHECKINS_PER_HALF = 3; // mínimo de check-ins em cada metade — provisório
export const TREND_MIN_DENSITY_RATIO = 0.5;   // metade recente ≥ 50% da densidade da antiga — provisório

/**
 * PROXY GROSSEIRO de "o intervalo de confiança do % não cruza zero". NÃO é o teste de
 * significância — apenas o acompanha. Enquanto for proxy, tudo bem; o que não pode é
 * alguém confundi-lo com a coisa medida. (É a mesma distinção de "registrado" vs "concluído".)
 */
export const TREND_MIN_CHECKINS_FOR_PERCENT = 6; // por metade — provisório

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

export type BehaviorTrend =
  | { kind: 'insufficient'; text: string }
  | { kind: 'trend'; text: string; confidence: string; withPercent: boolean };

function checkinMs(c: CheckinData): number {
  const [y, m, d] = (c.date || '').split('-').map(Number);
  return y ? new Date(y, m - 1, d).getTime() : 0;
}

function spanDays(list: CheckinData[]): number {
  const times = list.map(checkinMs).filter((t) => t > 0);
  if (times.length <= 1) return 1;
  return Math.max(1, (Math.max(...times) - Math.min(...times)) / 86_400_000 + 1);
}

/**
 * A ÚNICA porta para uma conclusão de tendência comportamental.
 *
 * A Guarda 1 (densidade comparável entre as duas metades) está DENTRO desta função —
 * nenhum caminho produz `kind: 'trend'` sem passar por ela. O property test em
 * trendGuards.test.ts trava isso: para qualquer distribuição em que a metade recente é
 * rala demais, o resultado NUNCA é 'trend'. Assim, um branch futuro que tente afirmar
 * tendência pulando a densidade quebra o CI — foi o que teria pego o `?? 'Concluído'`.
 *
 * O sujeito é "nos seus registros", não "o cão": enquanto a Guarda 1 não garante que os
 * registros representam o animal, a frase é honesta sobre o que o TUTOR anotou, e silenciosa
 * sobre o cachorro. A distância entre "nos seus registros latiu menos" e "o cão melhorou" é
 * o viés de amostragem inteiro.
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
    return { kind: 'insufficient', text: 'Ainda não há check-ins suficientes para comparar com o início.' };
  }
  const olderDensity = older.length / spanDays(older);
  const recentDensity = recent.length / spanDays(recent);
  if (recentDensity < olderDensity * TREND_MIN_DENSITY_RATIO) {
    return { kind: 'insufficient', text: 'Poucos registros recentes para comparar com o início.' };
  }

  const moves = SIGNALS.map((s) => {
    const oldRate = older.filter((c) => c.behaviors?.[s.key]).length / older.length;
    const newRate = recent.filter((c) => c.behaviors?.[s.key]).length / recent.length;
    const changePct = Math.round((newRate - oldRate) * 100);
    return { ...s, oldRate, newRate, changePct, mag: Math.abs(changePct) };
  })
    .filter((m) => (m.oldRate > 0 || m.newRate > 0) && m.mag >= 10)
    .sort((a, b) => b.mag - a.mag);

  // Guarda 2: o % só entra quando a amostra o sustenta (proxy de significância).
  const withPercent =
    older.length >= TREND_MIN_CHECKINS_FOR_PERCENT && recent.length >= TREND_MIN_CHECKINS_FOR_PERCENT;

  const artWord = art === 'a' ? 'a' : 'o';

  if (moves.length === 0) {
    return {
      kind: 'trend',
      text: `Nos seus registros, o comportamento ${art === 'a' ? 'da' : 'do'} ${dogName} se manteve estável em relação ao início.`,
      confidence: `Baseado em ${withDate.length} check-ins.`,
      withPercent: false,
    };
  }

  const phrase = (m: (typeof moves)[number]) => {
    const dir = m.newRate < m.oldRate ? 'menos' : 'mais';
    const pct = withPercent ? ` (${m.newRate < m.oldRate ? '↓' : '↑'}${m.mag}%)` : '';
    return `${dir} ${m.noun}${pct}`;
  };

  const lead = moves.slice(0, 2).map(phrase).join(', e ');
  const text = `Nos seus registros, ${artWord} ${dogName} apareceu com ${lead} nas últimas semanas.`;
  const confidence = withPercent
    ? `Tendência com base em ${withDate.length} check-ins.`
    : `Leitura inicial — ${withDate.length} check-ins. O número aparece quando houver mais registros.`;

  return { kind: 'trend', text, confidence, withPercent };
}
