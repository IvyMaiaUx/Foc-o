import { db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

/**
 * Persiste a conclusão MANUAL das missões diárias no Firestore, por dia,
 * em `users/{uid}/missions/{dateKey}`. Substitui o antigo armazenamento em
 * localStorage (que não sincronizava entre aparelhos).
 *
 * Missões "automáticas" (passeio, treino do dia) NÃO são gravadas aqui —
 * elas são derivadas em tempo real dos dados reais (check-in / trainingLogs)
 * pelo DailyMissionsMotor.autoCompletedIds. Aqui ficam só os toques manuais.
 */
export class MissionsRepository {
  static async getCompletedIds(userId: string, dateKey: string): Promise<string[]> {
    const ref = doc(db, 'users', userId, 'missions', dateKey);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    const ids = (snap.data() as { completedIds?: unknown }).completedIds;
    return Array.isArray(ids) ? (ids as string[]) : [];
  }

  static async completeMission(userId: string, dateKey: string, missionId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'missions', dateKey);
    await setDoc(
      ref,
      {
        completedIds: arrayUnion(missionId),
        date: dateKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  static async uncompleteMission(userId: string, dateKey: string, missionId: string): Promise<void> {
    const ref = doc(db, 'users', userId, 'missions', dateKey);
    await setDoc(
      ref,
      {
        completedIds: arrayRemove(missionId),
        date: dateKey,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
