import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { DogProfile } from '@/src/types';

export class DogRepository {
  static async saveDogProfile(userId: string, data: Partial<DogProfile>): Promise<string> {
    const dogRef = doc(db, 'users', userId, 'dog', 'profile');
    const dogSnap = await getDoc(dogRef);
    
    const now = Date.now();
    let dogId = 'profile';

    if (dogSnap.exists()) {
      // UPDATE
      await setDoc(dogRef, {
        ...data,
        updatedAt: now
      }, { merge: true });
    } else {
      // CREATE
      await setDoc(dogRef, {
        ...data,
        updatedAt: now,
        createdAt: data.createdAt || now
      });
    }
    
    return dogId;
  }

  static async getDogProfile(userId: string): Promise<DogProfile | null> {
    const dogRef = doc(db, 'users', userId, 'dog', 'profile');
    const dogSnap = await getDoc(dogRef);
    
    if (!dogSnap.exists()) return null;
    
    const data = dogSnap.data();
    return {
      id: dogSnap.id,
      ...data
    } as DogProfile;
  }
}
