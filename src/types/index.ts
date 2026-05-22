import { User as FirebaseUser } from 'firebase/auth';

export type SubscriptionPlan = 'free' | 'trial' | 'premium';
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface SubscriptionData {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  premiumAccess: boolean;
  trialStartedAt?: number;
  trialEndsAt?: number;
  currentPeriodEnd?: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  subscription: SubscriptionData;
  subscriptionTier?: string;
  trialEndsAt?: number;
  onboardingComplete: boolean;
  settings?: {
    notificationsEnabled: boolean;
    trainingReminderTime: string; // e.g. "09:00"
    checkinReminderTime: string; // e.g. "20:00"
    reminders?: {
      training: boolean;
      checkin: boolean;
      vaccines: boolean;
      report: boolean;
    };
  };
  createdAt: number;
  updatedAt: number;
}

export function hasPremiumAccess(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.subscription?.premiumAccess !== undefined) {
    return profile.subscription.premiumAccess;
  }
  const tier = profile.subscriptionTier;
  const trialEnd = profile.trialEndsAt;
  if (tier === 'premium') return true;
  if (tier === 'trial' && trialEnd && trialEnd > Date.now()) return true;
  return false;
}

export function getSubscriptionPlan(profile: UserProfile | null): SubscriptionPlan {
  if (!profile) return 'free';
  return profile.subscription?.plan ?? (profile.subscriptionTier as SubscriptionPlan) ?? 'free';
}

export function getSubscriptionStatus(profile: UserProfile | null): SubscriptionStatus {
  if (!profile) return 'inactive';
  return profile.subscription?.status ?? 'inactive';
}

export interface DogProfile {
  id?: string;
  name: string;
  breed: string;
  age: string;
  weight: string;
  photoUrl?: string;
  
  routine: string[];
  walksPerDay?: string;
  livesWithPeople?: boolean;
  livesWithAnimals?: boolean;
  animalRelationship?: string;
  energyLevel: string;
  personalityTraits?: string[];
  rewardPreference?: string;
  behaviorIssues: string[];
  trainingBase: string; // 'beginner', 'intermediate', 'advanced'
  knownCommands: string[];
  goals: string[];
  
  diet?: string;
  foodBrand?: string;
  foodLine?: string;
  lifeStage?: string;
  foodVersion?: string;
  foodQuantity?: string;
  naturalFoodDetails?: string;
  hasVetGuidance?: string;
  mealsPerDay?: string;
  lastVaccine?: string;
  nextCheckup?: string;
  observations?: string;
  
  createdAt: number;
  updatedAt: number;
}

export interface TrainingTask {
  id: string;
  title: string;
  duration: string;
  module: string;
  moduleName: string;
  description: string;
  steps: string[];
}

export interface CurrentPlan {
  tasks: TrainingTask[];
  currentTaskIndex: number;
  generatedAt: number;
  focus: string; 
}

export interface TrainingSession {
  id?: string;
  trainingId: string;
  title: string;
  durationMinutes: number;
  feedback: 'easy' | 'medium' | 'hard' | 'failed';
  completedAt: number;
}

export interface ProductConfig {
  monthlyPrice: string;
  annualPrice: string;
  monthlyCheckoutUrl: string;
  annualCheckoutUrl: string;
  trialDays: number;
  monthlyTitleStr: string;
  annualTitleStr: string;
  features: string[];
}

export interface SupportMessage {
  id: string;
  text: string;
  imageUrl?: string;
  sender: 'user' | 'admin';
  createdAt: number;
}

export interface SupportThread {
  id: string;
  userId: string;
  userName: string;
  dogName: string;
  status: 'open' | 'closed';
  lastMessageAt: number;
  unreadAdmin: boolean;
  unreadUser: boolean;
}
