import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, CheckCircle2, Clock, Droplets, Hand, Home, ShieldCheck, Volume2, Wind } from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';

const SOS_PROTOCOLS = [
  {
    id: 'destroying',
    title: 'Destruição',
    trigger: 'roendo, rasgando ou pegando objetos',
    icon: Home,
    duration: '5 min',
    firstMove: 'Troque o objeto sem bronca.',
    steps: [
      'Retire o objeto com calma e ofereça um mordedor ou brinquedo recheável.',
      'Reduza o espaço por alguns minutos para baixar a agitação.',
      'Depois faça 3 minutos de farejo com petiscos no chão.',
    ],
  },
  {
    id: 'barking',
    title: 'Latidos',
    trigger: 'campainha, janela, barulho ou visita',
    icon: Volume2,
    duration: '4 min',
    firstMove: 'Afaste do gatilho.',
    steps: [
      'Bloqueie a visão ou leve o cão para outro cômodo.',
      'Peça uma ação fácil, como olhar para você ou sentar.',
      'Recompense qualquer pausa curta de silêncio.',
    ],
  },
  {
    id: 'anxiety',
    title: 'Agitação',
    trigger: 'andando sem parar, ofegante ou sem relaxar',
    icon: Wind,
    duration: '6 min',
    firstMove: 'Diminua os estímulos.',
    steps: [
      'Reduza luz, barulho, visitas e acesso à janela.',
      'Ofereça lamber ou farejar por poucos minutos.',
      'Fique presente sem falar demais até ele baixar a intensidade.',
    ],
  },
  {
    id: 'biting',
    title: 'Mordidas',
    trigger: 'brincadeira passando do ponto',
    icon: Hand,
    duration: '3 min',
    firstMove: 'Congele a interação.',
    steps: [
      'Pare o movimento por alguns segundos.',
      'Tire mãos, roupas e pés do alcance sem empurrar.',
      'Redirecione para um brinquedo comprido e retome só com boca suave.',
    ],
  },
  {
    id: 'potty',
    title: 'Xixi fora',
    trigger: 'acidente recente dentro de casa',
    icon: Droplets,
    duration: '5 min',
    firstMove: 'Limpe sem chamar atenção.',
    steps: [
      'Limpe o local sem bronca e sem discurso.',
      'Leve o cão ao local correto mesmo que ele já tenha feito.',
      'Anote horário e contexto para antecipar a próxima ida.',
    ],
  },
];

export function SosTreinos() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(SOS_PROTOCOLS[0].id);
  const [isOpeningTraining, setIsOpeningTraining] = useState(false);
  const active = SOS_PROTOCOLS.find((protocol) => protocol.id === activeId) || SOS_PROTOCOLS[0];
  const ActiveIcon = active.icon;

  const openDailyTraining = async () => {
    if (isOpeningTraining) return;

    setIsOpeningTraining(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const plan = await TrainingRepository.getCurrentPlan(user.uid);
      const currentTask = plan?.tasks?.[plan.currentTaskIndex || 0] || plan?.tasks?.[0];

      if (currentTask?.id) {
        navigate(`/treino/${currentTask.id}`);
        return;
      }

      navigate('/plano');
    } catch (error) {
      console.error('Erro ao abrir treino do dia', error);
      navigate('/treino');
    } finally {
      setIsOpeningTraining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans pb-10">
      <header className="px-6 pt-12 pb-7 bg-white border-b border-[#055A43]/5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-[#FAFAFA] border border-[#055A43]/10 text-[#506352] flex items-center justify-center mb-8 active:scale-95 transition-transform"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#055A43]/10 bg-[#055A43]/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#055A43]">
              <AlertTriangle className="w-4 h-4" />
              Treinos SOS
            </span>
            <h1 className="mt-5 font-serif text-[34px] leading-[1.05] tracking-tight text-[#055A43]">
              O que está acontecendo agora?
            </h1>
            <p className="mt-4 text-[#5C615D] text-[15px] leading-relaxed max-w-sm">
              Escolha a situação e siga só o primeiro movimento. O objetivo é baixar a intensidade, não resolver tudo de uma vez.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="px-6 py-7 max-w-lg mx-auto flex flex-col gap-6">
        <section className="grid grid-cols-2 gap-3">
          {SOS_PROTOCOLS.map((protocol) => {
            const Icon = protocol.icon;
            const selected = protocol.id === activeId;

            return (
              <button
                key={protocol.id}
                onClick={() => setActiveId(protocol.id)}
                className={`min-h-[116px] rounded-[1.5rem] border p-4 text-left transition-all active:scale-[0.98] ${
                  selected
                    ? 'bg-[#055A43] text-white border-[#055A43] shadow-[0_8px_24px_rgba(5,90,67,0.16)]'
                    : 'bg-white text-[#506352] border-[#055A43]/10 shadow-[0_8px_20px_rgb(0,0,0,0.02)]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
                  selected ? 'bg-white/13 text-white' : 'bg-[#055A43]/5 text-[#055A43]'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="block text-[15px] font-bold leading-tight">{protocol.title}</span>
                <span className={`block mt-1 text-[11px] leading-snug ${selected ? 'text-white/65' : 'text-[#5C615D]/70'}`}>
                  {protocol.trigger}
                </span>
              </button>
            );
          })}
        </section>

        <motion.section
          key={active.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white border border-[#055A43]/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
        >
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#055A43]/5 text-[#055A43] flex items-center justify-center border border-[#055A43]/10">
              <ActiveIcon className="w-7 h-7" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-[#055A43] bg-[#055A43]/5 rounded-full px-3 py-1.5">
              <Clock className="w-3.5 h-3.5" />
              {active.duration}
            </span>
          </div>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#5C615D]/55 mb-2">
            Primeiro movimento
          </p>
          <h2 className="font-serif text-[29px] leading-tight text-[#055A43] mb-5">
            {active.firstMove}
          </h2>

          <div className="rounded-[1.5rem] bg-[#FAFAFA] border border-[#055A43]/8 p-4 mb-5">
            <p className="text-[13px] font-bold uppercase tracking-widest text-[#055A43] mb-3">Depois disso</p>
            <div className="flex flex-col gap-3">
              {active.steps.map((step) => (
                <div key={step} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#055A43] shrink-0 mt-0.5" />
                  <p className="text-[#506352] text-[14px] leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={openDailyTraining}
            disabled={isOpeningTraining}
            className="w-full h-14 rounded-2xl bg-[#055A43] text-white text-sm font-bold tracking-wide shadow-[0_8px_22px_rgba(5,90,67,0.14)] active:scale-[0.98] transition-transform disabled:opacity-70"
          >
            {isOpeningTraining ? 'Abrindo treino...' : 'Ir para treino do dia'}
          </button>
        </motion.section>

        <section className="rounded-[1.5rem] border border-[#055A43]/10 bg-white p-5 flex gap-4 shadow-[0_8px_20px_rgb(0,0,0,0.02)]">
          <ShieldCheck className="w-5 h-5 text-[#055A43] shrink-0 mt-0.5" />
          <p className="text-[13px] text-[#506352] leading-relaxed">
            Se houver risco de mordida, fuga, dor, engasgo, intoxicação ou machucado, procure ajuda veterinária ou presencial imediatamente.
          </p>
        </section>
      </main>
    </div>
  );
}
