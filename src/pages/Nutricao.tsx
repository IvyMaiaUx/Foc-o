import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Utensils, Droplets, ArrowRight, X, Loader2, Save, ChevronDown } from 'lucide-react';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, collection, getDocs, limit, query, updateDoc } from 'firebase/firestore';
import { NutritionMotor } from '@/src/motors/NutritionMotor';
import { DogProfile } from '@/src/types';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { Button } from '@/src/components/ui/Button';

import { PremiumGate } from '@/src/components/ui/PremiumGate';
import { useAuth } from '@/src/contexts/AuthContext';
import { DogRepository } from '@/src/repositories/DogRepository';
import { DOG_FOOD_BRANDS, DOG_FOOD_LINES, getDogFoodLifeStage, getDogFoodLinesByBrand } from '@/src/lib/dogFoodOptions';

const COMMON_VERSIONS = ['Raças Pequenas', 'Raças Médias', 'Raças Grandes', 'Castrados', 'Grãos Mini'];

export function Nutricao() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [dogData, setDogData] = useState<DogProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [brand, setBrand] = useState('');
  const [line, setLine] = useState('');
  const [lifeStage, setLifeStage] = useState('Adulto');
  const [version, setVersion] = useState('');
  const [quantity, setQuantity] = useState('');

  if (!isPremium) return <PremiumGate featureName="Nutrição inteligente" />;

  // Select Modal States
  const [isBrandSheetOpen, setIsBrandSheetOpen] = useState(false);
  const [isLineSheetOpen, setIsLineSheetOpen] = useState(false);
  const [isVersionSheetOpen, setIsVersionSheetOpen] = useState(false);
  const brandLineOptions = brand && DOG_FOOD_BRANDS.includes(brand)
    ? getDogFoodLinesByBrand(brand)
    : DOG_FOOD_LINES;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const dogProfile = await DogRepository.getDogProfile(user.uid);
        if (dogProfile) {
          setDogData(dogProfile);
          
          setBrand(dogProfile.foodBrand || '');
          setLine(dogProfile.foodLine || '');
          setLifeStage(dogProfile.lifeStage || 'Adulto');
          setVersion(dogProfile.foodVersion || '');
          setQuantity(dogProfile.foodQuantity || '');
        }
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveFood = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !dogData?.id) return;
      setIsSaving(true);

      await DogRepository.saveDogProfile(user.uid, {
        foodBrand: brand,
        foodLine: line,
        lifeStage: lifeStage,
        foodVersion: version,
        foodQuantity: quantity
      });

      setDogData({
        ...dogData,
        foodBrand: brand,
        foodLine: line,
        lifeStage: lifeStage,
        foodVersion: version,
        foodQuantity: quantity
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar ração", err);
    } finally {
      setIsSaving(false);
    }
  };

  const foodInfo = NutritionMotor.calculateFood(dogData);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 bg-white border-b border-[#055A43]/5 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-[#055A43]/5 flex items-center justify-center text-[#5C615D] active:scale-[0.98] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-medium text-[#506352] tracking-[0.15em] uppercase mb-0.5">
            Módulo de Saúde
          </p>
          <h1 className="font-serif text-[24px] text-[#055A43] tracking-tight leading-none">
            Nutrição
          </h1>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 overflow-y-auto pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Main Card */}
          <div className="bg-[#055A43] rounded-[2rem] p-6 text-white shadow-lg shadow-[#055A43]/10 relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/70 uppercase tracking-widest">Plano Diário</p>
                  <p className="text-white text-[15px] font-medium">{dogData?.name || 'Seu cão'}</p>
                </div>
              </div>
              <div className="text-right">
                {foodInfo.fallsback ? (
                  <span className="bg-white/10 text-white border border-white/20 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium">Referência</span>
                ) : foodInfo.meta.confidence === 'high' ? (
                  <span className="bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium">Alta Precisão</span>
                ) : foodInfo.meta.confidence === 'medium' ? (
                  <span className="bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium">Boa Precisão</span>
                ) : (
                  <span className="bg-white/10 text-white border border-white/20 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium">Aproximado</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10 mb-4 border-b border-white/10 pb-6">
              <div>
                <p className="font-serif text-[42px] leading-none mb-1">{foodInfo.daily > 0 ? foodInfo.daily : '--'}g</p>
                <p className="text-sm text-white/80 font-light">Recomendado por dia</p>
                {dogData?.foodBrand && <p className="text-[11px] text-white/60 lowercase tracking-widest uppercase mt-2">{dogData.foodBrand}</p>}
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="font-serif text-[24px] leading-none text-white/90 mb-1">{foodInfo.perMeal > 0 ? foodInfo.perMeal : '--'}g</p>
                <p className="text-sm text-white/80 font-light">Por refeição</p>
              </div>
            </div>

            {dogData?.foodQuantity && (
              <div className="flex justify-between items-center relative z-10 mb-4 bg-black/10 rounded-xl p-3 border border-white/5">
                <p className="text-sm text-white/80 font-light">Quantidade atual (informada):</p>
                <p className="font-medium text-white">{dogData.foodQuantity}g / dia</p>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 relative z-10">
              <div className="flex flex-wrap gap-2 text-[10px] text-white/70 uppercase tracking-widest">
                <span className="bg-white/10 px-2 py-1 rounded-md">{foodInfo.meta.weightUsed > 0 ? foodInfo.meta.weightUsed : '--'} kg</span>
                <span className="bg-white/10 px-2 py-1 rounded-md">Atividade: {foodInfo.meta.activityLevel}</span>
                <span className="bg-white/10 px-2 py-1 rounded-md">{foodInfo.meta.mealsPerDay} refeições/dia</span>
              </div>
              
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-white/60 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/60 leading-relaxed font-light">
                  {dogData?.foodBrand ? (
                    foodInfo.fallsback 
                      ? `A fórmula exata ainda não está na base. Usamos uma estimativa referencial segura para um cão adulto de ${foodInfo.meta.weightUsed || '-'} kg.`
                      : `Essa recomendação foi calculada com base no peso informado (${foodInfo.meta.weightUsed} kg), nível de energia (${foodInfo.meta.activityLevel}) e fórmula cadastrada (${foodInfo.meta.formulaName}).`
                  ) : (
                    'Configure a alimentação atual para receber uma recomendação mais precisa.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Tips / Info */}
          <h3 className="font-medium text-[#506352] text-sm tracking-widest uppercase mb-4 px-2">Orientações</h3>
          
          <div className="bg-white rounded-[1.5rem] border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col mb-4">
            <div className="p-4 px-5 flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#055A43]/5 text-[#055A43] flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#055A43] font-medium text-[15px] mb-1">Hidratação constante</p>
                <p className="text-[#5C615D] text-sm font-light leading-relaxed">
                  Mantenha água fresca sempre disponível. Aumente a oferta em dias quentes ou após passeios.
                </p>
              </div>
            </div>
            
            <div className="mx-5 h-px bg-gray-100" />
            
            <div className="p-4 px-5 flex gap-4">
               <div className="w-8 h-8 rounded-full bg-[#055A43]/5 text-[#055A43] flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#055A43] font-medium text-[15px] mb-1">Petiscos no Treino</p>
                <p className="text-[#5C615D] text-sm font-light leading-relaxed">
                  Os petiscos de treino devem representar, no máximo, 10% do total calórico diário para evitar sobrepeso.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-white p-4 rounded-xl border border-[#055A43]/10 text-[#055A43] font-medium text-sm flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            Cadastrar ração atual
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] p-8 shadow-2xl relative"
                style={{ zIndex: 51 }}
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-serif text-2xl text-[#055A43]">Qual ração ele come?</h2>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto pr-2 pb-2">
                  {/* Marca */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#506352] uppercase tracking-widest ml-1">Marca</label>
                    <button
                      type="button"
                      onClick={() => setIsBrandSheetOpen(true)}
                      className="w-full text-left text-base font-normal h-14 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[14px] px-5 text-[#055A43] focus:outline-none focus:border-[#055A43] transition-all relative"
                    >
                      {brand || <span className="text-[#A0A4A1]">Selecione uma marca...</span>}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>
                    {!DOG_FOOD_BRANDS.includes(brand) && brand ? (
                      <motion.input 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        type="text" 
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Digite o nome da marca..."
                        className="w-full h-14 px-5 bg-white border border-[#055A43]/20 rounded-2xl focus:ring-2 focus:ring-[#055A43]/20 focus:border-[#055A43] transition-all outline-none text-[#055A43] mt-2"
                      />
                    ) : null}
                  </div>

                  {/* Linha */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#506352] uppercase tracking-widest ml-1">Linha</label>
                    <button
                      type="button"
                      onClick={() => setIsLineSheetOpen(true)}
                      className="w-full text-left text-base font-normal h-14 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[14px] px-5 text-[#055A43] focus:outline-none focus:border-[#055A43] transition-all relative"
                    >
                      {line || <span className="text-[#A0A4A1]">Selecione uma linha...</span>}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>
                    {!brandLineOptions.includes(line) && line ? (
                      <motion.input 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        type="text" 
                        value={line}
                        onChange={(e) => setLine(e.target.value)}
                        placeholder="Digite a linha (ex: Formula, Maxi...)"
                        className="w-full h-14 px-5 bg-white border border-[#055A43]/20 rounded-2xl focus:ring-2 focus:ring-[#055A43]/20 focus:border-[#055A43] transition-all outline-none text-[#055A43] mt-2"
                      />
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {/* Fase */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#506352] uppercase tracking-widest ml-1">Fase</label>
                      <div className="flex bg-[#FAFAFA] border border-gray-100 rounded-2xl p-1 h-14">
                        {['Filhote', 'Adulto', 'Sênior'].map((stage) => {
                          const value = stage === 'Sênior' ? 'Senior' : stage;
                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => setLifeStage(value)}
                              className={`flex-1 rounded-xl text-xs font-bold transition-all ${
                                lifeStage === value 
                                  ? 'bg-white text-[#055A43] shadow-sm' 
                                  : 'text-[#5C615D]/60'
                              }`}
                            >
                              {stage}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Versão */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#506352] uppercase tracking-widest ml-1">Versão</label>
                      <button
                        type="button"
                        onClick={() => setIsVersionSheetOpen(true)}
                        className="w-full text-left text-base font-normal h-14 bg-[#FAFAFA] border border-[#E5E5E5] rounded-[14px] px-5 text-[#055A43] focus:outline-none focus:border-[#055A43] transition-all relative"
                      >
                        {version || <span className="text-[#A0A4A1]">Selecione a versão...</span>}
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#5C615D]">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </button>
                      {!COMMON_VERSIONS.includes(version) && version ? (
                        <motion.input 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          type="text" 
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          placeholder="Digite a versão ou sabor..."
                          className="w-full h-14 px-5 bg-white border border-[#055A43]/20 rounded-2xl focus:ring-2 focus:ring-[#055A43]/20 focus:border-[#055A43] transition-all outline-none text-[#055A43] mt-2"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-[#506352] uppercase tracking-widest ml-1">Quantidade Diária (em gramas)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Ex: 250"
                        className="w-full h-14 px-5 bg-[#FAFAFA] border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#055A43]/20 focus:border-[#055A43] transition-all outline-none text-[#055A43]"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A0A4A1] uppercase tracking-widest">g</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#055A43]/5 shrink-0">
                  <Button 
                    variant="primary"
                    size="md"
                    onClick={handleSaveFood}
                    disabled={!brand}
                    isLoading={isSaving}
                    className="w-full"
                  >
                    Salvar Informações
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <BottomSheetSelect 
          isOpen={isBrandSheetOpen}
          onClose={() => setIsBrandSheetOpen(false)}
          options={[...DOG_FOOD_BRANDS, 'Outra']}
          value={brand}
          onSelect={(val) => {
            setBrand(val);
            setLine('');
          }}
          title="Selecione a Marca"
          placeholder="Buscar marca..."
        />
        
        <BottomSheetSelect 
          isOpen={isLineSheetOpen}
          onClose={() => setIsLineSheetOpen(false)}
          options={[...brandLineOptions, 'Outra']}
          value={line}
          onSelect={(val) => {
            setLine(val);
            const detectedLifeStage = getDogFoodLifeStage(brand, val);
            if (detectedLifeStage) setLifeStage(detectedLifeStage);
          }}
          title="Selecione a Linha"
          placeholder="Buscar linha..."
        />
        
        <BottomSheetSelect 
          isOpen={isVersionSheetOpen}
          onClose={() => setIsVersionSheetOpen(false)}
          options={[...COMMON_VERSIONS, 'Outra']}
          value={version}
          onSelect={(val) => {
            if (val === 'Outra') setVersion('');
            else setVersion(val);
          }}
          title="Selecione a Versão"
          placeholder="Buscar versão..."
        />
      </main>
    </div>
  );
}
