import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Play, Lock, Info, CheckCircle2, Utensils, Syringe, Activity, Clock, ShieldPlus } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { VaccineRepository } from '@/src/repositories/VaccineRepository';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { CurrentPlan, DogProfile } from '@/src/types';
import { AgendaMotor, AgendaState } from '@/src/motors/AgendaMotor';

export function Agenda() {
  const navigate = useNavigate();
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);
  const [agendaState, setAgendaState] = useState<AgendaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAgenda = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch needed data
        const todayStr = new Date().toISOString().split('T')[0];
        
        const [dog, plan, checkinToday, vaccines, evol] = await Promise.all([
           DogRepository.getDogProfile(user.uid),
           TrainingRepository.getCurrentPlan(user.uid),
           CheckinRepository.getCheckin(user.uid, todayStr),
           VaccineRepository.getVaccines(user.uid),
           EvolutionRepository.getSummary(user.uid),
        ]);

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        let isTrialActive = true;
        let trialDaysLeft = 7;
        
        if (userData) {
           isTrialActive = userData.isTrialActive ?? true;
           const createdAt = userData.createdAt || Date.now();
           trialDaysLeft = Math.max(0, 7 - Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
        }

        const state = AgendaMotor.calculateState(
          dog,
          plan,
          checkinToday,
          evol?.totalSessions || 0,
          !!evol?.lastTrainedAt && new Date(evol.lastTrainedAt).toDateString() === new Date().toDateString(),
          vaccines,
          isTrialActive,
          trialDaysLeft
        );

        setDogProfile(dog);
        setAgendaState(state);
      } catch (err) {
        console.error("Erro ao carregar agenda", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAgenda();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  const dogName = dogProfile?.name || 'seu cão';

  return (
    <div className="flex-1 bg-[#F9F9F8] font-sans min-h-screen pb-24">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 bg-[#F9F9F8] sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-[#055A43]/5 flex items-center justify-center text-[#5C615D] active:scale-[0.98] shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <h1 className="font-serif text-[32px] text-[#055A43] tracking-tight leading-none mb-2">
          Agenda do {dogName}
        </h1>
        <p className="text-[#5C615D] text-[15px] font-light leading-relaxed">
          Veja os próximos passos da rotina, treinos e cuidados.
        </p>
      </header>

      <main className="px-6 flex flex-col gap-8">
        
        {/* Bloco "Hoje" */}
        <section>
          <h2 className="text-[17px] font-bold text-gray-900 mb-4 pb-1 border-b border-gray-200">Hoje</h2>
          
          <div className="flex flex-col gap-3">
             {/* Treino do dia */}
             <div 
               onClick={() => navigate('/treino')}
               className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all bg-white hover:border-[#055A43]/30 ${agendaState?.hasCompletedTrainingToday ? 'border-[#055A43]/20 shadow-sm' : 'border-[#055A43]/10 shadow-[0_4px_15px_rgb(0,0,0,0.02)]'}`}
             >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${agendaState?.hasCompletedTrainingToday ? 'bg-[#055A43] text-white' : 'bg-[#055A43]/5 text-[#055A43]'}`}>
                  {agendaState?.hasCompletedTrainingToday ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#055A43] mb-0.5 block">Treino diário</span>
                  <p className="text-[15px] font-medium text-gray-900 leading-snug">{agendaState?.activeTask?.title || 'Sem treino previsto'}</p>
                </div>
                <div className="text-[12px] font-medium text-[#506352] bg-[#FAFAFA] px-2.5 py-1 rounded-md border border-gray-100">
                   {agendaState?.hasCompletedTrainingToday ? 'Concluído' : 'Pendente'}
                </div>
             </div>

             {/* Check-in */}
             <div 
               onClick={() => navigate('/checkin')}
               className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white cursor-pointer active:scale-[0.98] transition-all shadow-[0_4px_15px_rgb(0,0,0,0.01)] hover:border-[#055A43]/20"
             >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${agendaState?.hasCheckedInToday ? 'bg-[#055A43] text-white' : 'bg-[#506352]/5 text-[#506352]'}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#506352] mb-0.5 block">Monitoramento</span>
                  <p className="text-[15px] font-medium text-gray-900 leading-snug">Check-in da Rotina</p>
                </div>
                <div className="text-[12px] font-medium text-[#506352] bg-[#FAFAFA] px-2.5 py-1 rounded-md border border-gray-100">
                   {agendaState?.hasCheckedInToday ? 'Concluído' : 'Pendente'}
                </div>
             </div>

             {/* Nutrição */}
             <div 
               onClick={() => navigate('/nutricao')}
               className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white cursor-pointer active:scale-[0.98] transition-all shadow-[0_4px_15px_rgb(0,0,0,0.01)] hover:border-[#055A43]/20"
             >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${agendaState?.nutritionIsPending ? 'bg-orange-50 text-orange-600' : 'bg-[#506352]/5 text-[#506352]'}`}>
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#506352] mb-0.5 block">Alimentação</span>
                  <p className={`text-[15px] font-medium leading-snug ${agendaState?.nutritionIsPending ? 'text-orange-700' : 'text-gray-900'}`}>
                    {agendaState?.nutritionText}
                  </p>
                </div>
             </div>
          </div>
        </section>

        {/* Bloco "Próximos Treinos" */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-1 border-b border-gray-200">
            <h2 className="text-[17px] font-bold text-gray-900">Em seguida no plano</h2>
            <button onClick={() => navigate('/plano')} className="text-sm font-medium text-[#055A43]">Ver completo</button>
          </div>
          
          <div className="flex flex-col gap-2">
            {(!agendaState?.upcomingTasks || agendaState.upcomingTasks.length === 0) ? (
               <p className="text-sm text-[#5C615D] italic">Não há mais tarefas no bloco atual.</p>
            ) : (
               agendaState.upcomingTasks.map((t, i) => (
                 <div key={i} className="flex flex-col gap-1 p-3.5 bg-white rounded-xl border border-gray-100 relative pl-10">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#055A43]/20" />
                   <p className="text-[14px] font-medium text-gray-900 leading-none">{t.title}</p>
                   <span className="text-[11px] text-[#5C615D]">{t.duration} • Bloco {t.module}</span>
                 </div>
               ))
            )}
          </div>
        </section>

        {/* Bloco "Esta semana" */}
        <section>
          <h2 className="text-[17px] font-bold text-gray-900 mb-4 pb-1 border-b border-gray-200">Esta semana</h2>
          
          <div className="flex flex-col gap-3">
             {agendaState?.weeklyPreview?.map((day, idx) => (
                <div key={idx} className="flex gap-4 items-start bg-white p-4 rounded-2xl border border-gray-100">
                   <div className="w-[50px] flex flex-col items-center justify-center bg-[#FAFAFA] border border-gray-200 rounded-lg py-2 shrink-0">
                     <span className="text-[10px] font-bold uppercase text-[#5C615D]">{day.label}</span>
                     <span className="text-[16px] font-bold text-gray-900 leading-none mt-1">{day.dateValue.getDate()}</span>
                   </div>
                   <div className="flex flex-col gap-2 flex-1 pt-1">
                      {day.hasTraining && (
                        <div className="flex items-center gap-2 text-[13px] text-[#506352] font-medium">
                          <Play className="w-3.5 h-3.5" /> Treino planejado
                        </div>
                      )}
                      {day.hasVaccine && (
                        <div className="flex items-center gap-2 text-[13px] text-[#055A43] font-bold">
                          <Syringe className="w-3.5 h-3.5" /> Dia de vacina!
                        </div>
                      )}
                      {day.isReportDay && (
                        <div className="flex items-center gap-2 text-[13px] text-blue-700 font-bold">
                          <Calendar className="w-3.5 h-3.5" /> Relatório Semanal
                        </div>
                      )}
                   </div>
                </div>
             ))}
          </div>
        </section>

        {/* Bloco de Cuidados e Alertas */}
        <section>
          <h2 className="text-[17px] font-bold text-gray-900 mb-4 pb-1 border-b border-gray-200">Próximos Cuidados</h2>
          
          <div className="grid grid-cols-2 gap-3">
             {agendaState?.upcomingVaccine && (
                <div onClick={() => navigate('/vacinas')} className="bg-[#055A43]/5 border border-[#055A43]/10 rounded-2xl p-4 cursor-pointer hover:bg-[#055A43]/10 transition-colors">
                  <Syringe className="w-6 h-6 text-[#055A43] mb-2" />
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">Vacina próxima</p>
                  <p className="text-[11px] text-[#055A43] mt-1">{agendaState.upcomingVaccine.name}</p>
                </div>
             )}

             {agendaState?.trialEndingSoon && (
                <div onClick={() => navigate('/plano-assinatura')} className="bg-orange-50 border border-orange-200 rounded-2xl p-4 cursor-pointer hover:bg-orange-100 transition-colors">
                  <ShieldPlus className="w-6 h-6 text-orange-600 mb-2" />
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">Trial expirando</p>
                  <p className="text-[11px] text-orange-700 mt-1">{agendaState.todayAlert}</p>
                </div>
             )}

             <div onClick={() => navigate('/relatorio')} className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors">
               <Calendar className="w-6 h-6 text-[#5C615D] mb-2" />
               <p className="text-[13px] font-bold text-gray-900 leading-tight">Relatório</p>
               <p className="text-[11px] text-[#5C615D] mt-1">{agendaState?.reportAvailable ? 'Pronto para ver' : 'Domingo'}</p>
             </div>
             
             {!agendaState?.upcomingVaccine && (
                <div onClick={() => navigate('/vacinas')} className="bg-[#FAFAFA] border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Syringe className="w-6 h-6 text-[#5C615D]/50 mb-2" />
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">Saúde em dia</p>
                  <p className="text-[11px] text-[#5C615D] mt-1">Nenhuma vacina</p>
                </div>
             )}
          </div>
        </section>

      </main>
    </div>
  );
}

