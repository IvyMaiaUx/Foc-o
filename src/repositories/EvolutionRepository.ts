import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

export interface EvolutionSummary {
  streak: number;
  totalSessions: number;
  activeDays: number;
  averageBehaviorScore: number;
  lastTrainedAt: number | null;
  lastCheckinAt: number | null;
  reportsViewed?: number;
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

  static async updateFromCheckin(userId: string): Promise<void> {
    const summaryRef = doc(db, 'users', userId, 'evolution', 'summary');
    const snap = await getDoc(summaryRef);
    if (!snap.exists()) return;
    
    const data = snap.data() as EvolutionSummary;
    const now = Date.now();
    
    // Very basic streak logic: if lastCheckinAt was yesterday, streak + 1.
    // Else if older, streak reset. If today, streak same.
    let newStreak = data.streak || 0;
    if (data.lastCheckinAt) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysSince = Math.floor(now / msPerDay) - Math.floor(data.lastCheckinAt / msPerDay);
      if (daysSince === 1) {
        newStreak += 1;
      } else if (daysSince > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1; // First checkin
    }

    await updateDoc(summaryRef, {
      streak: newStreak,
      activeDays: increment(1),
      lastCheckinAt: now
    });
  }

  static async updateFromTraining(userId: string): Promise<void> {
    const summaryRef = doc(db, 'users', userId, 'evolution', 'summary');
    await updateDoc(summaryRef, {
      totalSessions: increment(1),
      lastTrainedAt: Date.now()
    });
  }
}
