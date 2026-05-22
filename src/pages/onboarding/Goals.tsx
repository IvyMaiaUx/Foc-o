import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { Button } from '@/src/components/ui/Button';

export function Goals() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};

  const [goals, setGoals] = useState<string[]>([]);

  const options = [
    { id: 'obedience', title: 'Obediência básica' },
    { id: 'bond', title: 'Fortalecimento de vínculo' },
    { id: 'walks', title: 'Passeios com mais qualidade' },
    { id: 'behavior', title: 'Melhorar comportamento geral' },
    { id: 'anxiety', title: 'Reduzir ansiedade' }
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
      state: { ...stateData, goals } 
    });
  };

  return (
    <AuthLayout 
      title="Seus objetivos" 
      subtitle="O que você mais deseja alcançar com o Focão?"
      step="ETAPA 7 DE 7"
    >
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {options.map(opt => (
          <SelectCard
            key={opt.id}
            title={opt.title}
            selected={goals.includes(opt.id)}
            onClick={() => toggleGoal(opt.id)}
          />
        ))}

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleNext} className="w-full" disabled={goals.length === 0}>
            Analisar perfil
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
