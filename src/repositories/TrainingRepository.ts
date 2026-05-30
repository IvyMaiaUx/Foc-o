import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { CurrentPlan, TrainingSession } from '@/src/types';
import { sanitizeText, sanitizeTrainingTask } from '@/src/lib/textSanitizer';

function sanitizeCurrentPlan(plan: CurrentPlan): CurrentPlan {
  return {
    ...plan,
    focus: sanitizeText(plan.focus),
    tasks: (plan.tasks || []).map(sanitizeTrainingTask)
  };
}

function sanitizeTrainingLog<T extends Record<string, any>>(log: T): T {
  return {
    ...log,
    title: sanitizeText(log.title),
    module: sanitizeText(log.module),
    moduleName: sanitizeText(log.moduleName),
    description: sanitizeText(log.description)
  };
}

export class TrainingRepository {
  static async saveCurrentPlan(userId: string, plan: CurrentPlan): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'plan', 'current'), sanitizeCurrentPlan(plan));
  }

  static async getCurrentPlan(userId: string): Promise<CurrentPlan | null> {
    const docSnap = await getDoc(doc(db, 'users', userId, 'plan', 'current'));
    if (!docSnap.exists()) return null;
    return sanitizeCurrentPlan(docSnap.data() as CurrentPlan);
  }

  static async updatePlanProgress(userId: string, newTaskIndex: number): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'plan', 'current'), {
      currentTaskIndex: newTaskIndex
    });
  }

  static async logTraining(userId: string, data: any): Promise<void> {
    const logId = Date.now().toString();
    await setDoc(doc(db, 'users', userId, 'trainingLogs', logId), {
      ...sanitizeTrainingLog(data),
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
    return snap.docs.map((d: any) => sanitizeTrainingLog(d.data()));
  }
}
