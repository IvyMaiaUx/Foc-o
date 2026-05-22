import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Crown, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { getSubscriptionPlan, getSubscriptionStatus } from '@/src/types';

function formatDate(ts?: number) {
  if (!ts) return '--/--/----';
  return new Date(ts).toLocaleDateString('pt-BR');
}

export function Assinatura() {
  const navigate = useNavigate();
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthLoading) setLoading(false);
  }, [isAuthLoading]);

  if (loading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#FAFAFA]">
        <Loader2 className="w-8 h-8 text-[#055A43] animate-spin" />
      </div>
    );
  }

  const plan = getSubscriptionPlan(userProfile);
  const status = getSubscriptionStatus(userProfile);
  const isPremium = plan === 'premium' || plan === 'trial' || status === 'active' || status === 'trialing';
  const activeSince = userProfile?.subscription?.createdAt || userProfile?.createdAt;

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
          onClick={() => navigate(-1)}
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
            </div>
          </div>

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
