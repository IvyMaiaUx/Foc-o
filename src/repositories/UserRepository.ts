import { db } from '@/src/lib/firebase';
import { doc, setDoc, getDoc, getDocFromServer, updateDoc, serverTimestamp, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { auth } from '@/src/lib/firebase';
import { UserProfile, SubscriptionData, SubscriptionPlan } from '@/src/types';

export class UserRepository {
  static async createUserProfile(userId: string, email: string, name: string, referredBy?: string): Promise<void> {
    const now = Date.now();

    const generateReferralCode = (): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `FOC-${code}`;
    };

    // Garante que o código não colide com um já existente. Se a query de unicidade
    // falhar (ex.: regra de segurança não permite listar users), cai no código aleatório
    // (comportamento antigo) pra nunca travar o cadastro.
    const generateUniqueReferralCode = async (): Promise<string> => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateReferralCode();
        try {
          const existing = await getDocs(
            query(collection(db, 'users'), where('referralCode', '==', code), limit(1)),
          );
          if (existing.empty) return code;
        } catch {
          return code;
        }
      }
      // Fallback improvável: sufixo temporal pra garantir unicidade.
      return `${generateReferralCode()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
    };

    const referralCode = await generateUniqueReferralCode();

    const payload: any = {
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
      referralCode,
      referredBy: referredBy || null,
      referralRewardsDays: 0,
      validReferrals: 0,
      referralsLimitReached: false,
      premiumBonusDays: 0,
      lastSeenAt: now,
      lastActivityAt: now,
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

  static async updateBetaSignupDetails(userId: string, data: {
    whatsappPhone?: string;
    registrationSource?: string;
    acquisitionSource?: string;
    betaCohort?: string;
    betaVersion?: string;
  }): Promise<void> {
    const now = Date.now();
    await updateDoc(doc(db, 'users', userId), {
      betaTester: true,
      betaStartedAt: serverTimestamp(),
      onboardingStartedAt: serverTimestamp(),
      registrationSource: data.registrationSource || 'beta-domain',
      acquisitionSource: data.acquisitionSource || 'beta',
      betaCohort: data.betaCohort || 'wave_1',
      betaVersion: data.betaVersion || 'v1',
      ...(data.whatsappPhone && {
        whatsappPhone: data.whatsappPhone,
        whatsappEnabled: true,
        whatsappStatus: 'active',
      }),
      updatedAt: now,
    });
  }

  static async touchPresence(userId: string): Promise<void> {
    const now = Date.now();
    await updateDoc(doc(db, 'users', userId), {
      lastSeenAt: now,
      lastActivityAt: now,
      updatedAt: now,
    });
  }
}
