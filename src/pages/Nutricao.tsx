import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, Utensils, Droplets, ArrowRight, X, Loader2, Save, ChevronDown } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { NutritionMotor } from '@/src/motors/NutritionMotor';
import { DogProfile } from '@/src/types';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { Button } from '@/src/components/ui/Button';

import { PremiumGate } from '@/src/components/ui/PremiumGate';
import { useAuth } from '@/src/contexts/AuthContext';
import { DogRepository } from '@/src/repositories/DogRepository';
import { DOG_FOOD_OPTIONS } from '@/src/lib/dogFoodOptions';
import {
  getBrandsFromOptions,
  getLifeStageFromOptions,
  getLinesByBrandFromOptions,
  getLinesFromOptions,
  NutritionFormulaRepository,
} from '@/src/repositories/NutritionFormulaRepository';

const COMMON_VERSIONS = ['Raças Pequenas', 'Raças Médias', 'Raças Grandes', 'Castrados', 'Grãos Mini'];

function foodTypeFromDiet(diet?: string): 'dry' | 'wet' | 'natural' | 'mixed' {
  const normalized = String(diet || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('umida')) return 'wet';
  if (normalized.includes('natural')) return 'natural';
  if (normalized.includes('mista')) return 'mixed';
  return 'dry';
}

function parseMealsPerDay(value?: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseInt(String(value || '').replace(/\D/g, ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

function parsePortionGrams(value?: string): number | undefined {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

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
  const [foodOptions, setFoodOptions] = useState(DOG_FOOD_OPTIONS);

  // Select Modal States
  const [isBrandSheetOpen, setIsBrandSheetOpen] = useState(false);
  const [isLineSheetOpen, setIsLineSheetOpen] = useState(false);
  const [isVersionSheetOpen, setIsVersionSheetOpen] = useState(false);
  const foodBrands = useMemo(() => getBrandsFromOptions(foodOptions), [foodOptions]);
  const foodLines = useMemo(() => getLinesFromOptions(foodOptions), [foodOptions]);
  const brandLineOptions = useMemo(
    () => (brand && foodBrands.includes(brand) ? getLinesByBrandFromOptions(foodOptions, brand) : foodLines),
    [brand, foodBrands, foodLines, foodOptions]
  );

  useEffect(() => {
    let isMounted = true;

    NutritionFormulaRepository.getFoodOptions().then((options) => {
      if (isMounted) setFoodOptions(options);
    });

    return () => {
      isMounted = false;
    };
  }, []);

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

  if (!isPremium) return <PremiumGate featureName="Nutrição inteligente" />;

  const handleSaveFood = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !dogData?.id) return;
      setIsSaving(true);
      const mealsPerDay = dogData.nutrition?.mealsPerDay || parseMealsPerDay(dogData.mealsPerDay);
      const nutritionPreview = NutritionMotor.calculateFood({
        ...dogData,
        foodBrand: brand,
        foodLine: line,
        lifeStage,
        foodVersion: version,
      });
      const portionGrams = parsePortionGrams(quantity) || nutritionPreview.daily || undefined;
      const matchConfidence = nutritionPreview.meta.confidence === 'high'
        ? 0.95
        : nutritionPreview.meta.confidence === 'medium'
          ? 0.7
          : 0.45;
      const previousNutrition = { ...(dogData.nutrition || {}) };
      delete previousNutrition.fallbackReason;
      const nextNutrition = {
        ...previousNutrition,
        foodType: foodTypeFromDiet(dogData.diet),
        foodBrand: brand,
        foodLine: line,
        foodPhase: lifeStage,
        foodVersion: version,
        mealsPerDay,
        ...(portionGrams ? { portionGrams } : {}),
        ...(nutritionPreview.fallsback
          ? { fallbackReason: 'Fórmula específica não cadastrada; estimativa aproximada aplicada.' }
          : {}),
        matchConfidence,
      };

      await DogRepository.saveDogProfile(user.uid, {
        foodBrand: brand,
        foodLine: line,
        lifeStage: lifeStage,
        foodVersion: version,
        foodQuantity: quantity,
        nutrition: nextNutrition,
      });

      setDogData({
        ...dogData,
        foodBrand: brand,
        foodLine: line,
        lifeStage: lifeStage,
        foodVersion: version,
        foodQuantity: quantity,
        nutrition: nextNutrition,
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
      <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans">
      {/* Green header zone — full-bleed hero: ração diária */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden bg-[#055A43] px-6 pt-14 pb-10"
      >
        <div className="absolute -right-14 -top-14 w-56 h-56 rounded-full bg-white/[0.04] pointer-events-none" />
        <div className="absolute right-6 top-28 w-24 h-24 rounded-full bg-white/[0.04] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 active:scale-[0.98] transition-all shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 mb-1">
              Módulo de saúde
            </p>
            <h1 className="font-serif text-[26px] font-semibold text-white tracking-tight leading-none">
              Nutrição
            </h1>
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 shrink-0">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/55 uppercase tracking-widest mb-1.5">
                Plano diário de {dogData?.name || 'seu cão'}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-[52px] font-semibold leading-none text-white">
                  {foodInfo.daily > 0 ? foodInfo.daily : '--'}
                </span>
                <span className="text-white/55 text-sm font-medium">g / dia</span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {foodInfo.fallsback ? (
              <span className="bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium whitespace-nowrap">Recomendado</span>
            ) : foodInfo.meta.confidence === 'high' ? (
              <span className="bg-[#4ADE80]/20 text-[#4ADE80] border border-[#4ADE80]/30 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium whitespace-nowrap">Alta precisão</span>
            ) : foodInfo.meta.confidence === 'medium' ? (
              <span className="bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium whitespace-nowrap">Boa precisão</span>
            ) : (
              <span className="bg-white/10 text-white border border-white/20 px-2.5 py-1 rounded-md text-[10px] uppercase tracking-widest font-medium whitespace-nowrap">Aproximado</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* White drawer — resto do conteúdo, sobrepõe a zona verde */}
      <main className="relative -mt-6 rounded-t-[26px] bg-[#F7F5EF] px-6 pt-7 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {/* Detail hero card — nested, solid dark green */}
          <div className="bg-[#055A43] rounded-[1.75rem] p-6 text-white shadow-[0_14px_32px_rgba(5,90,67,0.2)] mb-6">
            <div className="flex justify-between items-end mb-4 pb-4 border-b border-white/10">
              <div>
                <p className="text-[11px] text-white/55 font-medium mb-1">Por refeição</p>
                <p className="font-serif text-[28px] leading-none text-white">{foodInfo.perMeal > 0 ? foodInfo.perMeal : '--'}g</p>
              </div>
              {dogData?.foodBrand && (
                <p className="text-[11px] text-white/55 uppercase tracking-widest text-right">{dogData.foodBrand}</p>
              )}
            </div>

            {dogData?.foodQuantity && (
              <div className="flex justify-between items-center mb-4 bg-black/15 rounded-xl p-3 border border-white/5">
                <p className="text-sm text-white/70 font-light">Quantidade atual (informada):</p>
                <p className="font-medium text-white text-sm">{dogData.foodQuantity}g / dia</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 text-[10px] text-white/70 uppercase tracking-widest">
                <span className="bg-white/10 px-2 py-1 rounded-md">{foodInfo.meta.weightUsed > 0 ? foodInfo.meta.weightUsed : '--'} kg</span>
                <span className="bg-white/10 px-2 py-1 rounded-md">Atividade: {foodInfo.meta.activityLevel}</span>
                <span className="bg-white/10 px-2 py-1 rounded-md">{foodInfo.meta.mealsPerDay} refeições/dia</span>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Info className="w-4 h-4 text-white/45 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/55 leading-relaxed font-light">
                  {dogData?.foodBrand ? (
                    `Essa recomendação foi calculada com base no peso informado (${foodInfo.meta.weightUsed} kg), nível de energia (${foodInfo.meta.activityLevel}) e alimentação cadastrada.`
                  ) : (
                    'Configure a alimentação atual para receber uma recomendação mais precisa.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Tips / Info */}
          <h3 className="font-serif text-[20px] text-[#506352] mb-4 px-1">Orientações</h3>

          <div className="bg-white rounded-[1.5rem] border border-[#055A43]/5 shadow-[0_8px_24px_rgba(45,74,58,0.08)] overflow-hidden flex flex-col mb-6">
            <div className="p-5 flex gap-4">
              <div className="w-9 h-9 rounded-full bg-[#055A43]/5 text-[#055A43] flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#055A43] font-medium text-[15px] mb-1">Hidratação constante</p>
                <p className="text-[#6B7A6E] text-sm font-light leading-relaxed">
                  Mantenha água fresca sempre disponível. Aumente a oferta em dias quentes ou após passeios.
                </p>
              </div>
            </div>

            <div className="mx-5 h-px bg-[#E4E1D6]" />

            <div className="p-5 flex gap-4">
               <div className="w-9 h-9 rounded-full bg-[#055A43]/5 text-[#055A43] flex items-center justify-center shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[#055A43] font-medium text-[15px] mb-1">Petiscos no treino</p>
                <p className="text-[#6B7A6E] text-sm font-light leading-relaxed">
                  Os petiscos de treino devem representar, no máximo, 10% do total calórico diário para evitar sobrepeso.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-[#C2703E] text-white p-4 rounded-xl font-semibold text-sm flex items-center justify-between active:scale-[0.98] transition-transform shadow-[0_8px_20px_rgba(194,112,62,0.25)]"
          >
            Cadastrar ração atual
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
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
                      className="w-full text-left text-base font-normal h-14 bg-[#F7F5EF] border border-[#E5E5E5] rounded-[14px] px-5 text-[#055A43] focus:outline-none focus:border-[#055A43] transition-all relative"
                    >
                      {brand || <span className="text-[#A0A4A1]">Selecione uma marca...</span>}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>
                    {!foodBrands.includes(brand) && brand ? (
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
                      className="w-full text-left text-base font-normal h-14 bg-[#F7F5EF] border border-[#E5E5E5] rounded-[14px] px-5 text-[#055A43] focus:outline-none focus:border-[#055A43] transition-all relative"
                    >
                      {line || <span className="text-[#A0A4A1]">Selecione uma linha...</span>}
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
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
                      <div className="flex bg-[#F7F5EF] border border-gray-100 rounded-2xl p-1 h-14">
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
                                  : 'text-[#6B7A6E]/60'
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
                        className="w-full text-left text-base font-normal h-14 bg-[#F7F5EF] border border-[#E5E5E5] rounded-[14px] px-5 text-[#055A43] focus:outline-none focus:border-[#055A43] transition-all relative"
                      >
                        {version || <span className="text-[#A0A4A1]">Selecione a versão...</span>}
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
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
                    <label className="text-[11px] font-medium text-[#506352] uppercase tracking-widest ml-1">Quantidade diária (em gramas)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Ex: 250"
                        className="w-full h-14 px-5 bg-[#F7F5EF] border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#055A43]/20 focus:border-[#055A43] transition-all outline-none text-[#055A43]"
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
                    Salvar informações
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <BottomSheetSelect 
          isOpen={isBrandSheetOpen}
          onClose={() => setIsBrandSheetOpen(false)}
          options={[...foodBrands, 'Outra']}
          value={brand}
          onSelect={(val) => {
            setBrand(val);
            setLine('');
          }}
          title="Selecione a marca"
          placeholder="Buscar marca..."
        />
        
        <BottomSheetSelect 
          isOpen={isLineSheetOpen}
          onClose={() => setIsLineSheetOpen(false)}
          options={[...brandLineOptions, 'Outra']}
          value={line}
          onSelect={(val) => {
            setLine(val);
            const detectedLifeStage = getLifeStageFromOptions(foodOptions, brand, val);
            if (detectedLifeStage) setLifeStage(detectedLifeStage);
          }}
          title="Selecione a linha"
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
          title="Selecione a versão"
          placeholder="Buscar versão..."
        />
      </main>
    </div>
  );
}
