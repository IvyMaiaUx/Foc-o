import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingState } from '@/src/lib/onboardingDraft';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { Button } from '@/src/components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

export function TrainingBase() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = useOnboardingState(location.state);

  const [base, setBase] = useState('');
  const [knownCommands, setKnownCommands] = useState<string[]>([]);

  const options = [
    { id: 'beginner', title: 'Iniciante', desc: 'Ainda não sabe comandos ou precisa reforçar a base.' },
    { id: 'intermediate', title: 'Intermediário', desc: 'Já entende alguns comandos básicos.' },
    { id: 'advanced', title: 'Avançado', desc: 'Obedece bem a vários comandos.' },
  ];

  const intermediateCommands = ['Senta', 'Fica', 'Deita', 'Vem', 'Junto', 'Solta', 'Não pular'];
  const advancedCommands = [...intermediateCommands, 'Toca', 'Gira', 'Cumprimenta', 'Rasteja', 'Buscar', 'Morto', 'Busca por faro'];

  useEffect(() => {
    if (base === 'beginner') {
      setKnownCommands([]);
    }
  }, [base]);

  const handleCommandToggle = (cmd: string) => {
    setKnownCommands(prev =>
      prev.includes(cmd) ? prev.filter(c => c !== cmd) : [...prev, cmd]
    );
  };

  const handleNext = () => {
    if (!base) return;
    navigate('/onboarding/goals', {
      state: { ...stateData, base, knownCommands }
    });
  };

  const suggestedCommands = base === 'intermediate' ? intermediateCommands : base === 'advanced' ? advancedCommands : [];

  return (
    <AuthLayout
      title="Base de treino"
      subtitle="Isso evita recomendar comandos que ele já domina."
      step="ETAPA 5 DE 6"
    >
      <div className="flex flex-col gap-5 flex-1">
        {options.map(opt => (
          <SelectCard
            key={opt.id}
            title={opt.title}
            description={opt.desc}
            selected={base === opt.id}
            onClick={() => setBase(opt.id)}
          />
        ))}

        <AnimatePresence>
          {(base === 'intermediate' || base === 'advanced') && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="flex flex-col gap-3 mt-4"
            >
              <h3 className="text-[#055A43] font-medium text-sm">Quais comandos ele já sabe?</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedCommands.map(cmd => {
                  const isSelected = knownCommands.includes(cmd);
                  return (
                    <button
                      key={cmd}
                      onClick={() => handleCommandToggle(cmd)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[#055A43] bg-[#055A43]/5 text-[#055A43]'
                          : 'border-gray-200 bg-white text-[#5C615D] hover:border-[#055A43]/30'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" strokeWidth={2.5} />}
                      {cmd}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleNext} className="w-full" disabled={!base}>
            Continuar
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
