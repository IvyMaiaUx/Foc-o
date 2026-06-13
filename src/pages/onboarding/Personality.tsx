import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Battery, BatteryMedium, BatteryFull, Bone, Car, Heart, Circle, Utensils, CircleHelp } from 'lucide-react';

export function Personality() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};
  const dogName = stateData.dogData?.name || 'seu cão';

  const [energyLevel, setEnergyLevel] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [rewardPreference, setRewardPreference] = useState('');

  const energyOptions = [
    { id: 'low', title: 'Baixo', icon: Battery },
    { id: 'medium', title: 'Moderado', icon: BatteryMedium },
    { id: 'high', title: 'Alto', icon: BatteryFull },
  ];

  const traitOptions = [
    'Calmo', 'Sociável', 'Brincalhão', 'Independente', 
    'Medroso', 'Agitado', 'Teimoso', 'Atento'
  ];

  const rewardOptions = [
    { id: 'treats', title: 'Petiscos', icon: Bone },
    { id: 'toys', title: 'Brinquedos', icon: Car },
    { id: 'praise', title: 'Elogios e carinho', icon: Heart },
    { id: 'play', title: 'Bolinha / brincadeiras', icon: Circle },
    { id: 'food', title: 'Comida em geral', icon: Utensils },
    { id: 'unknown', title: 'Ainda não sei', icon: CircleHelp },
  ];

  const toggleTrait = (trait: string) => {
    setPersonalityTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const handleNext = () => {
    if (!energyLevel || personalityTraits.length === 0 || !rewardPreference) return;
    navigate('/onboarding/behavior', { 
      state: { ...stateData, energyLevel, personalityTraits, rewardPreference } 
    });
  };

  return (
    <AuthLayout 
      title="Energia e personalidade" 
      subtitle={`Agora vamos entender melhor como o ${dogName} se comporta no dia a dia. Essas informações ajudam o app a ajustar os treinos, a rotina e a forma ideal de conduzir cada etapa.`}
      step="ETAPA 3 DE 6"
    >
      <div className="flex flex-col gap-8 flex-1">
        
        {/* ENERGIA */}
        <div>
          <h3 className="text-[#5C615D] text-[10px] font-bold tracking-wider mb-3 uppercase">
            COMO VOCÊ DESCREVERIA O NÍVEL DE ENERGIA DO {dogName.toUpperCase()}?
          </h3>
          <div className="flex flex-col gap-3">
            {energyOptions.map(opt => {
              const Icon = opt.icon;
              const isSelected = energyLevel === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setEnergyLevel(opt.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'border-[#055A43] bg-white ring-1 ring-[#055A43]/10' 
                      : 'border-gray-100 bg-white hover:border-[#055A43]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#5C615D]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-[#055A43]' : 'text-gray-900'}`}>
                      {opt.title}
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-[#055A43]' : 'border-gray-300'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#055A43]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PERSONALIDADE */}
        <div>
          <h3 className="text-[#5C615D] text-[10px] font-bold tracking-wider mb-3 uppercase">
            QUAL OPÇÃO MAIS COMBINA COM A PERSONALIDADE DELE?
          </h3>
          <div className="flex flex-wrap gap-2">
            {traitOptions.map(trait => {
              const isSelected = personalityTraits.includes(trait);
              return (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#055A43] text-white border-[#055A43]'
                      : 'bg-white text-[#506352] border-gray-200 hover:border-[#055A43]/30'
                  }`}
                >
                  {trait}
                </button>
              );
            })}
          </div>
        </div>

        {/* RECOMPENSA */}
        <div>
          <h3 className="text-[#5C615D] text-[10px] font-bold tracking-wider mb-3 uppercase">
            O QUE MAIS CHAMA A ATENÇÃO DO {dogName.toUpperCase()} E PODE FUNCIONAR MELHOR COMO RECOMPENSA DURANTE OS TREINOS?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {rewardOptions.map(opt => {
              const Icon = opt.icon;
              const isSelected = rewardPreference === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setRewardPreference(opt.id)}
                  className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all h-[110px] ${
                    isSelected
                      ? 'border-[#055A43] bg-white ring-1 ring-[#055A43]/10'
                      : 'border-gray-100 bg-white hover:border-[#055A43]/30'
                  }`}
                >
                  <div className="absolute top-2 right-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#055A43]' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-[#055A43]" />}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-[#055A43]/10 text-[#055A43]' : 'bg-gray-50 text-[#5C615D]'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-center text-gray-900 leading-tight">
                    {opt.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-4 pb-4">
          <Button 
            onClick={handleNext} 
            className="w-full" 
            disabled={!energyLevel || personalityTraits.length === 0 || !rewardPreference}
          >
            Próximo
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
