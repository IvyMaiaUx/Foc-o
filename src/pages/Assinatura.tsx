import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Crown, Loader2, Sparkles, CreditCard } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { hasPremiumAccess } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { hapticLightTap } from '@/src/lib/haptic';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';

const claimApiUrl = import.meta.env.VITE_PREMIUM_CLAIM_API_URL || '';
const apiBase = claimApiUrl.includes('/api/') ? claimApiUrl.substring(0, claimApiUrl.indexOf('/api/')) : '';

function formatDate(ts?: number) {
  if (!ts) return '--/--/----';
  return new Date(ts).toLocaleDateString('pt-BR');
}

export function Assinatura() {
  const navigate = useNavigate();
  const { userProfile, isLoading: isAuthLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [portalError, setPortalError] = useState('');

  // Dynamic Stripe Checkout configuration
  const [checkoutUrl, setCheckoutUrl] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'adminSettings/productConfig');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          // Load checkout link from either monthlyCheckoutUrl or hotmart/stripe config
          setCheckoutUrl(data?.monthlyCheckoutUrl || '');
        }
      } catch (err) {
        console.error('Error loading product config:', err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!isAuthLoading && userProfile) {
      const isPremiumUser = hasPremiumAccess(userProfile);
      if (!isPremiumUser) {
        AnalyticsRepository.logEvent('premium_viewed');
      }
    }
  }, [isAuthLoading, userProfile]);

  const handleManageSubscription = async () => {
    hapticLightTap();
    setIsOpeningPortal(true);
    setPortalError('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_CUSTOMER_PORTAL_API_URL || 
        (apiBase ? `${apiBase}/api/customer-portal` : '/api/customer-portal');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      if (!response.ok) {
        throw new Error('Falha ao abrir portal de gerenciamento.');
      }

      const data = await response.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Nenhum link retornado do portal.');
      }
    } catch (err: any) {
      console.error(err);
      setPortalError(err.message || 'Erro ao carregar o portal. Tente novamente.');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;

    let isMounted = true;
    const wasPremiumBefore = hasPremiumAccess(userProfile);

    refreshProfile().then(async () => {
      if (!isMounted) return;
      
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const freshProfile = userDoc.exists() ? userDoc.data() : null;
        const isPremiumNow = hasPremiumAccess(freshProfile as any);
        
        if (!wasPremiumBefore && isPremiumNow) {
          AnalyticsRepository.logEvent('premium_subscribed', { source: 'refresh_profile' });
        } else if (wasPremiumBefore && !isPremiumNow) {
          AnalyticsRepository.logEvent('premium_cancelled', { source: 'refresh_profile' });
        }
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading]);

  if (loading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 text-[#055A43] animate-spin" />
      </div>
    );
  }

  const isPremium = hasPremiumAccess(userProfile);
  const activeSince = userProfile?.subscription?.createdAt || userProfile?.createdAt;
  const stripeCustomerId = userProfile?.subscription?.stripeCustomerId;

  const benefits = [
    'Plano de treino completo e personalizado',
    'Relatório semanal de evolução',
    'Insights com base nos check-ins',
    'Nutrição, vacinas e rotina em um só lugar',
    'Acompanhamento contínuo da jornada do cão',
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col items-center">
      <header className="w-full max-w-lg px-6 pt-16 pb-4 flex items-center justify-between">
        <button
          onClick={() => { hapticLightTap(); navigate(-1); }}
          className="w-10 h-10 rounded-full bg-white border border-[#055A43]/10 flex items-center justify-center text-[#5C615D] shadow-sm active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 w-full max-w-lg px-6 pt-4 pb-32 flex flex-col gap-6">
        <h1 className="font-serif text-[34px] tracking-tight text-[#055A43] mb-2 px-2">Seu plano</h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-[2rem] p-8 shadow-lg shadow-[#055A43]/5 border border-[#055A43]/5 relative overflow-hidden"
        >
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#055A43]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[1.4rem] bg-emerald-50 flex items-center justify-center shrink-0">
              {isPremium ? (
                <Crown className="w-7 h-7 text-emerald-600" />
              ) : (
                <Sparkles className="w-7 h-7 text-[#506352]" />
              )}
            </div>

            <div className="min-w-0">
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-3 ${
                isPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-[#506352]'
              }`}>
                {isPremium ? 'Premium ativo' : 'Premium não ativo'}
              </span>
              <h2 className="font-serif text-2xl text-[#055A43] leading-tight">
                {isPremium ? 'Focão Premium' : 'Acesso gratuito'}
              </h2>
              <p className="mt-2 text-[14px] text-[#506352] leading-relaxed">
                {isPremium
                  ? `Ativo desde: ${formatDate(activeSince)}`
                  : 'Quando seu Premium for liberado, os benefícios aparecem automaticamente nesta conta.'}
              </p>
              
              {stripeCustomerId && (
                <div className="mt-4">
                  <button
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                    className="h-10 rounded-xl bg-[#055A43]/5 border border-[#055A43]/10 px-4 text-[12px] font-semibold text-[#055A43] flex items-center gap-2 active:scale-95 transition-all hover:bg-[#055A43]/10 disabled:opacity-50 cursor-pointer"
                  >
                    {isOpeningPortal ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    {isPremium ? 'Gerenciar assinatura' : 'Atualizar pagamento'}
                  </button>
                  {portalError && (
                    <p className="text-red-500 text-[11px] mt-1.5 font-medium">{portalError}</p>
                  )}
                </div>
              )}

              {userProfile?.subscription?.cancelAtPeriodEnd && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/50 text-amber-900 text-[13px] leading-relaxed animate-fadeIn">
                  Sua assinatura Premium está programada para ser cancelada. Você manterá o acesso Premium até{' '}
                  <span className="font-semibold">{formatDate(userProfile?.subscription?.currentPeriodEnd)}</span>.
                  Nenhuma nova cobrança será realizada.
                </div>
              )}



            </div>
          </div>

          {!isPremium && (
            <div className="mt-6">
              <a
                href={checkoutUrl || import.meta.env.VITE_STRIPE_PAYMENT_LINK || '#'}
                target={(checkoutUrl || import.meta.env.VITE_STRIPE_PAYMENT_LINK) ? "_blank" : "_self"}
                rel="noreferrer"
                onClick={(e) => {
                  hapticLightTap();
                  if (!checkoutUrl && !import.meta.env.VITE_STRIPE_PAYMENT_LINK) {
                    e.preventDefault();
                    alert('Link de pagamento não configurado no painel administrativo.');
                  } else {
                    AnalyticsRepository.logEvent('premium_clicked', {
                      url: checkoutUrl || import.meta.env.VITE_STRIPE_PAYMENT_LINK
                    });
                  }
                }}
                className="w-full h-13 rounded-2xl bg-[#055A43] text-white text-[15px] font-semibold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all hover:bg-[#044a37] shadow-sm shadow-[#055A43]/10 cursor-pointer"
              >
                <Crown className="w-4.5 h-4.5 text-emerald-300 animate-pulse" />
                Seja Premium por R$ 47,00/mês
              </a>
            </div>
          )}

          <div className="mt-7 pt-6 border-t border-[#055A43]/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#055A43]/60 mb-4">
              Benefícios Premium
            </p>

            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[14px] leading-relaxed text-[#506352]">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[12px] text-[#5C615D]/60 px-6 font-light">
          O acesso Premium é vinculado ao email usado na compra e nesta conta.
        </p>
      </main>
    </div>
  );
}
