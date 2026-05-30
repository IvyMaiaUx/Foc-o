import { db } from '@/src/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { CustomEvent } from '@/src/types';

export class CustomEventRepository {
  static async getEvents(userId: string): Promise<CustomEvent[]> {
    try {
      const colRef = collection(db, 'users', userId, 'customEvents');
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CustomEvent[];
    } catch (err) {
      console.error('Error fetching custom events:', err);
      return [];
    }
  }

  static async createEvent(
    userId: string,
    event: Omit<CustomEvent, 'id' | 'createdAt'>
  ): Promise<string> {
    const colRef = collection(db, 'users', userId, 'customEvents');
    const docRef = await addDoc(colRef, {
      ...event,
      createdAt: Date.now()
    });
    return docRef.id;
  }

  static async deleteEvent(userId: string, eventId: string): Promise<void> {
    const docRef = doc(db, 'users', userId, 'customEvents', eventId);
    await deleteDoc(docRef);
  }

  static async getCompletions(userId: string, dateKey: string): Promise<Record<string, boolean>> {
    try {
      const docRef = doc(db, 'users', userId, 'customEventCompletions', dateKey);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return data.completedIds || {};
      }
      return {};
    } catch (err) {
      console.error('Error fetching completions:', err);
      return {};
    }
  }

  static async toggleCompletion(
    userId: string,
    dateKey: string,
    eventId: string,
    completed: boolean
  ): Promise<void> {
    const docRef = doc(db, 'users', userId, 'customEventCompletions', dateKey);
    await setDoc(docRef, {
      completedIds: {
        [eventId]: completed
      }
    }, { merge: true });
  }
}
