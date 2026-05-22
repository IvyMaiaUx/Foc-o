import { db } from '@/src/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, query, getDocs, collection, orderBy, limit } from 'firebase/firestore';

export interface CheckinData {
  energia: string;
  alimentacao: string;
  comportamento: string;
  date?: string;
  createdAt?: any;
  updatedAt?: any;
}

export class CheckinRepository {
  static async saveCheckin(userId: string, dateStr: string, data: CheckinData): Promise<void> {
    const checkinRef = doc(db, 'users', userId, 'checkins', dateStr);
    await setDoc(checkinRef, {
      ...data,
      date: dateStr,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp() // Set allows merge via rules, but let's be careful with createdAt
    }, { merge: true });
  }

  static async getCheckin(userId: string, dateStr: string): Promise<CheckinData | null> {
    const checkinRef = doc(db, 'users', userId, 'checkins', dateStr);
    const snap = await getDoc(checkinRef);
    if (!snap.exists()) return null;
    return snap.data() as CheckinData;
  }

  static async getRecentCheckins(userId: string, limitCount: number = 7): Promise<CheckinData[]> {
    const q = query(
      collection(db, 'users', userId, 'checkins'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as CheckinData);
  }
}
