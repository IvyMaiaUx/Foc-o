import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { auth } from '@/src/lib/firebase';
import { UserProfile, SubscriptionData, SubscriptionPlan } from '@/src/types';

export class UserRepository {
  static async createUserProfile(userId: string, email: string, name: string): Promise<void> {
    const now = Date.now();

    const payload = {
      uid: userId,
      email,
      name,
      subscription: {
        plan: 'free',
        status: 'inactive',
        premiumAccess: false,
        createdAt: now,
        updatedAt: now,
      },
      subscriptionTier: 'free',
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now
    };

    // Tenta gravar diretamente
    try {
      await setDoc(doc(db, 'users', userId), payload);
      return;
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        throw error;
      }
      console.warn('[UserRepository] Initial createUserProfile failed with permission-denied. Retrying...');
    }

    // Se falhar com permission-denied, faz retries progressivos com backoff exponencial
    const maxAttempts = 5;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Delay progressivo: 150ms, 300ms, 600ms, 1200ms, 2400ms
        const delay = 75 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));

        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          await currentUser.getIdToken(true);
        }

        await setDoc(doc(db, 'users', userId), payload);
        console.log(`[UserRepository] createUserProfile succeeded on attempt ${attempt}`);
        return;
      } catch (error: any) {
        lastError = error;
        if (error?.code !== 'permission-denied') {
          throw error;
        }
        console.warn(`[UserRepository] createUserProfile attempt ${attempt} failed with permission-denied.`);
      }
    }

    throw lastError || new Error('Failed to create user profile after multiple attempts due to permission-denied.');
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const ref = doc(db, 'users', userId);
    const docSnap = await getDocFromServer(ref).catch(() => getDoc(ref));
    if (!docSnap.exists()) return null;
    return docSnap.data() as UserProfile;
  }

  static async getSubscription(userId: string): Promise<SubscriptionData | null> {
    const ref = doc(db, 'users', userId);
    const snap = await getDocFromServer(ref).catch(() => getDoc(ref));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.subscription) return data.subscription as SubscriptionData;
    
    const tier = data.subscriptionTier ?? 'free';
    const trialEnd = data.trialEndsAt ?? 0;
    const isPremium = tier === 'premium' || (tier === 'trial' && trialEnd > Date.now());
    return {
      plan: (tier === 'past_due' || tier === 'canceled') ? 'premium' : tier as SubscriptionPlan,
      status: tier === 'past_due' ? 'past_due'
            : tier === 'canceled' ? 'canceled'
            : tier === 'trial' ? 'trialing'
            : tier === 'premium' ? 'active'
            : 'inactive',
      premiumAccess: isPremium,
      trialEndsAt: trialEnd || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  static async markOnboardingComplete(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      onboardingComplete: true,
      updatedAt: Date.now()
    });
  }

  static async updateTutorName(userId: string, name: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      name,
      updatedAt: Date.now()
    });
  }
}
