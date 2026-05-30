import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronDown } from 'lucide-react';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { COMMON_BREEDS } from '@/src/lib/breeds';
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
import { useEffect } from 'react';

export function DogData() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    breed: '', 
    lifeStage: '', 
    age: '', 
    weight: '', 
    photoUrl: '', 
    gender: '',
    whatsappPhone: '',
    lgpdConsent: false
  });
  
  useEffect(() => {
    AnalyticsRepository.logEvent('onboarding_started');
  }, []);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [isLifeStageModalOpen, setIsLifeStageModalOpen] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    
    try {
      // Create an image element to read bounds
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Resize down to max 300x300, avoiding large payload
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, photoUrl: dataUrl }));
        URL.revokeObjectURL(objUrl);
        setIsUploading(false);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        setError('Falha ao processar a imagem.');
        setIsUploading(false);
      }
      
      img.src = objUrl;
    } catch (err) {
      console.error('Upload falhou', err);
      setError('Falha ao processar a foto do cão.');
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    hapticLightTap();
    if (!formData.breed || !formData.lifeStage) {
      setError('Preencha os dados do seu cão.');
      return;
    }
    const validationError = validateDogBasics(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    const phoneClean = (formData.whatsappPhone || '').replace(/\D/g, '');
    if (phoneClean.length < 10) {
      setError('Por favor, insira um número de WhatsApp válido com DDD (Ex: 11999999999).');
      return;
    }

    if (!formData.lgpdConsent) {
      setError('Você deve concordar com os Termos de Uso e LGPD para prosseguir.');
      return;
    }

    // We will pass data through navigation state
    navigate('/onboarding/routine', { state: { dogData: formData } });
  };

  const GENDER_OPTIONS = [
    { id: 'male', label: 'Macho' },
    { id: 'female', label: 'Fêmea' },
  ];


  return (
    <AuthLayout 
      title="Quem é o seu melhor amigo?" 
      subtitle="Vamos conhecê-lo para criar o plano perfeito."
      step="ETAPA 1 DE 7"
    >
      <div className="flex flex-col gap-6 flex-1">
        <div className="flex flex-col items-center justify-center mb-2">
          <input 
            type="file" 
            accept="image/*"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="relative w-24 h-24 rounded-full bg-[#055A43]/5 border-2 border-dashed border-[#055A43]/30 flex flex-col items-center justify-center text-[#055A43] overflow-hidden hover:bg-[#055A43]/10 transition-colors"
          >
            {formData.photoUrl ? (
              <img src={formData.photoUrl} alt="Cão" className="w-full h-full object-cover" />
            ) : isUploading ? (
              <span className="w-6 h-6 border-2 border-[#055A43]/30 border-t-[#055A43] rounded-full animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6 mb-1 opacity-60" />
                <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Foto</span>
              </>
            )}
          </button>
        </div>

        <Input 
          label="Nome do cão" 
          placeholder="Ex: Bento"
          value={formData.name}
          maxLength={DOG_NAME_MAX_LENGTH}
          onChange={(e) => setFormData(prev => ({ ...prev, name: sanitizeDogName(e.target.value) }))}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[#5C615D] text-sm font-medium ml-1">Sexo</label>
          <div className="flex gap-3">
            {GENDER_OPTIONS.map(opt => (
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
          <label className="text-[#5C615D] text-sm font-medium ml-1">Raça</label>
          <button
            type="button"
            onClick={() => setIsBreedModalOpen(true)}
            className="w-full text-left text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all relative"
          >
            {formData.breed || <span className="text-[#A0A4A1]">Selecione a raça</span>}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[#5C615D] text-sm font-medium ml-1">Fase da vida</label>
          <button
            type="button"
            onClick={() => setIsLifeStageModalOpen(true)}
            className="w-full text-left text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all relative"
          >
            {formData.lifeStage || <span className="text-[#A0A4A1]">Selecione a fase</span>}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#5C615D] text-sm font-medium ml-1">Idade aprox.</label>
            <button
              type="button"
              onClick={() => setIsAgeModalOpen(true)}
              disabled={!formData.lifeStage}
              className="w-full text-left text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all relative disabled:opacity-60"
            >
              {formData.age || <span className="text-[#A0A4A1]">Opcional</span>}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                <ChevronDown className="w-5 h-5" />
              </div>
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[#5C615D] text-sm font-medium ml-1">Peso (kg)</label>
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

        <Input 
          label="Seu WhatsApp (com DDD)" 
          placeholder="Ex: 11999999999"
          value={formData.whatsappPhone}
          type="tel"
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            setFormData(prev => ({ ...prev, whatsappPhone: raw }));
          }}
        />

        <div className="flex items-start gap-3 px-1 mt-2">
          <input
            type="checkbox"
            id="lgpdConsent"
            checked={formData.lgpdConsent}
            onChange={(e) => setFormData(prev => ({ ...prev, lgpdConsent: e.target.checked }))}
            className="w-5 h-5 rounded border-[#E5E5E5] text-[#055A43] focus:ring-[#055A43] mt-0.5"
          />
          <label htmlFor="lgpdConsent" className="text-xs text-[#5C615D] leading-relaxed">
            Declaro que li e aceito os <a href="/termos" target="_blank" className="font-semibold underline text-[#055A43]">Termos de Uso</a> e <a href="/privacidade" target="_blank" className="font-semibold underline text-[#055A43]">Política de Privacidade</a> do Focão, e autorizo o envio de comunicações de acordo com a LGPD.
          </label>
        </div>

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

        <div className="mt-auto pt-6 pb-4">
          <Button onClick={handleNext} className="w-full">
            Próximo
          </Button>
        </div>
      </div>
      
      <BottomSheetSelect 
        isOpen={isBreedModalOpen}
        onClose={() => setIsBreedModalOpen(false)}
        options={COMMON_BREEDS}
        value={formData.breed}
        onSelect={(val) => setFormData(prev => ({ ...prev, breed: val }))}
        title="Selecione a Raça"
        placeholder="Buscar raça..."
      />
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
