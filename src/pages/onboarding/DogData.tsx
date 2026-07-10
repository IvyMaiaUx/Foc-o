import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboardingState } from '@/src/lib/onboardingDraft';
import { ChevronDown } from 'lucide-react';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import {
  DOG_LIFE_STAGE_OPTIONS,
  DOG_NAME_MAX_LENGTH,
  DOG_WEIGHT_MAX_KG,
  getDogAgeOptions,
  sanitizeDecimalInput,
  sanitizeDogName,
  validateDogBasics,
} from '@/src/lib/dogFieldValidation';
import { hapticLightTap } from '@/src/lib/haptic';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import { auth } from '@/src/lib/firebase';
import { isBetaEnvironment } from '@/src/lib/beta';
import { DogRepository } from '@/src/repositories/DogRepository';

export function DogData() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = useOnboardingState(location.state);
  const initialDogData = stateData?.dogData || {};
  const isBeta = isBetaEnvironment();
  const [hideBetaPrefilledBasics, setHideBetaPrefilledBasics] = useState(Boolean(location.state?.betaPrefilledDogBasics && initialDogData.name));
  const [formData, setFormData] = useState(() => ({
    name: initialDogData.name || '',
    breed: initialDogData.breed || 'SRD',
    lifeStage: initialDogData.lifeStage || '',
    age: initialDogData.age || '',
    weight: initialDogData.weight || '',
    photoUrl: initialDogData.photoUrl || '',
    gender: initialDogData.gender || '',
  }));
  const [error, setError] = useState('');
  const [isLifeStageModalOpen, setIsLifeStageModalOpen] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  useEffect(() => {
    AnalyticsRepository.logEvent('onboarding_started');
  }, []);

  useEffect(() => {
    if (!isBeta || hideBetaPrefilledBasics) return;

    const loadBetaDogBasics = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const dogProfile = await DogRepository.getDogProfile(user.uid);
      if (!dogProfile?.name) return;

      setFormData((current) => ({
        ...current,
        name: current.name || dogProfile.name || '',
        breed: current.breed || dogProfile.breed || 'SRD',
        lifeStage: current.lifeStage || dogProfile.lifeStage || '',
        age: current.age || dogProfile.age || '',
        weight: current.weight || dogProfile.weight || '',
        photoUrl: current.photoUrl || dogProfile.photoUrl || '',
        gender: current.gender || dogProfile.gender || '',
      }));
      setHideBetaPrefilledBasics(true);
    };

    loadBetaDogBasics().catch((error) => {
      console.warn('[DogData] failed to load beta dog basics', error);
    });
  }, [hideBetaPrefilledBasics, isBeta]);

  const handleNext = () => {
    hapticLightTap();

    if (!formData.lifeStage || !formData.gender) {
      setError('Preencha os dados essenciais do seu cão.');
      return;
    }

    const validationError = validateDogBasics(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    navigate('/onboarding/routine', { state: { dogData: formData } });
  };

  const genderOptions = [
    { id: 'male', label: 'Macho' },
    { id: 'female', label: 'Fêmea' },
  ];

  return (
    <AuthLayout
      title="Sobre seu cão"
      subtitle="Só precisamos do básico para montar a primeira trilha de treino."
      step="ETAPA 1 DE 6"
      showLogoutButton={true}
    >
      <div className="flex flex-col gap-6 flex-1">
        {hideBetaPrefilledBasics ? (
          <div className="rounded-[18px] border border-[#055A43]/10 bg-[#055A43]/[0.04] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6C7870]">Cão cadastrado</p>
            <p className="mt-1 font-serif text-[24px] leading-tight text-[#055A43]">{formData.name}</p>
            {formData.age && <p className="mt-1 text-sm font-medium text-[#6B7A6E]">{formData.age}</p>}
          </div>
        ) : (
          <Input
            label="Nome do cão"
            placeholder="Ex: Bento"
            value={formData.name}
            maxLength={DOG_NAME_MAX_LENGTH}
            onChange={(e) => setFormData(prev => ({ ...prev, name: sanitizeDogName(e.target.value) }))}
          />
        )}

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[#6B7A6E] text-sm font-medium ml-1">Sexo</label>
          <div className="flex gap-3">
            {genderOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: opt.id }))}
                className={`flex-1 h-[52px] rounded-[14px] border text-[15px] font-medium transition-all ${
                  formData.gender === opt.id
                    ? 'bg-[#055A43] text-white border-[#055A43] shadow-md shadow-[#055A43]/20'
                    : 'bg-white text-[#506352] border-[#E5E5E5] hover:border-[#055A43]/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[#6B7A6E] text-sm font-medium ml-1">Fase da vida</label>
          <button
            type="button"
            onClick={() => setIsLifeStageModalOpen(true)}
            className="w-full text-left text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all relative"
          >
            {formData.lifeStage || <span className="text-[#A0A4A1]">Selecione a fase</span>}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>
        </div>

        <div className={`grid gap-4 ${hideBetaPrefilledBasics ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div className={`flex flex-col gap-1.5 ${hideBetaPrefilledBasics ? 'hidden' : ''}`}>
            <label className="text-[#6B7A6E] text-sm font-medium ml-1">Idade aprox.</label>
            <button
              type="button"
              onClick={() => setIsAgeModalOpen(true)}
              disabled={!formData.lifeStage}
              className="w-full text-left text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all relative disabled:opacity-60"
            >
              {formData.age || <span className="text-[#A0A4A1]">Opcional</span>}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#6B7A6E] text-sm font-medium ml-1">Peso aprox.</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 15.5"
                value={formData.weight}
                maxLength={5}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: sanitizeDecimalInput(e.target.value, DOG_WEIGHT_MAX_KG) }))}
                className="w-full text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A0A4A1] uppercase tracking-widest">kg</span>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-[#055A43]/5 border border-[#055A43]/10 p-4">
          <p className="text-[13px] leading-relaxed text-[#6B7A6E]">
            Você poderá adicionar raça, alimentação, convivência, foto e detalhes avançados depois no perfil.
          </p>
        </div>

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleNext} className="w-full">
            Continuar
          </Button>
        </div>
      </div>

      <BottomSheetSelect
        isOpen={isLifeStageModalOpen}
        onClose={() => setIsLifeStageModalOpen(false)}
        options={DOG_LIFE_STAGE_OPTIONS}
        value={formData.lifeStage}
        onSelect={(val) => setFormData(prev => ({ ...prev, lifeStage: val, age: '' }))}
        title="Fase da vida"
        placeholder="Buscar fase..."
      />
      <BottomSheetSelect
        isOpen={isAgeModalOpen}
        onClose={() => setIsAgeModalOpen(false)}
        options={getDogAgeOptions(formData.lifeStage)}
        value={formData.age}
        onSelect={(val) => setFormData(prev => ({ ...prev, age: val }))}
        title="Idade aproximada"
        placeholder="Buscar idade..."
      />
    </AuthLayout>
  );
}
