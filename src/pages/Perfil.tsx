import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Settings, ShieldPlus, ChevronRight, HelpCircle, LogOut, Utensils, Syringe, Crown, CalendarClock, Bell, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getSubscriptionPlan, getSubscriptionStatus, hasPremiumAccess } from '@/src/types';
import { DogRepository } from '@/src/repositories/DogRepository';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { isPlanUpgradeEligible } from '@/src/lib/planUpgrade';
import { CurrentPlan } from '@/src/types';
import { isBetaEnvironment } from '@/src/lib/beta';

const valueOrFallback = (value: any) => {
  if (value === undefined || value === null || value === '') return 'Não informado';
  return value;
};

const yesNo = (value: any) => {
  if (value === undefined || value === null || value === '') return 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  const normalized = String(value).trim().toLowerCase();
  if (['sim', 'yes', 'true', '1'].includes(normalized)) return 'Sim';
  if (['não', 'nao', 'no', 'false', '0'].includes(normalized)) return 'Não';
  return value;
};

const withUnit = (value: any, unit: string) => {
  if (value === undefined || value === null || value === '') return '';
  const text = String(value).trim();
  if (/[a-zA-ZÀ-ÿ]/.test(text)) return text;
  return text.toLowerCase().includes(unit.toLowerCase()) ? text : `${text} ${unit}`;
};

const firstRoutine = (dog: any) => {
  if (dog?.housingType) return dog.housingType;
  return Array.isArray(dog?.routine) ? dog.routine[0] : dog?.routine;
};

const housingLabel = (value?: string) => {
  const map: Record<string, string> = {
    apartment: 'Apartamento',
    house: 'Casa',
  };
  return value ? map[value] || value : 'Não informado';
};

const levelLabel = (value?: string) => {
  const map: Record<string, string> = {
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    beginner: 'Iniciante',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };
  return value ? map[value] || value : 'Não informado';
};

const behaviorLabel = (value: string) => {
  const map: Record<string, string> = {
    separation_anxiety: 'Ansiedade de separação',
    destructive: 'Comportamento destrutivo',
    barking: 'Latidos excessivos',
    pulling: 'Puxa muito no passeio',
    none: 'Nenhum problema grave',
  };
  return map[value] || value.replace(/_/g, ' ');
};

const behaviorIssues = (dog: any) => {
  if (Array.isArray(dog?.behaviorIssues) && dog.behaviorIssues.length > 0) {
    return dog.behaviorIssues.map(behaviorLabel).join(', ');
  }

  const behaviorMap: Record<string, string> = {
    anxiety: 'Ansiedade',
    barking: 'Latidos excessivos',
    reactivity: 'Reatividade',
    destruction: 'Destruição',
    aggression: 'Agressividade',
    peeWrongPlace: 'Xixi fora do lugar',
    fear: 'Medo ou insegurança',
    pullingLeash: 'Puxa a guia',
    hyperactivity: 'Hiperatividade',
  };

  const marked = Object.entries(dog?.behavior || {})
    .filter(([, value]) => Boolean(value))
    .map(([key]) => behaviorMap[key] || key);

  return marked.join(', ');
};

const rewardLabel = (value?: string) => {
  const map: Record<string, string> = {
    treats: 'Petiscos',
    toys: 'Brinquedos',
    praise: 'Elogios e carinho',
    play: 'Bolinha / brincadeiras',
    food: 'Comida em geral',
    unknown: 'Ainda não sei',
  };
  return value ? map[value] || value : 'Não informado';
};

function ProfileField({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-[#F7F5EF] border border-[#055A43]/5 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7A6E]/55 mb-1">{label}</p>
      <p className="text-[13px] font-medium text-[#506352] leading-snug">{valueOrFallback(value)}</p>
    </div>
  );
}

export function Perfil() {
  const navigate = useNavigate();
  const isBeta = isBetaEnvironment();
  const { userProfile, isPremium } = useAuth();
  
  const [userName, setUserName] = useState('');
  const [dogData, setDogData] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        if (userProfile) {
          setUserName(userProfile.name);
        } else {
          setUserName(user.displayName || 'Tutor');
        }
        
        const dogProfile = await DogRepository.getDogProfile(user.uid);
        if (dogProfile) {
          setDogData(dogProfile);
        }

        const plan = await TrainingRepository.getCurrentPlan(user.uid);
        setCurrentPlan(plan);
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setLoading(false);
      }

      // Check support unread status
      const unsubscribe = onSnapshot(doc(db, 'supportThreads', user.uid), (docSnap) => {
        if (docSnap.exists() && docSnap.data().unreadUser) {
          setHasUnreadSupport(true);
        } else {
          setHasUnreadSupport(false);
        }
      }, () => {
        // Ignore
      });
      return () => unsubscribe();
    };
    loadProfile();
  }, [userProfile]);

  const getSubscriptionDisplay = () => {
    const plan = getSubscriptionPlan(userProfile);
    const status = getSubscriptionStatus(userProfile);
    
    if (status === 'past_due') {
      return { text: 'Pagamento pendente', color: 'bg-red-400/20 text-red-600 border-red-400/30' };
    }

    if (status === 'canceled') {
      return { text: 'Cancelado', color: 'bg-[#6B7A6E]/10 text-[#6B7A6E] border-[#6B7A6E]/20' };
    }
    
    if (plan === 'premium' && hasPremiumAccess(userProfile)) return { text: 'Premium', color: 'bg-emerald-400/20 text-emerald-600 border-emerald-400/30' };
    
    if (plan === 'trial') {
      const trialEndsAt = userProfile?.subscription?.trialEndsAt ?? userProfile?.trialEndsAt;
      if (trialEndsAt && trialEndsAt > Date.now()) {
        const daysLeft = Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24));
        return { text: `Trial (${daysLeft} dias)`, color: 'bg-orange-400/20 text-orange-600 border-orange-400/30' };
      }
    }
    
    return { text: 'Plano Grátis', color: 'bg-[#6B7A6E]/10 text-[#6B7A6E] border-[#6B7A6E]/20' };
  };

  const planBadge = getSubscriptionDisplay();

  const canRecalcular = isPlanUpgradeEligible(dogData, currentPlan);

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsExporting(true);
    try {
      // 1. Fetch main docs
      const [userSnap, dogSnap, planSnap, evolSnap] = await Promise.all([
        getDoc(doc(db, 'users', user.uid)),
        getDoc(doc(db, 'users', user.uid, 'dog', 'profile')),
        getDoc(doc(db, 'users', user.uid, 'plan', 'current')),
        getDoc(doc(db, 'users', user.uid, 'evolution', 'summary'))
      ]);

      // 2. Fetch collections
      const [checkinsSnap, logsSnap, vaccinesSnap, customEventsSnap, customEventCompsSnap] = await Promise.all([
        getDocs(collection(db, 'users', user.uid, 'checkins')),
        getDocs(collection(db, 'users', user.uid, 'trainingLogs')),
        getDocs(collection(db, 'users', user.uid, 'vaccines')),
        getDocs(collection(db, 'users', user.uid, 'customEvents')),
        getDocs(collection(db, 'users', user.uid, 'customEventCompletions'))
      ]);

      // 3. Fetch support thread and messages
      const supportThreadSnap = await getDoc(doc(db, 'supportThreads', user.uid));
      let supportMessages: any[] = [];
      if (supportThreadSnap.exists()) {
        const msgsSnap = await getDocs(collection(db, 'supportThreads', user.uid, 'messages'));
        supportMessages = msgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      // 4. Assemble payload
      const payload = {
        exportedAt: new Date().toISOString(),
        userProfile: userSnap.exists() ? userSnap.data() : null,
        dogProfile: dogSnap.exists() ? dogSnap.data() : null,
        currentPlan: planSnap.exists() ? planSnap.data() : null,
        evolutionSummary: evolSnap.exists() ? evolSnap.data() : null,
        checkins: checkinsSnap.docs.map(d => d.data()),
        trainingLogs: logsSnap.docs.map(d => d.data()),
        vaccines: vaccinesSnap.docs.map(d => d.data()),
        customEvents: customEventsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        customEventCompletions: customEventCompsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        support: supportThreadSnap.exists() ? {
          thread: supportThreadSnap.data(),
          messages: supportMessages
        } : null
      };

      // 5. Trigger download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `focao-dados-${user.uid}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Erro ao exportar dados:", err);
      alert("Ocorreu um erro ao exportar seus dados. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmFirst = window.confirm(
      "Tem certeza absoluta de que deseja excluir sua conta e TODOS os seus dados do Focão permanentemente? Esta ação é irreversível."
    );
    if (!confirmFirst) return;

    const confirmSecond = window.confirm(
      "Para confirmar e cumprir a LGPD, o Focão irá deletar seu histórico de treinos, check-ins, vacinas, perfil do cão e cadastro. Clique em OK para confirmar a exclusão imediata."
    );
    if (!confirmSecond) return;

    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('https://foc-o.vercel.app/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Não foi possível concluir a exclusão. Tente novamente em alguns minutos.');
      }

      await signOut(auth).catch(() => undefined);

      alert("Sua conta e todos os seus dados foram excluídos com sucesso em conformidade com a LGPD.");
      navigate('/');
    } catch (err: any) {
      console.error("Erro ao excluir conta:", err);
      if (err?.code === 'auth/requires-recent-login') {
        alert(
          "Por motivos de segurança, você precisa fazer login novamente antes de excluir sua conta. Por favor, encerre a sessão, faça login de novo e repita o processo."
        );
      } else {
        alert(`Ocorreu um erro ao excluir sua conta: ${err.message || err}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="flex-1 bg-[#F7F5EF] font-sans pb-32">
      {/* Header Profile Area */}
      <header className="px-6 pt-16 pb-12 bg-white border-b border-[#055A43]/5 flex flex-col items-center">
        {loading ? (
          <>
            <div className="w-24 h-24 rounded-[2rem] bg-gray-200 animate-pulse mb-4" />
            <div className="w-48 h-8 bg-gray-200 animate-pulse rounded-md mb-2" />
            <div className="w-32 h-4 bg-gray-200 animate-pulse rounded-md" />
          </>
        ) : (
          <>
            <div className="relative w-24 h-24 rounded-[2rem] shadow-xl shadow-[#055A43]/10 mb-4 border border-[#055A43]/10 bg-[#055A43] flex items-center justify-center">
              <span className="absolute inset-0 rounded-[2rem] overflow-hidden flex items-center justify-center">
                {dogData?.photoUrl ? (
                  <img
                    src={dogData.photoUrl}
                    alt="Dog Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-white text-[40px] opacity-90">
                    {dogData?.name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                )}
              </span>
            </div>
            <h1 className="font-serif text-[28px] text-[#055A43] tracking-tight mb-1">
              {dogData ? dogData.name : 'Seu cão'}
            </h1>
            <p className="text-sm font-medium text-[#506352]/70 uppercase tracking-widest">
              Tutor(a): {userName.split(' ')[0] || 'Usuário'}
            </p>
          </>
        )}

        {/* Subscription Badge */}
        <button 
          onClick={() => navigate(isBeta ? '/beta' : '/assinatura')}
          className={`mt-4 px-4 py-1.5 rounded-full flex items-center gap-2 border ${planBadge.color} active:scale-95 transition-transform`}
        >
          {isBeta ? <ShieldPlus className="w-4 h-4" /> : getSubscriptionPlan(userProfile) === 'premium' ? <Crown className="w-4 h-4" /> : <ShieldPlus className="w-4 h-4" />}
          <span className="text-[10px] font-medium tracking-widest uppercase">{isBeta ? 'Beta gratuito' : planBadge.text}</span>
        </button>
      </header>

      <main className="px-6 py-8 flex flex-col gap-8">

        
        {/* Desenvolvimento & Treinos */}
        <section>
          <h3 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase mb-3 px-2">
            Desenvolvimento
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col">
            <button
              onClick={() => navigate('/sos')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Treinos SOS</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Protocolos rápidos para crise</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button
              onClick={() => navigate('/historico')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43]">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Histórico de Treinos</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Sessões concluídas</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
            {canRecalcular && (
              <>
                <div className="h-px w-[85%] bg-gray-100 self-end" />
                <button
                  onClick={() => navigate('/onboarding/personality', { state: { mode: 'updatePlan', dogData: dogData } })}
                  className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#506352] text-sm">Recalcular meu plano</p>
                      <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Gerar plano personalizado inteligente</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#506352]/40" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Saúde & Rotina */}
        <section>
          <h3 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase mb-3 px-2">
            Saúde & Rotina
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col">
            <button
              onClick={() => navigate('/nutricao')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43]">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Nutrição & Peso</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Plano alimentar e pesagem</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button 
              onClick={() => navigate('/vacinas')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43]">
                  <Syringe className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Carteira de Vacinação</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Próximas doses e histórico</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
          </div>
        </section>

        {/* Indicações */}
        <section>
          <h3 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase mb-3 px-2">
            Promoções
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col">
            <button onClick={() => navigate('/indique')}
              className="flex items-center justify-between p-4 px-3 active:bg-emerald-50/50 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/10 flex items-center justify-center text-[#055A43] text-lg font-bold">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#506352] text-sm">Indique e Ganhe</p>
                    {userProfile && userProfile.validReferrals > 0 && (
                      <span className="text-[9px] font-bold bg-[#055A43]/5 text-[#055A43] border border-[#055A43]/15 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        {userProfile.validReferrals === 1 && '🥉 Embaixador'}
                        {userProfile.validReferrals === 2 && '🥈 Tutor Influente'}
                        {userProfile.validReferrals >= 3 && '🥇 Embaixador Gold'}
                      </span>
                    )}
                  </div>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Ganhe 7 dias Premium com seus amigos</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
          </div>
        </section>

        {/* Conta */}
        <section>
          <h3 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase mb-3 px-2">
            Conta
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col">
            <button 
              onClick={() => navigate('/editar-perfil')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#506352]">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Editar Perfil</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button 
              onClick={() => navigate('/notificacoes')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#506352]">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Notificações & Lembretes</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button 
              onClick={() => navigate(isBeta ? '/beta' : '/assinatura')}
              className="flex items-center justify-between p-4 active:bg-[#055A43]/5 rounded-xl transition-colors bg-[#055A43]/[0.03] border border-[#055A43]/10 mx-1 my-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43] flex items-center justify-center text-white shadow-md shadow-[#055A43]/20">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#055A43] text-sm">{isBeta ? 'Beta Focão' : 'Seu plano'}</p>
                  <p className="text-[#055A43]/70 text-[11px] font-light mt-0.5">{isBeta ? 'Feedback, bugs e sugestões' : 'Status da assinatura e acesso'}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#055A43]/40" />
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button 
              onClick={() => navigate('/ajuda')}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#506352]">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#506352] text-sm">Perguntas Frequentes</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">FAQ</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button 
              onClick={() => navigate('/suporte')}
              className="flex items-center justify-between p-4 active:bg-[#055A43]/5 rounded-xl transition-colors bg-[#055A43]/[0.03] border border-[#055A43]/10 mx-1 mb-1"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 rounded-full bg-[#055A43]/10 flex items-center justify-center text-[#055A43]">
                  <span className="text-lg">💬</span>
                  {hasUnreadSupport && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#055A43] text-sm">Falar com Especialistas</p>
                    {hasUnreadSupport && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Novo
                      </span>
                    )}
                  </div>
                  <p className="text-[#055A43]/70 text-[11px] font-light mt-0.5">Chat de Suporte em tempo real</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#055A43]/40" />
            </button>
          </div>
        </section>

        {/* Privacidade (LGPD) */}
        <section>
          <h3 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase mb-3 px-2">
            Privacidade & LGPD
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col gap-1">
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center justify-between p-4 px-3 active:bg-gray-50 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43]/5 flex items-center justify-center text-[#055A43]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-[#506352] text-sm">Exportar Meus Dados</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Baixar meus dados estruturados em JSON</p>
                </div>
              </div>
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-[#055A43]/30 border-t-[#055A43] rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#506352]/40" />
              )}
            </button>
            <div className="h-px w-[85%] bg-gray-100 self-end" />
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="flex items-center justify-between p-4 px-3 active:bg-red-50/50 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-red-600 text-sm">Excluir Minha Conta</p>
                  <p className="text-[#6B7A6E]/70 text-[11px] font-light mt-0.5">Excluir permanentemente todos os meus dados (LGPD)</p>
                </div>
              </div>
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-red-300" />
              )}
            </button>
          </div>
        </section>

        {/* Logout */}
        <section className="pt-4">
          <button 
            onClick={handleSignOut}
            className="w-full bg-white rounded-[1.5rem] p-4 border border-[#C2703E]/10 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#C2703E]" />
            <span className="font-medium text-[#C2703E] text-sm tracking-wide">Encerrar Sessão</span>
          </button>
        </section>

      </main>
    </div>
  );
}
