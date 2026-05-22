import { db } from '@/src/lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export interface VaccineData {
  id?: string;
  name: string;
  dateApplied: string;
  nextDose?: string;
  notes?: string;
  createdAt?: number;
}

export class VaccineRepository {
  static async saveVaccine(userId: string, data: VaccineData): Promise<string> {
    const vaccinesRef = collection(db, 'users', userId, 'vaccines');
    const vaccineId = data.id || Date.now().toString();
    
    await setDoc(doc(vaccinesRef, vaccineId), {
      ...data,
      id: vaccineId,
      createdAt: data.createdAt || Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return vaccineId;
  }

  static async getVaccines(userId: string): Promise<VaccineData[]> {
    const vaccinesRef = collection(db, 'users', userId, 'vaccines');
    // For simplicity without composite indexes, we get all and sort in memory
    const snap = await getDocs(vaccinesRef);
    
    const vaccines = snap.docs.map(doc => doc.data() as VaccineData);
    
    // Sort descending by date Applied
    return vaccines.sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
  }
}
