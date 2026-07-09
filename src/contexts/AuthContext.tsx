import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { UserProfile, hasPremiumAccess } from '@/src/types';
import { UserRepository } from '@/src/repositories/UserRepository';
import { PremiumClaimRepository } from '@/src/repositories/PremiumClaimRepository';
import { UserProfileService } from '@/src/services/UserProfileService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isPremium: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userProfile: null,
  isPremium: false,
  isLoading: true,
  refreshProfile: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      try {
        if (user) {
          let profile = await UserRepository.getUserProfile(user.uid);
          if (!profile && user.email) {
            await UserProfileService.ensureProfile(
              user,
              user.displayName || user.email.split('@')[0] || 'Tutor',
              localStorage.getItem('focao_referred_by') || undefined
            );
            profile = await UserRepository.getUserProfile(user.uid);
          }

          if (!hasPremiumAccess(profile)) {
            const claimed = await PremiumClaimRepository.claimForUser(user);
            if (claimed) {
              profile = await UserRepository.getUserProfile(user.uid);
            }
          }
          UserRepository.touchPresence(user.uid).catch((error) => {
            console.warn('[AuthContext] failed to touch presence', error);
          });
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('[AuthContext] failed to load user state', error);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    let lastTouch = 0;
    const touchPresence = () => {
      if (document.visibilityState === 'hidden') return;

      const now = Date.now();
      if (now - lastTouch < 30_000) return;
      lastTouch = now;

      UserRepository.touchPresence(user.uid).catch((error) => {
        console.warn('[AuthContext] failed to refresh presence', error);
      });
    };

    touchPresence();
    const intervalId = window.setInterval(touchPresence, 60_000);
    document.addEventListener('visibilitychange', touchPresence);
    window.addEventListener('focus', touchPresence);
    window.addEventListener('online', touchPresence);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', touchPresence);
      window.removeEventListener('focus', touchPresence);
      window.removeEventListener('online', touchPresence);
    };
  }, [user?.uid]);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        let profile = await UserRepository.getUserProfile(auth.currentUser.uid);
        if (!profile && auth.currentUser.email) {
          await UserProfileService.ensureProfile(
            auth.currentUser,
            auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || 'Tutor',
            localStorage.getItem('focao_referred_by') || undefined
          );
          profile = await UserRepository.getUserProfile(auth.currentUser.uid);
        }
        if (!hasPremiumAccess(profile)) {
          const claimed = await PremiumClaimRepository.claimForUser(auth.currentUser);
          if (claimed) {
            profile = await UserRepository.getUserProfile(auth.currentUser.uid);
          }
        }
        setUserProfile(profile);
      } catch (error) {
        console.error('[AuthContext] failed to refresh profile', error);
      }
    }
  };

  const isPremium = hasPremiumAccess(userProfile);

  return (
    <AuthContext.Provider value={{ user, userProfile, isPremium, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
