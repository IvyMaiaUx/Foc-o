import { db } from '@/src/lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, query, getDocs, collection, orderBy, limit } from 'firebase/firestore';

export type CheckinIncident =
  | 'leash_pulling'
  | 'excessive_barking'
  | 'reactivity'
  | 'destruction'
  | 'exit_agitation'
  | 'pee_wrong_place'
  | 'biting';

export type CheckinTrigger =
  | 'doorbell'
  | 'visitors'
  | 'dogs_nearby'
  | 'street_noise'
  | 'being_alone'
  | 'leaving_home'
  | 'routine_change'
  | 'unknown';

export interface CheckinContext {
  walked?: boolean;
  walkDurationMinutes?: number;
  environment?: 'home' | 'calm_street' | 'busy_street' | 'dogs_nearby' | 'new_environment';
  incidents?: CheckinIncident[];
  triggers?: CheckinTrigger[];
  intensity?: 1 | 2 | 3;
  notes?: string;
}

export interface CheckinBehaviors {
  walked: boolean;
  bathroom: boolean;
  barked: boolean;
  pulledLeash: boolean;
  destroyed: boolean;
  reactivity: boolean;
  exitAgitation: boolean;
  peeWrongPlace: boolean;
  biting: boolean;
}

export interface CheckinData {
  energia: string;
  alimentacao: string;
  comportamento: string;
  context?: CheckinContext;
  behaviors?: CheckinBehaviors;
  date?: string;
  createdAt?: any;
  updatedAt?: any;
}

export class CheckinRepository {
  static async saveCheckin(userId: string, dateStr: string, data: CheckinData): Promise<void> {
    const checkinRef = doc(db, 'users', userId, 'checkins', dateStr);
    const incidents = data.context?.incidents ?? [];
    const behaviors: CheckinBehaviors = {
      walked: data.context?.walked === true || data.comportamento === 'Passeio tranquilo',
      bathroom: incidents.includes('pee_wrong_place'),
      barked: incidents.includes('excessive_barking'),
      pulledLeash: incidents.includes('leash_pulling'),
      destroyed: incidents.includes('destruction'),
      reactivity: incidents.includes('reactivity') || data.comportamento === 'Reagiu a outros cães',
      exitAgitation: incidents.includes('exit_agitation') || data.comportamento === 'Ansiedade ao ficar só',
      peeWrongPlace: incidents.includes('pee_wrong_place'),
      biting: incidents.includes('biting'),
    };

    // createdAt só na primeira gravação do dia; um merge posterior não deve
    // sobrescrever o timestamp original (corromperia o histórico).
    const existing = await getDoc(checkinRef);

    await setDoc(checkinRef, {
      ...data,
      behaviors,
      date: dateStr,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
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
