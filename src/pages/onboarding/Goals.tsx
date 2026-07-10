import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingState } from '@/src/lib/onboardingDraft';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { Button } from '@/src/components/ui/Button';

export function Goals() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = useOnboardingState(location.state);

  const [goals, setGoals] = useState<string[]>([]);
  const [goalNotes, setGoalNotes] = useState('');

  const options = [
    { id: 'obedience', title: 'Melhorar obediência básica' },
    { id: 'walks', title: 'Melhorar passeio na guia' },
    { id: 'focus', title: 'Aumentar foco e atenção' },
    { id: 'anxiety_alone', title: 'Reduzir ansiedade ao ficar sozinho' },
    { id: 'barking', title: 'Reduzir latidos' },
    { id: 'destruction', title: 'Evitar destruição de objetos' },
    { id: 'routine', title: 'Criar uma rotina melhor' },
    { id: 'other', title: 'Outro' }
  ];

  const toggleGoal = (id: string) => {
    setGoals(prev => {
      if (prev.includes(id)) {
        return prev.filter(g => g !== id);
      }
      return [...prev, id];
    });
  };

  const handleNext = () => {
    if (goals.length === 0) return;
    navigate('/onboarding/analyzing', {
      state: { ...stateData, goals, goalNotes }
    });
  };

  return (
    <AuthLayout
      title="Objetivo principal"
      subtitle="Escolha o foco inicial. Depois o plano pode evoluir com base no histórico."
      step="ETAPA 6 DE 6"
    >
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {options.map(opt => (
            <SelectCard
              key={opt.id}
              title={opt.title}
              selected={goals.includes(opt.id)}
              onClick={() => toggleGoal(opt.id)}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#055A43]">
            Algo importante?
          </label>
          <p className="text-xs text-[#6B7A6E] mb-1 font-light leading-relaxed">
            Se quiser, conte em uma frase o que mais quer melhorar.
          </p>
          <textarea
            value={goalNotes}
            onChange={(e) => setGoalNotes(e.target.value)}
            placeholder="Ex: ele morde quando fica muito agitado..."
            rows={3}
            className="w-full rounded-2xl border-2 border-gray-100 p-4 text-sm text-gray-800 outline-none focus:border-[#055A43]/30 resize-none font-light bg-white"
          />
        </div>

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleNext} className="w-full" disabled={goals.length === 0}>
            Criar plano
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
