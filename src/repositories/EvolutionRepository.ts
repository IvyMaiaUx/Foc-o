import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { toLocalDateKey } from '@/src/lib/dateKeys';

export interface EvolutionSummary {
  streak: number;
  totalSessions: number;
  activeDays: number;
  averageBehaviorScore: number;
  lastTrainedAt: number | null;
  lastCheckinAt: number | null;
  // Dia local (YYYY-MM-DD) da última atividade (treino OU check-in) que conta pra sequência.
  lastActivityDate?: string | null;
  reportsViewed?: number;
}

// Diferença em dias entre duas chaves de data local 'YYYY-MM-DD'.
function daysBetweenKeys(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd).getTime();
  const to = new Date(ty, tm - 1, td).getTime();
  return Math.round((to - from) / 86400000);
}

export class EvolutionRepository {
  static async initializeSummary(userId: string): Promise<void> {
    const summary: EvolutionSummary = {
      streak: 0,
      totalSessions: 0,
      activeDays: 0,
      averageBehaviorScore: 0,
      lastTrainedAt: null,
      lastCheckinAt: null,
      reportsViewed: 0
    };
    await setDoc(doc(db, 'users', userId, 'evolution', 'summary'), summary);
  }

  static async incrementReportsViewed(userId: string): Promise<void> {
    const summaryRef = doc(db, 'users', userId, 'evolution', 'summary');
    const snap = await getDoc(summaryRef);
    if (!snap.exists()) {
      // If summary doesn't exist yet, initialize it
      await EvolutionRepository.initializeSummary(userId);
    }
    await updateDoc(summaryRef, {
      reportsViewed: increment(1)
    });
  }

  static async getSummary(userId: string): Promise<EvolutionSummary | null> {
    const docSnap = await getDoc(doc(db, 'users', userId, 'evolution', 'summary'));
    if (!docSnap.exists()) return null;
    return docSnap.data() as EvolutionSummary;
  }

  /**
   * Sequência "viva" para EXIBIÇÃO: o streak gravado só vale se a última atividade
   * foi hoje ou ontem. Sem isto, a tela mostra o número antigo (ex.: "5 dias seguidos")
   * mesmo depois do usuário sumir e quebrar a sequência — o reset só acontece na
   * próxima atividade. Aqui zeramos no momento da leitura.
   */
  static liveStreak(summary: EvolutionSummary | null, today: string = toLocalDateKey()): number {
    const stored = summary?.streak || 0;
    if (stored <= 0) return 0;

    let lastKey = summary?.lastActivityDate || null;
    if (!lastKey) {
      // Migração: deriva do estado antigo (maior entre check-in/treino).
      const lastMs = Math.max(summary?.lastCheckinAt || 0, summary?.lastTrainedAt || 0);
      if (lastMs > 0) lastKey = toLocalDateKey(lastMs);
    }
    if (!lastKey) return 0;

    const diff = daysBetweenKeys(lastKey, today);
    // Viva só se a última atividade foi hoje (0) ou ontem (1).
    return diff <= 1 ? stored : 0;
  }

  /**
   * Registra uma atividade (treino OU check-in) e atualiza a sequência por DIA LOCAL.
   * - Mesmo dia: não mexe na sequência nem em activeDays.
   * - Dia seguinte: +1 na sequência.
   * - Buraco (> 1 dia): sequência reinicia em 1.
   * activeDays só incrementa em dia novo.
   */
  private static async recordActivity(
    userId: string,
    kind: 'checkin' | 'training',
    todayKey: string,
  ): Promise<void> {
    const summaryRef = doc(db, 'users', userId, 'evolution', 'summary');
    const snap = await getDoc(summaryRef);
    if (!snap.exists()) return;

    const data = snap.data() as EvolutionSummary;
    const now = Date.now();

    // Último dia de atividade. Migração suave: se ainda não existe lastActivityDate,
    // deriva do maior entre lastCheckinAt/lastTrainedAt pra não zerar a sequência de quem já usava.
    let lastKey = data.lastActivityDate || null;
    if (!lastKey) {
      const lastMs = Math.max(data.lastCheckinAt || 0, data.lastTrainedAt || 0);
      if (lastMs > 0) lastKey = toLocalDateKey(lastMs);
    }

    let newStreak = data.streak || 0;
    let isNewDay = true;
    if (lastKey) {
      const diff = daysBetweenKeys(lastKey, todayKey);
      if (diff <= 0) {
        isNewDay = false; // mesmo dia (ou relógio atrasado) → não conta de novo
      } else if (diff === 1) {
        newStreak += 1;
      } else {
        newStreak = 1; // buraco na sequência
      }
    } else {
      newStreak = 1; // primeira atividade registrada
    }

    const updates: Record<string, unknown> = {
      streak: newStreak,
      lastActivityDate: todayKey,
    };
    if (isNewDay) updates.activeDays = increment(1);
    if (kind === 'checkin') updates.lastCheckinAt = now;
    if (kind === 'training') updates.lastTrainedAt = now;

    await updateDoc(summaryRef, updates);
  }

  static async updateFromCheckin(userId: string, todayKey: string = toLocalDateKey()): Promise<void> {
    await EvolutionRepository.recordActivity(userId, 'checkin', todayKey);
  }

  static async updateFromTraining(userId: string, todayKey: string = toLocalDateKey()): Promise<void> {
    // totalSessions conta toda sessão (mesmo várias no mesmo dia); a sequência é por dia.
    await EvolutionRepository.recordActivity(userId, 'training', todayKey);
    await updateDoc(doc(db, 'users', userId, 'evolution', 'summary'), {
      totalSessions: increment(1),
    });
  }
}
