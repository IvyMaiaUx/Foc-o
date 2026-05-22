import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { UserRepository } from '@/src/repositories/UserRepository';

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
      
      // Initial user document
      await UserRepository.createUserProfile(userCredential.user.uid, formData.email, formData.name);

      navigate('/onboarding/dog-data');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else {
        setError(`Erro ao criar conta: ${err?.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Comece sua jornada." 
      subtitle="Crie sua conta e viva uma vida mais equilibrada ao lado do seu cão."
      topImage="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        <Input 
          label="Seu nome" 
          placeholder="Como quer ser chamado(a)?"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <Input 
          label="E-mail" 
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        />
        <Input 
          label="Senha" 
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        />
        
        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

        <div className="mt-auto pt-6 pb-4">
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Continuar
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
