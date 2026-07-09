import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { CurrentPlan, TrainingSession } from '@/src/types';
import { sanitizeText, sanitizeTrainingTask } from '@/src/lib/textSanitizer';
import { knownCommandTrainingIds } from '@/src/lib/knownCommandTrainings';

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

function reconcileKnownCommandPlan(plan: CurrentPlan, knownCommands: string[] = []): CurrentPlan {
  const skippedTrainingIds = knownCommandTrainingIds(knownCommands);
  if (skippedTrainingIds.size === 0) return plan;

  const tasks = plan.tasks.filter(task => !skippedTrainingIds.has(task.id));
  const currentTaskIndex = plan.tasks
    .slice(0, Math.min(plan.currentTaskIndex, plan.tasks.length))
    .filter(task => !skippedTrainingIds.has(task.id))
    .length;

  if (tasks.length === plan.tasks.length && currentTaskIndex === plan.currentTaskIndex) {
    return plan;
  }

  return {
    ...plan,
    tasks,
    currentTaskIndex
  };
}

export class TrainingRepository {
  static async saveCurrentPlan(userId: string, plan: CurrentPlan): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'plan', 'current'), sanitizeCurrentPlan(plan));
  }

  static async getCurrentPlan(userId: string): Promise<CurrentPlan | null> {
    const planRef = doc(db, 'users', userId, 'plan', 'current');
    const [planResult, dogResult] = await Promise.allSettled([
      getDoc(planRef),
      getDoc(doc(db, 'users', userId, 'dog', 'profile'))
    ]);

    // The plan is the primary read; only its failure should fail the load.
    if (planResult.status === 'rejected') throw planResult.reason;
    const docSnap = planResult.value;
    if (!docSnap.exists()) return null;

    const plan = sanitizeCurrentPlan(docSnap.data() as CurrentPlan);

    // A dog-profile read failure (offline/permissions) must not block the plan.
    const dogSnap = dogResult.status === 'fulfilled' ? dogResult.value : null;
    const knownCommands = dogSnap?.exists() ? (dogSnap.data().knownCommands || []) : [];
    const reconciledPlan = reconcileKnownCommandPlan(plan, knownCommands);

    if (reconciledPlan.tasks.length !== plan.tasks.length || reconciledPlan.currentTaskIndex !== plan.currentTaskIndex) {
      // Persist the reconciliation, but never let a write failure break the read.
      try {
        await setDoc(planRef, reconciledPlan);
      } catch {
        // ignore: the reconciled plan returned below is already correct in memory
      }
    }

    return reconciledPlan;
  }

  static async updatePlanProgress(userId: string, newTaskIndex: number): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'plan', 'current'), {
      currentTaskIndex: newTaskIndex
    });
  }

  static async logTraining(userId: string, data: any): Promise<void> {
    // Auto-id evita colisão quando dois logs caem no mesmo milissegundo (duplo-toque/revisão),
    // que antes sobrescrevia o log anterior via Date.now() como ID.
    const logRef = doc(collection(db, 'users', userId, 'trainingLogs'));
    await setDoc(logRef, {
      ...sanitizeTrainingLog(data),
      completedAt: Date.now()
    });
  }

  static async getTrainingLogs(userId: string, limitCount = 400): Promise<any[]> {
    // Antes limitado a 20: corrompia contagens semana-vs-semana no relatório e fazia a
    // regeneração de plano "esquecer" treinos concluídos há mais tempo. 400 cobre com folga
    // a janela dos relatórios (14 dias) e o conjunto de treinos distintos concluídos.
    const logsQuery = query(
      collection(db, 'users', userId, 'trainingLogs'),
      orderBy('completedAt', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(logsQuery);
    return snap.docs.map((d: any) => sanitizeTrainingLog(d.data()));
  }
}
