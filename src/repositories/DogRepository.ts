import { db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DogProfile } from '@/src/types';

function dietFromFoodType(foodType?: string): string {
  if (foodType === 'wet') return 'Ração úmida';
  if (foodType === 'natural') return 'Alimentação natural';
  if (foodType === 'mixed') return 'Mista';
  if (foodType === 'dry') return 'Ração seca';
  return '';
}

function mealsLabel(meals?: number): string {
  if (!meals || !Number.isFinite(meals)) return '';
  return meals >= 4 ? '4 ou mais' : `${meals} ${meals === 1 ? 'vez' : 'vezes'}`;
}

function normalizeDogProfile(id: string, data: any): DogProfile {
  const nutrition = data?.nutrition || {};

  return {
    id,
    ...data,
    diet: data?.diet || dietFromFoodType(nutrition.foodType),
    foodBrand: data?.foodBrand || nutrition.foodBrand || '',
    foodLine: data?.foodLine || nutrition.foodLine || '',
    lifeStage: data?.lifeStage || nutrition.foodPhase || '',
    foodVersion: data?.foodVersion || nutrition.foodVersion || '',
    foodQuantity: data?.foodQuantity || (nutrition.portionGrams ? String(nutrition.portionGrams) : ''),
    mealsPerDay: data?.mealsPerDay || mealsLabel(nutrition.mealsPerDay),
    nutrition,
  } as DogProfile;
}

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
    
    return normalizeDogProfile(dogSnap.id, dogSnap.data());
  }
}
