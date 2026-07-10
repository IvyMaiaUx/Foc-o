import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Button } from '@/src/components/ui/Button';

type ConfirmationStatus = 'loading' | 'success' | 'error';

export function EmailConfirmed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [message, setMessage] = useState('');

  const oobCode = searchParams.get('oobCode') || '';
  const mode = searchParams.get('mode') || '';

  useEffect(() => {
    let active = true;

    async function confirmEmail() {
      if (!oobCode || mode !== 'verifyEmail') {
        setStatus('error');
        setMessage('Este link de confirmação está incompleto ou inválido.');
        return;
      }

      try {
        await checkActionCode(auth, oobCode);
        await applyActionCode(auth, oobCode);
        await auth.currentUser?.reload();

        if (!active) return;
        setStatus('success');
        setMessage('E-mail confirmado. Agora você já pode entrar no Focão.');
      } catch {
        if (!active) return;
        setStatus('error');
        setMessage('Este link expirou ou já foi utilizado. Entre na sua conta para solicitar um novo envio, se necessário.');
      }
    }

    void confirmEmail();
    return () => {
      active = false;
    };
  }, [mode, oobCode]);

  return (
    <AuthLayout
      showBackButton={false}
      title={status === 'success' ? 'E-mail confirmado' : status === 'error' ? 'Não foi possível confirmar' : 'Confirmando e-mail'}
      subtitle={
        status === 'loading'
          ? 'Aguarde enquanto validamos seu link de confirmação.'
          : message
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        {status === 'loading' && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#055A43]/5 text-[#055A43]">
            <Loader2 className="h-9 w-9 animate-spin" />
          </div>
        )}

        {status === 'success' && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        )}

        {status === 'error' && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertCircle className="h-10 w-10" />
          </div>
        )}

        <div className="mt-auto w-full pb-4 pt-8">
          <Button
            type="button"
            className="w-full"
            onClick={() => navigate('/login', { replace: true })}
            disabled={status === 'loading'}
          >
            Entrar no app
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
