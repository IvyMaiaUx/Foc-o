import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductConfig } from '../types';

export class AdminSettingsRepository {
  static async getProductConfig(): Promise<ProductConfig | null> {
    const docRef = doc(db, 'adminSettings', 'productConfig');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ProductConfig;
    }
    return null;
  }
}
