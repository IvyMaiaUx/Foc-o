import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toLocalDateKey } from '@/src/lib/dateKeys';
import { hapticLightTap } from '@/src/lib/haptic';
import { auth, db } from '@/src/lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, Flame, Utensils, Bell, FileText, ChevronRight, Sparkles, Activity, X, Lock, Calendar, Syringe, AlertTriangle, MessageSquareText } from 'lucide-react';
import { DogRepository } from '@/src/repositories/DogRepository';
import { UserRepository } from '@/src/repositories/UserRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { DogProfile, CurrentPlan, TrainingTask, UserProfile } from '@/src/types';
import { EvolutionSummary } from '@/src/repositories/EvolutionRepository';
import { CheckinRepository, CheckinData } from '@/src/repositories/CheckinRepository';
import { MissionsRepository } from '@/src/repositories/MissionsRepository';
import { NutritionMotor } from '@/src/motors/NutritionMotor';
import { TRAINING_TEMPLATES } from '@/src/lib/trainingTemplates';
import { HomeMotor, HomeState } from '@/src/motors/HomeMotor';
import { VaccineRepository } from '@/src/repositories/VaccineRepository';
import { CheckinInsightsMotor, CheckinInsights } from '@/src/motors/CheckinInsightsMotor';
import { NotificationRepository } from '@/src/repositories/NotificationRepository';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/src/contexts/AuthContext';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { isBetaEnvironment } from '@/src/lib/beta';
import { isPlanUpgradeEligible } from '@/src/lib/planUpgrade';
import { DailyMissionsMotor, DailyMission, GapDirective } from '@/src/motors/DailyMissionsMotor';

export function Home() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const isBeta = isBetaEnvironment();
  
  useEffect(() => {
    const sessionKey = 'focao_session_started_logged';
    if (!sessionStorage.getItem(sessionKey)) {
      AnalyticsRepository.logEvent('session_started');
      sessionStorage.setItem(sessionKey, 'true');
    }
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userName, setUserName] = useState<string>('Tutor');
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [evolution, setEvolution] = useState<EvolutionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [homeState, setHomeState] = useState<HomeState | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [checkinInsights, setCheckinInsights] = useState<CheckinInsights | null>(null);
  const [promoNotification, setPromoNotification] = useState<any | null>(null);
  const [recentCheckinDays, setRecentCheckinDays] = useState(0);
  const [showBetaFeedbackPrompt, setShowBetaFeedbackPrompt] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [checkinToday, setCheckinToday] = useState<CheckinData | null>(null);
  const [gapDirective, setGapDirective] = useState<GapDirective | null>(null);

  const [planBannerDismissed, setPlanBannerDismissed] = useState(
    () => localStorage.getItem('focao_plan_upgrade_dismissed') === 'true'
  );
  const showPlanUpgradeBanner = !planBannerDismissed && isPlanUpgradeEligible(dogProfile, currentPlan);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  useEffect(() => {
    if (!isBeta) return;
    if (localStorage.getItem('focao_beta_feedback_dismissed') === 'true') return;

    const nextUses = Number(localStorage.getItem('focao_beta_home_uses') || '0') + 1;
    localStorage.setItem('focao_beta_home_uses', String(nextUses));

    if (nextUses >= 2) {
      const timer = window.setTimeout(() => setShowBetaFeedbackPrompt(true), 1200);
      return () => window.clearTimeout(timer);
    }
  }, [isBeta]);

  const closeBetaFeedbackPrompt = () => {
    localStorage.setItem('focao_beta_feedback_dismissed', 'true');
    setShowBetaFeedbackPrompt(false);
  };

  const sendQuickBetaFeedback = (label: string) => {
    closeBetaFeedbackPrompt();
    navigate('/suporte', {
      state: {
        betaPrompt: `[Feedback beta] Minha experiência até agora está: ${label}. O que mais me ajudou foi: `,
      },
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const profile = await UserRepository.getUserProfile(user.uid);
        // Só manda pro onboarding quando o perfil respondeu e disse explicitamente
        // que está incompleto — igual o guard do App.tsx (RequireAuth). Uma leitura
        // que falhou/voltou vazia (rede instável, sem cache local nesse dispositivo)
        // NÃO é sinal de onboarding pendente: mandar de volta pra anamnese nesse caso
        // já mandou usuário com conta pronta pra refazer tudo do zero.
        if (profile?.onboardingComplete === false) {
           navigate('/onboarding/intro');
           return;
        }
        if (profile) {
          setUserProfile(profile);
          setUserName(profile.name || 'Tutor');
        } else {
          console.warn('[Home] Leitura do perfil voltou vazia nesta sessão — seguindo sem redirecionar pro onboarding.');
        }

        const todayStr = toLocalDateKey();
        const [dog, plan, evol, todayCheckin, logs, vaccines, recentCheckins, activeNotifs, completedMissionIds] = await Promise.all([
          DogRepository.getDogProfile(user.uid),
          TrainingRepository.getCurrentPlan(user.uid),
          EvolutionRepository.getSummary(user.uid),
          CheckinRepository.getCheckin(user.uid, todayStr),
          TrainingRepository.getTrainingLogs(user.uid),
          VaccineRepository.getVaccines(user.uid),
          CheckinRepository.getRecentCheckins(user.uid, 7),
          NotificationRepository.getActiveNotifications(user.uid),
          MissionsRepository.getCompletedIds(user.uid, todayStr)
        ]);

        setDogProfile(dog);
        setCurrentPlan(plan);
        setEvolution(evol);
        setCheckinToday(todayCheckin);
        setCompletedMissions(new Set(completedMissionIds));
        setRecentCheckinDays(new Set(recentCheckins.map((checkin) => checkin.date).filter(Boolean)).size);
        
        const state = HomeMotor.calculateState(profile, dog, plan, evol, logs, todayCheckin, vaccines);
        setHomeState(state);

        const insights = CheckinInsightsMotor.analyze(recentCheckins, logs);
        setCheckinInsights(insights);
        setGapDirective(DailyMissionsMotor.detectGap(logs, dog));

        const mappedNotifs = activeNotifs.map(n => ({
          id: n.id,
          title: n.title,
          message: n.body,
          time: formatDistanceToNow(n.createdAt, { locale: ptBR, addSuffix: true }),
          isNew: true,
          type: n.title.toLowerCase().includes('vacina') ? 'vaccine'
              : n.title.toLowerCase().includes('relatório') ? 'report'
              : 'system',
          link: n.link
        }));
        setNotifications(mappedNotifs);

        const referralNotif = activeNotifs.find((n: any) =>
          n.type === 'referral_reward_indicator' || n.type === 'referral_reward_referee'
        );
        if (referralNotif) {
          setPromoNotification(referralNotif);

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              if (referralNotif.type === 'referral_reward_indicator') {
                const friendName = referralNotif.friendName || 'Seu amigo';
                new Notification('🎁 Recompensa liberada!', {
                  body: `${friendName} ativou o Premium e você ganhou +7 dias de acesso Premium.`,
                  icon: '/icon-192.png',
                });
              } else if (referralNotif.type === 'referral_reward_referee') {
                const referrerName = referralNotif.referrerName || 'Tutor';
                new Notification('🎉 Obrigado por apoiar o Focão!', {
                  body: `Sua assinatura está ativa. E tem mais: ${referrerName} (que te convidou) acabou de receber +7 dias Premium graças à sua indicação. 🐶💛`,
                  icon: '/icon-192.png',
                });
              }
            } catch (err) {
              console.warn('Native notification simulation failed:', err);
            }
          }
        }

      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#F7F5EF] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  const activeTask = currentPlan?.tasks[currentPlan?.currentTaskIndex || 0];
  const todayKey = toLocalDateKey();
  const dailyMissions = DailyMissionsMotor.generateMissions(dogProfile, activeTask ?? null);

  // Conclusão AUTOMÁTICA a partir das ações reais do dia:
  // passeio no check-in → daily_walk; treino do dia concluído → daily_training.
  const walkedToday = checkinToday?.behaviors?.walked === true || checkinToday?.context?.walked === true;
  const trainingDoneToday = homeState?.hasCompletedTrainingToday ?? false;
  const autoCompletedMissions = new Set(
    DailyMissionsMotor.autoCompletedIds(dailyMissions, { walkedToday, trainingDoneToday })
  );
  const isMissionDone = (id: string) => completedMissions.has(id) || autoCompletedMissions.has(id);

  const handleMissionTap = (id: string) => {
    hapticLightTap();
    setCompletedMissions(prev => new Set(prev).add(id));
    const user = auth.currentUser;
    if (user) {
      MissionsRepository.completeMission(user.uid, todayKey, id).catch((err) => {
        console.warn('[Missions] Não foi possível salvar a missão concluída', err);
      });
    }
  };

  const dogName = dogProfile?.name || 'Seu cão';
  const dogArticle = dogProfile?.gender === 'female' ? 'a' : 'o';
  const streak = EvolutionRepository.liveStreak(evolution);
  // Calculate nutrition info
  const nutritionDaily = NutritionMotor.calculateFood(dogProfile).daily;

  // Plan progress (for the Evolução card)
  const planTotalTasks = currentPlan?.tasks.length || 0;
  const planDoneTasks = Math.min(currentPlan?.currentTaskIndex ?? 0, planTotalTasks);
  const planProgressPct = planTotalTasks > 0 ? Math.round((planDoneTasks / planTotalTasks) * 100) : 0;

  const showReportReady = (homeState?.hasCompletedTrainingToday || false)
    && (evolution?.totalSessions ?? 0) >= 7
    && recentCheckinDays >= 3;

  return (
    <div className="flex-1 bg-[#F7F5EF] font-sans pb-24 overflow-x-hidden selection:bg-[#055A43]/20">
      <div className="max-w-lg mx-auto w-full">

        {/* Green header zone — full-bleed hero: greeting + treino do dia */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-[#055A43] px-5 pt-8 pb-10"
        >
          {/* Decorative ghost circles */}
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute right-8 top-20 w-24 h-24 rounded-full bg-white/[0.04] pointer-events-none" />

          {/* Header row */}
          <header className="relative z-10 flex justify-between items-start mb-7 gap-3">
            <div className="flex flex-col min-w-0">
              <p className="text-[13px] font-medium text-white/55 mb-1.5">
                Olá, {userName?.split(' ')[0] || 'Tutor'}
              </p>
              <h1 className="font-serif font-semibold text-[32px] text-white tracking-tight leading-[1.15] break-words">
                {dogProfile?.name ? (
                  <>Como está<br /><span className="line-clamp-1">{dogArticle} {dogName}?</span></>
                ) : (
                  <>Resumo<br />de hoje</>
                )}
              </h1>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={toggleNotifications}
                className="w-[38px] h-[38px] rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all cursor-pointer relative"
                aria-label="Notificações"
              >
                {notifications.some(n => n.isNew) && (
                  <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-400 rounded-full border border-[#055A43]" />
                )}
                <Bell className="w-[17px] h-[17px]" strokeWidth={2} />
              </button>
              <button onClick={() => navigate('/perfil')} className="relative active:scale-95 transition-transform text-left">
                <div className="w-[46px] h-[46px] rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10">
                  {dogProfile?.photoUrl ? (
                    <img
                      src={dogProfile.photoUrl}
                      alt="Avatar do cão"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-white text-xl opacity-90">
                        {dogProfile?.name?.charAt(0).toUpperCase() || 'C'}
                      </span>
                    </div>
                  )}
                </div>
                {streak > 0 && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#C2703E] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#055A43] whitespace-nowrap flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5" />
                    {streak}
                  </div>
                )}
              </button>
            </div>
          </header>

          {/* Daily Training Card - Hero, nested inside the green zone */}
          {(activeTask || homeState?.hasCompletedTrainingToday) ? (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative z-10 rounded-[20px] p-5 border border-white/10 bg-black/15 cursor-pointer group"
              onClick={() => {
                hapticLightTap();
                if (homeState?.isPremiumLocked) {
                  navigate('/assinatura');
                  return;
                }
                homeState?.hasCompletedTrainingToday ? navigate('/evolucao') : navigate('/treino')
              }}
            >
              <div className="flex flex-col text-white">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/45">
                    {homeState?.hasCompletedTrainingToday ? 'Concluído' : 'Treino do dia'}
                  </span>
                  {!homeState?.hasCompletedTrainingToday && activeTask && (
                    <span className="text-white/45 text-[11px] font-medium">
                      {activeTask.duration}
                    </span>
                  )}
                  {homeState?.hasCompletedTrainingToday && (
                    <CheckCircle2 className="w-5 h-5 text-white/50" />
                  )}
                </div>

                <h3 className="font-sans text-[20px] font-semibold leading-[1.3] mb-2">
                  {homeState?.heroTitle}
                </h3>
                <p className="text-white/55 text-[13px] leading-relaxed mb-[18px] line-clamp-2">
                  {homeState?.heroSubtitle}
                </p>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 bg-[#C2703E] rounded-[10px] px-[18px] py-[11px] text-[13px] font-semibold group-hover:brightness-105 transition-all">
                    {homeState?.isPremiumLocked ? <Lock className="w-3.5 h-3.5" /> : (homeState?.hasCompletedTrainingToday ? <Activity className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" fill="currentColor" />)}
                    {homeState?.heroCta}
                  </span>
                  {isPremium && (activeTask && !homeState?.hasCompletedTrainingToday) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); hapticLightTap(); navigate('/escolher-treino'); }}
                      className="text-[12px] text-white/35 underline underline-offset-2"
                    >
                      Ver catálogo
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative z-10 flex flex-col items-center justify-center bg-white/[0.06] border border-white/10 rounded-[20px] p-6 text-center"
            >
              <div className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-white mb-3">Tudo concluído!</h3>
              <p className="text-white/55 text-[15px] leading-relaxed max-w-[240px] mb-5">Estamos preparando o próximo plano de treinos. Já já ele aparece por aqui.</p>
              {isPremium && (
                <button
                  onClick={() => { hapticLightTap(); navigate('/escolher-treino'); }}
                  className="h-11 px-5 rounded-full bg-[#C2703E] text-white text-sm font-semibold active:scale-[0.98] transition-all"
                >
                  Escolher um treino extra
                </button>
              )}
            </motion.section>
          )}
        </motion.div>

        {/* White drawer — resto do conteúdo, sobrepõe a zona verde */}
        <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] flex flex-col gap-6 pt-7 px-5">

        {isBeta && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-[1.5rem] border border-[#055A43]/10 bg-white p-5 shadow-[0_8px_24px_rgba(5,90,67,0.06)]"
          >
            <div className="mb-3 flex items-center gap-2 text-[#055A43]">
              <Sparkles className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">Beta Focão</p>
            </div>
            <h2 className="font-serif text-[24px] leading-tight text-[#055A43]">
              Você está no Beta do Focão
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B7A6E]">
              Use o app normalmente e, quando puder, nos envie seu feedback. Isso vai ajudar a construir a versão oficial.
            </p>
            <button
              type="button"
              onClick={() => navigate('/beta')}
              className="mt-4 rounded-full bg-[#055A43] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white"
            >
              Enviar feedback
            </button>
          </motion.section>
        )}

        {/* Priority Alert banner if any */}
        <AnimatePresence>
          {homeState?.priorityAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: -16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-orange-50 border border-orange-200 rounded-2xl p-4 overflow-hidden -mt-2"
            >
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-sm font-medium text-orange-800 leading-snug">{homeState.priorityAlert}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WhatsApp Connection Banner */}
        {userProfile?.whatsappEnabled !== true && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50/70 border border-[#25D366]/30 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(37,211,102,0.03)] flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(37,211,102,0.3)] text-lg">
              📱
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <h3 className="font-semibold text-sm text-[#075E54]">
                WhatsApp do Focão
              </h3>
              <p className="text-[13px] text-[#6B7A6E] leading-relaxed">
                Receba lembretes de treino, avisos de inatividade e relatórios semanais direto no seu WhatsApp.
              </p>
              <button
                onClick={() => {
                  hapticLightTap();
                  navigate('/notificacoes');
                }}
                className="mt-2 self-start bg-[#055A43] hover:bg-[#075E54] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Conectar WhatsApp
              </button>
            </div>
          </motion.div>
        )}

        {/* Plan Upgrade Banner */}
        {showPlanUpgradeBanner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#055A43]/20 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(5,90,67,0.05)] flex gap-4 items-start"
          >
            <div className="flex-1 flex flex-col gap-1.5">
              <h3 className="font-semibold text-sm text-[#055A43]">Deixe seu plano mais inteligente</h3>
              <p className="text-[13px] text-[#6B7A6E] leading-relaxed">
                Responda mais algumas perguntas e recalculamos seu plano com base no perfil do seu cão.
                Seus treinos já concluídos são mantidos.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    hapticLightTap();
                    navigate('/onboarding/personality', { state: { mode: 'updatePlan', dogData: dogProfile } });
                  }}
                  className="bg-[#055A43] text-white text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 cursor-pointer"
                >
                  Recalcular plano
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('focao_plan_upgrade_dismissed', 'true');
                    setPlanBannerDismissed(true);
                  }}
                  className="text-[#6B7A6E] text-xs font-medium px-3 py-2"
                >
                  Agora não
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Dynamic Notification (Report) */}
        <AnimatePresence>
          {showReportReady && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
              className="bg-white rounded-[2rem] p-4 flex items-center justify-between border border-[#055A43]/10 shadow-[0_8px_30px_rgba(45,74,58,0.08)] cursor-pointer hover:border-[#055A43]/30 transition-colors"
              onClick={() => navigate('/relatorio')}
            >
              <div className="flex items-center gap-4 pl-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-[#055A43]/20 rounded-full blur animate-pulse" />
                  <div className="relative w-12 h-12 bg-[#055A43] rounded-full flex items-center justify-center text-white shadow-inner">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-[#055A43] mb-0.5 flex items-center gap-2">
                    Relatório da semana <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  </h4>
                  <p className="text-[12px] text-[#6B7A6E] font-medium">Sua análise semanal está pronta.</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#055A43]/50">
                <ChevronRight className="w-5 h-5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gap Directive */}
        {gapDirective && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.13 }}
            className="bg-[#FBF3E4] rounded-[20px] p-[18px] shadow-[0_8px_24px_rgba(45,74,58,0.08)]"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B07C3A] mb-2">
              Hoje {dogName} precisa...
            </p>
            <p className="text-[15px] font-semibold text-[#4A3A22] leading-snug mb-2">
              Que tal retomar {gapDirective.skillLabel}?
            </p>
            <p className="text-[13px] text-[#9A6A2E] leading-relaxed">
              {gapDirective.suggestion}
            </p>
          </motion.section>
        )}

        {/* Daily Missions */}
        {!isLoading && dailyMissions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white rounded-[2rem] p-5 border border-[#055A43]/5 shadow-[0_8px_24px_rgba(45,74,58,0.08)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[#055A43]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#055A43]">Missões da semana</p>
            </div>
            <div className="flex flex-col gap-1">
              {dailyMissions.map((mission) => {
                const done = isMissionDone(mission.id);
                return (
                  <button
                    key={mission.id}
                    onClick={() => !done && handleMissionTap(mission.id)}
                    className={`flex items-start gap-3 text-left w-full rounded-2xl p-3 transition-all ${done ? '' : 'hover:bg-[#055A43]/5 active:bg-[#055A43]/8'}`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 ${done ? 'bg-[#055A43] border-[#055A43] animate-pop' : 'border-[#055A43]/25'}`}>
                      {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[14px] font-medium leading-snug transition-all duration-200 ${done ? 'line-through text-[#6B7A6E]/40' : 'text-[#506352]'}`}>
                        {mission.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-semibold text-[#055A43]/50 uppercase tracking-widest">{mission.when}</span>
                        <span className="text-[9px] text-[#6B7A6E]/30">·</span>
                        <span className="text-[10px] text-[#6B7A6E]/50">{mission.duration}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Bento Grid Actions */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Check-in */}
          <button 
            onClick={() => { hapticLightTap(); navigate('/checkin'); }}
            className={`group relative overflow-hidden flex flex-col p-5 rounded-[2rem] border shadow-[0_8px_20px_rgba(45,74,58,0.08)] items-start text-left gap-4 transition-all duration-300 hover:-translate-y-1 ${homeState?.hasCheckedInToday ? 'bg-[#055A43]/[0.02] border-[#055A43]/20 hover:border-[#055A43]/40' : (homeState?.priorityAction === 'checkin' ? 'bg-[#055A43]/10 border-[#055A43]/30' : 'bg-white border-[#055A43]/10 hover:border-[#055A43]/30')}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-16 h-16 text-[#055A43] -mr-4 -mt-4" />
            </div>
            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${homeState?.hasCheckedInToday ? 'bg-[#055A43] text-white' : 'bg-[#055A43]/5 text-[#055A43]'}`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="relative">
              <p className="font-bold text-gray-900 text-[16px] mb-1">Check-in</p>
              <p className={`text-[13px] font-medium leading-tight ${homeState?.hasCheckedInToday ? 'text-[#055A43]' : 'text-[#6B7A6E]'}`}>
                {homeState?.hasCheckedInToday ? "✓ Feito hoje · toque para editar" : "Pendente hoje"}
              </p>
            </div>
          </button>

          {/* Nutrição */}
          <button 
            onClick={() => { hapticLightTap(); navigate('/nutricao'); }}
            className={`group relative overflow-hidden flex flex-col p-5 rounded-[2rem] border shadow-[0_8px_20px_rgba(45,74,58,0.08)] items-start text-left gap-4 hover:-translate-y-1 transition-all duration-300 ${homeState?.nutritionIsPending && homeState?.priorityAction === 'nutrition' ? 'bg-[#506352]/10 border-[#506352]/30' : 'bg-white border-[#055A43]/10 hover:border-[#506352]/30'}`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Utensils className="w-16 h-16 text-[#506352] -mr-4 -mt-4" />
            </div>
            <div className="relative w-12 h-12 rounded-full bg-[#506352]/5 text-[#506352] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Utensils className="w-6 h-6" />
            </div>
            <div className="relative">
              <p className="font-bold text-gray-900 text-[16px] mb-1">Alimentação</p>
              {homeState?.nutritionIsPending ? (
                <p className="text-[13px] text-orange-600 font-medium leading-tight">Configuração<br />pendente</p>
              ) : (
                <p className="text-[13px] text-[#6B7A6E] font-medium leading-tight">Sugestão <br />consciente</p>
              )}
            </div>
          </button>

        </motion.section>

        {/* Treinos SOS */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="bg-[#055A43] text-white rounded-[2rem] p-5 shadow-[0_14px_30px_rgba(5,90,67,0.18)] flex items-center justify-between cursor-pointer group transition-all duration-300"
          onClick={() => { hapticLightTap(); navigate('/sos'); }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold mb-0.5">Treinos SOS</h4>
              <p className="text-[13px] font-medium text-white/70">Ajuda rápida para crise</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
        </motion.section>

        {/* Agenda Mini Card */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white border border-[#055A43]/10 rounded-[2rem] p-5 shadow-[0_8px_20px_rgba(45,74,58,0.08)] flex items-center justify-between cursor-pointer group hover:border-[#055A43]/30 transition-all duration-300"
          onClick={() => { hapticLightTap(); navigate('/agenda'); }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-[#055A43] group-hover:bg-[#055A43]/5 transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-gray-900 mb-0.5">Agenda do cão</h4>
              <p className="text-[13px] font-medium text-[#6B7A6E]">Ver próximos treinos</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#055A43] transition-colors" />
        </motion.section>

        {/* Evolução / Progresso */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#055A43]/[0.06] to-[#506352]/[0.03] border border-[#055A43]/10 rounded-[2rem] p-5 shadow-[0_8px_20px_rgba(45,74,58,0.08)] cursor-pointer group hover:border-[#055A43]/30 transition-all duration-300"
          onClick={() => { hapticLightTap(); navigate('/evolucao'); }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#055A43]/10 rounded-full flex items-center justify-center text-[#055A43] group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 leading-tight">Evolução geral</h4>
                <p className="text-[12px] font-medium text-[#6B7A6E]">{evolution?.totalSessions || 0} treinos realizados</p>
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-white/70 border border-orange-200/60 rounded-full px-3 py-1.5 shadow-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-[13px] font-bold text-orange-600">{streak}</span>
                <span className="text-[11px] font-medium text-[#6B7A6E]">dias</span>
              </div>
            )}
          </div>

          {planTotalTasks > 0 ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7A6E]/80">Progresso do plano</span>
                <span className="text-[13px] font-bold text-[#055A43]">{planProgressPct}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#055A43]/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${planProgressPct}%` }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#055A43] to-[#0a7a5c]"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium text-[#6B7A6E]">
                  Etapa {planDoneTasks} de {planTotalTasks}
                </p>
                <span className="flex items-center gap-1 text-[12px] font-semibold text-[#055A43] group-hover:gap-1.5 transition-all">
                  Ver detalhes <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-[#6B7A6E]">Acompanhe a evolução {dogArticle} {dogName}</p>
              <ChevronRight className="w-5 h-5 text-[#055A43]/50 group-hover:text-[#055A43] transition-colors" />
            </div>
          )}
        </motion.section>

        {/* Checkin Insights */}
        {checkinInsights?.hasEnoughData && isPremium && (
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white border border-[#055A43]/10 rounded-[2rem] p-5 shadow-[0_8px_20px_rgba(45,74,58,0.08)]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#055A43]/5 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-[#055A43]" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-1">Padrão observado</h4>
                <p className="text-[13px] text-[#6B7A6E] leading-relaxed">{checkinInsights.insightText}</p>
              </div>
            </div>
          </motion.section>
        )}

        </main>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleNotifications}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#F7F5EF] rounded-t-[2rem] z-[70] shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 pb-2">
                <h2 className="font-serif text-[24px] text-[#055A43]">Notificações</h2>
                <button 
                  onClick={toggleNotifications}
                  className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-[#6B7A6E] hover:bg-black/10 active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 pb-safe pt-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-[#6B7A6E]/60 flex flex-col items-center">
                    <Bell className="w-12 h-12 mb-3 text-[#055A43]/20" />
                    <p>Tudo tranquilo por aqui. Avisamos quando houver novidade.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {notifications.map(n => (
                      <button 
                        key={n.id}
                        onClick={async () => {
                          if (auth.currentUser) {
                            await NotificationRepository.markAsRead(n.id, auth.currentUser.uid);
                            // Optimistically update local state to remove the blue dot
                            setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isNew: false } : notif));
                          }
                          if (n.link) navigate(n.link);
                          else if (n.type === 'report') navigate('/relatorio');
                          else if (n.type === 'vaccine') navigate('/vacinas');
                          toggleNotifications();
                        }}
                        className={`text-left p-4 rounded-2xl border transition-colors ${
                          n.isNew ? 'bg-white border-[#055A43]/10 shadow-sm' : 'bg-transparent border-transparent hover:bg-black/5'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                            n.type === 'report' ? 'bg-[#055A43]/10 text-[#055A43]' :
                            n.type === 'vaccine' ? 'bg-orange-50 text-orange-500' :
                            'bg-[#E5F2ED] text-[#506352]'
                          }`}>
                            {n.type === 'report' ? <FileText className="w-5 h-5" /> :
                             n.type === 'vaccine' ? <Syringe className="w-5 h-5" /> :
                             <Sparkles className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`font-bold text-[14px] ${n.isNew ? 'text-gray-900' : 'text-[#506352]'}`}>{n.title}</h4>
                              {n.isNew && <span className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 shrink-0" />}
                            </div>
                            <p className="text-[13px] text-[#6B7A6E] mb-2 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] uppercase tracking-widest text-[#6B7A6E]/60 font-medium">{n.time}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Promo Notification Modal */}
      <AnimatePresence>
        {promoNotification && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={async () => {
                const user = auth.currentUser;
                if (user) {
                  await NotificationRepository.markAsRead(promoNotification.id, user.uid);
                }
                setPromoNotification(null);
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-white rounded-[2rem] border border-[#055A43]/10 p-6 z-[90] shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-[#055A43]/5 rounded-full flex items-center justify-center mb-5 text-3xl">
                {promoNotification.type === 'referral_reward_indicator' ? '🎁' : '🎉'}
              </div>
              <h3 className="font-serif text-2xl text-[#055A43] mb-3 leading-tight font-bold">
                {promoNotification.title}
              </h3>
              <p className="text-[#6B7A6E] text-sm font-light leading-relaxed mb-6">
                {promoNotification.body}
              </p>
              <button
                onClick={async () => {
                  const user = auth.currentUser;
                  if (user) {
                    await NotificationRepository.markAsRead(promoNotification.id, user.uid);
                  }
                  setPromoNotification(null);
                }}
                className="w-full bg-[#055A43] hover:bg-[#044735] text-white h-12 rounded-xl font-semibold shadow-md active:scale-95 transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                Entendido
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBetaFeedbackPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBetaFeedbackPrompt}
              className="fixed inset-0 z-[95] bg-black/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: 'spring', damping: 26, stiffness: 330 }}
              className="fixed inset-x-4 top-1/2 z-[100] mx-auto flex max-w-sm -translate-y-1/2 flex-col rounded-[2rem] border border-[#055A43]/10 bg-white p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={closeBetaFeedbackPrompt}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#F7F6F3] text-[#6B7A6E]"
                aria-label="Fechar feedback"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#055A43]/10 text-[#055A43]">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl leading-tight text-[#055A43]">
                Como está sendo sua experiência?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#6B7A6E]">
                Seu feedback é essencial para evoluirmos o app.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {['Muito boa', 'Boa', 'Pode melhorar', 'Tive dificuldades'].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => sendQuickBetaFeedback(label)}
                    className="rounded-2xl border border-[#055A43]/10 bg-[#F7F5EF] px-3 py-3 text-xs font-bold text-[#055A43]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


