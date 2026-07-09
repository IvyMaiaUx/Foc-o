import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

export interface WeeklyReportOverride {
  title: string;
  summary: string;
  recommendation: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export const WeeklyReportOverrideRepository = {
  async get(userId: string): Promise<WeeklyReportOverride | null> {
    const snap = await getDoc(doc(db, 'users', userId, 'adminReports', 'weekly'));
    if (!snap.exists()) return null;
    return snap.data() as WeeklyReportOverride;
  },
};
