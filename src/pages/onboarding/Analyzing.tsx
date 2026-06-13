import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import { motion } from "motion/react";
import { DogRepository } from "@/src/repositories/DogRepository";
import { UserRepository } from "@/src/repositories/UserRepository";
import { TrainingRepository } from "@/src/repositories/TrainingRepository";
import { EvolutionRepository } from "@/src/repositories/EvolutionRepository";
import { IntelligentPlanMotor } from "@/src/motors/IntelligentPlanMotor";
import { DogProfile } from "@/src/types";
import { AnalyticsRepository } from "@/src/repositories/AnalyticsRepository";

function foodTypeFromDiet(diet?: string): 'dry' | 'wet' | 'natural' | 'mixed' {
  const normalized = String(diet || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('umida')) return 'wet';
  if (normalized.includes('natural')) return 'natural';
  if (normalized.includes('mista')) return 'mixed';
  return 'dry';
}

function parseMealsPerDay(value?: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value || '').replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

function parsePortionGrams(value?: unknown): number | undefined {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function Analyzing() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saveAndRedirect = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // Simulate analysis delay
        for (let i = 0; i <= 100; i += 20) {
          setProgress(i);
          await new Promise((r) => setTimeout(r, 600));
        }

        const {
          dogData,
          routine,
          hasOutdoorArea,
          walksPerDay,
          walkDuration,
          livesWithPeople,
          livesWithAnimals,
          animalRelationship,
          health,
          energyLevel,
          personalityTraits,
          rewardPreference,
          behaviors,
          base,
          goals,
          goalNotes,
          knownCommands,
        } = stateData;
        const nutritionFoodType = foodTypeFromDiet(health?.diet);
        const portionGrams = parsePortionGrams(health?.foodQuantity);
        const nutrition = health?.diet ? {
          foodType: nutritionFoodType,
          foodBrand: health?.foodBrand || "",
          foodLine: health?.foodLine || "",
          foodPhase: health?.lifeStage || dogData?.lifeStage || "",
          foodVersion: health?.foodVersion || "",
          mealsPerDay: parseMealsPerDay(health?.mealsPerDay),
          ...(portionGrams ? { portionGrams } : {}),
          ...(!health?.foodBrand && nutritionFoodType !== 'natural'
            ? { fallbackReason: 'Ração não informada no onboarding' }
            : {}),
          matchConfidence: health?.foodBrand && health?.foodLine ? 0.95 : 0.45,
        } : undefined;

        // 1. Build Dog Profile Object
        const fullDogProfile: Partial<DogProfile> = {
          name: dogData?.name || "Cão",
          breed: dogData?.breed || "SRD",
          photoUrl: dogData?.photoUrl || "",
          age: dogData?.age || "0",
          weight: dogData?.weight || "0",
          gender: dogData?.gender || "",
          lifeStage: health?.lifeStage || dogData?.lifeStage || "",
          routine: routine ? [routine] : [],
          walksPerDay: walksPerDay || "",
          livesWithPeople,
          livesWithAnimals,
          animalRelationship,
          energyLevel: energyLevel || "medium",
          personalityTraits: personalityTraits || [],
          rewardPreference: rewardPreference || "",
          behaviorIssues: (behaviors || []).filter((behavior: string) => behavior !== 'none'),
          trainingBase: base || "beginner",
          knownCommands: knownCommands || [],
          goals: goals || [],
          goalNotes: goalNotes || "",
          diet: health?.diet || "",
          foodBrand: health?.foodBrand || "",
          foodLine: health?.foodLine || "",
          foodVersion: health?.foodVersion || "",
          foodQuantity: health?.foodQuantity || "",
          mealsPerDay: health?.mealsPerDay || "",
          naturalFoodDetails: health?.naturalFoodDetails || "",
          hasVetGuidance: health?.hasVetGuidance || "",
          ...(nutrition ? { nutrition } : {}),
          lastVaccine: health?.lastVaccine || "",
          nextCheckup: health?.nextCheckup || "",
          observations: health?.observations || "",
          hasOutdoorArea,
          hasYard: hasOutdoorArea,
          housingType: routine || "",
          walkDuration: walkDuration || "",
          walkDurationMinutes: Number.parseInt(String(walkDuration || "").replace(/\D/g, ""), 10) || undefined,
          walkFrequency: walksPerDay === "Não passeia"
            ? 0
            : walksPerDay === "1 vez"
              ? 1
              : walksPerDay === "2 vezes"
                ? 2
                : walksPerDay === "3+ vezes"
                  ? 3
                  : undefined,
          peopleCount: livesWithPeople || "",
          dailyRoutine: routine || "",
          personality: personalityTraits || [],
          behavior: {
            anxiety: behaviors?.includes("separation_anxiety") || false,
            destruction: behaviors?.includes("destructive") || false,
            barking: behaviors?.includes("barking") || false,
            pullingLeash: behaviors?.includes("pulling") || false,
            lackFocus: behaviors?.includes("lack_focus") || false,
            agitation: behaviors?.includes("agitation") || false,
          },
        };

        // Execute everything in a single atomic batch
        const batch = writeBatch(db);
        const now = Date.now();

        // 1. Save Dog Profile
        const dogRef = doc(db, "users", user.uid, "dog", "profile");
        const finalDogProfile = {
          ...fullDogProfile,
          createdAt: now,
          updatedAt: now,
        };
        batch.set(dogRef, finalDogProfile);

        // 2. Generate Plan
        // Use the generated dog profile directly to avoid an extra read
        const generatedPlan = IntelligentPlanMotor.generatePlan({
          id: "profile",
          ...finalDogProfile,
        } as DogProfile);
        const planRef = doc(db, "users", user.uid, "plan", "current");
        batch.set(planRef, generatedPlan);

        // 3. Initialize Evolution
        const evolutionRef = doc(db, "users", user.uid, "evolution", "summary");
        batch.set(evolutionRef, {
          streak: 0,
          totalSessions: 0,
          activeDays: 0,
          averageBehaviorScore: 0,
          lastTrainedAt: null,
          lastCheckinAt: null,
        });

        // 4. Mark Onboarding Complete
        const userRef = doc(db, "users", user.uid);
        const userUpdate: Record<string, any> = {
          onboardingComplete: true,
          updatedAt: now,
          whatsappNotificationTypes: {
            weeklyReport: true,
            trainingReminder: true,
            inactivity: true,
            trialAndBilling: true,
          },
        };

        if (dogData?.whatsappPhone) {
          userUpdate.whatsappEnabled = true;
          userUpdate.whatsappPhone = dogData.whatsappPhone;
          userUpdate.whatsappOptInAt = now;
          userUpdate.whatsappStatus = 'active';
        }

        batch.update(userRef, userUpdate);

        // Commit transaction
        try {
          await batch.commit();
          AnalyticsRepository.logEvent('onboarding_completed');

          // Process referral if user was referred by someone
          try {
            const token = await user.getIdToken();
            const response = await fetch('https://foc-o.vercel.app/api/process-referral', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            if (response.ok) {
              await response.json();
            } else {
              console.warn('[Referral] API responded with error status:', response.status);
            }
          } catch (refErr) {
            console.error('[Referral] Error calling process-referral API:', refErr);
          }
        } catch (e: any) {
          throw new Error("Transaction error: " + e.message);
        }

        navigate("/"); // Go to Home
      } catch (error: any) {
        console.error("Error saving onboarding data:", error?.message);
        alert(`Erro de permissão ou conexão: ${error?.message}`);
        navigate("/");
      }
    };

    saveAndRedirect();
  }, [navigate, stateData]);

  return (
    <div className="min-h-screen bg-[#055A43] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" />

      <div className="z-10 flex flex-col items-center max-w-sm text-center">
        {stateData?.dogData?.photoUrl && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20 mb-6 shadow-2xl"
          >
            <img
              src={stateData.dogData.photoUrl}
              alt="Cão"
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}

        <div className="relative w-24 h-24 mb-8">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-current text-white/20"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-current text-white"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * progress) / 100 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl font-medium">
            {progress}%
          </div>
        </div>

        <h1 className="font-serif text-3xl mb-3">Analisando o perfil</h1>
        <p className="text-white/80">
          Cruzando rotina, dificuldade e objetivos para criar o plano inicial do{" "}
          {stateData?.dogData?.name || "seu cão"}...
        </p>
      </div>
    </div>
  );
}
