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
      if (user) {
        let profile = await UserRepository.getUserProfile(user.uid);
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
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      setUserProfile(await UserRepository.getUserProfile(auth.currentUser.uid));
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
