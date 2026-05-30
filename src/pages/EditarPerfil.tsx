import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, ChevronLeft, ChevronDown, Crown, ShieldPlus } from 'lucide-react';
import { DogRepository } from '@/src/repositories/DogRepository';
import { UserRepository } from '@/src/repositories/UserRepository';
import { auth } from '@/src/lib/firebase';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { COMMON_BREEDS } from '@/src/lib/breeds';
import { useAuth } from '@/src/contexts/AuthContext';
import { getSubscriptionPlan, getSubscriptionStatus, hasPremiumAccess } from '@/src/types';
import {
  DOG_LIFE_STAGE_OPTIONS,
  DOG_NAME_MAX_LENGTH,
  DOG_WEIGHT_MAX_KG,
  getDogAgeOptions,
  sanitizeDecimalInput,
  sanitizeDogName,
  validateDogBasics,
} from '@/src/lib/dogFieldValidation';

export function EditarPerfil() {
  const navigate = useNavigate();
  const { userProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'basico'|'rotina'|'comportamento'|'saude'>('basico');
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [isLifeStageModalOpen, setIsLifeStageModalOpen] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  const foodBrands = [
    'Adidog', 'Affinity', 'Axia', 'Baw Waw', 'Biofresh', 'Cibau', 'Dog Chow', 'Faro', 'Formula Natural', 'Golden', 'Gran Plus', 'Guabi Natural', 
    'Max', 'ND (N&D)', 'Nero', 'Nutrilus', 'Pedigree', 'PremieR', 'Quatree', 'Royal Canin', 'Sabor & Vida', 'Special Dog', 'Tutano', 'Outra'
  ];

  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    lifeStage: '',
    age: '',
    weight: '',
    photoUrl: '',
    gender: '',
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
  const [savedMessage, setSavedMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tutorNameInput, setTutorNameInput] = useState(userProfile?.name || auth.currentUser?.displayName || '');

  const getSubscriptionDisplay = () => {
    const plan = getSubscriptionPlan(userProfile);
    const status = getSubscriptionStatus(userProfile);

    if (status === 'past_due') {
      return { text: 'Pagamento pendente', color: 'bg-red-400/20 text-red-600 border-red-400/30' };
    }

    if (status === 'canceled') {
      return { text: 'Cancelado', color: 'bg-[#5C615D]/10 text-[#5C615D] border-[#5C615D]/20' };
    }

    if (plan === 'premium' && hasPremiumAccess(userProfile)) {
      return { text: 'Premium', color: 'bg-emerald-400/20 text-emerald-600 border-emerald-400/30' };
    }

    if (plan === 'trial') {
      const trialEndsAt = userProfile?.subscription?.trialEndsAt ?? userProfile?.trialEndsAt;
      if (trialEndsAt && trialEndsAt > Date.now()) {
        const daysLeft = Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24));
        return { text: `Trial (${daysLeft} dias)`, color: 'bg-orange-400/20 text-orange-600 border-orange-400/30' };
      }
    }

    return { text: 'Plano Grátis', color: 'bg-[#5C615D]/10 text-[#5C615D] border-[#5C615D]/20' };
  };

  const planBadge = getSubscriptionDisplay();
  const isPremiumProfile = getSubscriptionPlan(userProfile) === 'premium' && hasPremiumAccess(userProfile);
  const tutorName = userProfile?.name || auth.currentUser?.displayName || 'Tutor';

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      setTutorNameInput(userProfile?.name || user.displayName || '');
      
      const dogProfile = await DogRepository.getDogProfile(user.uid);
      
      if (dogProfile) {
        setDogId(dogProfile.id || 'profile');
        setFormData({
          name: dogProfile.name || '',
          breed: dogProfile.breed || '',
          lifeStage: dogProfile.lifeStage || '',
          age: dogProfile.age || '',
          weight: dogProfile.weight || '',
          photoUrl: dogProfile.photoUrl || '',
          gender: dogProfile.gender || '',
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
  }, [userProfile]);

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

    setError('');
    setSavedMessage('');

    const cleanTutorName = tutorNameInput.trim();
    if (!cleanTutorName || cleanTutorName.length < 2) {
      setError('Informe o nome do tutor.');
      return;
    }

    if (!formData.lifeStage) {
      setError('Selecione a fase da vida do cão.');
      return;
    }

    const validationError = validateDogBasics(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      await DogRepository.saveDogProfile(user.uid, {
        name: formData.name,
        breed: formData.breed,
        lifeStage: formData.lifeStage,
        age: formData.age,
        weight: formData.weight,
        photoUrl: formData.photoUrl,
        gender: formData.gender,
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
      await UserRepository.updateTutorName(user.uid, cleanTutorName);
      await refreshProfile();
      setSavedMessage('Alterações salvas com sucesso.');
      setTimeout(() => navigate(-1), 900);
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
      <header className="px-6 pt-16 pb-4 bg-white flex items-center gap-4 sticky top-0 z-10">
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

      <section className="px-6 pt-4 pb-10 bg-white border-b border-[#055A43]/5 flex flex-col items-center">
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
          className="relative w-24 h-24 rounded-[2rem] shadow-xl shadow-[#055A43]/10 mb-4 border border-[#055A43]/10 bg-[#055A43] flex items-center justify-center active:scale-[0.98] transition-all"
          aria-label="Alterar foto do cão"
        >
          {isPremiumProfile && (
            <span className="pointer-events-none absolute -inset-1 rounded-full border-[2.5px] border-[#D8C3A5] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_2px_10px_rgba(216,195,165,0.18)]" />
          )}
          <span className="absolute inset-0 rounded-[2rem] overflow-hidden flex items-center justify-center">
          {formData.photoUrl ? (
            <img src={formData.photoUrl} alt="Foto do cão" className="w-full h-full object-cover" />
          ) : isUploading ? (
            <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="font-serif text-white text-[40px] opacity-90">
                {formData.name?.charAt(0).toUpperCase() || 'C'}
              </span>
              <span className="absolute right-1.5 bottom-1.5 w-8 h-8 rounded-full bg-white text-[#055A43] shadow-md flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </span>
            </>
          )}
          </span>
        </button>

        <h2 className="font-serif text-[28px] text-[#055A43] tracking-tight leading-none mb-1 text-center">
          {formData.name || 'Seu cão'}
        </h2>
        <p className="text-sm font-medium text-[#506352]/70 uppercase tracking-widest text-center">
          Tutor(a): {tutorName.split(' ')[0] || 'Tutor'}
        </p>

        <button
          type="button"
          onClick={() => navigate('/assinatura')}
          className={`mt-4 px-4 py-1.5 rounded-full flex items-center gap-2 border ${planBadge.color} active:scale-95 transition-transform`}
        >
          {getSubscriptionPlan(userProfile) === 'premium' ? <Crown className="w-4 h-4" /> : <ShieldPlus className="w-4 h-4" />}
          <span className="text-[10px] font-medium tracking-widest uppercase">{planBadge.text}</span>
        </button>
      </section>

      <div className="px-6 pt-4 pb-4 bg-white border-b border-[#055A43]/5">
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
            <Input
              label="Nome do tutor"
              placeholder="Ex: Isabelle"
              value={tutorNameInput}
              maxLength={60}
              onChange={(e) => setTutorNameInput(e.target.value)}
            />

            <Input 
              label="Nome do cão" 
              placeholder="Ex: Bento"
              value={formData.name}
              maxLength={DOG_NAME_MAX_LENGTH}
              onChange={(e) => setFormData(prev => ({ ...prev, name: sanitizeDogName(e.target.value) }))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[#5C615D] text-sm font-medium ml-1">Sexo</label>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'male' }))} 
                  className={`flex-1 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                    formData.gender === 'male' 
                      ? 'bg-[#055A43] text-white border-[#055A43]' 
                      : 'bg-white text-[#506352] border-gray-200 hover:border-[#055A43]/30'
                  }`}
                >
                  Macho
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, gender: 'female' }))} 
                  className={`flex-1 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                    formData.gender === 'female' 
                      ? 'bg-[#055A43] text-white border-[#055A43]' 
                      : 'bg-white text-[#506352] border-gray-200 hover:border-[#055A43]/30'
                  }`}
                >
                  Fêmea
                </button>
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
              <Input 
                label="Peso (kg)" 
                placeholder="Ex: 15.5"
                type="text"
                inputMode="decimal"
                maxLength={5}
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: sanitizeDecimalInput(e.target.value, DOG_WEIGHT_MAX_KG) }))}
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

        {savedMessage && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[#055A43]">
            <CheckCircle2 className="h-4 w-4" />
            {savedMessage}
          </p>
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
    </div>
  );
}
