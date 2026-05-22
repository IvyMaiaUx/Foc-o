import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { Button } from '@/src/components/ui/Button';

export function Behavior() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};

  const [behaviors, setBehaviors] = useState<string[]>([]);

  const options = [
    { id: 'separation_anxiety', title: 'Ansiedade de separação' },
    { id: 'destructive', title: 'Comportamento destrutivo' },
    { id: 'barking', title: 'Latidos excessivos' },
    { id: 'pulling', title: 'Puxa muito no passeio' },
    { id: 'none', title: 'Nenhum problema grave' },
  ];

  const toggleBehavior = (id: string) => {
    if (id === 'none') {
      setBehaviors(['none']);
      return;
    }
    setBehaviors(prev => {
      const next = prev.filter(b => b !== 'none');
      if (next.includes(id)) {
        return next.filter(b => b !== id);
      }
      return [...next, id];
    });
  };

  const handleNext = () => {
    if (behaviors.length === 0) return;
    navigate('/onboarding/training-base', { 
      state: { ...stateData, behaviors } 
    });
  };

  return (
    <AuthLayout 
      title="Comportamento" 
      subtitle="Quais são os maiores desafios hoje?"
      step="ETAPA 5 DE 7"
    >
      <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
        {options.map(opt => (
          <SelectCard
            key={opt.id}
            title={opt.title}
            selected={behaviors.includes(opt.id)}
            onClick={() => toggleBehavior(opt.id)}
          />
        ))}

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleNext} className="w-full" disabled={behaviors.length === 0}>
            Próximo
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
