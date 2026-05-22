import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, HeartPulse, Battery, Sparkles } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { haptics } from '@/src/lib/haptics';
import confetti from 'canvas-confetti';

export function Checkin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [dogName, setDogName] = useState('seu cão');
  
  const [data, setData] = useState({
    energia: '',
    alimentacao: '',
    comportamento: ''
  });

  useEffect(() => {
    const loadDog = async () => {
      const user = auth.currentUser;
      if (user) {
        const dog = await DogRepository.getDogProfile(user.uid);
        if (dog && dog.name) setDogName(dog.name);
      }
    };
    loadDog();
  }, []);

  const updateData = (field: keyof typeof data, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) {
      haptics.light();
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const dateStr = new Date().toISOString().split('T')[0];
        await CheckinRepository.saveCheckin(user.uid, dateStr, data);
        await EvolutionRepository.updateFromCheckin(user.uid);
      }
    } catch (err) {
      console.error("Erro ao salvar check-in", err);
    } finally {
      setIsSaving(false);
      haptics.success();
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ['#055A43', '#506352', '#E5F2ED'] });
      setTimeout(() => {
        confetti({ particleCount: 30, spread: 70, origin: { y: 0.6 }, colors: ['#055A43', '#fbf9f5'] });
      }, 200);
      setIsCompleted(true);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="flex flex-col items-center max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-[#055A43]/5 rounded-[2rem] flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-[#055A43]" />
          </div>
          <h2 className="font-serif text-[32px] text-[#055A43] leading-tight tracking-tight mb-3">
            Diário <br/>Atualizado
          </h2>
          <p className="text-[#5C615D] text-sm font-light leading-relaxed mb-10">
            Check-in de hoje registrado. Cuidar também é observar. Hoje vocês deram mais um passo na jornada.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#055A43] text-white h-14 rounded-2xl font-medium shadow-lg hover:bg-[#044735] active:scale-[0.98] transition-all"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 bg-[#506352]/10 rounded-full flex items-center justify-center mb-6">
              <Battery className="w-6 h-6 text-[#506352]" />
            </div>
            <h2 className="font-serif text-3xl text-[#055A43] mb-2 tracking-tight">Energia</h2>
            <p className="text-[#5C615D] text-[15px] font-light mb-8">Como foi o ritmo do seu cão hoje?</p>
            
            <div className="flex flex-col gap-3">
              {['Calmo e relaxado', 'Equilibrado', 'Agitado e sem foco'].map(option => (
                <button
                  key={option}
                  onClick={() => updateData('energia', option)}
                  className={`w-full p-5 rounded-[1.5rem] border text-left flex justify-between items-center transition-all ${
                    data.energia === option 
                    ? 'border-[#055A43] bg-[#055A43]/5' 
                    : 'border-[#055A43]/10 bg-white hover:border-[#055A43]/30'
                  }`}
                >
                  <span className={`text-[15px] ${data.energia === option ? 'text-[#055A43] font-medium' : 'text-[#5C615D]'}`}>
                    {option}
                  </span>
                  {data.energia === option && <Check className="w-5 h-5 text-[#055A43]" />}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 bg-[#5F2620]/10 rounded-full flex items-center justify-center mb-6">
              <HeartPulse className="w-6 h-6 text-[#5F2620]" />
            </div>
            <h2 className="font-serif text-3xl text-[#055A43] mb-2 tracking-tight">Alimentação</h2>
            <p className="text-[#5C615D] text-[15px] font-light mb-8">O apetite dele estava normal?</p>
            
            <div className="flex flex-col gap-3">
              {['Comeu tudo com gosto', 'Deixou um pouco', 'Sem apetite'].map(option => (
                <button
                  key={option}
                  onClick={() => updateData('alimentacao', option)}
                  className={`w-full p-5 rounded-[1.5rem] border text-left flex justify-between items-center transition-all ${
                    data.alimentacao === option 
                    ? 'border-[#055A43] bg-[#055A43]/5' 
                    : 'border-[#055A43]/10 bg-white hover:border-[#055A43]/30'
                  }`}
                >
                  <span className={`text-[15px] ${data.alimentacao === option ? 'text-[#055A43] font-medium' : 'text-[#5C615D]'}`}>
                    {option}
                  </span>
                  {data.alimentacao === option && <Check className="w-5 h-5 text-[#055A43]" />}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 bg-[#055A43]/10 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-[#055A43]" />
            </div>
            <h2 className="font-serif text-3xl text-[#055A43] mb-2 tracking-tight">Comportamento</h2>
            <p className="text-[#5C615D] text-[15px] font-light mb-8">Houve algum desvio na rotina ou reatividade?</p>
            
            <div className="flex flex-col gap-3">
              {['Passeio tranquilo', 'Reagiu a outros cães', 'Ansiedade ao ficar só', 'Dia excelente, sem problemas'].map(option => (
                <button
                  key={option}
                  onClick={() => updateData('comportamento', option)}
                  className={`w-full p-5 rounded-[1.5rem] border text-left flex justify-between items-center transition-all ${
                    data.comportamento === option 
                    ? 'border-[#055A43] bg-[#055A43]/5' 
                    : 'border-[#055A43]/10 bg-white hover:border-[#055A43]/30'
                  }`}
                >
                  <span className={`text-[15px] ${data.comportamento === option ? 'text-[#055A43] font-medium' : 'text-[#5C615D]'}`}>
                    {option}
                  </span>
                  {data.comportamento === option && <Check className="w-5 h-5 text-[#055A43]" />}
                </button>
              ))}
            </div>
          </motion.div>
        );
    }
  };

  const isCurrentStepValid = () => {
    if (step === 1) return data.energia !== '';
    if (step === 2) return data.alimentacao !== '';
    if (step === 3) return data.comportamento !== '';
    return false;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 pt-16 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#055A43]/10 flex items-center justify-center text-[#5C615D]"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="px-6 mt-6">
        <span className="text-[10px] font-medium text-[#055A43] tracking-widest uppercase mb-1 block">Check-in de hoje</span>
        <h1 className="font-serif text-[28px] text-[#055A43] leading-none mb-6">Como foi o dia <br/>do {dogName}?</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#506352] uppercase tracking-widest">Passo {step} de 3</span>
        </div>
        <div className="w-full bg-[#055A43]/10 h-[6px] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#055A43]"
            initial={{ width: `${(step - 1) * 33.3}%` }}
            animate={{ width: `${step * 33.3}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <main className="flex-1 px-6 pt-10 pb-32">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <div className="fixed bottom-[80px] left-0 right-0 p-6 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent z-40 pointer-events-none">
        <button
          onClick={handleNext}
          disabled={!isCurrentStepValid() || isSaving}
          className="w-full bg-[#055A43] text-white h-14 rounded-2xl font-medium text-base flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] pointer-events-auto"
        >
          {isSaving ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{step === 3 ? 'Finalizar Check-in' : 'Continuar'}</span>
              {step !== 3 && <ArrowRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
