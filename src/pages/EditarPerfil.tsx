import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronDown } from 'lucide-react';
import { DogRepository } from '@/src/repositories/DogRepository';
import { auth, db } from '@/src/lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { COMMON_BREEDS } from '@/src/lib/breeds';

export function EditarPerfil() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'basico'|'rotina'|'comportamento'|'saude'>('basico');
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const foodBrands = [
    'Adidog', 'Affinity', 'Axia', 'Baw Waw', 'Biofresh', 'Cibau', 'Dog Chow', 'Faro', 'Formula Natural', 'Golden', 'Gran Plus', 'Guabi Natural', 
    'Max', 'ND (N&D)', 'Nero', 'Nutrilus', 'Pedigree', 'PremieR', 'Quatree', 'Royal Canin', 'Sabor & Vida', 'Special Dog', 'Tutano', 'Outra'
  ];

  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    photoUrl: '',
    walksPerDay: '',
    livesWithPeople: false,
    livesWithAnimals: false,
    animalRelationship: '',
    energyLevel: '',
    trainingBase: '',
    diet: '',
    foodBrand: '',
    mealsPerDay: '',
    lastVaccine: '',
    nextCheckup: '',
    observations: ''
  });
  
  const [dogId, setDogId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const dogProfile = await DogRepository.getDogProfile(user.uid);
      
      if (dogProfile) {
        setDogId(dogProfile.id || 'profile');
        setFormData({
          name: dogProfile.name || '',
          breed: dogProfile.breed || '',
          age: dogProfile.age || '',
          weight: dogProfile.weight || '',
          photoUrl: dogProfile.photoUrl || '',
          walksPerDay: dogProfile.walksPerDay || '',
          livesWithPeople: dogProfile.livesWithPeople || false,
          livesWithAnimals: dogProfile.livesWithAnimals || false,
          animalRelationship: dogProfile.animalRelationship || '',
          energyLevel: dogProfile.energyLevel || '',
          trainingBase: dogProfile.trainingBase || '',
          diet: dogProfile.diet || '',
          foodBrand: dogProfile.foodBrand || '',
          mealsPerDay: dogProfile.mealsPerDay || '',
          lastVaccine: dogProfile.lastVaccine || '',
          nextCheckup: dogProfile.nextCheckup || '',
          observations: dogProfile.observations || ''
        });
      }
    };
    loadData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    setError('');
    
    try {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      
      img.onload = () => {
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

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || !dogId) return;

    setIsSaving(true);
    setError('');

    try {
      await DogRepository.saveDogProfile(user.uid, {
        name: formData.name,
        breed: formData.breed,
        age: formData.age,
        weight: formData.weight,
        photoUrl: formData.photoUrl,
        walksPerDay: formData.walksPerDay,
        livesWithPeople: formData.livesWithPeople,
        livesWithAnimals: formData.livesWithAnimals,
        animalRelationship: formData.animalRelationship,
        energyLevel: formData.energyLevel,
        trainingBase: formData.trainingBase,
        diet: formData.diet,
        foodBrand: formData.foodBrand,
        mealsPerDay: formData.mealsPerDay,
        lastVaccine: formData.lastVaccine,
        nextCheckup: formData.nextCheckup,
        observations: formData.observations
      });
      navigate(-1);
    } catch (err) {
      console.error('Erro ao salvar', err);
      setError('Erro ao salvar as informações.');
    } finally {
      setIsSaving(false);
    }
  };

  const TabButton = ({ id, label }: { id: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-2 font-medium text-[13px] rounded-xl transition-all ${activeTab === id ? 'bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] text-[#055A43]' : 'text-[#5C615D] hover:text-[#055A43]/70'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col pb-safe">
      <header className="px-6 pt-16 pb-4 bg-white border-b border-[#055A43]/5 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#055A43]/5 flex items-center justify-center text-[#5C615D] active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium text-[#506352] tracking-[0.15em] uppercase mb-0.5">
            Configurações
          </p>
          <h1 className="font-serif text-[24px] text-[#055A43] tracking-tight leading-none">
            Editar Perfil
          </h1>
        </div>
      </header>

      <div className="px-6 pb-4 bg-white border-b border-[#055A43]/5">
        <div className="flex bg-[#FAFAFA] rounded-[1rem] p-1 border border-[#055A43]/5">
          <TabButton id="basico" label="Básico" />
          <TabButton id="rotina" label="Rotina" />
          <TabButton id="comportamento" label="Perfil" />
          <TabButton id="saude" label="Saúde" />
        </div>
      </div>

      <main className="flex-1 px-6 py-8 overflow-y-auto">
        {activeTab === 'basico' && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="flex flex-col items-center justify-center mb-4">
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
                className="relative w-32 h-32 rounded-full bg-[#055A43]/5 border-2 border-dashed border-[#055A43]/30 flex flex-col items-center justify-center text-[#055A43] overflow-hidden hover:bg-[#055A43]/10 transition-colors shadow-sm"
              >
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Cão" className="w-full h-full object-cover" />
                ) : isUploading ? (
                  <span className="w-8 h-8 border-2 border-[#055A43]/30 border-t-[#055A43] rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 mb-1 opacity-60" />
                    <span className="text-xs font-medium opacity-80 uppercase tracking-wider">Alterar</span>
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
                placeholder="Meses ou anos"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              />
              <Input 
                label="Peso (kg)" 
                placeholder="Ex: 15"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>
          </div>
        )}

        {activeTab === 'rotina' && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <Input 
              label="Frequência de passeios" 
              placeholder="Ex: 2 vezes ao dia, Só finais de semana"
              value={formData.walksPerDay}
              onChange={(e) => setFormData(prev => ({ ...prev, walksPerDay: e.target.value }))}
            />
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Convive com mais pessoas?</label>
              <div className="flex gap-2">
                <button onClick={() => setFormData(prev => ({ ...prev, livesWithPeople: true }))} className={`flex-1 py-3 rounded-xl border ${formData.livesWithPeople ? 'bg-[#055A43] text-white border-[#055A43]' : 'bg-white text-[#506352] border-gray-200'}`}>Sim</button>
                <button onClick={() => setFormData(prev => ({ ...prev, livesWithPeople: false }))} className={`flex-1 py-3 rounded-xl border ${!formData.livesWithPeople ? 'bg-[#055A43] text-white border-[#055A43]' : 'bg-white text-[#506352] border-gray-200'}`}>Não</button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Convive com outros animais?</label>
              <div className="flex gap-2">
                <button onClick={() => setFormData(prev => ({ ...prev, livesWithAnimals: true }))} className={`flex-1 py-3 rounded-xl border ${formData.livesWithAnimals ? 'bg-[#055A43] text-white border-[#055A43]' : 'bg-white text-[#506352] border-gray-200'}`}>Sim</button>
                <button onClick={() => setFormData(prev => ({ ...prev, livesWithAnimals: false }))} className={`flex-1 py-3 rounded-xl border ${!formData.livesWithAnimals ? 'bg-[#055A43] text-white border-[#055A43]' : 'bg-white text-[#506352] border-gray-200'}`}>Não</button>
              </div>
            </div>

            {formData.livesWithAnimals && (
              <Input 
                label="Como é a relação deles?"
                placeholder="Ex: Brincam bastante, Não se dão bem"
                value={formData.animalRelationship}
                onChange={(e) => setFormData(prev => ({ ...prev, animalRelationship: e.target.value }))}
              />
            )}
          </div>
        )}

        {activeTab === 'comportamento' && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Nível de Energia</label>
              <div className="relative">
                <select
                  value={formData.energyLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, energyLevel: e.target.value }))}
                  className="w-full text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] placeholder-[#A0A4A1] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all appearance-none"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="low">Baixa (Calmo)</option>
                  <option value="medium">Média (Equilibrado)</option>
                  <option value="high">Alta (Agitado)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Base de Treino Anterior</label>
              <div className="relative">
                <select
                  value={formData.trainingBase}
                  onChange={(e) => setFormData(prev => ({ ...prev, trainingBase: e.target.value }))}
                  className="w-full text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] placeholder-[#A0A4A1] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all appearance-none"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="none">Nenhuma base</option>
                  <option value="beginner">Comandos básicos</option>
                  <option value="intermediate">Intermediário</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saude' && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Alimentação Base</label>
              <div className="relative">
                <select
                  value={formData.diet}
                  onChange={(e) => setFormData(prev => ({ ...prev, diet: e.target.value }))}
                  className="w-full text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] placeholder-[#A0A4A1] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all appearance-none"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="Ração seca">Ração Seca</option>
                  <option value="Ração úmida">Ração Úmida</option>
                  <option value="Alimentação natural">Alimentação Natural</option>
                  <option value="Mista">Mista</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {(formData.diet === 'Ração seca' || formData.diet === 'Ração úmida' || formData.diet === 'Mista') && (
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[#5C615D] text-sm font-medium ml-1">Marca da Ração (se aplicável)</label>
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(true)}
                  className="w-full text-left text-base font-normal h-[52px] bg-white border border-[#E5E5E5] rounded-[14px] px-4 text-[#055A43] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all relative"
                >
                  {formData.foodBrand || <span className="text-[#A0A4A1]">Ex: Golden, Premier, etc</span>}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>
              </div>
            )}
            
            <Input 
              label="Refeições por dia" 
              placeholder="Ex: 2 vezes"
              value={formData.mealsPerDay}
              onChange={(e) => setFormData(prev => ({ ...prev, mealsPerDay: e.target.value }))}
            />

            <Input 
              label="Última vacina ou checkup" 
              placeholder="Ex: Há 3 meses"
              value={formData.lastVaccine}
              onChange={(e) => setFormData(prev => ({ ...prev, lastVaccine: e.target.value }))}
            />

            <Input 
              label="Próximo checkup" 
              placeholder="Ex: Janeiro de 2024"
              value={formData.nextCheckup}
              onChange={(e) => setFormData(prev => ({ ...prev, nextCheckup: e.target.value }))}
            />

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Observações de Saúde</label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Alergias, medicamentos, etc."
                className="w-full text-base font-normal min-h-[100px] bg-white border border-[#E5E5E5] rounded-[14px] p-4 text-[#055A43] placeholder-[#A0A4A1] focus:outline-none focus:border-[#055A43] focus:ring-1 focus:ring-[#055A43] transition-all resize-none"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm ml-1 mt-6 text-center">{error}</p>}
      </main>

      <div className="p-6 bg-white border-t border-[#055A43]/5">
        <Button onClick={handleSave} className="w-full" disabled={isSaving || isUploading}>
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
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
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        options={foodBrands}
        value={formData.foodBrand}
        onSelect={(val) => setFormData(prev => ({ ...prev, foodBrand: val }))}
        title="Selecione a Marca"
        placeholder="Buscar marca..."
      />
    </div>
  );
}
