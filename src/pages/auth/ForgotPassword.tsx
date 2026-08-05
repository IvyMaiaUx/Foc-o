import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { AuthEmailService } from '@/src/services/AuthEmailService';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');
    if (redirect === 'ativar') return '/ativar';
    if (redirect === 'assinatura') return '/assinatura';
    return '/login';
  }, [searchParams]);

  const isActivationFlow = redirectTo === '/ativar';
  const isSubscriptionFlow = redirectTo === '/assinatura';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Informe seu e-mail para receber o link.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await AuthEmailService.sendPasswordReset(
        email,
        isActivationFlow ? 'ativar' : isSubscriptionFlow ? 'assinatura' : undefined
      );
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
              <p className="text-[#6B7A6E] text-sm mt-1">
                {isActivationFlow
                  ? 'Se houver uma conta vinculada a este e-mail, você receberá um link para redefinir sua senha e concluir a ativação.'
                  : 'Se houver uma conta vinculada a este e-mail, você receberá um link para redefinir sua senha.'}
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
              className="text-[#6B7A6E] text-sm font-medium hover:text-[#055A43] transition-colors"
              onClick={() => navigate(isActivationFlow ? '/login?redirect=ativar' : isSubscriptionFlow ? '/login?redirect=assinatura' : '/login')}
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
