import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  User,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { PremiumClaimRepository } from '@/src/repositories/PremiumClaimRepository';
import { hapticLightTap } from '@/src/lib/haptic';
import { AuthEmailService } from '@/src/services/AuthEmailService';
import { UserProfileService } from '@/src/services/UserProfileService';
import { DogRepository } from '@/src/repositories/DogRepository';
import { UserRepository } from '@/src/repositories/UserRepository';
import { getAppBaseType, getBetaRegistrationMetadata } from '@/src/lib/beta';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appBaseType = getAppBaseType();
  const isBeta = appBaseType === 'beta';
  const [formData, setFormData] = useState(() => ({
    name: '',
    email: localStorage.getItem('focao_presell_email') || '',
    password: '',
    whatsapp: '',
    dogName: localStorage.getItem('focao_presell_dog_name') || '',
    dogAge: '',
  }));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');
    return redirect === 'ativar' ? '/ativar' : '/onboarding/intro';
  }, [searchParams]);

  const loginPath = redirectTo === '/ativar' ? '/login?redirect=ativar' : '/login';

  const loginUrl = useMemo(() => {
    const suffix = redirectTo === '/ativar' ? '?redirect=ativar' : '';
    return `${window.location.origin}/login${suffix}`;
  }, [redirectTo]);

  async function runWithRetry(task: () => Promise<void>, attempts = 3): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await task();
        return;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await sleep(350 * attempt);
        }
      }
    }
    throw lastError;
  }

  async function completeBetaRegistration(user: User, name: string, referredBy?: string): Promise<void> {
    await runWithRetry(async () => {
      await UserProfileService.ensureProfile(user, name, referredBy);
      await UserRepository.updateBetaSignupDetails(user.uid, {
        whatsappPhone: formData.whatsapp.trim(),
        ...getBetaRegistrationMetadata(),
      });
      await DogRepository.saveDogProfile(user.uid, {
        name: formData.dogName.trim(),
        age: formData.dogAge.trim(),
        breed: 'SRD',
        lifeStage: '',
        weight: '',
        gender: '',
        energyLevel: '',
        trainingBase: '',
      });
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticLightTap();
    if (!formData.name || !formData.email || !formData.password || (isBeta && (!formData.whatsapp || !formData.dogName || !formData.dogAge))) {
      setError('Por favor, preencha todos os campos.');
      setInfo('');
      return;
    }

    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const existingUser = auth.currentUser?.email?.toLowerCase() === email ? auth.currentUser : null;
      const userCredential = existingUser
        ? { user: existingUser }
        : await createUserWithEmailAndPassword(auth, email, formData.password);
      await userCredential.user.getIdToken(true);

      try {
        await updateProfile(userCredential.user, { displayName: formData.name });
      } catch (profileError) {
        console.warn('[Register] updateProfile failed', profileError);
      }

      const referredBy = localStorage.getItem('focao_referred_by') || undefined;
      if (isBeta) {
        try {
          await completeBetaRegistration(userCredential.user, formData.name, referredBy);
        } catch (betaSetupError) {
          console.error('[Register] beta setup failed', betaSetupError);
          setError('Sua conta foi criada, mas não conseguimos finalizar o acesso beta. Confira sua conexão e toque em Entrar no Beta novamente para completar.');
          setInfo('');
          return;
        }

        if (referredBy) {
          localStorage.removeItem('focao_referred_by');
        }
      } else {
        try {
        await UserProfileService.ensureProfile(userCredential.user, formData.name, referredBy);
        if (referredBy) {
          localStorage.removeItem('focao_referred_by');

          try {
            const token = await userCredential.user.getIdToken();
            await fetch('https://foc-o.vercel.app/api/process-referral', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (refErr) {
            console.warn('[Referral] Failed to trigger initial register check:', refErr);
          }
        }
      } catch (profileDocError) {
        console.warn('[Register] createUserProfile failed', profileDocError);
      }
      }

      try {
        await AuthEmailService.sendVerification(userCredential.user);
      } catch (verificationError) {
        console.warn('[Register] custom verification email failed, using Firebase fallback', verificationError);
        try {
          await sendEmailVerification(userCredential.user, {
            url: `${window.location.origin}/email-confirmado`,
            handleCodeInApp: true,
          });
        } catch (fallbackError) {
          console.warn('[Register] Firebase verification email fallback failed', fallbackError);
        }
      }

      try {
        await PremiumClaimRepository.claimForUser(userCredential.user);
      } catch (claimError) {
        console.warn('[Register] claimForUser failed', claimError);
      }

      if (isBeta) {
        navigate('/onboarding/intro', { replace: true });
        return;
      }

      await signOut(auth);
      navigate(loginPath, {
        replace: true,
        state: {
          registered: true,
          email,
        },
      });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        const email = formData.email.trim().toLowerCase();

        try {
          try {
            await AuthEmailService.sendPasswordReset(email, redirectTo === '/ativar' ? 'ativar' : undefined);
          } catch (customEmailError) {
            console.warn('[Register] custom password reset failed, using Firebase fallback', customEmailError);
            await sendPasswordResetEmail(auth, email, {
              url: loginUrl,
              handleCodeInApp: false,
            });
          }
          setInfo(
            redirectTo === '/ativar'
              ? 'Este e-mail já possui conta. Enviamos um link de recuperação para você concluir a ativação.'
              : isBeta
                ? 'Este e-mail já possui conta. Enviamos um link para você recuperar o acesso e entrar no beta.'
                : 'Este e-mail já possui conta. Enviamos um link de recuperação para o seu e-mail.'
          );
        } catch {
          setError(
            redirectTo === '/ativar'
              ? 'Este e-mail já possui conta. Entre nele para concluir a ativação do acesso.'
              : isBeta
                ? 'Este e-mail já possui conta. Faça login com ele para entrar no beta ou use "Esqueci minha senha".'
                : 'Este e-mail já possui conta. Faça login ou use "Esqueci minha senha" para continuar.'
          );
        }
      } else if (err.code === 'auth/weak-password') {
        setError('A senha precisa ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Informe um e-mail válido.');
      } else {
        setError('Não foi possível criar sua conta agora. Tente novamente.');
        console.error('[Register] failed', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isBeta ? 'Crie seu acesso beta' : 'Comece sua jornada.'}
      subtitle={isBeta ? 'Preencha seus dados para começar a testar o app.' : 'Crie sua conta para acompanhar a rotina, os treinos e a evolução do seu cão.'}
      topImage="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        <Input
          label="Seu nome"
          placeholder="Como quer ser chamado(a)?"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        />
        <Input
          label="E-mail"
          type="email"
          placeholder={isBeta ? 'seu melhor e-mail' : 'mesmo e-mail do pagamento'}
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        />
        {isBeta && (
          <>
            <Input
              label="WhatsApp"
              type="tel"
              placeholder="com DDD"
              value={formData.whatsapp}
              onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
            />
            <Input
              label="Nome do cachorro"
              placeholder="Ex: Bento"
              value={formData.dogName}
              onChange={(e) => setFormData((prev) => ({ ...prev, dogName: e.target.value }))}
            />
            <Input
              label="Idade do cachorro"
              placeholder="Ex: 2 anos"
              value={formData.dogAge}
              onChange={(e) => setFormData((prev) => ({ ...prev, dogAge: e.target.value }))}
            />
          </>
        )}
        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
        />

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}
        {info && <p className="text-[#055A43] text-sm ml-1">{info}</p>}

        <div className="mt-auto pt-6 pb-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {isBeta ? 'Entrar no Beta' : 'Continuar'}
          </Button>
          {isBeta && (
            <p className="mt-3 text-center text-xs font-medium text-[#5C615D]">
              Você está acessando uma versão beta gratuita do app.
            </p>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
