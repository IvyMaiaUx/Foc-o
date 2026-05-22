import { EvolutionSummary } from '../repositories/EvolutionRepository';
import { CheckinData } from '../repositories/CheckinRepository';

export interface WeeklyChartPoint {
  label: string;
  value: number;
}

export interface EvolutionInsights {
  chartData: WeeklyChartPoint[];
  chartTitle: string;
  chartSubtitle: string;
  journeyInsight: string;
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

    // Define days array based on the last 7 days ending today
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = new Date();
    
    // Create an array mapping the last 7 days
    const chartData: WeeklyChartPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const label = days[d.getDay()];
      chartData.push({ label, value: 0 });
    }

    // Assign actual values to the chart if any
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Checkins
    checkins.forEach(c => {
      // Expecting c.date to be like YYYY-MM-DD
      if (c && (c as any).date) {
        const [y, m, d] = (c as any).date.split('-');
        const cDate = new Date(Number(y), Number(m) - 1, Number(d));
        const cDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const diffDays = Math.floor((cDateTime - cDate.getTime()) / oneDay);
        
        if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays;
            if (index >= 0 && index < 7) {
                chartData[index].value += 0.5;
            }
        }
      }
    });

    // Training logs
    trainingLogs.forEach(log => {
      if (log.completedAt) {
        const logDate = new Date(log.completedAt);
        const cDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const lDate = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();
        const diffDays = Math.floor((cDateTime - lDate) / oneDay);

        if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays;
            if (index >= 0 && index < 7) {
                const points = log.feedback === 'failed' ? 0.25 : 1.0;
                chartData[index].value += points;
            }
        }
      }
    });

    const MAX_POINTS = 3.0;
    chartData.forEach(cd => {
      cd.value = Math.min(100, Math.round((cd.value / MAX_POINTS) * 100));
    });

    // Determine state
    if (totalRecords === 0) {
      return {
        chartData: chartData.map(d => ({ ...d, value: 0 })),
        chartTitle: 'Atividade da Semana',
        chartSubtitle: 'O gráfico ganhará vida com seus primeiros registros.',
        journeyInsight: 'Ainda não há dados suficientes para mostrar evolução. Complete seu primeiro treino ou check-in para começar.',
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
        badge: {
          title: 'Primeiros passos',
          description: 'A jornada de vocês acabou de começar.',
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
        journeyInsight: 'A rotina está começando a ganhar consistência. O foco agora é tentar manter a regularidade.',
        badge: {
          title: 'Ganhando ritmo',
          description: 'Ótima frequência nos registros.',
          opacity: 'opacity-100'
        },
        isEmpty: false
      };
    }

    // 5 or more records
    return {
      chartData,
      chartTitle: 'Consistência Excepcional',
      chartSubtitle: 'Acompanhamento constante',
      journeyInsight: 'Excelente consistência. Esta semana teve um ritmo contínuo de leituras e treinos, ajudando a traçar planos cada vez melhores.',
      badge: {
        title: 'Foco Total',
        description: 'Constância impressionante, continuem assim!',
        opacity: 'opacity-100'
      },
      isEmpty: false
    };
  }
}
