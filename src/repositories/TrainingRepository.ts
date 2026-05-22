import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { CurrentPlan, TrainingSession } from '@/src/types';

export class TrainingRepository {
  static async saveCurrentPlan(userId: string, plan: CurrentPlan): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'plan', 'current'), plan);
  }

  static async getCurrentPlan(userId: string): Promise<CurrentPlan | null> {
    const docSnap = await getDoc(doc(db, 'users', userId, 'plan', 'current'));
    if (!docSnap.exists()) return null;
    return docSnap.data() as CurrentPlan;
  }

  static async updatePlanProgress(userId: string, newTaskIndex: number): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'plan', 'current'), {
      currentTaskIndex: newTaskIndex
    });
  }

  static async logTraining(userId: string, data: any): Promise<void> {
    const logId = Date.now().toString();
    await setDoc(doc(db, 'users', userId, 'trainingLogs', logId), {
      ...data,
      completedAt: Date.now()
    });
  }

  static async getTrainingLogs(userId: string): Promise<any[]> {
    const logsQuery = query(
      collection(db, 'users', userId, 'trainingLogs'),
      orderBy('completedAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(logsQuery);
    return snap.docs.map((d: any) => d.data());
  }
}
