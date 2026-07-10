import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Play, Pause, CheckCircle2, ChevronLeft, Award, Lightbulb, Lock } from 'lucide-react';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { CurrentPlan, TrainingTask, DogProfile } from '@/src/types';
import confetti from 'canvas-confetti';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { TrainingReasonMotor, TrainingReason } from '@/src/motors/TrainingReasonMotor';
import { haptics } from '@/src/lib/haptics';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumGate } from '@/src/components/ui/PremiumGate';
import { sanitizeText } from '@/src/lib/textSanitizer';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { toLocalDateKey } from '@/src/lib/dateKeys';

export function Treino() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isPremium } = useAuth();
  
  const [plan, setPlan] = useState<CurrentPlan | null>(null);
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);
  const [activeTask, setActiveTask] = useState<TrainingTask | null>(null);
  const [trainingReason, setTrainingReason] = useState<TrainingReason | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<string | null>(null);
  const [hasCheckinToday, setHasCheckinToday] = useState(false);
  const [shouldOfferCheckin, setShouldOfferCheckin] = useState(false);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggleTimer = () => {
    if (!timerRunning && timeElapsed === 0 && activeTask) {
      AnalyticsRepository.logEvent('training_started', {
        trainingId: activeTask.id,
        title: activeTask.title
      });
    }
    setTimerRunning(!timerRunning);
  };

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const todayKey = toLocalDateKey();
          const [currentP, dogProf, evolution, checkinsList, todayCheckin] = await Promise.all([
             TrainingRepository.getCurrentPlan(user.uid),
             DogRepository.getDogProfile(user.uid),
             EvolutionRepository.getSummary(user.uid),
             CheckinRepository.getRecentCheckins(user.uid, 5),
             CheckinRepository.getCheckin(user.uid, todayKey)
          ]);
          setPlan(currentP);
          setDogProfile(dogProf);
          setHasCheckinToday(!!todayCheckin);

          let task = null;
          if (currentP && currentP.tasks.length > 0) {
            if (id) {
              task = currentP.tasks.find(t => t.id === id);
              setActiveTask(task || currentP.tasks[currentP.currentTaskIndex]);
            } else {
              task = currentP.tasks[currentP.currentTaskIndex] || currentP.tasks[0];
              setActiveTask(task);
            }
          }

          if (task) {
             const reason = TrainingReasonMotor.explainTrainingChoice(
                dogProf,
                task,
                checkinsList,
                evolution?.totalSessions || 0
             );
             setTrainingReason(reason);
          }

        }
      } catch (err) {
        console.error("Erro ao carregar plano: ", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlan();
  }, [id]);

  // The steps will come directly from activeTask now, fallback to templates or default
  const stepsToUse = activeTask?.steps?.length ? activeTask.steps : 
    (activeTask?.id && Object.values(TRAINING_TEMPLATES).find(t => t.id === activeTask.id)?.steps) || [
      'Fique em um ambiente silencioso, sem distrações, segurando alguns petiscos.',
      'Aguarde o seu cão olhar.',
      'No exato momento em que ele olhar, diga "Muito bem!" (ou clique) e dê o petisco.',
      'Repita o processo por 5 minutos, faça uma pausa, e repita novamente.',
    ];

  const handleCompleteRequest = () => {
    setTimerRunning(false);
    setShowFeedback(true);
  };

  const submitFeedback = async (score: string) => {
    setFeedbackScore(score);
    setIsSaving(true);
    let offerCheckinAfterCompletion = false;
    try {
      const user = auth.currentUser;
      if (user && activeTask) {
        // Save completion record
        const elapsedMinutes = Math.max(1, Math.ceil(timeElapsed / 60)); // at least 1 minute
        const duration = timeElapsed > 0 ? elapsedMinutes : (parseInt(activeTask.duration) || 15);
        const activeTaskIndex = plan?.tasks.findIndex((task) => task.id === activeTask.id) ?? -1;
        const isReview = activeTaskIndex >= 0 && activeTaskIndex < (plan?.currentTaskIndex ?? 0);

        await TrainingRepository.logTraining(user.uid, {
          trainingId: activeTask.id,
          title: sanitizeText(activeTask.title),
          durationMinutes: duration,
          feedback: score,
          isReview,
        });

        // Track event
        AnalyticsRepository.logEvent('training_completed', {
          trainingId: activeTask.id,
          title: activeTask.title,
          durationMinutes: duration,
          feedback: score,
          isReview,
        });

        // Update sequence (streak) and total sessions
        if (!isReview && score !== 'failed' && score !== 'hard') {
          await EvolutionRepository.updateFromTraining(user.uid);
          
          if (plan) {
            const nextIndex = Math.min(plan.currentTaskIndex + 1, plan.tasks.length);
            await TrainingRepository.updatePlanProgress(user.uid, nextIndex);
          }
        } else if (!isReview && score === 'hard') {
          await EvolutionRepository.updateFromTraining(user.uid);
        }

        if (!isReview && score !== 'failed') {
          const todayKey = toLocalDateKey();
          const promptKey = `focao_post_training_checkin_prompted_${user.uid}_${todayKey}`;
          const alreadyPromptedToday = localStorage.getItem(promptKey) === 'true';

          offerCheckinAfterCompletion = !hasCheckinToday && !alreadyPromptedToday;

          if (offerCheckinAfterCompletion) {
            localStorage.setItem(promptKey, 'true');
          }
        }
      }
    } catch (err) {
      console.error("Erro ao salvar treino", err);
    } finally {
      setIsSaving(false);
      setShowFeedback(false);
      setShouldOfferCheckin(offerCheckinAfterCompletion);
      setIsCompleted(true);
    }
  };

  useEffect(() => {
    if (isCompleted && feedbackScore !== 'failed') {
      haptics.success();
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#FFFEFB', '#EAB308', '#055A43', '#506352']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#FFFEFB', '#EAB308', '#055A43', '#506352']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isCompleted, feedbackScore]);

  if (showFeedback) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col justify-center px-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-md mx-auto flex flex-col items-center"
        >
           <h2 className="font-serif text-[32px] text-[#055A43] mb-2 text-center">Como foi o treino?</h2>
           <p className="text-[#6B7A6E] text-[15px] font-light mb-8 text-center text-balance">
             Seu feedback ajuda a adaptar os próximos treinos para o seu cão.
           </p>

           <div className="flex flex-col gap-3 w-full">
             {[
               { id: 'easy', label: 'Fácil', desc: dogProfile?.gender === 'female' ? 'Ela tirou de letra' : 'Ele tirou de letra' },
               { id: 'medium', label: 'Médio', desc: 'Exigiu um pouco de foco' },
               { id: 'hard', label: 'Difícil', desc: 'Precisamos praticar mais' },
               { id: 'failed', label: 'Não concluí', desc: 'Paramos no meio' },
             ].map(opt => (
               <button
                 key={opt.id}
                 disabled={isSaving}
                 onClick={() => submitFeedback(opt.id)}
                 className="flex flex-col w-full text-left p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-[#055A43]/30 transition-all active:scale-[0.98]"
               >
                 <span className="font-semibold text-[#055A43] text-[15px]">{opt.label}</span>
                 <span className="text-[#6B7A6E] text-sm mt-0.5">{opt.desc}</span>
               </button>
             ))}
           </div>
           
           {isSaving && (
             <div className="mt-8">
               <span className="w-6 h-6 border-2 border-[#055A43]/30 border-t-[#055A43] rounded-full animate-spin inline-block" />
             </div>
           )}
        </motion.div>
      </div>
    );
  }

  if (isCompleted) {
    const isFailed = feedbackScore === 'failed';
    const isHard = feedbackScore === 'hard';
    const dogName = dogProfile?.name || 'seu cão';

    return (
      <div className="min-h-screen bg-[#055A43] font-sans flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          className="flex flex-col items-center z-10 w-full"
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 }}
            className="relative w-28 h-28 mb-10"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-2xl shadow-green-900/50">
              <Award className="w-14 h-14 text-[#055A43]" strokeWidth={1.5} />
            </div>
          </motion.div>
          
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 font-medium tracking-widest uppercase text-xs mb-3"
          >
            {isFailed ? "Tentativa Registrada" : "Sessão Finalizada"}
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-serif text-[42px] leading-tight tracking-tight mb-4"
          >
            {isFailed ? (
              <>Tudo bem <br/><span className="italic text-white/90">pausar</span></>
            ) : (
              <>Treino <br/><span className="italic text-white/90">concluído</span></>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/80 max-w-[280px] mx-auto font-light leading-relaxed mb-12"
          >
            {(() => {
              const art = dogProfile?.gender === 'female' ? 'da' : 'do';
              return isFailed 
                ? `Respeitar o limite ${art} ${dogName} também é cuidado. Vocês podem retomar quando estiverem prontos.`
                : isHard 
                ? `Nem todo dia precisa ser perfeito. Respeitar o ritmo ${art} ${dogName} também faz parte da evolução.`
                : "Excelente trabalho. A consistência de hoje se transforma nos resultados de amanhã.";
            })()}
          </motion.p>

          {shouldOfferCheckin && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.58 }}
              className="mb-5 max-w-[280px] text-sm font-light leading-relaxed text-white/75"
            >
              Registre o check-in de hoje para deixar os relatórios e as próximas recomendações mais precisos.
            </motion.p>
          )}

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => navigate(shouldOfferCheckin ? '/checkin' : '/')}
            className="bg-white text-[#055A43] w-full max-w-[280px] h-14 rounded-full font-medium text-[15px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] transition-transform"
          >
            {shouldOfferCheckin ? 'Fazer check-in de hoje' : 'Voltar ao Início'}
          </motion.button>
          {shouldOfferCheckin && (
            <button
              onClick={() => navigate('/')}
              className="mt-4 h-10 rounded-full px-5 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              Agora não
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#055A43]/20 border-t-[#055A43] rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeTask) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] p-6 flex flex-col items-center justify-center">
        <p className="text-[#6B7A6E]">Treino não encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#055A43] font-medium">Voltar</button>
      </div>
    );
  }

  // Plano concluído: sem id específico e o índice já passou do fim da trilha.
  // Antes caía em tasks[0] (treino errado / paywall de "revisão"). Agora mostra estado final.
  if (!id && plan && plan.tasks.length > 0 && (plan.currentTaskIndex ?? 0) >= plan.tasks.length) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] px-6 font-sans flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-[28px] text-[#055A43]">Plano concluído! 🎉</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6B7A6E]">
          Vocês terminaram todos os treinos deste plano. Aguarde a geração do próximo ou acompanhe a evolução.
        </p>
        <button
          onClick={() => navigate('/evolucao', { replace: true })}
          className="mt-7 h-12 rounded-full bg-[#055A43] px-6 text-sm font-bold text-white"
        >
          Ver evolução
        </button>
      </div>
    );
  }

  const activeTaskIndex = plan?.tasks.findIndex((task) => task.id === activeTask.id) ?? -1;
  const currentTaskIndex = plan?.currentTaskIndex ?? 0;
  const isReview = activeTaskIndex >= 0 && activeTaskIndex < currentTaskIndex;
  const isFutureTraining = activeTaskIndex > currentTaskIndex;
  const isPremiumTrainingLocked = !isPremium && (
    currentTaskIndex >= 3 || activeTaskIndex >= 3
  );

  if (isFutureTraining) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] px-6 font-sans flex flex-col items-center justify-center text-center">
        <Lock className="h-8 w-8 text-[#055A43]" />
        <h1 className="mt-4 font-serif text-[28px] text-[#055A43]">Esta etapa ainda não foi liberada.</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6B7A6E]">
          Conclua o treino atual para avançar pela trilha na ordem recomendada.
        </p>
        <button
          onClick={() => navigate('/plano', { replace: true })}
          className="mt-7 h-12 rounded-full bg-[#055A43] px-6 text-sm font-bold text-white"
        >
          Voltar ao plano
        </button>
      </div>
    );
  }

  if (isReview && !isPremium) {
    return <PremiumGate featureName="Revisão de Treinos" />;
  }

  if (isPremiumTrainingLocked) {
    return (
      <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
        <header className="px-6 pt-safe-top mt-6 pb-6 flex items-start justify-between z-10 relative">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7A6E]"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </header>
        <PremiumGate featureName="Treinamento Completo" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
      <header className="px-6 pt-safe-top mt-6 pb-6 flex items-start justify-between z-10 relative">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7A6E]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="bg-[#055A43]/10 px-3 py-1.5 rounded-full text-[#055A43] text-[10px] font-bold tracking-widest uppercase">
          {isReview ? 'Modo revisão' : `Módulo ${activeTask.module}`}
        </span>
      </header>

      <main className="flex-1 px-6 pb-40 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm flex items-center justify-center bg-[#055A43]">
             {dogProfile?.photoUrl ? (
               <img src={dogProfile.photoUrl} alt="Dog" className="w-full h-full object-cover" />
             ) : (
               <span className="text-white text-lg font-serif">
                 {dogProfile?.name?.charAt(0) || 'F'}
               </span>
             )}
          </div>
          <span className="text-[13px] font-medium text-[#6B7A6E]/80 uppercase tracking-widest">
            {dogProfile?.name || 'Seu cão'}
          </span>
        </div>

        {plan?.hybridPlan?.some(
          (p: any) => p.trainingId === activeTask.id && p.priority === 'high' && p.manualOverride === true
        ) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-amber-600 text-lg">✨</span>
            <span className="text-[#055A43] text-sm font-medium">
              Treino priorizado para a fase atual do seu cão.
            </span>
          </div>
        )}

        <h1 className="font-serif text-[32px] leading-[1.1] tracking-tight text-[#055A43] mb-4">
          {sanitizeText(activeTask.title)}
        </h1>
        <p className="text-[#6B7A6E] text-[15px] font-light leading-relaxed mb-6">
          {sanitizeText(TRAINING_TEMPLATES[activeTask.id]?.objective || activeTask.description)}
        </p>

        {/* Intelligence Reason Card */}
        {trainingReason && (
          <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-[#055A43]/[0.03] border border-[#055A43]/10 rounded-2xl p-5 mb-8 flex flex-col gap-3"
          >
             <div className="flex items-center gap-2">
               <Lightbulb className="w-5 h-5 text-[#055A43]" />
               <span className="font-semibold text-[13px] uppercase tracking-widest text-[#055A43] pt-0.5">
                 {sanitizeText(trainingReason.reasonTitle)}
               </span>
             </div>
             <p className="text-sm text-[#506352] leading-relaxed font-medium">
               {sanitizeText(trainingReason.reasonText)}
             </p>
             <div className="flex flex-col gap-2 mt-2">
               <div className="flex items-center justify-between border-t border-[#055A43]/5 pt-3 mt-1">
                  <span className="text-[12px] uppercase tracking-wider text-[#6B7A6E]/80 font-semibold">Fase</span>
                  <span className="text-[#055A43] font-medium text-[13px]">{sanitizeText(trainingReason.phase)}</span>
               </div>
               <div className="flex items-center justify-between border-t border-[#055A43]/5 pt-3">
                  <span className="text-[12px] uppercase tracking-wider text-[#6B7A6E]/80 font-semibold">Foco Atual</span>
                  <span className="text-[#055A43] font-medium text-[13px]">{sanitizeText(trainingReason.focus)}</span>
               </div>
             </div>
          </motion.div>
        )}

        <div className="bg-[#055A43]/5 rounded-[1.5rem] p-5 mb-8 border border-[#055A43]/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#055A43]/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#055A43]" />
            </div>
            <span className="font-semibold text-[#055A43] text-sm uppercase tracking-wider">Antes de começar</span>
          </div>
          <p className="text-[#506352] text-sm leading-relaxed font-light">
            {sanitizeText((TRAINING_TEMPLATES[activeTask.id] as any)?.beforeStart || "Use reforço positivo, faça sessões curtas e escolha um ambiente calmo. Avance apenas quando o cão estiver confortável.")}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#E5E5E5] mb-12">
          <h3 className="font-medium text-[#506352] text-sm tracking-widest uppercase mb-6 flex items-center justify-between">
            <span>Passo a passo</span>
            <span className="text-[10px] text-[#A0A4A1]">{activeTask.duration}</span>
          </h3>
          <div className="flex flex-col gap-6">
            {stepsToUse.map((step, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                key={index}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full bg-[#F7F5EF] border border-[#055A43]/10 flex items-center justify-center text-[#055A43] font-serif text-sm shrink-0">
                  {index + 1}
                </div>
                <p className="text-[#6B7A6E] text-[15px] leading-relaxed pt-1">
                  {sanitizeText(step)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timer Section — "momento de treino": card suave verde */}
        <div className="flex flex-col items-center justify-center mb-8 bg-[#EAF0E8] rounded-[20px] p-6">
          <div className="text-[64px] font-mono tracking-tighter text-[#055A43] mb-6 font-light tabular-nums">
            {formatTime(timeElapsed)}
          </div>
          <button
            onClick={handleToggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(45,74,58,0.08)] transform transition-transform duration-150 ease-out active:scale-95 border-4 border-[#FFFEFB] ${timerRunning ? 'bg-[#506352] text-white' : 'bg-[#055A43] text-white shadow-[#055A43]/20'}`}
          >
            {timerRunning ? (
              <Pause className="w-8 h-8" fill="currentColor" />
            ) : (
                <Play className="w-8 h-8 ml-2" fill="currentColor" />
            )}
          </button>
        </div>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pt-6 bg-gradient-to-t from-[#F7F5EF] via-[#F7F5EF] to-transparent" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <button 
          onClick={handleCompleteRequest}
          disabled={isSaving}
          className="w-full bg-[#055A43] text-white h-14 rounded-2xl font-medium text-base flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(5,90,67,0.2)] active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {isSaving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Marcar como Concluído</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
