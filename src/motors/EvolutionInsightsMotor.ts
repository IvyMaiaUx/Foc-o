import { EvolutionSummary, EvolutionRepository } from '../repositories/EvolutionRepository';
import { CheckinData } from '../repositories/CheckinRepository';
import { TRAINING_TEMPLATES } from '../lib/trainingTemplates';
import { toLocalDateKey } from '../lib/dateKeys';

export interface WeeklyChartPoint {
  label: string;
  value: number;
}

export interface ChartDayDetail {
  dayLabel: string;
  date: string;
  hasCheckin: boolean;
  trainings: Array<{ title: string; durationMinutes?: number; feedback?: string }>;
}

export interface EvolutionSmartReading {
  headline: string;
  body: string;
  evidence: string[];
  attention: string;
  recommendation: string;
  consistencyLabel: string;
  hasEnoughData: boolean;
  /** Score 0-100 da evolução geral (antes calculado internamente, agora exposto). */
  score: number;
}

export interface EvolutionAchievement {
  id: string;
  title: string;
  description: string;
  context: string;
  unlocked: boolean;
  priority: number;
}

export interface SkillProgress {
  skill: string;
  label: string;
  completions: number;
  total: number;
  pct: number;
}

export interface EmotionalTrend {
  label: string;
  direction: 'up' | 'down';
  change: number;
  isGood: boolean;
}

export interface TimelineEvent {
  type: 'checkin' | 'training';
  label: string;
  dayLabel: string;
  daysAgo: number;
}

export interface StatusItem {
  label: string;
  status: 'green' | 'yellow';
}

export interface EvolutionInsights {
  chartData: WeeklyChartPoint[];
  chartDayDetails: ChartDayDetail[];
  chartTitle: string;
  chartSubtitle: string;
  journeyInsight: string;
  smartReading: EvolutionSmartReading;
  achievements: EvolutionAchievement[];
  featuredAchievement: EvolutionAchievement | null;
  badge: { title: string; description: string; opacity: string } | null;
  isEmpty: boolean;
  totalCheckins: number;
  statusItems: StatusItem[];
  skillProgress: SkillProgress[];
  emotionalTrends: EmotionalTrend[];
  timeline: TimelineEvent[];
  /** Score 0-100 de evolução geral, exibido em destaque no topo. */
  evolutionScore: number;
  /** Variação do score da última semana vs a anterior (pode ser negativa). */
  scoreDelta: number;
  /** Rótulo qualitativo do score (ex.: "Excelente consistência"). */
  scoreLabel: string;
  /** Dias desde a última atividade (check-in OU treino). Alimenta o card de "retomar". */
  daysSinceLastActivity: number;
}

// Rótulos das 7 tags canônicas de comportamento (evolução por habilidade).
const SKILL_LABELS: Record<string, string> = {
  calma: 'Calma',
  foco: 'Foco',
  obediencia: 'Obediência',
  social: 'Socialização',
  rotina: 'Rotina',
  passeio: 'Passeio',
  convivencia: 'Convivência',
};

export class EvolutionInsightsMotor {
  static generateInsights(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: any[]
  ): EvolutionInsights {
    const totalRecords = checkins.length + trainingLogs.length;
    const smartReading = this.generateSmartReading(summary, checkins, trainingLogs);
    const achievements = this.generateAchievements(summary, checkins, trainingLogs, smartReading);
    const featuredAchievement = achievements.find((a) => a.unlocked) || null;

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const chartData: WeeklyChartPoint[] = [];
    const chartDayDetails: ChartDayDetail[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayMidnight - i * oneDay);
      const dateKey = toLocalDateKey(d);
      chartData.push({ label: days[d.getDay()], value: 0 });
      chartDayDetails.push({
        dayLabel: i === 0 ? 'Hoje' : i === 1 ? 'Ontem' : days[d.getDay()],
        date: dateKey,
        hasCheckin: false,
        trainings: [],
      });
    }

    checkins.forEach((checkin) => {
      if (!checkin?.date) return;
      const [year, month, day] = checkin.date.split('-');
      const checkinDate = new Date(Number(year), Number(month) - 1, Number(day));
      const diffDays = Math.floor((todayMidnight - checkinDate.getTime()) / oneDay);
      if (diffDays >= 0 && diffDays < 7) {
        chartData[6 - diffDays].value += 0.5;
        chartDayDetails[6 - diffDays].hasCheckin = true;
      }
    });

    trainingLogs.forEach((log) => {
      if (!log.completedAt) return;
      const logDate = new Date(log.completedAt);
      const logMidnight = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();
      const diffDays = Math.floor((todayMidnight - logMidnight) / oneDay);
      if (diffDays >= 0 && diffDays < 7) {
        chartData[6 - diffDays].value += log.feedback === 'failed' ? 0.25 : 1;
        chartDayDetails[6 - diffDays].trainings.push({
          title: log.title || 'Treino',
          durationMinutes: log.durationMinutes,
          feedback: log.feedback,
        });
      }
    });

    chartData.forEach((point) => {
      point.value = Math.min(100, Math.round((point.value / 3) * 100));
    });

    const statusItems = this.generateStatusItems(summary, checkins, trainingLogs);
    const skillProgress = this.generateSkillProgress(trainingLogs);
    const emotionalTrends = this.generateEmotionalTrends(checkins);
    const timeline = this.generateTimeline(checkins, trainingLogs, todayMidnight, oneDay, days);

    // Variação do score: últimos 7 dias vs os 7 dias anteriores.
    const thisWeekStart = todayMidnight - 6 * oneDay;
    const prevWeekStart = todayMidnight - 13 * oneDay;
    const checkinMs = (ck: CheckinData): number => {
      const [y, m, d] = (ck.date || '').split('-').map(Number);
      return y ? new Date(y, m - 1, d).getTime() : 0;
    };
    const thisWeekLogs = trainingLogs.filter((l) => l.completedAt && l.completedAt >= thisWeekStart);
    const prevWeekLogs = trainingLogs.filter((l) => l.completedAt && l.completedAt >= prevWeekStart && l.completedAt < thisWeekStart);
    const thisWeekCheckins = checkins.filter((c) => checkinMs(c) >= thisWeekStart);
    const prevWeekCheckins = checkins.filter((c) => { const ms = checkinMs(c); return ms >= prevWeekStart && ms < thisWeekStart; });
    const scoreDelta = this.weeklyScore(thisWeekCheckins, thisWeekLogs) - this.weeklyScore(prevWeekCheckins, prevWeekLogs);

    // Recência: o Score e a leitura "esfriam" quando o tutor fica dias sem registrar.
    const lastActivityMs = this.lastActivityMs(summary, checkins, trainingLogs);
    const daysSinceLastActivity = lastActivityMs > 0 ? Math.max(0, Math.floor((todayMidnight - lastActivityMs) / oneDay)) : 999;
    const recencyFactor = this.recencyFactor(daysSinceLastActivity);
    const evolutionScore = Math.round(smartReading.score * recencyFactor);
    const scoreLabel = this.scoreLabel(evolutionScore, daysSinceLastActivity);

    // Narrativa honesta quando faz tempo sem registro (evita "tudo consistente" com dados velhos).
    if (smartReading.hasEnoughData && daysSinceLastActivity >= 7) {
      smartReading.headline = 'Faz um tempo desde o último registro.';
      smartReading.recommendation = 'Retome com um check-in rápido ou um treino curto — assim a leitura da evolução volta a refletir o momento atual do seu cão.';
    }

    const base = {
      chartData,
      chartDayDetails,
      smartReading,
      achievements,
      featuredAchievement,
      statusItems,
      skillProgress,
      emotionalTrends,
      timeline,
      totalCheckins: checkins.length,
      evolutionScore,
      scoreDelta,
      scoreLabel,
      daysSinceLastActivity,
    };

    if (totalRecords === 0) {
      return {
        ...base,
        chartTitle: 'Atividade da Semana',
        chartSubtitle: 'O gráfico ganhará vida com os primeiros registros.',
        journeyInsight: 'Ainda não há dados suficientes. Complete o primeiro treino ou check-in para começar.',
        badge: null,
        isEmpty: true,
      };
    }

    if (totalRecords <= 2) {
      return {
        ...base,
        chartData: chartData,
        chartTitle: 'Atividade da Semana',
        chartSubtitle: 'Estamos conhecendo a rotina',
        journeyInsight: 'Os registros ainda são iniciais, mas já ajudam a personalizar o plano.',
        badge: {
          title: featuredAchievement?.title || 'Primeiros passos',
          description: featuredAchievement?.description || 'A jornada de vocês acabou de começar.',
          opacity: 'opacity-100',
        },
        isEmpty: false,
      };
    }

    return {
      ...base,
      chartTitle: 'Consistência da Semana',
      chartSubtitle: 'Acompanhamento contínuo',
      journeyInsight: smartReading.headline,
      badge: {
        title: featuredAchievement?.title || 'Foco constante',
        description: featuredAchievement?.description || 'A rotina está criando base para progresso real.',
        opacity: 'opacity-100',
      },
      isEmpty: false,
    };
  }

  static generateStatusItems(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: any[]
  ): StatusItem[] {
    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - 6 * 24 * 60 * 60 * 1000;
    const ckMs = (c: CheckinData): number => {
      const [y, m, d] = (c.date || '').split('-').map(Number);
      return y ? new Date(y, m - 1, d).getTime() : 0;
    };
    // Janela real dos últimos 7 dias — para que os rótulos "esta semana" sejam honestos.
    const weekCheckins = checkins.filter((c) => ckMs(c) >= weekStart);
    const weekLogs = trainingLogs.filter((l) => l.completedAt && l.completedAt >= weekStart);
    const activeDaysWeek = this.countActiveDays(weekCheckins, weekLogs);
    const streak = EvolutionRepository.liveStreak(summary);
    const hardRatio =
      weekLogs.length > 0
        ? weekLogs.filter((l) => l.feedback === 'failed' || l.feedback === 'hard').length / weekLogs.length
        : 0;

    return [
      {
        label:
          activeDaysWeek >= 5
            ? 'Excelente consistência esta semana'
            : activeDaysWeek >= 3
              ? 'Boa frequência esta semana'
              : activeDaysWeek >= 1
                ? 'Comece a criar ritmo esta semana'
                : 'Sem registros esta semana ainda',
        status: activeDaysWeek >= 3 ? 'green' : 'yellow',
      },
      {
        label:
          weekCheckins.length >= 5
            ? 'Check-ins completos esta semana'
            : weekCheckins.length >= 3
              ? 'Bons check-ins esta semana'
              : weekCheckins.length >= 1
                ? 'Poucos check-ins esta semana'
                : 'Nenhum check-in esta semana',
        status: weekCheckins.length >= 3 ? 'green' : 'yellow',
      },
      {
        label:
          weekLogs.length === 0
            ? 'Nenhum treino esta semana'
            : hardRatio < 0.3
              ? 'Treinos bem assimilados'
              : 'Alguns treinos pedem revisão',
        status: weekLogs.length > 0 && hardRatio < 0.3 ? 'green' : 'yellow',
      },
      {
        label:
          streak >= 7
            ? `${streak} dias de sequência 🔥`
            : streak >= 3
              ? `${streak} dias de sequência`
              : streak > 0
                ? 'Sequência iniciada'
                : 'Inicie uma sequência hoje',
        status: streak >= 3 ? 'green' : 'yellow',
      },
    ];
  }

  static generateSkillProgress(trainingLogs: any[]): SkillProgress[] {
    const counts: Record<string, { done: number; total: number }> = {};

    for (const log of trainingLogs) {
      const template = log.trainingId ? TRAINING_TEMPLATES[log.trainingId] : null;
      if (!template) continue;
      for (const tag of template.objectiveTags || []) {
        if (!SKILL_LABELS[tag]) continue;
        if (!counts[tag]) counts[tag] = { done: 0, total: 0 };
        counts[tag].total++;
        if (log.feedback !== 'failed') counts[tag].done++;
      }
    }

    return Object.entries(counts)
      .map(([skill, { done, total }]) => ({
        skill,
        label: SKILL_LABELS[skill],
        completions: done,
        total,
        pct: Math.round((done / total) * 100),
      }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5);
  }

  static generateEmotionalTrends(checkins: CheckinData[]): EmotionalTrend[] {
    if (checkins.length < 4) return [];

    const half = Math.floor(checkins.length / 2);
    // checkins sorted newest-first; older half = slice(half)
    const older = checkins.slice(half);
    const recent = checkins.slice(0, half);

    const SIGNALS: Array<{ key: keyof NonNullable<CheckinData['behaviors']>; label: string; goodDir: 'down' | 'up' }> = [
      { key: 'barked', label: 'Latidos', goodDir: 'down' },
      { key: 'pulledLeash', label: 'Puxar guia', goodDir: 'down' },
      { key: 'reactivity', label: 'Reatividade', goodDir: 'down' },
      { key: 'exitAgitation', label: 'Agitação', goodDir: 'down' },
      { key: 'peeWrongPlace', label: 'Xixi em casa', goodDir: 'down' },
    ];

    const trends: EmotionalTrend[] = [];

    for (const { key, label, goodDir } of SIGNALS) {
      const oldRate = older.filter((c) => c.behaviors?.[key]).length / older.length;
      const newRate = recent.filter((c) => c.behaviors?.[key]).length / recent.length;
      if (oldRate === 0 && newRate === 0) continue;
      const change = Math.abs(Math.round((newRate - oldRate) * 100));
      if (change < 10) continue; // only show meaningful changes
      const direction: 'up' | 'down' = newRate > oldRate ? 'up' : 'down';
      trends.push({ label, direction, change, isGood: direction === goodDir });
    }

    return trends.slice(0, 4);
  }

  static generateTimeline(
    checkins: CheckinData[],
    trainingLogs: any[],
    todayMidnight: number,
    oneDay: number,
    days: string[]
  ): TimelineEvent[] {
    const events: Array<{ timestamp: number; type: 'checkin' | 'training'; label: string }> = [];

    for (const checkin of checkins.slice(0, 14)) {
      if (!checkin.date) continue;
      const [y, m, d] = checkin.date.split('-').map(Number);
      events.push({ timestamp: new Date(y, m - 1, d).getTime(), type: 'checkin', label: 'Check-in registrado' });
    }

    for (const log of trainingLogs.slice(0, 14)) {
      if (!log.completedAt) continue;
      events.push({ timestamp: log.completedAt, type: 'training', label: log.title || 'Treino concluído' });
    }

    events.sort((a, b) => b.timestamp - a.timestamp);

    return events.slice(0, 8).map((e) => {
      const date = new Date(e.timestamp);
      const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const daysAgo = Math.round((todayMidnight - dateMidnight) / oneDay);
      const dayLabel = daysAgo === 0 ? 'Hoje' : daysAgo === 1 ? 'Ontem' : days[date.getDay()];
      return { type: e.type, label: e.label, dayLabel, daysAgo };
    });
  }

  private static generateAchievements(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: any[],
    smartReading: EvolutionSmartReading
  ): EvolutionAchievement[] {
    const totalSessions = Math.max(summary?.totalSessions || 0, trainingLogs.length);
    const activeDays = Math.max(summary?.activeDays || 0, this.countActiveDays(checkins, trainingLogs));
    const streak = summary?.streak || 0;
    const recentCheckins = checkins.length;
    const recentTrainings = trainingLogs.length;
    const hasGoodRecentConsistency =
      smartReading.hasEnoughData && this.countActiveDays(checkins, trainingLogs) >= 4;

    const achievements: EvolutionAchievement[] = [
      {
        id: 'first_step',
        title: 'Primeiro registro',
        description: 'O histórico de evolução começou a ser construído.',
        context: 'Base inicial',
        unlocked: totalSessions >= 1 || recentCheckins >= 1,
        priority: 10,
      },
      {
        id: 'seven_trainings',
        title: '7 treinos concluídos',
        description: 'A repetição já cria uma base mais sólida para os próximos exercícios.',
        context: 'Treino',
        unlocked: totalSessions >= 7,
        priority: 40,
      },
      {
        id: 'thirty_trainings',
        title: '30 treinos concluídos',
        description: 'O histórico acumulado permite leituras mais úteis sobre evolução e consistência.',
        context: 'Treino',
        unlocked: totalSessions >= 30,
        priority: 80,
      },
      {
        id: 'three_day_streak',
        title: '3 dias de sequência',
        description: 'A rotina começou a ganhar previsibilidade.',
        context: 'Consistência',
        unlocked: streak >= 3,
        priority: 30,
      },
      {
        id: 'seven_day_streak',
        title: '7 dias de sequência',
        description: 'Uma semana de constância melhora a leitura do comportamento e da rotina.',
        context: 'Consistência',
        unlocked: streak >= 7,
        priority: 70,
      },
      {
        id: 'thirty_active_days',
        title: '30 dias acompanhados',
        description: 'O Focão já tem um histórico relevante para interpretar a jornada do cão.',
        context: 'Histórico',
        unlocked: activeDays >= 30,
        priority: 90,
      },
      {
        id: 'weekly_consistency',
        title: 'Semana consistente',
        description: 'Os registros recentes mostram ritmo suficiente para gerar recomendações melhores.',
        context: 'Semana atual',
        unlocked: hasGoodRecentConsistency,
        priority: 60,
      },
      {
        id: 'complete_week',
        title: 'Semana completa',
        description: 'Sete dias com atividade criam uma leitura mais precisa da rotina.',
        context: 'Semana atual',
        unlocked: this.countActiveDays(checkins, trainingLogs) >= 7,
        priority: 75,
      },
      {
        id: 'recent_training_rhythm',
        title: 'Ritmo de treino ativo',
        description: 'Os últimos registros mostram boa presença nos treinos.',
        context: 'Treino',
        unlocked: recentTrainings >= 4,
        priority: 55,
      },
    ];

    return achievements.filter((a) => a.unlocked).sort((a, b) => b.priority - a.priority);
  }

  private static generateSmartReading(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: any[]
  ): EvolutionSmartReading {
    const totalTrainings = trainingLogs.length;
    const totalCheckins = checkins.length;
    const activeDays = this.countActiveDays(checkins, trainingLogs);
    const hardTrainings = trainingLogs.filter(
      (log) => log.feedback === 'failed' || log.feedback === 'hard'
    ).length;
    const positiveTrainings = trainingLogs.filter(
      (log) => log.feedback === 'easy' || log.feedback === 'medium'
    ).length;
    const behaviorSignals = checkins.filter((checkin) => {
      const behavior = `${checkin.comportamento || ''}`.toLowerCase();
      return (
        behavior.includes('agitado') ||
        behavior.includes('ansioso') ||
        behavior.includes('destrutivo') ||
        behavior.includes('latido') ||
        behavior.includes('medo')
      );
    }).length;

    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Math.min(totalTrainings, 5) * 10 +
            Math.min(totalCheckins, 5) * 7 +
            Math.min(activeDays, 7) * 5 +
            Math.min(summary?.streak || 0, 7) * 2 -
            hardTrainings * 5 -
            behaviorSignals * 3
        )
      )
    );

    const hasEnoughData = totalTrainings + totalCheckins >= 3;
    const consistencyLabel =
      score >= 75
        ? 'Excelente consistência'
        : score >= 55
          ? 'Boa consistência'
          : score >= 35
            ? 'Progresso em construção'
            : 'Leitura inicial';

    if (!hasEnoughData) {
      return {
        headline: 'A leitura ainda está em construção.',
        body: 'O Focão precisa de mais alguns treinos e check-ins para interpretar a evolução com segurança.',
        evidence: [
          `${totalTrainings} ${totalTrainings === 1 ? 'treino registrado' : 'treinos registrados'}`,
          `${totalCheckins} ${totalCheckins === 1 ? 'check-in registrado' : 'check-ins registrados'}`,
          `${activeDays} ${activeDays === 1 ? 'dia ativo' : 'dias ativos'}`,
        ],
        attention: 'Com poucos registros, qualquer conclusão ainda pode oscilar bastante.',
        recommendation:
          'Próximo foco: concluir o treino do dia e registrar o check-in para melhorar a precisão da leitura.',
        consistencyLabel,
        hasEnoughData: false,
        score,
      };
    }

    // Headlines descrevem a ATIVIDADE registrada (fato), não "evolução" (juízo que
    // o dado não sustenta). Filtro: o dado sustenta a afirmação, ou só a acompanha?
    const headline =
      score >= 75
        ? 'Uma semana com bastante presença de vocês.'
        : score >= 55
          ? 'Uma semana com atividade em vários dias.'
          : score >= 35
            ? 'Uma semana mais tranquila de registros.'
            : 'Poucos registros nesta semana — acontece.';

    const body =
      totalTrainings === 0
        ? 'Esta semana teve check-ins, mas nenhum treino registrado.'
        : positiveTrainings >= hardTrainings
          ? 'Os treinos desta semana foram concluídos.'
          : 'Alguns treinos foram marcados como difíceis. Vale repetir em ambiente mais simples antes de avançar.';

    const attention =
      behaviorSignals > 0
        ? 'Os check-ins registraram alguns incidentes (agitação, ansiedade ou reatividade). Vale observar se aparecem depois de mudanças na rotina.'
        : activeDays < 4
          ? 'Foram poucos dias com registro nesta semana.'
          : 'Sem ponto de atenção claro nos registros desta semana.';

    const recommendation =
      behaviorSignals > 0
        ? 'Próximo foco: exercícios curtos de calma e previsibilidade antes de aumentar a dificuldade.'
        : hardTrainings > 0
          ? 'Próximo foco: repetir os treinos mais difíceis em ambientes mais simples antes de avançar.'
          : 'Sem um ajuste específico a sugerir com os registros desta semana.';

    return {
      headline,
      body,
      evidence: [
        `${totalTrainings} ${totalTrainings === 1 ? 'treino concluído' : 'treinos concluídos'} nos últimos registros`,
        `${totalCheckins} ${totalCheckins === 1 ? 'check-in analisado' : 'check-ins analisados'}`,
        `${activeDays} ${activeDays === 1 ? 'dia com atividade' : 'dias com atividade'} na semana`,
      ],
      attention,
      recommendation,
      consistencyLabel,
      hasEnoughData,
      score,
    };
  }

  /**
   * Score 0-100 de uma janela de registros (sem o termo de sequência, que não é
   * conceito semanal). Usado para calcular a variação "esta semana vs anterior".
   */
  private static weeklyScore(checkins: CheckinData[], trainingLogs: any[]): number {
    const t = trainingLogs.length;
    const c = checkins.length;
    const activeDays = this.countActiveDays(checkins, trainingLogs);
    const hard = trainingLogs.filter((l) => l.feedback === 'failed' || l.feedback === 'hard').length;
    const behavior = checkins.filter((ck) => {
      const b = `${ck.comportamento || ''}`.toLowerCase();
      return (
        b.includes('agitado') || b.includes('ansioso') || b.includes('destrutivo') ||
        b.includes('latido') || b.includes('medo')
      );
    }).length;
    return Math.max(
      0,
      Math.min(100, Math.round(Math.min(t, 5) * 10 + Math.min(c, 5) * 7 + Math.min(activeDays, 7) * 5 - hard * 5 - behavior * 3))
    );
  }

  /** Timestamp (ms) da atividade mais recente: check-in OU treino. */
  private static lastActivityMs(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: any[]
  ): number {
    let ms = 0;
    for (const c of checkins) {
      const [y, m, d] = (c.date || '').split('-').map(Number);
      if (y) ms = Math.max(ms, new Date(y, m - 1, d).getTime());
    }
    for (const l of trainingLogs) {
      if (l.completedAt) ms = Math.max(ms, l.completedAt);
    }
    return Math.max(ms, summary?.lastCheckinAt || 0, summary?.lastTrainedAt || 0);
  }

  /** Fator de recência do Score: 1.0 até 3 dias sem atividade, decai até 0.35 aos 21+ dias. */
  private static recencyFactor(daysSince: number): number {
    if (daysSince <= 3) return 1;
    if (daysSince >= 21) return 0.35;
    const t = (daysSince - 3) / 18; // 0..1 entre 3 e 21 dias
    return 1 - t * 0.65;
  }

  private static scoreLabel(score: number, daysSince: number): string {
    if (daysSince >= 10) return 'Leitura esfriando — retome os registros';
    if (score >= 75) return 'Excelente consistência';
    if (score >= 55) return 'Boa consistência';
    if (score >= 35) return 'Progresso em construção';
    return 'Leitura inicial';
  }

  private static countActiveDays(checkins: CheckinData[], trainingLogs: any[]): number {
    const dates = new Set<string>();
    checkins.forEach((checkin) => { if (checkin.date) dates.add(checkin.date); });
    trainingLogs.forEach((log) => { if (log.completedAt) dates.add(toLocalDateKey(new Date(log.completedAt))); });
    return dates.size;
  }
}
