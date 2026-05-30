import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { hapticLightTap } from '@/src/lib/haptic';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');
    return redirect === 'ativar' ? '/ativar' : '/';
  }, [searchParams]);

  const isActivationFlow = redirectTo === '/ativar';

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
          ? 'Entre na sua conta para concluir a ativacao da assinatura vinculada a este e-mail.'
          : 'Ficamos felizes em ter voce e seu caozinho por aqui mais uma vez.'
      }
      topImage="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
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
          onClick={() => navigate(`/forgot-password${isActivationFlow ? '?redirect=ativar' : ''}`)}
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
