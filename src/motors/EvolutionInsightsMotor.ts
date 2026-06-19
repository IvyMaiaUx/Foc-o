import { EvolutionSummary } from '../repositories/EvolutionRepository';
import { CheckinData } from '../repositories/CheckinRepository';
import { toLocalDateKey } from '../lib/dateKeys';

export interface WeeklyChartPoint {
  label: string;
  value: number;
}

export interface EvolutionSmartReading {
  headline: string;
  body: string;
  evidence: string[];
  attention: string;
  recommendation: string;
  consistencyLabel: string;
  hasEnoughData: boolean;
}

export interface EvolutionAchievement {
  id: string;
  title: string;
  description: string;
  context: string;
  unlocked: boolean;
  priority: number;
}

export interface EvolutionInsights {
  chartData: WeeklyChartPoint[];
  chartTitle: string;
  chartSubtitle: string;
  journeyInsight: string;
  smartReading: EvolutionSmartReading;
  achievements: EvolutionAchievement[];
  featuredAchievement: EvolutionAchievement | null;
  badge: {
    title: string;
    description: string;
    opacity: string;
  } | null;
  isEmpty: boolean;
}

export class EvolutionInsightsMotor {
  static generateInsights(summary: EvolutionSummary | null, checkins: CheckinData[], trainingLogs: any[]): EvolutionInsights {
    const totalRecords = checkins.length + trainingLogs.length;
    const smartReading = this.generateSmartReading(summary, checkins, trainingLogs);
    const achievements = this.generateAchievements(summary, checkins, trainingLogs, smartReading);
    const featuredAchievement = achievements.find((achievement) => achievement.unlocked) || null;

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    const chartData: WeeklyChartPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      chartData.push({ label: days[d.getDay()], value: 0 });
    }

    const oneDay = 24 * 60 * 60 * 1000;
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    checkins.forEach((checkin) => {
      if (!checkin?.date) return;
      const [year, month, day] = checkin.date.split('-');
      const checkinDate = new Date(Number(year), Number(month) - 1, Number(day));
      const diffDays = Math.floor((todayMidnight - checkinDate.getTime()) / oneDay);

      if (diffDays >= 0 && diffDays < 7) {
        chartData[6 - diffDays].value += 0.5;
      }
    });

    trainingLogs.forEach((log) => {
      if (!log.completedAt) return;
      const logDate = new Date(log.completedAt);
      const logMidnight = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();
      const diffDays = Math.floor((todayMidnight - logMidnight) / oneDay);

      if (diffDays >= 0 && diffDays < 7) {
        chartData[6 - diffDays].value += log.feedback === 'failed' ? 0.25 : 1;
      }
    });

    chartData.forEach((point) => {
      point.value = Math.min(100, Math.round((point.value / 3) * 100));
    });

    if (totalRecords === 0) {
      return {
        chartData: chartData.map((point) => ({ ...point, value: 0 })),
        chartTitle: 'Atividade da Semana',
        chartSubtitle: 'O gráfico ganhará vida com os primeiros registros.',
        journeyInsight: 'Ainda não há dados suficientes para mostrar evolução. Complete o primeiro treino ou check-in para começar.',
        smartReading,
        achievements,
        featuredAchievement,
        badge: null,
        isEmpty: true
      };
    }

    if (totalRecords <= 2) {
      return {
        chartData,
        chartTitle: 'Atividade da Semana',
        chartSubtitle: 'Estamos conhecendo a rotina',
        journeyInsight: 'Os registros ainda são iniciais, mas já ajudam a personalizar o plano.',
        smartReading,
        achievements,
        featuredAchievement,
        badge: {
          title: featuredAchievement?.title || 'Primeiros passos',
          description: featuredAchievement?.description || 'A jornada de vocês acabou de começar.',
          opacity: 'opacity-100'
        },
        isEmpty: false
      };
    }

    if (totalRecords <= 4) {
      return {
        chartData,
        chartTitle: 'Consistência Diária',
        chartSubtitle: 'Vocês estão ganhando ritmo',
        journeyInsight: 'A rotina está começando a ganhar consistência. O foco agora é manter regularidade.',
        smartReading,
        achievements,
        featuredAchievement,
        badge: {
          title: featuredAchievement?.title || 'Ganhando ritmo',
          description: featuredAchievement?.description || 'Boa frequência nos registros.',
          opacity: 'opacity-100'
        },
        isEmpty: false
      };
    }

    return {
      chartData,
      chartTitle: 'Consistência da Semana',
      chartSubtitle: 'Acompanhamento constante',
      journeyInsight: 'Esta semana teve ritmo contínuo de leituras e treinos, ajudando o plano a ficar mais preciso.',
      smartReading,
      achievements,
      featuredAchievement,
      badge: {
        title: featuredAchievement?.title || 'Foco constante',
        description: featuredAchievement?.description || 'A rotina está criando base para progresso real.',
        opacity: 'opacity-100'
      },
      isEmpty: false
    };
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
    const hasGoodRecentConsistency = smartReading.hasEnoughData && this.countActiveDays(checkins, trainingLogs) >= 4;

    const achievements: EvolutionAchievement[] = [
      {
        id: 'first_step',
        title: 'Primeiro registro',
        description: 'O histórico de evolução começou a ser construído.',
        context: 'Base inicial',
        unlocked: totalSessions >= 1 || recentCheckins >= 1,
        priority: 10
      },
      {
        id: 'seven_trainings',
        title: '7 treinos concluídos',
        description: 'A repetição já cria uma base mais sólida para os próximos exercícios.',
        context: 'Treino',
        unlocked: totalSessions >= 7,
        priority: 40
      },
      {
        id: 'thirty_trainings',
        title: '30 treinos concluídos',
        description: 'O histórico acumulado permite leituras mais úteis sobre evolução e consistência.',
        context: 'Treino',
        unlocked: totalSessions >= 30,
        priority: 80
      },
      {
        id: 'three_day_streak',
        title: '3 dias de sequência',
        description: 'A rotina começou a ganhar previsibilidade.',
        context: 'Consistência',
        unlocked: streak >= 3,
        priority: 30
      },
      {
        id: 'seven_day_streak',
        title: '7 dias de sequência',
        description: 'Uma semana de constância melhora a leitura do comportamento e da rotina.',
        context: 'Consistência',
        unlocked: streak >= 7,
        priority: 70
      },
      {
        id: 'thirty_active_days',
        title: '30 dias acompanhados',
        description: 'O Focão já tem um histórico relevante para interpretar a jornada do cão.',
        context: 'Histórico',
        unlocked: activeDays >= 30,
        priority: 90
      },
      {
        id: 'weekly_consistency',
        title: 'Semana consistente',
        description: 'Os registros recentes mostram ritmo suficiente para gerar recomendações melhores.',
        context: 'Semana atual',
        unlocked: hasGoodRecentConsistency,
        priority: 60
      },
      {
        id: 'complete_week',
        title: 'Semana completa',
        description: 'Sete dias com atividade criam uma leitura mais precisa da rotina.',
        context: 'Semana atual',
        unlocked: this.countActiveDays(checkins, trainingLogs) >= 7,
        priority: 75
      },
      {
        id: 'recent_training_rhythm',
        title: 'Ritmo de treino ativo',
        description: 'Os últimos registros mostram boa presença nos treinos.',
        context: 'Treino',
        unlocked: recentTrainings >= 4,
        priority: 55
      }
    ];

    return achievements
      .filter((achievement) => achievement.unlocked)
      .sort((a, b) => b.priority - a.priority);
  }

  private static generateSmartReading(
    summary: EvolutionSummary | null,
    checkins: CheckinData[],
    trainingLogs: any[]
  ): EvolutionSmartReading {
    const totalTrainings = trainingLogs.length;
    const totalCheckins = checkins.length;
    const activeDays = this.countActiveDays(checkins, trainingLogs);
    const hardTrainings = trainingLogs.filter((log) => log.feedback === 'failed' || log.feedback === 'hard').length;
    const positiveTrainings = trainingLogs.filter((log) => log.feedback === 'easy' || log.feedback === 'medium').length;
    const behaviorSignals = checkins.filter((checkin) => {
      const behavior = `${checkin.comportamento || ''}`.toLowerCase();
      return behavior.includes('agitado')
        || behavior.includes('ansioso')
        || behavior.includes('destrutivo')
        || behavior.includes('latido')
        || behavior.includes('medo');
    }).length;

    const score = Math.max(0, Math.min(
      100,
      Math.round(
        Math.min(totalTrainings, 5) * 10
        + Math.min(totalCheckins, 5) * 7
        + Math.min(activeDays, 7) * 5
        + Math.min(summary?.streak || 0, 7) * 2
        - hardTrainings * 5
        - behaviorSignals * 3
      )
    ));

    const hasEnoughData = totalTrainings + totalCheckins >= 3;
    const consistencyLabel = score >= 75
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
          `${activeDays} ${activeDays === 1 ? 'dia ativo' : 'dias ativos'}`
        ],
        attention: 'Com poucos registros, qualquer conclusão ainda pode oscilar bastante.',
        recommendation: 'Próximo foco: concluir o treino do dia e registrar o check-in para melhorar a precisão da leitura.',
        consistencyLabel,
        hasEnoughData: false
      };
    }

    const headline = score >= 75
      ? 'A evolução está consistente e bem sustentada.'
      : score >= 55
        ? 'A rotina mostra progresso com boa regularidade.'
        : score >= 35
          ? 'Há sinais de progresso, mas a rotina ainda precisa ganhar ritmo.'
          : 'A jornada começou, mas ainda precisa de mais constância.';

    const body = positiveTrainings >= hardTrainings
      ? 'Os registros indicam que os treinos estão sendo assimilados com estabilidade, principalmente quando a rotina é mantida por mais dias na semana.'
      : 'Os registros mostram que alguns treinos ainda pedem ajuste de ritmo, ambiente ou recompensa para ficarem mais fáceis de repetir.';

    const attention = behaviorSignals > 0
      ? 'Os check-ins trouxeram sinais de agitação, ansiedade ou desconforto. Vale observar se eles aparecem depois de mudanças na rotina.'
      : activeDays < 4
        ? 'A principal oportunidade é aumentar a frequência dos registros, porque isso melhora a personalização do plano.'
        : 'Não há um ponto crítico nos registros recentes. O foco é manter a consistência.';

    const recommendation = behaviorSignals > 0
      ? 'Próximo foco: priorizar exercícios curtos de calma e previsibilidade antes de aumentar a dificuldade.'
      : hardTrainings > 0
        ? 'Próximo foco: repetir os treinos mais difíceis em ambientes mais simples antes de avançar.'
        : 'Próximo foco: manter check-ins e treinos em dias alternados para consolidar o progresso.';

    return {
      headline,
      body,
      evidence: [
        `${totalTrainings} ${totalTrainings === 1 ? 'treino concluído' : 'treinos concluídos'} nos últimos registros`,
        `${totalCheckins} ${totalCheckins === 1 ? 'check-in analisado' : 'check-ins analisados'}`,
        `${activeDays} ${activeDays === 1 ? 'dia com atividade' : 'dias com atividade'} na semana`
      ],
      attention,
      recommendation,
      consistencyLabel,
      hasEnoughData
    };
  }

  private static countActiveDays(checkins: CheckinData[], trainingLogs: any[]): number {
    const dates = new Set<string>();

    checkins.forEach((checkin) => {
      if (checkin.date) dates.add(checkin.date);
    });

    trainingLogs.forEach((log) => {
      if (!log.completedAt) return;
      dates.add(toLocalDateKey(new Date(log.completedAt)));
    });

    return dates.size;
  }
}
