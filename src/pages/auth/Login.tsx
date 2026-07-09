import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { hapticLightTap } from '@/src/lib/haptic';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const registrationState = location.state as { registered?: boolean; passwordReset?: boolean; email?: string } | null;
  const [formData, setFormData] = useState({ email: registrationState?.email || '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');
    if (redirect === 'ativar') return '/ativar';
    if (redirect === 'assinatura') return '/assinatura';
    return '/';
  }, [searchParams]);

  const isActivationFlow = redirectTo === '/ativar';
  const isSubscriptionFlow = redirectTo === '/assinatura';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hapticLightTap();
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      await signInWithEmailAndPassword(auth, email, formData.password);
      navigate(redirectTo);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Erro ao entrar. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta."
      subtitle={
        isActivationFlow
          ? 'Entre na sua conta para concluir a ativação da assinatura vinculada a este e-mail.'
          : 'Ficamos felizes em ter você e seu cãozinho por aqui mais uma vez.'
      }
      topImage="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        {registrationState?.registered && (
          <div className="rounded-xl border border-[#055A43]/15 bg-[#055A43]/5 p-4 text-sm leading-relaxed text-[#055A43]">
            Conta criada com sucesso. Entre com o e-mail e a senha que você acabou de cadastrar.
          </div>
        )}
        {registrationState?.passwordReset && (
          <div className="rounded-xl border border-[#055A43]/15 bg-[#055A43]/5 p-4 text-sm leading-relaxed text-[#055A43]">
            Senha atualizada com sucesso. Entre com sua nova senha.
          </div>
        )}
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="********"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
        />

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

        <button
          type="button"
          onClick={() => navigate(`/forgot-password${isActivationFlow ? '?redirect=ativar' : isSubscriptionFlow ? '?redirect=assinatura' : ''}`)}
          className="text-sm font-medium text-[#055A43] self-start ml-1 mt-2 hover:underline"
        >
          Esqueci minha senha
        </button>

        <div className="mt-auto pt-6 pb-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Entrar
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
