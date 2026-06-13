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
  referralCode?: string;
  referredBy?: string | null;
  referredById?: string;
  referralRewardsDays?: number;
  validReferrals?: number;
  referralsLimitReached?: boolean;
  premiumBonusDays?: number;
  premiumBonusExpiresAt?: number;
  settings?: {
    notificationsEnabled: boolean;
    trainingReminderTime: string; // e.g. "09:00"
    checkinReminderTime: string; // e.g. "20:00"
    vaccineReminderTime?: string; // e.g. "09:00"
    reportReminderTime?: string; // e.g. "10:00"
    reminders?: {
      training: boolean;
      checkin: boolean;
      vaccines: boolean;
      report: boolean;
    };
  };
  whatsappEnabled?: boolean;
  whatsappPhone?: string;
  whatsappStatus?: 'active' | 'disabled' | 'missing_phone' | 'failed' | string;
  lastSeenAt?: number;
  lastActivityAt?: number;
  whatsappNotificationTypes?: {
    welcome?: boolean;
    agendaDay?: boolean;
    weeklyReport: boolean;
    trainingReminder: boolean;
    achievements?: boolean;
    inactivity: boolean;
    trialAndBilling: boolean;
  };
  createdAt: number;
  updatedAt: number;
}

export function hasPremiumAccess(profile: UserProfile | null): boolean {
  if (!profile) return false;

  if (profile.premiumBonusExpiresAt && profile.premiumBonusExpiresAt > Date.now()) {
    return true;
  }

  const subscription = profile.subscription;
  if (subscription) {
    const trialEndsAt = subscription.trialEndsAt ?? profile.trialEndsAt ?? 0;

    if (subscription.status === 'trialing' || subscription.plan === 'trial') {
      return Boolean(subscription.premiumAccess && trialEndsAt > Date.now());
    }

    if (subscription.status === 'active') {
      return subscription.premiumAccess !== false;
    }

    return false;
  }

  const tier = profile.subscriptionTier;
  const trialEnd = profile.trialEndsAt;
  if (tier === 'premium') return true;
  if (tier === 'trial' && trialEnd && trialEnd > Date.now()) return true;
  return false;
}

export function getSubscriptionPlan(profile: UserProfile | null): SubscriptionPlan {
  if (!profile) return 'free';
  if (profile.premiumBonusExpiresAt && profile.premiumBonusExpiresAt > Date.now()) {
    return 'premium';
  }
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
  gender?: 'male' | 'female' | string;
  size?: 'small' | 'medium' | 'large' | 'giant' | string;
  
  routine: string[];
  housingType?: string;
  hasOutdoorArea?: boolean;
  hasYard?: boolean;
  walksPerDay?: string;
  walkFrequency?: number;
  walkDuration?: string;
  walkDurationMinutes?: number;
  livesWithPeople?: boolean;
  peopleCount?: string;
  livesWithAnimals?: boolean;
  animalRelationship?: string;
  dailyRoutine?: string;
  energyLevel: string;
  personalityTraits?: string[];
  personality?: string[];
  anxietyLevel?: string;
  sociabilityLevel?: string;
  independenceLevel?: string;
  fearLevel?: string;
  rewardPreference?: string;
  behaviorIssues: string[];
  behavior?: Record<string, boolean | undefined>;
  trainingBase: string; // 'beginner', 'intermediate', 'advanced'
  knownCommands: string[];
  goals: string[];
  goalNotes?: string;
  
  diet?: string;
  foodBrand?: string;
  foodLine?: string;
  lifeStage?: string;
  foodVersion?: string;
  foodQuantity?: string;
  naturalFoodDetails?: string;
  hasVetGuidance?: string;
  mealsPerDay?: string;
  nutrition?: {
    foodType?: 'dry' | 'wet' | 'natural' | 'mixed';
    foodBrand?: string;
    foodLine?: string;
    foodPhase?: string;
    foodVersion?: string;
    mealsPerDay?: number;
    portionGrams?: number;
    fallbackReason?: string;
    matchConfidence?: number;
  };
  lastVaccine?: string;
  nextCheckup?: string;
  observations?: string;
  health?: {
    castrated?: boolean;
    [key: string]: any;
  };
  
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
  reason?: string;
  priority?: 'alta' | 'normal' | 'baixa';
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
  isReview?: boolean;
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

export interface CustomEvent {
  id: string;
  title: string;
  time: string; // e.g. "08:30"
  type: 'walk' | 'feed' | 'grooming' | 'vet' | 'meds' | 'other';
  frequency: 'daily' | 'weekly' | 'once';
  daysOfWeek?: number[]; // [0 = Sunday, 1 = Monday, etc.]
  date?: string; // "YYYY-MM-DD"
  createdAt: number;
}
