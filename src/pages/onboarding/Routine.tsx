import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { SelectCard } from '@/src/components/ui/SelectCard';
import { Button } from '@/src/components/ui/Button';

import { Input } from '@/src/components/ui/Input';

export function Routine() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};

  const [routine, setRoutine] = useState('');
  const [hasOutdoorArea, setHasOutdoorArea] = useState<string>('');
  const [walksPerDay, setWalksPerDay] = useState('');
  const [walkDuration, setWalkDuration] = useState('');
  const [livesWithPeople, setLivesWithPeople] = useState<string>('');
  const [livesWithAnimals, setLivesWithAnimals] = useState<string>('');
  const [animalRelationship, setAnimalRelationship] = useState('');

  const options = [
    { id: 'apartment', title: 'Apartamento', desc: 'Geralmente sem área externa privativa.' },
    { id: 'house', title: 'Casa', desc: 'Espaço mais reservado para o cão.' },
  ];

  const walksOptions = ['Não passeia', '1 vez', '2 vezes', '3+ vezes'];
  const durationOptions = ['15 min', '30 min', '1h', '2h+'];
  
  const yesNoOptions = ['Sim', 'Não'];

  const handleNext = () => {
    if (!routine || !hasOutdoorArea || !walksPerDay || !livesWithPeople || !livesWithAnimals) return;
    if (livesWithAnimals === 'Sim' && !animalRelationship) return;
    
    navigate('/onboarding/health-care', { 
      state: { 
        ...stateData, 
        routine, 
        hasOutdoorArea: hasOutdoorArea === 'Sim',
        walksPerDay, 
        walkDuration,
        livesWithPeople,
        livesWithAnimals: livesWithAnimals === 'Sim',
        animalRelationship: livesWithAnimals === 'Sim' ? animalRelationship : ''
      } 
    });
  };

  return (
    <AuthLayout 
      title="Estilo de vida" 
      subtitle="Conte um pouco sobre o ambiente e a rotina de passeios do seu cão."
      step="ETAPA 2 DE 7"
    >
      <div className="flex flex-col gap-8 flex-1 pb-10">
        <div>
          <h3 className="text-[#5C615D] text-sm font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Ambiente:</h3>
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
          <h3 className="text-[#5C615D] text-sm font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Possui área externa?</h3>
          <div className="flex flex-wrap gap-2">
            {yesNoOptions.map(item => (
              <button
                key={item}
                onClick={() => setHasOutdoorArea(item)}
                className={`px-6 py-3 rounded-2xl border text-sm font-medium transition-all ${
                  hasOutdoorArea === item
                    ? 'bg-[#055A43] text-white border-[#055A43] shadow-md shadow-[#055A43]/20'
                    : 'bg-white text-[#506352] border-gray-100 hover:border-[#055A43]/30'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <h3 className="text-[#5C615D] text-sm font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Frequência de passeio:</h3>
            <div className="flex flex-wrap gap-2">
              {walksOptions.map(item => (
                <button
                  key={item}
                  onClick={() => setWalksPerDay(item)}
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

          {walksPerDay !== 'Não passeia' && walksPerDay !== '' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-[#5C615D] text-sm font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Duração média:</h3>
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
        </div>
        
        <div>
          <h3 className="text-[#5C615D] text-sm font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Convive com quantas pessoas?</h3>
          <div className="flex flex-wrap gap-2">
            {['Mora sozinho', '2 pessoas', '3 a 4 pessoas', '5+ pessoas'].map(item => (
              <button
                key={item}
                onClick={() => setLivesWithPeople(item)}
                className={`px-4 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                  livesWithPeople === item
                    ? 'bg-[#055A43] text-white border-[#055A43]'
                    : 'bg-white text-[#506352] border-gray-100 hover:border-[#055A43]/30'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[#5C615D] text-sm font-medium mb-3 ml-1 uppercase tracking-wider text-[11px]">Tem outros animais?</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {yesNoOptions.map(item => (
              <button
                key={item}
                onClick={() => setLivesWithAnimals(item)}
                className={`px-6 py-3 rounded-2xl border text-sm font-medium transition-all ${
                  livesWithAnimals === item
                    ? 'bg-[#055A43] text-white border-[#055A43] shadow-md shadow-[#055A43]/20'
                    : 'bg-white text-[#506352] border-gray-100 hover:border-[#055A43]/30'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          
          {livesWithAnimals === 'Sim' && (
             <Input 
               label="Como é a relação deles?"
               placeholder="Ex: Brincam muito, mas brigam por comida"
               value={animalRelationship}
               onChange={(e) => setAnimalRelationship(e.target.value)}
             />
          )}
        </div>

        <div className="mt-auto pt-10 pb-4">
          <Button 
            onClick={handleNext} 
            className="w-full" 
            disabled={!routine || !hasOutdoorArea || !walksPerDay || !livesWithPeople || !livesWithAnimals || (livesWithAnimals === 'Sim' && !animalRelationship) || (walksPerDay !== 'Não passeia' && !walkDuration)}
          >
            Próximo
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
