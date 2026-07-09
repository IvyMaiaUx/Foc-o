import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isCheckingLink, setIsCheckingLink] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);

  const oobCode = searchParams.get('oobCode') || '';
  const loginPath = useMemo(() => {
    const continueUrl = searchParams.get('continueUrl') || '';
    if (continueUrl.includes('redirect=ativar')) return '/login?redirect=ativar';
    if (continueUrl.includes('redirect=assinatura')) return '/login?redirect=assinatura';
    return '/login';
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function validateLink() {
      if (!oobCode) {
        setError('Este link de redefinição está incompleto.');
        setIsCheckingLink(false);
        return;
      }

      try {
        await verifyPasswordResetCode(auth, oobCode);
        if (active) setIsValidLink(true);
      } catch {
        if (active) {
          setError('Este link expirou ou já foi utilizado. Solicite um novo e-mail de recuperação.');
        }
      } finally {
        if (active) setIsCheckingLink(false);
      }
    }

    void validateLink();
    return () => {
      active = false;
    };
  }, [oobCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      navigate(loginPath, {
        replace: true,
        state: { passwordReset: true },
      });
    } catch {
      setError('Não foi possível redefinir sua senha. Solicite um novo link e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crie uma nova senha"
      subtitle="Escolha uma senha segura para voltar a acessar sua conta."
    >
      {isCheckingLink ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#055A43]/20" />
        </div>
      ) : isValidLink ? (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5">
          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo de 6 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            label="Confirme sua nova senha"
            type="password"
            autoComplete="new-password"
            placeholder="Digite novamente"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />

          {error && <p className="ml-1 text-sm text-red-500">{error}</p>}

          <div className="mt-auto pb-4 pt-6">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Salvar nova senha
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="rounded-xl border-l-4 border-red-400 bg-red-50 p-4">
            <p className="text-sm leading-relaxed text-red-700">{error}</p>
          </div>
          <div className="mt-auto pb-4 pt-6">
            <Button type="button" className="w-full" onClick={() => navigate('/forgot-password')}>
              Solicitar novo link
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
