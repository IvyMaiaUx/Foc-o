import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronDown } from 'lucide-react';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { COMMON_BREEDS } from '@/src/lib/breeds';

export function DogData() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ name: '', breed: '', age: '', weight: '', photoUrl: '' });
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);

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
    if (!formData.name || !formData.breed || !formData.age || !formData.weight) {
      setError('Preencha os dados do seu cão.');
      return;
    }
    // We will pass data through navigation state
    navigate('/onboarding/routine', { state: { dogData: formData } });
  };

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
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        
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

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Idade" 
            placeholder="Ex: 2 anos"
            value={formData.age}
            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[#5C615D] text-sm font-medium ml-1">Peso (kg)</label>
            <div className="relative">
              <input 
                type="number"
                placeholder="Ex: 15"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A0A4A1] uppercase tracking-widest">kg</span>
            </div>
          </div>
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
    </AuthLayout>
  );
}
