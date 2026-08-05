import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, Share2, Award } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { db, auth } from '@/src/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function IndiqueGanhe() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referralCode = userProfile?.referralCode || 'FOC-XXXXXX';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;
  const shareMessage = `Estou usando o Focão para acompanhar a evolução do meu cão 🐶\n\nUse meu link para conhecer:\n${referralLink}`;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'referrals'),
      where('referrerUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      list.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Number(a.createdAt || 0);
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Number(b.createdAt || 0);
        return bTime - aTime;
      });
      setReferrals(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching referrals:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy share message: ', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };
  const validReferrals = userProfile?.validReferrals || 0;
  const referralRewardsDays = userProfile?.referralRewardsDays || 0;
  const isLimitReached = userProfile?.referralsLimitReached || (validReferrals >= 3);

  // Status text for client
  const remainingReferrals = Math.max(0, 3 - validReferrals);
  const statusMessage = isLimitReached
    ? 'Você completou todas as indicações — obrigado por espalhar o Focão. 💛'
    : `Ainda ${remainingReferrals === 1 ? 'falta' : 'faltam'} ${remainingReferrals} ${remainingReferrals === 1 ? 'indicação' : 'indicações'} para atingir o limite.`;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'activated': return 'Ativado (Onboarding)';
      case 'converted': return 'Assinante (Aguardando check-ins)';
      case 'rewarded': return 'Recompensado';
      case 'invalid': return 'Inválido / Duplicado';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rewarded': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'converted': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'activated': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'invalid': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="flex-1 bg-[#F7F5EF] font-sans pb-32 min-h-screen">
      <div className="mx-auto max-w-md">

        {/* Green metric header zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden bg-[#055A43] px-6 pt-14 pb-9"
        >
          <div className="absolute -right-16 -bottom-16 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
          <div className="absolute right-10 top-6 w-20 h-20 rounded-full bg-white/[0.04] pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between mb-7">
            <button
              onClick={() => navigate('/perfil')}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {isLimitReached && (
              <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                Limite atingido
              </span>
            )}
          </div>

          <p className="relative z-10 mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            Indique e ganhe
          </p>
          <div className="relative z-10 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-[28px] font-semibold leading-tight text-white">
                Ganhe até 21 dias Premium
              </h1>
              <p className="mt-1.5 text-[13px] text-white/50 leading-relaxed max-w-[220px]">
                Cada tutor indicado que virar Premium libera +7 dias para você.
              </p>
            </div>
            <span className="shrink-0 font-serif text-[56px] font-semibold leading-none text-white/90">
              {validReferrals}<span className="text-[24px] text-white/40">/3</span>
            </span>
          </div>
          <div className="relative z-10 mt-5 h-[5px] overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-[#C2703E] transition-all duration-500"
              style={{ width: `${Math.min(100, (validReferrals / 3) * 100)}%` }}
            />
          </div>
          <p className="relative z-10 mt-3.5 flex items-center gap-1.5 text-[13px] font-semibold text-white/60">
            <Award className="h-4 w-4" />
            {referralRewardsDays} dias Premium conquistados
          </p>
        </motion.div>

        {/* White drawer */}
        <main className="relative -mt-6 flex flex-col gap-6 rounded-t-[26px] bg-[#F7F5EF] px-6 pb-8 pt-7">

        {/* Status Message */}
        <div className={`p-4 rounded-2xl border text-center text-xs font-semibold ${
          isLimitReached
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-amber-50/50 text-[#855D28] border-amber-100'
        }`}>
          {statusMessage}
        </div>

        {/* Badges de Reconhecimento */}
        <section className="bg-white rounded-[1.5rem] p-6 border border-[#055A43]/5 shadow-[0_8px_24px_rgba(45,74,58,0.08)]">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#6B7A6E]/60 mb-4 px-1">
            Badges de reconhecimento
          </h3>
          
          <div className="flex flex-col gap-4">
            {/* Badge 1 */}
            <div className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
              validReferrals >= 1 
                ? 'bg-amber-50/40 border-amber-200 shadow-[0_4px_12px_rgba(217,119,6,0.05)]' 
                : 'bg-gray-50/30 border-gray-100 opacity-60'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border ${
                validReferrals >= 1 
                  ? 'bg-amber-100/70 border-amber-200 text-amber-800' 
                  : 'bg-gray-100/50 border-gray-200/50 text-gray-400'
              }`}>
                🥉
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${validReferrals >= 1 ? 'text-[#055A43]' : 'text-gray-400'}`}>
                    Embaixador Focão
                  </h4>
                  {validReferrals >= 1 && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Conquistado</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7A6E]/85 mt-0.5">
                  1 indicação válida concluída
                </p>
              </div>
            </div>

            {/* Badge 2 */}
            <div className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
              validReferrals >= 2 
                ? 'bg-slate-50 border-slate-200 shadow-[0_4px_12px_rgba(148,163,184,0.05)]' 
                : 'bg-gray-50/30 border-gray-100 opacity-60'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border ${
                validReferrals >= 2 
                  ? 'bg-slate-100 border-slate-200 text-slate-800' 
                  : 'bg-gray-100/50 border-gray-200/50 text-gray-400'
              }`}>
                🥈
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${validReferrals >= 2 ? 'text-[#055A43]' : 'text-gray-400'}`}>
                    Tutor Influente
                  </h4>
                  {validReferrals >= 2 && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Conquistado</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7A6E]/85 mt-0.5">
                  2 indicações válidas concluídas
                </p>
              </div>
            </div>

            {/* Badge 3 */}
            <div className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
              validReferrals >= 3 
                ? 'bg-yellow-50/30 border-yellow-200 shadow-[0_4px_12px_rgba(234,179,8,0.05)]' 
                : 'bg-gray-50/30 border-gray-100 opacity-60'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border ${
                validReferrals >= 3 
                  ? 'bg-yellow-100/70 border-yellow-200 text-yellow-800' 
                  : 'bg-gray-100/50 border-gray-200/50 text-gray-400'
              }`}>
                🥇
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-bold ${validReferrals >= 3 ? 'text-[#055A43]' : 'text-gray-400'}`}>
                    Embaixador Gold
                  </h4>
                  {validReferrals >= 3 && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Conquistado</span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7A6E]/85 mt-0.5">
                  3 indicações válidas concluídas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Code & Sharing Section */}
        <section className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/5 shadow-[0_8px_24px_rgba(45,74,58,0.08)] flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#6B7A6E]/60 mb-2">Seu código de indicação</p>
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-[#F7F5EF] border border-[#055A43]/10 rounded-2xl px-6 py-3 font-mono text-xl font-bold tracking-wider text-[#055A43]">
              {referralCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="w-12 h-12 rounded-2xl border border-[#055A43]/10 bg-white flex items-center justify-center text-[#055A43] active:scale-95 transition-transform"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 ${
              copiedLink
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-[#C2703E] text-white hover:brightness-105 shadow-lg shadow-[#C2703E]/20'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-5 h-5" />
                Mensagem de convite copiada!
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5" />
                Compartilhar convite
              </>
            )}
          </button>
        </section>

        {/* History */}
        <section>
          <h3 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase mb-3 px-2">
            Status das indicações
          </h3>
          <div className="bg-white rounded-[1.75rem] p-3 border border-[#055A43]/5 shadow-[0_8px_24px_rgba(45,74,58,0.08)] min-h-[100px] flex flex-col justify-center">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-[#055A43]/20 border-t-[#055A43] rounded-full" />
              </div>
            ) : referrals.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#6B7A6E]/60 font-light">
                Compartilhe seu convite para acompanhar as indicações por aqui.
              </div>
            ) : (
              <div className="flex flex-col">
                {referrals.map((ref, idx) => (
                  <React.Fragment key={ref.id}>
                    <div className="flex items-center justify-between py-3 px-2 text-xs">
                      <div>
                        <p className="font-semibold text-[#506352]">Tutor Indicado</p>
                        <p className="text-[10px] text-[#6B7A6E]/60 mt-0.5">
                          Check-ins: {ref.checkinsCompleted || 0} | Onboarding: {ref.onboardingCompleted ? 'OK' : 'Pendente'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getStatusColor(ref.status)}`}>
                        {getStatusLabel(ref.status)}
                      </span>
                    </div>
                    {idx < referrals.length - 1 && <div className="h-px bg-gray-100 w-full" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Rules */}
        <section className="bg-white rounded-[1.75rem] p-6 border border-[#055A43]/5 shadow-[0_8px_24px_rgba(45,74,58,0.08)]">
          <h4 className="font-serif text-lg text-[#055A43] mb-4 font-semibold">Regras do programa</h4>
          <div className="text-xs text-[#6B7A6E]/80 space-y-3 leading-relaxed">
            <p>
              Todos os usuários do Focão podem fazer indicações, sejam usuários Free, Trial ou Premium.
            </p>
            <p className="font-medium text-[#506352]">
              A indicação é considerada válida somente após o indicado:
            </p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>criar a conta;</li>
              <li>concluir o onboarding;</li>
              <li>fazer pelo menos <strong>2 check-ins</strong>;</li>
              <li>ativar uma assinatura Premium.</li>
            </ul>
            <p>
              Cada indicação válida libera <strong>+7 dias Premium</strong> para quem indicou.
            </p>
            <p>
              A recompensa é acumulativa, com limite vitalício de no máximo <strong>3 indicações válidas</strong> por usuário, totalizando até <strong>21 dias Premium</strong>.
            </p>
            <p>
              Tentativas de autoindicação ou duplicação de dados, como e-mail ou WhatsApp, invalidarão a indicação de forma permanente.
            </p>
            <p className="font-medium text-[#855D28]">
              A recompensa só será liberada após a confirmação do pagamento da assinatura Premium.
            </p>
          </div>
        </section>
        </main>
      </div>
    </div>
  );
}
