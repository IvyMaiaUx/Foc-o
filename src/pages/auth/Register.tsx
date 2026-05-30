import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { UserRepository } from '@/src/repositories/UserRepository';
import { PremiumClaimRepository } from '@/src/repositories/PremiumClaimRepository';
import { hapticLightTap } from '@/src/lib/haptic';

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');
    return redirect === 'ativar' ? '/ativar' : '/onboarding/dog-data';
  }, [searchParams]);

  const loginUrl = useMemo(() => {
    const suffix = redirectTo === '/ativar' ? '?redirect=ativar' : '';
    return `${window.location.origin}/login${suffix}`;
  }, [redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticLightTap();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      setInfo('');
      return;
    }

    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.password);
      await userCredential.user.getIdToken(true);

      try {
        await updateProfile(userCredential.user, { displayName: formData.name });
      } catch (profileError) {
        console.warn('[Register] updateProfile failed', profileError);
      }

      try {
        await UserRepository.createUserProfile(userCredential.user.uid, email, formData.name);
      } catch (profileDocError) {
        console.warn('[Register] createUserProfile failed', profileDocError);
      }

      try {
        await sendEmailVerification(userCredential.user, {
          url: loginUrl,
          handleCodeInApp: false,
        });
      } catch (verificationError) {
        console.warn('[Register] sendEmailVerification failed', verificationError);
      }

      try {
        await PremiumClaimRepository.claimForUser(userCredential.user);
      } catch (claimError) {
        console.warn('[Register] claimForUser failed', claimError);
      }

      navigate(redirectTo);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        const email = formData.email.trim().toLowerCase();

        try {
          await sendPasswordResetEmail(auth, email, {
            url: loginUrl,
            handleCodeInApp: false,
          });
          setInfo(
            redirectTo === '/ativar'
              ? 'Este e-mail já possui conta. Enviamos um link de recuperação para você concluir a ativação.'
              : 'Este e-mail já possui conta. Enviamos um link de recuperação para o seu e-mail.'
          );
        } catch {
          setError(
            redirectTo === '/ativar'
              ? 'Este e-mail já possui conta. Entre nele para concluir a ativação do acesso.'
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
      title="Comece sua jornada."
      subtitle="Crie sua conta usando o mesmo e-mail do pagamento para ativar seu acesso automaticamente."
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
          placeholder="mesmo e-mail do pagamento"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="Minimo 6 caracteres"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
        />

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}
        {info && <p className="text-[#055A43] text-sm ml-1">{info}</p>}

        <div className="mt-auto pt-6 pb-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Continuar
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
