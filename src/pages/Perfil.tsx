import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, collection, getDocs, limit, query, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Settings, ShieldPlus, ChevronRight, HelpCircle, LogOut, Utensils, Syringe, Crown, CalendarClock, Bell } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getSubscriptionPlan, getSubscriptionStatus, hasPremiumAccess } from '@/src/types';
import { DogRepository } from '@/src/repositories/DogRepository';

export function Perfil() {
  const navigate = useNavigate();
  const { userProfile, isPremium } = useAuth();
  
  const [userName, setUserName] = useState('');
  const [dogData, setDogData] = useState<any>(null);
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
    
    if (plan === 'premium') return { text: 'Premium', color: 'bg-emerald-400/20 text-emerald-600 border-emerald-400/30' };
    
    if (plan === 'trial') {
      const trialEndsAt = userProfile?.subscription?.trialEndsAt ?? userProfile?.trialEndsAt;
      if (trialEndsAt && trialEndsAt > Date.now()) {
        const daysLeft = Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24));
        return { text: `Trial (${daysLeft} dias)`, color: 'bg-orange-400/20 text-orange-600 border-orange-400/30' };
      }
    }
    
    return { text: 'Plano Grátis', color: 'bg-[#5C615D]/10 text-[#5C615D] border-[#5C615D]/20' };
  };

  const planBadge = getSubscriptionDisplay();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="flex-1 bg-[#FAFAFA] font-sans pb-32 overflow-y-auto">
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
            <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden shadow-xl shadow-[#055A43]/10 mb-4 border border-[#055A43]/10 bg-[#055A43] flex items-center justify-center">
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
          onClick={() => navigate('/assinatura')}
          className={`mt-4 px-4 py-1.5 rounded-full flex items-center gap-2 border ${planBadge.color} active:scale-95 transition-transform`}
        >
          {getSubscriptionPlan(userProfile) === 'premium' ? <Crown className="w-4 h-4" /> : <ShieldPlus className="w-4 h-4" />}
          <span className="text-[10px] font-medium tracking-widest uppercase">{planBadge.text}</span>
        </button>
      </header>

      <main className="px-6 py-8 flex flex-col gap-8">
        
        {/* Desenvolvimento & Treinos */}
        <section>
          <h3 className="text-[10px] font-medium text-[#5C615D] tracking-[0.15em] uppercase mb-3 px-2">
            Desenvolvimento
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
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
                  <p className="text-[#5C615D]/70 text-[11px] font-light mt-0.5">Sessões concluídas</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
          </div>
        </section>

        {/* Saude & Rotina */}
        <section>
          <h3 className="text-[10px] font-medium text-[#5C615D] tracking-[0.15em] uppercase mb-3 px-2">
            Saúde & Rotina
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
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
                  <p className="text-[#5C615D]/70 text-[11px] font-light mt-0.5">Plano alimentar e pesagem</p>
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
                  <p className="text-[#5C615D]/70 text-[11px] font-light mt-0.5">Próximas doses e histórico</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#506352]/40" />
            </button>
          </div>
        </section>

        {/* Conta */}
        <section>
          <h3 className="text-[10px] font-medium text-[#5C615D] tracking-[0.15em] uppercase mb-3 px-2">
            Conta
          </h3>
          <div className="bg-white rounded-[1.5rem] p-2 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
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
              onClick={() => navigate('/assinatura')}
              className="flex items-center justify-between p-4 active:bg-[#055A43]/5 rounded-xl transition-colors bg-[#055A43]/[0.03] border border-[#055A43]/10 mx-1 my-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#055A43] flex items-center justify-center text-white shadow-md shadow-[#055A43]/20">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#055A43] text-sm">Seu plano</p>
                  <p className="text-[#055A43]/70 text-[11px] font-light mt-0.5">Status da assinatura e acesso</p>
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
                  <p className="text-[#5C615D]/70 text-[11px] font-light mt-0.5">FAQ</p>
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

        {/* Logout */}
        <section className="pt-4">
          <button 
            onClick={handleSignOut}
            className="w-full bg-white rounded-[1.5rem] p-4 border border-[#5F2620]/10 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex items-center justify-center gap-2 active:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#5F2620]" />
            <span className="font-medium text-[#5F2620] text-sm tracking-wide">Encerrar Sessão</span>
          </button>
        </section>

      </main>
    </div>
  );
}
