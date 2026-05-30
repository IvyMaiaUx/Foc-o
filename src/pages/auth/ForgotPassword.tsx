import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');
    return redirect === 'ativar' ? '/ativar' : '/login';
  }, [searchParams]);

  const isActivationFlow = redirectTo === '/ativar';

  const loginUrl = useMemo(() => {
    const suffix = isActivationFlow ? '?redirect=ativar' : '';
    return `${window.location.origin}/login${suffix}`;
  }, [isActivationFlow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), {
        url: loginUrl,
        handleCodeInApp: false,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('[ForgotPassword] failed', err);

      if (err.code === 'auth/invalid-email') {
        setError('Informe um e-mail válido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        setError('Não foi possível enviar o e-mail agora. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle={
        isActivationFlow
          ? 'Informe o e-mail da conta para recuperar a senha e concluir a ativação.'
          : 'Informe seu e-mail para receber um link de redefinição.'
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {success ? (
          <div className="flex flex-col mt-4">
            <div className="bg-[#055A43]/5 border-l-4 border-[#055A43] p-4 rounded-r-xl">
              <p className="text-[#055A43] font-medium text-[15px]">E-mail enviado</p>
              <p className="text-[#5C615D] text-sm mt-1">
                {isActivationFlow
                  ? 'Redefina sua senha pelo link recebido e volte para entrar e concluir a ativação.'
                  : 'Verifique sua caixa de entrada para redefinir sua senha.'}
              </p>
            </div>
          </div>
        ) : (
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

        <div className="mt-auto pt-6 pb-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {success ? 'Enviar novamente' : 'Enviar link'}
          </Button>
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-[#5C615D] text-sm font-medium hover:text-[#055A43] transition-colors"
              onClick={() => navigate(isActivationFlow ? '/login?redirect=ativar' : '/login')}
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
