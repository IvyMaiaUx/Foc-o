import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { getDefaultPresellConfig, PresellConfig } from '@/src/lib/presellConfig';

export class PresellConfigRepository {
  private static readonly DOC_PATH = 'adminSettings/presellConfig';

  static async getConfig(): Promise<PresellConfig> {
    const fallback = getDefaultPresellConfig();
    const snap = await getDoc(doc(db, this.DOC_PATH));
    if (!snap.exists()) return fallback;

    return {
      ...fallback,
      ...(snap.data() as Partial<PresellConfig>),
    };
  }
}
