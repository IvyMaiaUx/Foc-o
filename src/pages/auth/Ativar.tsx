import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  ArrowRight,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { PremiumClaimRepository } from '@/src/repositories/PremiumClaimRepository';
import { notifyPremiumActivated } from '@/src/services/whatsappService';
import confetti from 'canvas-confetti';

export function Ativar() {
  const navigate = useNavigate();
  const { user, isPremium, refreshProfile, isLoading: isAuthLoading } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'no-auth' | 'error' | 'already-active'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setStatus('no-auth');
      return;
    }

    if (isPremium) {
      setStatus('already-active');
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }

    const attemptClaim = async () => {
      try {
        setStatus('loading');
        const claimed = await PremiumClaimRepository.claimForUser(user);
        if (claimed) {
          await refreshProfile();
          notifyPremiumActivated(user.uid).catch((whatsappError) => {
            console.warn('[Ativar] notifyPremiumActivated failed', whatsappError);
          });
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
          });
          setStatus('success');
        } else if (attempts < 2) {
          setTimeout(() => {
            setAttempts((prev) => prev + 1);
          }, 3000);
        } else {
          setStatus('error');
          setErrorMsg(
            `Não encontramos nenhuma ativação pendente para o e-mail ${user.email}. Se você acabou de pagar, aguarde 1 a 2 minutos e atualize esta página.`
          );
        }
      } catch (err) {
        console.error('Erro ao ativar premium', err);
        setStatus('error');
        setErrorMsg('Ocorreu um erro ao verificar sua ativação. Tente novamente.');
      }
    };

    attemptClaim();
  }, [user, isPremium, isAuthLoading, attempts, navigate, refreshProfile]);

  const handleRetry = () => {
    setAttempts(0);
    setStatus('loading');
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-xl shadow-[#055A43]/5 border border-[#055A43]/5 text-center flex flex-col items-center gap-6 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#055A43]/5 rounded-full blur-2xl pointer-events-none" />

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#055A43]/10 rounded-full blur animate-pulse w-16 h-16" />
              <Loader2 className="w-10 h-10 text-[#055A43] animate-spin relative" />
            </div>
            <h2 className="font-serif text-2xl text-[#055A43] mt-2">Verificando pagamento...</h2>
            <p className="text-[#6B7A6E] text-sm leading-relaxed max-w-[280px]">
              Buscando sua assinatura vinculada ao e-mail <strong className="text-gray-900">{user?.email}</strong>.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Crown className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="font-serif text-3xl text-[#055A43] mt-2">Premium ativado!</h2>
            <p className="text-emerald-800 font-medium text-[15px] bg-emerald-50 px-4 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Bem-vindo ao Focão Premium
            </p>
            <p className="text-[#6B7A6E] text-sm leading-relaxed max-w-[300px]">
              Seu acesso completo foi liberado. Aproveite todos os treinos personalizados e recursos exclusivos.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full h-12 rounded-2xl bg-[#055A43] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-[#044a37]"
            >
              Começar jornada <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'already-active' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-[#055A43]" />
            </div>
            <h2 className="font-serif text-2xl text-[#055A43] mt-2">Premium já ativo!</h2>
            <p className="text-[#6B7A6E] text-sm leading-relaxed max-w-[280px]">
              Você já possui acesso ilimitado às funcionalidades Premium do Focão. Redirecionando...
            </p>
          </div>
        )}

        {status === 'no-auth' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl text-[#055A43] mt-2">Login necessário</h2>
            <p className="text-[#6B7A6E] text-sm leading-relaxed max-w-[280px]">
              Entre na conta vinculada ao pagamento. Se esqueceu a senha, use a recuperação de senha e volte para esta ativação.
            </p>
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={() => navigate('/login?redirect=ativar')}
                className="w-full h-12 rounded-2xl bg-[#055A43] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <LogIn className="w-4 h-4" /> Fazer login
              </button>
              <button
                onClick={() => navigate('/forgot-password?redirect=ativar')}
                className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-white"
              >
                <KeyRound className="w-4 h-4" /> Recuperar senha
              </button>
              <button
                onClick={() => navigate('/register?redirect=ativar')}
                className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all bg-white"
              >
                Criar conta
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl text-[#055A43] mt-2">Ativação pendente</h2>
            <p className="text-[#6B7A6E] text-sm leading-relaxed">{errorMsg}</p>
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={handleRetry}
                className="w-full h-12 rounded-2xl bg-[#055A43] text-white text-[14px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => navigate('/login?redirect=ativar')}
                className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-white"
              >
                <LogIn className="w-4 h-4" /> Entrar em outra conta
              </button>
              <button
                onClick={() => navigate('/forgot-password?redirect=ativar')}
                className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-white"
              >
                <KeyRound className="w-4 h-4" /> Recuperar senha
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full h-12 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all bg-white"
              >
                Ir para a home grátis
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
