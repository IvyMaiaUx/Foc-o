import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, writeBatch } from "firebase/firestore";
import { auth, db } from "@/src/lib/firebase";
import { motion } from "motion/react";
import { CheckCircle2, Circle } from "lucide-react";
import { DogRepository } from "@/src/repositories/DogRepository";
import { UserRepository } from "@/src/repositories/UserRepository";
import { TrainingRepository } from "@/src/repositories/TrainingRepository";
import { EvolutionRepository } from "@/src/repositories/EvolutionRepository";
import { IntelligentPlanMotor } from "@/src/motors/IntelligentPlanMotor";
import { DogProfile } from "@/src/types";
import { AnalyticsRepository } from "@/src/repositories/AnalyticsRepository";
import { useAuth } from "@/src/contexts/AuthContext";
import { useOnboardingState, clearOnboardingDraft } from "@/src/lib/onboardingDraft";

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

const ANALYSIS_BEHAVIOR_LABELS: Record<string, string> = {
  pulling: 'puxar na guia',
  barking: 'latidos excessivos',
  lack_focus: 'falta de foco',
  agitation: 'agitação e impulsividade',
  destructive: 'destruir objetos',
  separation_anxiety: 'ansiedade ao ficar sozinho',
};
const ANALYSIS_GOAL_LABELS: Record<string, string> = {
  obedience: 'obediência básica',
  walks: 'passeio sem puxar',
  focus: 'foco e atenção',
  anxiety_alone: 'reduzir a ansiedade',
  barking: 'reduzir os latidos',
  destruction: 'evitar a destruição',
  routine: 'criar uma rotina melhor',
};
const ANALYSIS_LEVEL_LABELS: Record<string, string> = {
  beginner: 'iniciante',
  intermediate: 'intermediário',
  advanced: 'avançado',
};

// Monta as mensagens de análise a partir da anamnese REAL do cão, para a tela
// "Analisando o perfil" refletir os dados que o tutor informou (não ser só enfeite).
function buildAnalysisSteps(stateData: any): string[] {
  const name = stateData?.dogData?.name || 'seu cão';
  const behaviors: string[] = Array.isArray(stateData?.behaviors) ? stateData.behaviors : [];
  const goals: string[] = Array.isArray(stateData?.goals) ? stateData.goals : [];
  const base: string = stateData?.base || 'beginner';

  const steps: string[] = [`Analisando o perfil ${name}…`];

  const problem = behaviors
    .filter((b) => b && b !== 'none')
    .map((b) => ANALYSIS_BEHAVIOR_LABELS[b])
    .find(Boolean);
  steps.push(problem ? `Identifiquei a dificuldade: ${problem}.` : 'Montando uma base sólida de fundamentos.');

  const goal = goals
    .filter((g) => g && g !== 'other')
    .map((g) => ANALYSIS_GOAL_LABELS[g])
    .find(Boolean);
  if (goal) steps.push(`Priorizando seu objetivo: ${goal}.`);

  steps.push(`Ajustando ao nível ${ANALYSIS_LEVEL_LABELS[base] || 'iniciante'} do ${name}.`);
  steps.push('Selecionando e ordenando os treinos ideais…');

  return steps;
}

export function Analyzing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const stateData = useOnboardingState(location.state);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saveAndRedirect = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        // Se os dados do onboarding se perderam (ex.: refresh nesta tela), os campos
        // viriam vazios e geraríamos um perfil em branco. Volta ao início para refazer.
        if (!stateData?.dogData?.name) {
          navigate("/onboarding/intro", { replace: true });
          return;
        }

        // Trava de segurança: se essa conta já tem cão/plano cadastrados, NÃO deixa o
        // batch abaixo rodar de novo — ele sobrescreve tudo sem merge (perfil do cão,
        // plano atual e resumo de evolução voltam a zero). Isso pode acontecer se o
        // usuário for mandado de volta pro onboarding por engano (ver Home.tsx) e
        // conseguir chegar até aqui com o rascunho antigo salvo no localStorage.
        const existingDog = await DogRepository.getDogProfile(user.uid);
        if (existingDog?.name) {
          console.warn('[Analyzing] Conta já tem cão cadastrado — pulando a gravação destrutiva e só confirmando onboardingComplete.');
          await UserRepository.markOnboardingComplete(user.uid);
          clearOnboardingDraft();
          await refreshProfile();
          navigate("/inicio");
          return;
        }

        // Progresso suave de 0 a 100 (~3s), contando de forma fluida (1 a 1).
        const totalMs = 3000;
        const tickMs = 30;
        const totalTicks = Math.round(totalMs / tickMs);
        for (let tick = 1; tick <= totalTicks; tick += 1) {
          setProgress(Math.min(Math.round((tick / totalTicks) * 100), 100));
          await new Promise((r) => setTimeout(r, tickMs));
        }
        setProgress(100);

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
        // merge:true por segurança extra — a trava acima já impede reentrada numa
        // conta com cão existente, mas isso evita que qualquer outro caminho futuro
        // apague campos do perfil sem querer.
        batch.set(dogRef, finalDogProfile, { merge: true });

        // 2. Generate Plan
        // Use the generated dog profile directly to avoid an extra read
        const generatedPlan = IntelligentPlanMotor.generatePlan({
          id: "profile",
          ...finalDogProfile,
        } as DogProfile);
        const planRef = doc(db, "users", user.uid, "plan", "current");
        batch.set(planRef, generatedPlan, { merge: true });

        // 3. Initialize Evolution
        const evolutionRef = doc(db, "users", user.uid, "evolution", "summary");
        batch.set(evolutionRef, {
          streak: 0,
          totalSessions: 0,
          activeDays: 0,
          averageBehaviorScore: 0,
          lastTrainedAt: null,
          lastCheckinAt: null,
        }, { merge: true });

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

        // set(merge) em vez de update: cria-ou-mescla o doc do usuário, evitando que o
        // onboarding inteiro falhe (batch abortado) caso o doc /users/{uid} ainda não exista.
        batch.set(userRef, userUpdate, { merge: true });

        // Commit transaction
        try {
          await batch.commit();
          AnalyticsRepository.logEvent('onboarding_completed');

          // Process referral if user was referred by someone
          try {
            const token = await user.getIdToken();
            const response = await fetch('https://app.focaoapp.com.br/api/process-referral', {
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

        // Atualiza o perfil no AuthContext (onboardingComplete=true) ANTES de ir pra Home,
        // senão o guard de onboarding rebateria o usuário de volta pro fluxo.
        clearOnboardingDraft(); // onboarding concluído: descarta o rascunho
        await refreshProfile();
        navigate("/inicio"); // Go to Home
      } catch (error: any) {
        console.error("Error saving onboarding data:", error?.message);
        alert('Não foi possível salvar seus dados agora. Verifique a conexão e tente de novo.');
        navigate("/inicio");
      }
    };

    saveAndRedirect();
  }, [navigate, stateData]);

  const analysisSteps = buildAnalysisSteps(stateData);
  const dogDisplayName = stateData?.dogData?.name || "seu cão";
  const dogInitial = (stateData?.dogData?.name || "C").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        {/* Avatar do cão */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-20 h-20 rounded-[1.75rem] overflow-hidden border border-[#055A43]/10 shadow-[0_10px_30px_rgba(5,90,67,0.15)] mb-7 bg-[#055A43] flex items-center justify-center"
        >
          {stateData?.dogData?.photoUrl ? (
            <img src={stateData.dogData.photoUrl} alt="Cão" className="w-full h-full object-cover" />
          ) : (
            <span className="font-serif text-white text-3xl opacity-90">{dogInitial}</span>
          )}
        </motion.div>

        {/* Anel de progresso */}
        <div className="relative w-24 h-24 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" className="stroke-current text-[#055A43]/10" strokeWidth="5" fill="none" />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-current text-[#055A43]"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
              animate={{ strokeDashoffset: 251.2 - (251.2 * progress) / 100 }}
              transition={{ duration: 0.12, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-[#055A43]">
            {progress}%
          </div>
        </div>

        <h1 className="font-serif text-[28px] text-[#055A43] tracking-tight leading-tight mb-1">
          Montando o plano
        </h1>
        <p className="text-[13px] text-[#6B7A6E] mb-8">
          Personalizando cada treino para {dogDisplayName}.
        </p>

        {/* Checklist da análise — passos reais da anamnese */}
        <div className="w-full flex flex-col gap-2.5 text-left">
          {analysisSteps.map((step, i) => {
            const doneThreshold = ((i + 1) / analysisSteps.length) * 100;
            const activeThreshold = (i / analysisSteps.length) * 100;
            const done = progress >= doneThreshold - 0.01;
            const active = !done && progress >= activeThreshold;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: done || active ? 1 : 0.4, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                  done ? "bg-[#055A43]/[0.04] border-[#055A43]/15" : "bg-white border-gray-100"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-[#055A43] shrink-0" />
                ) : active ? (
                  <span className="w-5 h-5 shrink-0 rounded-full border-2 border-[#055A43]/20 border-t-[#055A43] animate-spin" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <span className={`text-[13px] font-medium leading-snug ${done ? "text-[#055A43]" : "text-[#6B7A6E]"}`}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
