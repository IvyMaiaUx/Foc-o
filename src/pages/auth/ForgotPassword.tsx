import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('E-mail não encontrado.');
      } else {
        setError('Erro ao enviar e-mail. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Esqueci minha senha" 
      subtitle="Informe seu e-mail para receber um link de redefinição."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {success ? (
          <div className="flex flex-col mt-4">
            <div className="bg-[#055A43]/5 border-l-4 border-[#055A43] p-4 rounded-r-xl">
              <p className="text-[#055A43] font-medium text-[15px]">E-mail enviado!</p>
              <p className="text-[#5C615D] text-sm mt-1">
                Verifique sua caixa de entrada para redefinir sua senha.
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
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
            disabled={success && email === ''}
          >
            {success ? 'Enviar novamente' : 'Enviar link'}
          </Button>
          <div className="text-center mt-4">
            <button 
              type="button" 
              className="text-[#5C615D] text-sm font-medium hover:text-[#055A43] transition-colors"
              onClick={() => navigate('/login')}
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
