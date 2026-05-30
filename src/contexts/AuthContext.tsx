import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { UserProfile, hasPremiumAccess } from '@/src/types';
import { UserRepository } from '@/src/repositories/UserRepository';
import { PremiumClaimRepository } from '@/src/repositories/PremiumClaimRepository';

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
            await UserRepository.createUserProfile(
              user.uid,
              user.email.trim().toLowerCase(),
              user.displayName || user.email.split('@')[0] || 'Tutor'
            );
            profile = await UserRepository.getUserProfile(user.uid);
          }

          if (!hasPremiumAccess(profile)) {
            const claimed = await PremiumClaimRepository.claimForUser(user);
            if (claimed) {
              profile = await UserRepository.getUserProfile(user.uid);
            }
          }
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

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        let profile = await UserRepository.getUserProfile(auth.currentUser.uid);
        if (!profile && auth.currentUser.email) {
          await UserRepository.createUserProfile(
            auth.currentUser.uid,
            auth.currentUser.email.trim().toLowerCase(),
            auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || 'Tutor'
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
