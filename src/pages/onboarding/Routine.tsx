import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingState } from '@/src/lib/onboardingDraft';
import { motion } from 'motion/react';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { Button } from '@/src/components/ui/Button';

export function Routine() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = useOnboardingState(location.state);

  const [routine, setRoutine] = useState('');
  const [walksPerDay, setWalksPerDay] = useState('');
  const [walkDuration, setWalkDuration] = useState('');

  const options = [
    { id: 'apartment', title: 'Apartamento', desc: 'Rotina com menos espaço físico e mais necessidade de previsibilidade.' },
    { id: 'house', title: 'Casa', desc: 'Ambiente com mais espaço e estímulos próprios da casa.' },
  ];

  const walksOptions = ['Não passeia', '1 vez', '2 vezes', '3+ vezes'];
  const durationOptions = ['15 min', '30 min', '1h', '2h+'];

  const shouldAskDuration = walksPerDay !== 'Não passeia' && walksPerDay !== '';

  const handleNext = () => {
    if (!routine || !walksPerDay || (shouldAskDuration && !walkDuration)) return;

    navigate('/onboarding/health-care', {
      state: {
        ...stateData,
        routine,
        hasOutdoorArea: routine === 'house',
        walksPerDay,
        walkDuration,
        livesWithPeople: '',
        livesWithAnimals: false,
        animalRelationship: ''
      }
    });
  };

  return (
    <AuthLayout
      title="Rotina básica"
      subtitle="Essas informações ajudam a ajustar a sequência inicial de treinos."
      step="ETAPA 2 DE 6"
    >
      <div className="flex flex-col gap-8 flex-1 pb-10">
        <div>
          <h3 className="text-[#5C615D] font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Onde ele vive?</h3>
          <div className="flex flex-col gap-3">
            {options.map(opt => (
              <SelectCard
                key={opt.id}
                title={opt.title}
                description={opt.desc}
                selected={routine === opt.id}
                onClick={() => setRoutine(opt.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[#5C615D] font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Quantos passeios por dia?</h3>
          <div className="flex flex-wrap gap-2">
            {walksOptions.map(item => (
              <button
                key={item}
                onClick={() => {
                  setWalksPerDay(item);
                  if (item === 'Não passeia') setWalkDuration('');
                }}
                className={`px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  walksPerDay === item
                    ? 'bg-[#055A43] text-white border-[#055A43]'
                    : 'bg-white text-[#506352] border-gray-100 hover:border-[#055A43]/30'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {shouldAskDuration && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="text-[#5C615D] font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Duração média</h3>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map(item => (
                <button
                  key={item}
                  onClick={() => setWalkDuration(item)}
                  className={`px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                    walkDuration === item
                      ? 'bg-[#055A43] text-white border-[#055A43]'
                      : 'bg-white text-[#506352] border-gray-100 hover:border-[#055A43]/30'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-auto pt-10 pb-4">
          <Button
            onClick={handleNext}
            className="w-full"
            disabled={!routine || !walksPerDay || (shouldAskDuration && !walkDuration)}
          >
            Continuar
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
