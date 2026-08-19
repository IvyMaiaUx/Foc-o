import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Crown, Loader2, Sparkles, CreditCard, XCircle, ChevronRight, ReceiptText } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { hasPremiumAccess } from '@/src/types';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { hapticLightTap } from '@/src/lib/haptic';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { REFUND_STATUS_LABEL, RefundRepository, formatCurrency } from '@/src/repositories/RefundRepository';
import { apiUrl, readJson } from '@/src/lib/apiBase';
import type { BillingCharge } from '@/src/types';


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

  // Cancellation request form
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [cancelSubmitError, setCancelSubmitError] = useState('');
  const [cancelSubmitSuccess, setCancelSubmitSuccess] = useState(false);

  // Dynamic Stripe Checkout configuration
  const [checkoutUrl, setCheckoutUrl] = useState('');

  // Histórico de cobranças (vem da Stripe pela API — o app não guarda cobrança no Firestore)
  const [charges, setCharges] = useState<BillingCharge[]>([]);
  const [chargesLoading, setChargesLoading] = useState(true);
  const [chargesError, setChargesError] = useState('');

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
    let mounted = true;
    RefundRepository.getCharges()
      .then((data) => {
        if (mounted) setCharges(data.charges || []);
      })
      .catch((err: Error) => {
        if (mounted) setChargesError(err.message);
      })
      .finally(() => {
        if (mounted) setChargesLoading(false);
      });
    return () => { mounted = false; };
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
      const url = apiUrl('/api/customer-portal', import.meta.env.VITE_CUSTOMER_PORTAL_API_URL);

      const response = await fetch(url, {
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

      const data = await readJson<{ url?: string }>(response);
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

  const handleSubmitCancellation = async () => {
    hapticLightTap();
    setIsSubmittingCancel(true);
    setCancelSubmitError('');
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const url = apiUrl('/api/cancel-subscription', import.meta.env.VITE_CANCEL_SUBSCRIPTION_API_URL);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason.trim(), feedback: cancelFeedback.trim() }),
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar a solicitação. Tente novamente.');
      }
      // Confirma que quem respondeu foi a API, e não o app.html do Hosting com 200.
      await readJson<{ success?: boolean }>(response);

      setCancelSubmitSuccess(true);
      AnalyticsRepository.logEvent('subscription_canceled');
    } catch (err: any) {
      console.error(err);
      setCancelSubmitError(err.message || 'Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmittingCancel(false);
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
      <div className="flex justify-center items-center h-screen bg-[#F7F5EF]">
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
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col items-center">
      <div className="w-full max-w-lg">

        {/* Green header zone — hero: status da assinatura */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-[#055A43] px-6 pt-16 pb-10"
        >
          {/* Decorative ghost circles */}
          <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute right-6 top-24 w-24 h-24 rounded-full bg-white/[0.04] pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-7">
            <button
              onClick={() => { hapticLightTap(); navigate(-1); }}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 active:scale-[0.98] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <p className="relative z-10 text-[13px] font-medium text-white/55 mb-1.5">Sua assinatura</p>
          <h1 className="relative z-10 font-serif font-semibold text-[32px] text-white tracking-tight leading-[1.15] mb-6">
            {isPremium ? 'Focão Premium' : 'Acesso gratuito'}
          </h1>

          {/* Hero status card, nested inside the green zone */}
          <div className="relative z-10 rounded-[20px] border border-white/10 bg-white/[0.06] p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                {isPremium ? (
                  <Crown className="w-6 h-6 text-white" />
                ) : (
                  <Sparkles className="w-6 h-6 text-white/70" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border ${
                  isPremium ? 'bg-emerald-400/15 text-emerald-200 border-emerald-300/25' : 'bg-white/10 text-white/60 border-white/10'
                }`}>
                  {isPremium ? 'Premium ativo' : 'Premium não ativo'}
                </span>
                <p className="text-[13px] text-white/55 leading-relaxed">
                  {isPremium
                    ? `Ativo desde: ${formatDate(activeSince)}`
                    : 'Quando seu Premium for liberado, os benefícios aparecem automaticamente nesta conta.'}
                </p>

                {stripeCustomerId && (
                  <div className="mt-4">
                    <button
                      onClick={handleManageSubscription}
                      disabled={isOpeningPortal}
                      className="h-10 rounded-xl bg-white/10 border border-white/15 px-4 text-[12px] font-semibold text-white flex items-center gap-2 active:scale-95 transition-all hover:bg-white/15 disabled:opacity-50 cursor-pointer"
                    >
                      {isOpeningPortal ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      {isPremium ? 'Gerenciar assinatura' : 'Atualizar pagamento'}
                    </button>
                    {portalError && (
                      <p className="text-red-300 text-[11px] mt-1.5 font-medium">{portalError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* White drawer — resto do conteúdo, sobrepõe a zona verde */}
        <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] flex flex-col gap-6 pt-7 px-6 pb-32">

        {userProfile?.subscription?.cancelAtPeriodEnd && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/50 text-amber-900 text-[13px] leading-relaxed animate-fadeIn">
            Sua assinatura Premium está programada para ser cancelada. Você manterá o acesso Premium até{' '}
            <span className="font-semibold">{formatDate(userProfile?.subscription?.currentPeriodEnd)}</span>.
            Nenhuma nova cobrança será realizada.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
        >
          {!isPremium && (
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
              className="w-full h-13 rounded-xl bg-[#C2703E] text-white text-[15px] font-semibold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all hover:brightness-105 shadow-sm cursor-pointer mb-7"
            >
              <Crown className="w-4.5 h-4.5 text-white animate-pulse" />
              Seja Premium por R$ 47,00/mês
            </a>
          )}

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
        </motion.div>

        {/* Cobranças e reembolsos — "solicitar reembolso" é sobre uma cobrança JÁ feita, e
            não se confunde com "solicitar cancelamento" (que só impede cobranças futuras). */}
        {(chargesLoading || charges.length > 0 || chargesError) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#055A43]/60 mb-4">
              Cobranças e reembolsos
            </p>

            {chargesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-[#055A43] animate-spin" />
              </div>
            ) : chargesError ? (
              <p className="text-[13px] text-[#6B7A6E] leading-relaxed">{chargesError}</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#055A43]/8">
                {charges.map((charge) => (
                  <div key={charge.chargeId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#3A3F3B]">
                        {formatCurrency(charge.amount, charge.currency)}
                      </p>
                      <p className="text-[12px] text-[#6B7A6E] truncate">
                        {formatDate(charge.createdAt)}
                        {charge.cardLast4 ? ` · ${charge.cardBrand || 'cartão'} ••••${charge.cardLast4}` : ''}
                        {charge.refunded ? ' · reembolsada' : ''}
                      </p>
                    </div>

                    {charge.request ? (
                      <button
                        onClick={() => { hapticLightTap(); navigate(`/reembolso/${charge.request!.protocol}`); }}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#055A43] shrink-0 cursor-pointer"
                      >
                        {REFUND_STATUS_LABEL[charge.request.status]}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : charge.eligible ? (
                      <button
                        onClick={() => { hapticLightTap(); navigate(`/reembolso/solicitar?cobranca=${charge.chargeId}`); }}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#055A43]/15 text-[12px] font-semibold text-[#055A43] shrink-0 active:scale-95 transition-all hover:bg-[#055A43]/5 cursor-pointer"
                      >
                        <ReceiptText className="w-3.5 h-3.5" />
                        Solicitar reembolso
                      </button>
                    ) : (
                      <span className="text-[11.5px] text-[#6B7A6E]/70 shrink-0">Fora do prazo</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {isPremium && !userProfile?.subscription?.cancelAtPeriodEnd && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-[2rem] p-6 shadow-[0_8px_24px_rgba(45,74,58,0.08)] border border-[#055A43]/5"
          >
            {cancelSubmitSuccess ? (
              <div className="flex flex-col items-center text-center gap-2 py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <p className="font-serif text-[18px] text-[#055A43]">Solicitação registrada</p>
                <p className="text-[13px] text-[#506352] leading-relaxed">
                  Recebemos seu pedido de cancelamento. Nossa equipe vai processar em breve — você continua com acesso Premium normalmente até lá.
                </p>
              </div>
            ) : showCancelForm ? (
              <div className="flex flex-col gap-4">
                <p className="text-[13px] font-semibold text-[#055A43]">Solicitar cancelamento</p>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#055A43]/60 mb-1.5 block">
                    Motivo do cancelamento (opcional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Conte pra gente o que te fez decidir cancelar..."
                    rows={3}
                    className="w-full bg-[#F7F5EF] border border-[#055A43]/10 rounded-xl p-3 text-[14px] text-[#3A3F3B] focus:outline-none focus:border-[#055A43] transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#055A43]/60 mb-1.5 block">
                    Alguma sugestão pra gente melhorar? (opcional)
                  </label>
                  <textarea
                    value={cancelFeedback}
                    onChange={(e) => setCancelFeedback(e.target.value)}
                    placeholder="O que poderia ter sido diferente?"
                    rows={3}
                    className="w-full bg-[#F7F5EF] border border-[#055A43]/10 rounded-xl p-3 text-[14px] text-[#3A3F3B] focus:outline-none focus:border-[#055A43] transition-colors resize-none"
                  />
                </div>
                {cancelSubmitError && (
                  <p className="text-red-500 text-[12px] font-medium">{cancelSubmitError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { hapticLightTap(); setShowCancelForm(false); }}
                    disabled={isSubmittingCancel}
                    className="h-11 px-4 rounded-xl text-[13px] font-semibold text-[#6B7A6E] disabled:opacity-50 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSubmitCancellation}
                    disabled={isSubmittingCancel}
                    className="flex-1 h-11 rounded-xl bg-[#055A43] text-white text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingCancel ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Enviar solicitação'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { hapticLightTap(); setShowCancelForm(true); }}
                  className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-[#6B7A6E] hover:text-[#055A43] transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar próxima renovação
                </button>
                <p className="text-center text-[11.5px] text-[#6B7A6E]/70 leading-relaxed">
                  Impede cobranças futuras. Para pedir de volta um valor já cobrado, use
                  &ldquo;Solicitar reembolso&rdquo; na lista de cobranças.
                </p>
              </div>
            )}
          </motion.div>
        )}

        <p className="text-center text-[12px] text-[#6B7A6E]/60 px-6 font-light">
          O acesso Premium é vinculado ao email usado na compra e nesta conta.
        </p>
        </main>
      </div>
    </div>
  );
}
