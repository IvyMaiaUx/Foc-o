import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowRight, HeartPulse, Battery, Sparkles, MapPin } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { CheckinRepository, type CheckinData, type CheckinIncident, type CheckinTrigger } from '@/src/repositories/CheckinRepository';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { haptics } from '@/src/lib/haptics';
import { toLocalDateKey } from '@/src/lib/dateKeys';
import { AnalyticsRepository } from '@/src/repositories/AnalyticsRepository';
import confetti from 'canvas-confetti';

export function Checkin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState('Não foi possível salvar seu check-in. Verifique a conexão e tente de novo.');
  const [dogName, setDogName] = useState('seu cão');
  const [dogGender, setDogGender] = useState('male');

  const [data, setData] = useState<CheckinData>({
    energia: '',
    alimentacao: '',
    comportamento: '',
    context: {
      incidents: [],
      triggers: [],
      notes: ''
    }
  });

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const dog = await DogRepository.getDogProfile(user.uid);
      if (dog) {
        if (dog.name) setDogName(dog.name);
        setDogGender(dog.gender || 'male');
      }
      // O check-in sempre abre em branco, mesmo se já existir um salvo hoje —
      // salvar de novo sobrescreve o anterior (saveCheckin faz merge do
      // documento do dia inteiro, então isso não deixa dado velho pra trás).
    };
    load();
  }, []);

  const updateData = (field: 'energia' | 'alimentacao' | 'comportamento', value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateContext = (field: keyof NonNullable<CheckinData['context']>, value: unknown) => {
    setData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        [field]: value
      }
    }));
  };

  const toggleIncident = (incident: CheckinIncident) => {
    const incidents = data.context?.incidents ?? [];
    updateContext(
      'incidents',
      incidents.includes(incident)
        ? incidents.filter(item => item !== incident)
        : [...incidents, incident]
    );
  };

  const toggleTrigger = (trigger: CheckinTrigger) => {
    const triggers = data.context?.triggers ?? [];
    updateContext(
      'triggers',
      triggers.includes(trigger)
        ? triggers.filter(item => item !== trigger)
        : [...triggers, trigger]
    );
  };

  const setWalked = (walked: boolean | undefined) => {
    setData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        walked,
        ...(walked === true ? {} : { walkDurationMinutes: undefined, environment: undefined })
      }
    }));
  };

  const handleNext = () => {
    if (step < 4) {
      haptics.light();
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setSaveError(false);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      const dateStr = toLocalDateKey();
      // O save de fato — se isto falhar, NÃO mostramos sucesso.
      await CheckinRepository.saveCheckin(user.uid, dateStr, data);
      await EvolutionRepository.updateFromCheckin(user.uid, dateStr);
      AnalyticsRepository.logEvent('checkin_created', data);

      // Referral é best-effort: não bloqueia nem invalida o check-in.
      try {
        const token = await user.getIdToken();
        await fetch('https://app.focaoapp.com.br/api/process-referral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (refErr) {
        console.warn('[Referral] Failed to trigger checkin referral evaluation:', refErr);
      }

      // Sucesso confirmado → comemora.
      haptics.success();
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ['#055A43', '#506352', '#E5F2ED'] });
      setTimeout(() => {
        confetti({ particleCount: 30, spread: 70, origin: { y: 0.6 }, colors: ['#055A43', '#fbf9f5'] });
      }, 200);
      setIsCompleted(true);
    } catch (err) {
      console.error("Erro ao salvar check-in", err);
      setSaveErrorMsg(
        err instanceof Error && err.message === 'Usuário não autenticado'
          ? 'Sua sessão expirou. Entre novamente para continuar.'
          : 'Não foi possível salvar seu check-in. Verifique a conexão e tente de novo.'
      );
      setSaveError(true);
    } finally {
      setIsSaving(false);
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
            Diário <br/>atualizado
          </h2>
          <p className="text-[#6B7A6E] text-sm font-light leading-relaxed mb-10">
            Check-in de hoje registrado. Cuidar também é observar. Hoje vocês deram mais um passo na jornada.
          </p>
          <button
            onClick={() => navigate('/inicio')}
            className="w-full bg-[#055A43] text-white h-14 rounded-2xl font-medium shadow-lg hover:bg-[#044735] active:scale-[0.98] transition-all"
          >
            Voltar ao início
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
            <p className="text-[#6B7A6E] text-[15px] font-light mb-8">Como foi o ritmo {dogGender === 'female' ? 'da' : 'do'} {dogName} hoje?</p>
            
            <div className="flex flex-col gap-3">
              {['Calmo e relaxado', 'Equilibrado', 'Agitado e sem foco'].map(option => (
                <button
                  key={option}
                  onClick={() => updateData('energia', option)}
                  className={`w-full min-h-[56px] px-5 py-4 rounded-2xl border text-left flex justify-between items-center transition-all duration-200 ease-out ${
                    data.energia === option 
                    ? 'border-[#055A43] bg-[#EAF0E8]' 
                    : 'border-[#E4E1D6] bg-[#FFFEFB] hover:border-[#055A43]/40'
                  }`}
                >
                  <span className={`text-[15px] ${data.energia === option ? 'text-[#055A43] font-medium' : 'text-[#6B7A6E]'}`}>
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
            <div className="w-12 h-12 bg-[#C2703E]/10 rounded-full flex items-center justify-center mb-6">
              <HeartPulse className="w-6 h-6 text-[#C2703E]" />
            </div>
            <h2 className="font-serif text-3xl text-[#055A43] mb-2 tracking-tight">Alimentação</h2>
            <p className="text-[#6B7A6E] text-[15px] font-light mb-8">O apetite dele estava normal?</p>
            
            <div className="flex flex-col gap-3">
              {['Comeu tudo com gosto', 'Deixou um pouco', 'Sem apetite'].map(option => (
                <button
                  key={option}
                  onClick={() => updateData('alimentacao', option)}
                  className={`w-full min-h-[56px] px-5 py-4 rounded-2xl border text-left flex justify-between items-center transition-all duration-200 ease-out ${
                    data.alimentacao === option 
                    ? 'border-[#055A43] bg-[#EAF0E8]' 
                    : 'border-[#E4E1D6] bg-[#FFFEFB] hover:border-[#055A43]/40'
                  }`}
                >
                  <span className={`text-[15px] ${data.alimentacao === option ? 'text-[#055A43] font-medium' : 'text-[#6B7A6E]'}`}>
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
            <p className="text-[#6B7A6E] text-[15px] font-light mb-8">Houve algum desvio na rotina ou reatividade?</p>
            
            <div className="flex flex-col gap-3">
              {['Passeio tranquilo', 'Reagiu a outros cães', 'Ansiedade ao ficar só', 'Dia excelente, sem problemas'].map(option => (
                <button
                  key={option}
                  onClick={() => updateData('comportamento', option)}
                  className={`w-full min-h-[56px] px-5 py-4 rounded-2xl border text-left flex justify-between items-center transition-all duration-200 ease-out ${
                    data.comportamento === option 
                    ? 'border-[#055A43] bg-[#EAF0E8]' 
                    : 'border-[#E4E1D6] bg-[#FFFEFB] hover:border-[#055A43]/40'
                  }`}
                >
                  <span className={`text-[15px] ${data.comportamento === option ? 'text-[#055A43] font-medium' : 'text-[#6B7A6E]'}`}>
                    {option}
                  </span>
                  {data.comportamento === option && <Check className="w-5 h-5 text-[#055A43]" />}
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 4: {
        const incidents = data.context?.incidents ?? [];
        const triggers = data.context?.triggers ?? [];
        const incidentOptions: Array<{ value: CheckinIncident; label: string }> = [
          { value: 'leash_pulling', label: 'Puxou a guia' },
          { value: 'excessive_barking', label: 'Latiu em excesso' },
          { value: 'reactivity', label: 'Reagiu a estímulos' },
          { value: 'destruction', label: 'Destruiu objetos' },
          { value: 'exit_agitation', label: 'Agitação na saída' },
          { value: 'pee_wrong_place', label: 'Xixi fora do lugar' },
          { value: 'biting', label: 'Mordeu durante brincadeira' },
        ];
        const triggerOptions: Array<{ value: CheckinTrigger; label: string }> = [
          { value: 'doorbell', label: 'Campainha' },
          { value: 'visitors', label: 'Visitas' },
          { value: 'dogs_nearby', label: 'Outros cães' },
          { value: 'street_noise', label: 'Barulho da rua' },
          { value: 'being_alone', label: 'Ficou sozinho' },
          { value: 'leaving_home', label: 'Hora de sair' },
          { value: 'routine_change', label: 'Mudança na rotina' },
          { value: 'unknown', label: 'Não identifiquei' },
        ];

        return (
          <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="w-12 h-12 bg-[#055A43]/10 rounded-full flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6 text-[#055A43]" />
            </div>
            <h2 className="font-serif text-3xl text-[#055A43] mb-2 tracking-tight">Contexto do dia</h2>
            <p className="text-[#6B7A6E] text-[15px] font-light mb-6">
              Opcional. Esses detalhes tornam as recomendações mais precisas.
            </p>

            <div className="space-y-6">
              <section>
                <p className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3">Teve passeio hoje?</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Sim', value: true },
                    { label: 'Não', value: false },
                    { label: 'Não informar', value: undefined },
                  ].map(option => (
                    <button
                      type="button"
                      key={option.label}
                      onClick={() => setWalked(option.value)}
                      className={`min-h-11 rounded-xl border px-2 text-xs transition-all ${
                        data.context?.walked === option.value
                          ? 'border-[#055A43] bg-[#EAF0E8] text-[#055A43] font-semibold'
                          : 'border-[#055A43]/10 bg-white text-[#6B7A6E]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {data.context?.walked === true && (
                <section className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3">Duração aproximada</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 20, 30, 45].map(minutes => (
                        <button
                          type="button"
                          key={minutes}
                          onClick={() => updateContext('walkDurationMinutes', minutes)}
                          className={`min-h-11 rounded-xl border px-2 text-xs transition-all ${
                            data.context?.walkDurationMinutes === minutes
                              ? 'border-[#055A43] bg-[#EAF0E8] text-[#055A43] font-semibold'
                              : 'border-[#055A43]/10 bg-white text-[#6B7A6E]'
                          }`}
                        >
                          {minutes} min
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3">Onde aconteceu?</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'calm_street', label: 'Rua tranquila' },
                        { value: 'busy_street', label: 'Rua movimentada' },
                        { value: 'dogs_nearby', label: 'Perto de cães' },
                        { value: 'new_environment', label: 'Lugar novo' },
                      ].map(option => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => updateContext('environment', option.value)}
                          className={`rounded-full border px-3 py-2 text-xs transition-all ${
                            data.context?.environment === option.value
                              ? 'border-[#055A43] bg-[#055A43] text-white'
                              : 'border-[#055A43]/10 bg-white text-[#6B7A6E]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              <section>
                <p className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3">Aconteceu algo relevante?</p>
                <div className="flex flex-wrap gap-2">
                  {incidentOptions.map(option => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => toggleIncident(option.value)}
                      className={`rounded-full border px-3 py-2 text-xs transition-all ${
                        incidents.includes(option.value)
                          ? 'border-[#055A43] bg-[#055A43] text-white'
                          : 'border-[#055A43]/10 bg-white text-[#6B7A6E]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {incidents.length > 0 && (
                <>
                  <section>
                    <p className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3">O que pode ter provocado?</p>
                    <div className="flex flex-wrap gap-2">
                      {triggerOptions.map(option => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => toggleTrigger(option.value)}
                          className={`rounded-full border px-3 py-2 text-xs transition-all ${
                            triggers.includes(option.value)
                              ? 'border-[#055A43] bg-[#055A43] text-white'
                              : 'border-[#055A43]/10 bg-white text-[#6B7A6E]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section>
                    <p className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3">Intensidade percebida</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Leve', value: 1 as const },
                        { label: 'Moderada', value: 2 as const },
                        { label: 'Alta', value: 3 as const },
                      ].map(option => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => updateContext('intensity', option.value)}
                          className={`min-h-11 rounded-xl border px-2 text-xs transition-all ${
                            data.context?.intensity === option.value
                              ? 'border-[#055A43] bg-[#EAF0E8] text-[#055A43] font-semibold'
                              : 'border-[#055A43]/10 bg-white text-[#6B7A6E]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </section>
                </>
              )}

              <section>
                <label className="text-[10px] font-semibold text-[#506352] tracking-widest uppercase mb-3 block" htmlFor="checkin-notes">
                  Observação rápida
                </label>
                <textarea
                  id="checkin-notes"
                  value={data.context?.notes ?? ''}
                  onChange={(event) => updateContext('notes', event.target.value.slice(0, 180))}
                  placeholder="Ex.: ficou mais calmo depois do passeio."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[#055A43]/10 bg-white p-4 text-sm text-[#6B7A6E] outline-none transition focus:border-[#055A43]/40"
                />
              </section>
            </div>
          </motion.div>
        );
      }
    }
  };

  const isCurrentStepValid = () => {
    if (step === 1) return data.energia !== '';
    if (step === 2) return data.alimentacao !== '';
    if (step === 3) return data.comportamento !== '';
    if (step === 4) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 pt-16 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#055A43]/10 flex items-center justify-center text-[#6B7A6E]"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="px-6 mt-6">
        <span className="text-[10px] font-medium text-[#055A43] tracking-widest uppercase mb-1 block">Check-in de hoje</span>
        <h1 className="font-serif text-[28px] text-[#055A43] leading-none mb-6">Como foi o dia <br/>{dogGender === 'female' ? 'da' : 'do'} {dogName}?</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#506352] uppercase tracking-widest">Passo {step} de 4</span>
        </div>
        <div className="w-full bg-[#055A43]/10 h-[6px] rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#055A43]"
            initial={{ width: `${(step - 1) * 25}%` }}
            animate={{ width: `${step * 25}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <main className="flex-1 px-6 pt-10 pb-48">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <div className="fixed bottom-[80px] left-0 right-0 p-6 bg-gradient-to-t from-[#F7F5EF] via-[#F7F5EF] to-transparent z-40 pointer-events-none">
        {saveError && (
          <p className="mb-3 text-center text-[13px] text-[#B42318] pointer-events-auto">
            {saveErrorMsg}
          </p>
        )}
        <button
          onClick={handleNext}
          disabled={!isCurrentStepValid() || isSaving}
          className="w-full bg-[#055A43] text-white h-14 rounded-2xl font-medium text-base flex justify-center items-center gap-2 shadow-lg disabled:opacity-50 transition-all active:scale-[0.98] pointer-events-auto"
        >
          {isSaving ? (
             <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{step === 4 ? 'Finalizar check-in' : 'Continuar'}</span>
              {step !== 4 && <ArrowRight className="w-5 h-5" />}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
