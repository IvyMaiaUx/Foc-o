import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile, SubscriptionData, SubscriptionPlan } from '@/src/types';

export class UserRepository {
  static async createUserProfile(userId: string, email: string, name: string): Promise<void> {
    const now = Date.now();
    
    await setDoc(doc(db, 'users', userId), {
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
    });
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) return null;
    return docSnap.data() as UserProfile;
  }

  static async getSubscription(userId: string): Promise<SubscriptionData | null> {
    const snap = await getDoc(doc(db, 'users', userId));
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
}
