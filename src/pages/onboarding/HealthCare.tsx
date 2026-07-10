import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/src/lib/firebase';
import { NotificationRepository } from '@/src/repositories/NotificationRepository';
import { AuthLayout } from '@/src/components/layout/AuthLayout';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { ShieldPlus, ChevronDown } from 'lucide-react';
import { BottomSheetSelect } from '@/src/components/ui/BottomSheetSelect';
import { DOG_FOOD_OPTIONS } from '@/src/lib/dogFoodOptions';
import {
  getBrandsFromOptions,
  getLifeStageFromOptions,
  getLinesByBrandFromOptions,
  getLinesFromOptions,
  NutritionFormulaRepository,
} from '@/src/repositories/NutritionFormulaRepository';
import { DOG_WEIGHT_MAX_KG, sanitizeDecimalInput } from '@/src/lib/dogFieldValidation';

export function HealthCare() {
  const navigate = useNavigate();
  const location = useLocation();
  const dogName = location.state?.dogData?.name || 'seu cão';
  
  const [formData, setFormData] = useState({ 
    weight: location.state?.dogData?.weight || '', 
    diet: '', 
    foodBrand: '',
    foodLine: '',
    lifeStage: ['Nao sei', 'Não sei'].includes(location.state?.dogData?.lifeStage) ? '' : location.state?.dogData?.lifeStage || '',
    foodVersion: '',
    mealsPerDay: '',
    foodQuantity: '',
    naturalFoodDetails: '',
    hasVetGuidance: '',
    lastVaccine: '', 
    nextVaccine: '',
    nextCheckup: '',
    observations: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [foodOptions, setFoodOptions] = useState(DOG_FOOD_OPTIONS);

  const diets = ['Ração seca', 'Ração úmida', 'Alimentação natural', 'Mista'];
  const foodVersions = ['Padrão', 'Castrado', 'Light', 'Sensível', 'Outra versão'];
  const lifeStages = ['Filhote', 'Adulto', 'Sênior'];
  const mealsOptions = ['1 vez', '2 vezes', '3 vezes', '4 ou mais'];
  
  const isRacao = formData.diet === 'Ração seca' || formData.diet === 'Ração úmida' || formData.diet === 'Mista';
  const isNatural = formData.diet === 'Alimentação natural';
  const isMista = formData.diet === 'Mista';

  useEffect(() => {
    let isMounted = true;

    NutritionFormulaRepository.getFoodOptions().then((options) => {
      if (isMounted) setFoodOptions(options);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const foodBrands = useMemo(() => getBrandsFromOptions(foodOptions), [foodOptions]);
  const foodLines = useMemo(() => getLinesFromOptions(foodOptions), [foodOptions]);
  const brandLineOptions = useMemo(
    () =>
      formData.foodBrand && foodBrands.includes(formData.foodBrand)
        ? getLinesByBrandFromOptions(foodOptions, formData.foodBrand)
        : foodLines,
    [foodBrands, foodLines, foodOptions, formData.foodBrand]
  );

  const handleNext = async () => {
    if (!formData.diet) {
      setError('Por favor, selecione como o cão se alimenta.');
      return;
    }
    if (!formData.mealsPerDay) {
      setError('Por favor, informe a quantidade de refeições.');
      return;
    }
    if (!formData.weight) {
      setError('Por favor, informe o peso atual.');
      return;
    }

    const numericWeight = Number(formData.weight);
    if (!Number.isFinite(numericWeight) || numericWeight <= 0 || numericWeight > DOG_WEIGHT_MAX_KG) {
      setError(`Informe um peso entre 0.1 e ${DOG_WEIGHT_MAX_KG} kg.`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        if (formData.nextVaccine) {
          await NotificationRepository.scheduleVaccineReminders(user.uid, dogName, 'Geral', formData.nextVaccine);
        }
        if (formData.nextCheckup) {
          await NotificationRepository.scheduleCheckupReminders(user.uid, dogName, formData.nextCheckup);
        }
      }
      
      navigate('/onboarding/personality', { 
        state: { 
          ...location.state, 
          health: formData,
          dogData: {
            ...location.state?.dogData,
            weight: formData.weight
          }
        } 
      });
    } catch (err) {
      console.error('Error scheduling reminders:', err);
      setError('Ocorreu um erro ao agendar os lembretes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout 
      title="Alimentação atual" 
      subtitle={`Conte como o ${dogName} se alimenta hoje para personalizarmos melhor as recomendações nutricionais.`}
      step="ETAPA 3 DE 7"
    >
      <div className="flex flex-col gap-8 flex-1">
        
        <div>
          <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
            Como o {dogName} se alimenta hoje?
          </label>
          <div className="flex flex-col gap-2">
            {diets.map(item => (
              <button
                key={item}
                onClick={() => setFormData(prev => ({ ...prev, diet: item }))}
                className={`w-full text-left px-5 py-4 rounded-2xl border text-[15px] font-medium transition-all ${
                  formData.diet === item
                    ? 'bg-[#055A43] text-white border-[#055A43]'
                    : 'bg-white text-[#506352] border-gray-100 hover:border-[#055A43]/30'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {isRacao && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest ml-1">{isMista ? 'Qual a marca principal?' : 'Qual marca ele usa hoje?'}</label>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                className="w-full text-left font-normal h-[56px] bg-[#F7F5EF] border border-gray-100 rounded-2xl px-4 text-[15px] text-[#055A43] focus:outline-none transition-all relative"
              >
                {formData.foodBrand || <span className="text-[#A0A4A1]">Ex: Royal Canin, PremieR...</span>}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              {formData.foodBrand === 'Outra' || (!foodBrands.includes(formData.foodBrand) && formData.foodBrand) ? (
                <Input
                  placeholder="Digite a marca da ração..."
                  value={formData.foodBrand === 'Outra' ? '' : formData.foodBrand}
                  onChange={(e) => setFormData(prev => ({ ...prev, foodBrand: e.target.value }))}
                />
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest ml-1">
                {isMista ? 'Qual é a linha principal?' : 'Qual é a linha da ração?'}
              </label>
              <button
                type="button"
                onClick={() => setIsLineModalOpen(true)}
                className="w-full text-left font-normal min-h-[56px] bg-[#F7F5EF] border border-gray-100 rounded-2xl px-4 py-3 text-[15px] text-[#055A43] focus:outline-none transition-all relative pr-12"
              >
                {formData.foodLine || <span className="text-[#A0A4A1]">Selecione a linha da ração...</span>}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B7A6E]">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              {formData.foodLine === 'Outra' || (!brandLineOptions.includes(formData.foodLine) && formData.foodLine) ? (
                <Input
                  placeholder="Digite a linha da ração..."
                  value={formData.foodLine === 'Outra' ? '' : formData.foodLine}
                  onChange={(e) => setFormData(prev => ({ ...prev, foodLine: e.target.value }))}
                />
              ) : null}
            </div>

            <div>
              <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
                Em qual fase ele está?
              </label>
              <div className="flex gap-2">
                {lifeStages.map(item => {
                  const value = item === 'Sênior' ? 'Senior' : item;
                  return (
                    <button
                      key={item}
                      onClick={() => setFormData(prev => ({ ...prev, lifeStage: value }))}
                      className={`flex-1 py-3 rounded-xl border text-[14px] font-medium transition-all ${
                        formData.lifeStage === value
                          ? 'bg-[#055A43] text-white border-[#055A43]'
                          : 'bg-white text-[#506352] border-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
                A fórmula é de algum tipo específico?
              </label>
              <div className="flex flex-wrap gap-2">
                {foodVersions.map(item => (
                  <button
                    key={item}
                    onClick={() => setFormData(prev => ({ ...prev, foodVersion: item }))}
                    className={`px-4 py-2 rounded-full border text-[13px] font-medium transition-all ${
                      formData.foodVersion === item
                        ? 'bg-[#055A43] text-white border-[#055A43]'
                        : 'bg-white text-[#506352] border-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isNatural && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
               <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
                Detalhes da Alimentação Natural
              </label>
              <textarea
                value={formData.naturalFoodDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, naturalFoodDetails: e.target.value }))}
                placeholder="Ex: dietas cruas, cozidas, restrições..."
                className="w-full bg-[#F7F5EF] border border-gray-100 rounded-2xl p-4 text-[#6B7A6E] text-[15px] focus:outline-none focus:border-[#055A43]/20 focus:bg-white transition-colors h-24 resize-none"
              />
            </div>
            <div>
               <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
                Acompanha orientação profissional?
              </label>
              <div className="flex flex-wrap gap-2">
                {['Sim, com nutrólogo/vet', 'Não, faço por conta', 'Pretendo buscar'].map(item => (
                  <button
                    key={item}
                    onClick={() => setFormData(prev => ({ ...prev, hasVetGuidance: item }))}
                    className={`px-4 py-2 rounded-xl border text-[13px] font-medium transition-all ${
                      formData.hasVetGuidance === item
                        ? 'bg-[#055A43] text-white border-[#055A43]'
                        : 'bg-white text-[#506352] border-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {formData.diet && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-2 duration-300 pt-4 border-t border-gray-100">
            <div>
               <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
                Quantas vezes ele come por dia?
              </label>
              <div className="flex flex-wrap gap-2">
                {mealsOptions.map(item => (
                  <button
                    key={item}
                    onClick={() => setFormData(prev => ({ ...prev, mealsPerDay: item }))}
                    className={`px-4 py-2 rounded-full border text-[14px] font-medium transition-all ${
                      formData.mealsPerDay === item
                        ? 'bg-[#055A43] text-white border-[#055A43]'
                        : 'bg-white text-[#506352] border-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {isRacao && (
              <Input 
                label="Você sabe quanto ele come por dia hoje? (Opcional)" 
                placeholder="Ex: 120"
                type="number"
                suffix="gramas"
                value={formData.foodQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, foodQuantity: e.target.value }))}
              />
            )}
            
            <div className="h-px w-full bg-gray-100" />

            <div className="flex flex-col gap-6">
               <h3 className="text-[#055A43] font-serif text-[20px]">Informações Gerais</h3>
               <Input 
                label="Peso atual" 
                placeholder="00.0"
                type="text"
                inputMode="decimal"
                maxLength={5}
                suffix="kg"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: sanitizeDecimalInput(e.target.value, DOG_WEIGHT_MAX_KG) }))}
              />

              <Input 
                label="Última vacina" 
                type="date"
                value={formData.lastVaccine}
                onChange={(e) => setFormData(prev => ({ ...prev, lastVaccine: e.target.value }))}
              />

              <Input 
                label="Próxima vacina" 
                type="date"
                value={formData.nextVaccine}
                onChange={(e) => setFormData(prev => ({ ...prev, nextVaccine: e.target.value }))}
              />

              <Input 
                label="Próximo check-up" 
                type="date"
                value={formData.nextCheckup}
                onChange={(e) => setFormData(prev => ({ ...prev, nextCheckup: e.target.value }))}
              />

              <div>
                 <label className="block text-[#6B7A6E] text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">
                  Observações de saúde (opcional)
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Alguma condição de saúde, alergia ou preferência que devemos saber?"
                  className="w-full bg-[#F7F5EF] border border-gray-100 rounded-2xl p-4 text-[#6B7A6E] text-[15px] focus:outline-none focus:border-[#055A43]/20 focus:bg-white transition-colors h-24 resize-none"
                />
              </div>
            </div>

          </div>
        )}

        <div className="bg-[#055A43] text-white p-4 rounded-2xl flex gap-4 items-start relative overflow-hidden mt-4">
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
           <ShieldPlus className="w-6 h-6 text-white/80 shrink-0 mt-0.5" />
           <div className="relative z-10">
             <p className="text-white/80 text-xs font-medium mb-1">Dica do Especialista</p>
             <p className="text-sm font-semibold text-white">Manter o peso ideal aumenta a longevidade em até 20%.</p>
           </div>
        </div>

        {error && <p className="text-red-500 text-sm ml-1">{error}</p>}

        <div className="mt-2 pb-4">
          <Button onClick={handleNext} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Próximo passo'}
          </Button>
        </div>
      </div>

      <BottomSheetSelect 
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        options={[...foodBrands, 'Outra']}
        value={formData.foodBrand}
        onSelect={(val) => setFormData(prev => ({ ...prev, foodBrand: val, foodLine: '' }))}
        title="Selecione a Marca"
        placeholder="Buscar marca..."
      />
      <BottomSheetSelect
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        options={[...brandLineOptions, 'Outra']}
        value={formData.foodLine}
        onSelect={(val) => {
          const detectedLifeStage = getLifeStageFromOptions(foodOptions, formData.foodBrand, val);
          setFormData(prev => ({
            ...prev,
            foodLine: val,
            lifeStage: detectedLifeStage || prev.lifeStage
          }));
        }}
        title="Selecione a Linha"
        placeholder="Buscar linha..."
      />
    </AuthLayout>
  );
}
