import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Play, CheckCircle2, Utensils, Syringe, Activity, Clock, ShieldPlus, Save, Plus, Trash2, Check, Pill, Scissors, Footprints, Info } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/src/lib/firebase';
import { TrainingRepository } from '@/src/repositories/TrainingRepository';
import { DogRepository } from '@/src/repositories/DogRepository';
import { CheckinRepository } from '@/src/repositories/CheckinRepository';
import { VaccineRepository } from '@/src/repositories/VaccineRepository';
import { EvolutionRepository } from '@/src/repositories/EvolutionRepository';
import { CustomEventRepository } from '@/src/repositories/CustomEventRepository';
import { DogProfile, CustomEvent } from '@/src/types';
import { AgendaMotor, AgendaState } from '@/src/motors/AgendaMotor';
import { sanitizeText } from '@/src/lib/textSanitizer';
import { toLocalDateKey } from '@/src/lib/dateKeys';

export function Agenda() {
  const navigate = useNavigate();
  const [dogProfile, setDogProfile] = useState<DogProfile | null>(null);
  const [agendaState, setAgendaState] = useState<AgendaState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agendaSettings, setAgendaSettings] = useState({
    trainingReminderTime: '09:00',
    checkinReminderTime: '20:00',
    vaccineReminderTime: '09:00',
    reportReminderTime: '10:00',
    reminders: {
      training: true,
      checkin: true,
      vaccines: true,
      report: true
    }
  });
  const [isSavingAgenda, setIsSavingAgenda] = useState(false);
  const [agendaSaved, setAgendaSaved] = useState(false);

  // Custom Events State
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    time: '08:00',
    type: 'walk' as CustomEvent['type'],
    frequency: 'daily' as CustomEvent['frequency'],
    daysOfWeek: [] as number[],
    date: toLocalDateKey()
  });

  useEffect(() => {
    const loadAgenda = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch needed data
        const todayStr = toLocalDateKey();
        
        const [dog, plan, checkinToday, vaccines, evol, events, comps] = await Promise.all([
           DogRepository.getDogProfile(user.uid),
           TrainingRepository.getCurrentPlan(user.uid),
           CheckinRepository.getCheckin(user.uid, todayStr),
           VaccineRepository.getVaccines(user.uid),
           EvolutionRepository.getSummary(user.uid),
           CustomEventRepository.getEvents(user.uid),
           CustomEventRepository.getCompletions(user.uid, todayStr)
        ]);

        // set states
        setCustomEvents(events.sort((a, b) => a.time.localeCompare(b.time)));
        setCompletions(comps);

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        let isTrialActive = false;
        let trialDaysLeft = 0;
        
        if (userData) {
           const settings = userData.settings || {};
           const reminders = settings.reminders || {};
           setAgendaSettings({
             trainingReminderTime: settings.trainingReminderTime || '09:00',
             checkinReminderTime: settings.checkinReminderTime || '20:00',
             vaccineReminderTime: settings.vaccineReminderTime || '09:00',
             reportReminderTime: settings.reportReminderTime || '10:00',
             reminders: {
               training: reminders.training !== false,
               checkin: reminders.checkin !== false,
               vaccines: reminders.vaccines !== false,
               report: reminders.report !== false
             }
           });
           const status = userData.subscription?.status;
           const planName = userData.subscription?.plan ?? userData.subscriptionTier;
           const trialEndsAt = userData.subscription?.trialEndsAt ?? userData.trialEndsAt ?? 0;
           isTrialActive = (status === 'trialing' || planName === 'trial') && trialEndsAt > Date.now();
           trialDaysLeft = isTrialActive
             ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
             : 0;
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

  const saveAgendaSettings = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSavingAgenda(true);
    setAgendaSaved(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.notificationsEnabled': 
          agendaSettings.reminders.training || 
          agendaSettings.reminders.checkin || 
          agendaSettings.reminders.vaccines || 
          agendaSettings.reminders.report,
        'settings.trainingReminderTime': agendaSettings.trainingReminderTime,
        'settings.checkinReminderTime': agendaSettings.checkinReminderTime,
        'settings.vaccineReminderTime': agendaSettings.vaccineReminderTime,
        'settings.reportReminderTime': agendaSettings.reportReminderTime,
        'settings.reminders.training': agendaSettings.reminders.training,
        'settings.reminders.checkin': agendaSettings.reminders.checkin,
        'settings.reminders.vaccines': agendaSettings.reminders.vaccines,
        'settings.reminders.report': agendaSettings.reminders.report,
      });
      setAgendaSaved(true);
      setTimeout(() => setAgendaSaved(false), 2600);
    } catch (err) {
      console.error('Erro ao salvar agenda', err);
    } finally {
      setIsSavingAgenda(false);
    }
  };

  // Helper dates for comparison
  const todayDateKey = toLocalDateKey();
  const todayDate = new Date();
  const todayDayOfWeek = todayDate.getDay();

  const isEventForToday = (event: CustomEvent) => {
    if (event.frequency === 'daily') return true;
    if (event.frequency === 'weekly') {
      return event.daysOfWeek?.includes(todayDayOfWeek) ?? false;
    }
    if (event.frequency === 'once') {
      return event.date === todayDateKey;
    }
    return false;
  };

  const todaysCustomEvents = customEvents.filter(isEventForToday);

  const getEventsForDate = (date: Date) => {
    const dateKey = toLocalDateKey(date);
    const dayOfWeek = date.getDay();
    
    return customEvents.filter(event => {
      if (event.frequency === 'daily') return true;
      if (event.frequency === 'weekly') {
        return event.daysOfWeek?.includes(dayOfWeek) ?? false;
      }
      if (event.frequency === 'once') {
        return event.date === dateKey;
      }
      return false;
    });
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) return;
    const user = auth.currentUser;
    if (!user) return;

    setIsCreatingEvent(true);
    try {
      const payload: Omit<CustomEvent, 'id' | 'createdAt'> = {
        title: eventForm.title.trim().slice(0, 50),
        time: eventForm.time,
        type: eventForm.type,
        frequency: eventForm.frequency,
      };

      if (eventForm.frequency === 'weekly') {
        payload.daysOfWeek = eventForm.daysOfWeek.length > 0 ? eventForm.daysOfWeek : [todayDayOfWeek];
      } else if (eventForm.frequency === 'once') {
        payload.date = eventForm.date;
      }

      const eventId = await CustomEventRepository.createEvent(user.uid, payload);
      
      const newEvent: CustomEvent = {
        id: eventId,
        createdAt: Date.now(),
        ...payload
      };
      
      setCustomEvents(prev => [...prev, newEvent].sort((a,b) => a.time.localeCompare(b.time)));
      
      setEventForm({
        title: '',
        time: '08:00',
        type: 'walk',
        frequency: 'daily',
        daysOfWeek: [],
        date: toLocalDateKey(),
      });
      setIsEventModalOpen(false);
    } catch (e) {
      console.error('Erro ao criar compromisso', e);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    if (!window.confirm('Excluir este compromisso?')) return;

    try {
      await CustomEventRepository.deleteEvent(user.uid, eventId);
      setCustomEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Erro ao excluir compromisso', err);
    }
  };

  const toggleEventCompletion = async (eventId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const isCompleted = !completions[eventId];
    setCompletions(prev => ({ ...prev, [eventId]: isCompleted }));
    
    try {
      await CustomEventRepository.toggleCompletion(user.uid, todayDateKey, eventId, isCompleted);
    } catch (err) {
      console.error('Erro ao alternar conclusão', err);
      // rollback
      setCompletions(prev => ({ ...prev, [eventId]: !isCompleted }));
    }
  };

  const getEventIcon = (type: CustomEvent['type']) => {
    switch(type) {
      case 'walk': return <Footprints className="w-5 h-5" />;
      case 'feed': return <Utensils className="w-5 h-5" />;
      case 'grooming': return <Scissors className="w-5 h-5" />;
      case 'vet': return <Syringe className="w-5 h-5" />;
      case 'meds': return <Pill className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventBgColor = (type: CustomEvent['type']) => {
    switch(type) {
      case 'walk': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'feed': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'grooming': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'vet': return 'bg-red-50 text-red-600 border-red-100';
      case 'meds': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#F7F5EF] flex items-center justify-center">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  const dogName = dogProfile?.name || 'seu cão';

  return (
    <div className="flex-1 bg-[#F7F5EF] font-sans min-h-screen pb-24">
      {/* Header */}
      <header className="px-6 pt-16 pb-6 bg-[#F7F5EF] sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-[#055A43]/5 flex items-center justify-center text-[#6B7A6E] active:scale-[0.98] shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <h1 className="font-serif text-[32px] text-[#055A43] tracking-tight leading-none mb-2">
          Agenda de {dogName}
        </h1>
        <p className="text-[#6B7A6E] text-[15px] font-light leading-relaxed">
          Veja os próximos passos da rotina, treinos e cuidados.
        </p>
      </header>

      <main className="px-6 flex flex-col gap-8">
        <section className="bg-white rounded-[1.5rem] border border-[#055A43]/5 shadow-[0_4px_15px_rgba(45,74,58,0.08)] p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Personalizar agenda</h2>
              <p className="text-[13px] text-[#6B7A6E] mt-1 leading-relaxed">
                Defina os horários de lembrete para a rotina do cão.
              </p>
            </div>
            {agendaSaved && (
              <span className="rounded-full bg-[#055A43]/10 px-3 py-1 text-[11px] font-semibold text-[#055A43]">
                Salvo
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <AgendaTimeInput
              label="Treino diário"
              value={agendaSettings.trainingReminderTime}
              enabled={agendaSettings.reminders.training}
              onToggle={(enabled) => setAgendaSettings((prev) => ({ ...prev, reminders: { ...prev.reminders, training: enabled } }))}
              onChange={(value) => setAgendaSettings((prev) => ({ ...prev, trainingReminderTime: value }))}
            />
            <AgendaTimeInput
              label="Check-in da rotina"
              value={agendaSettings.checkinReminderTime}
              enabled={agendaSettings.reminders.checkin}
              onToggle={(enabled) => setAgendaSettings((prev) => ({ ...prev, reminders: { ...prev.reminders, checkin: enabled } }))}
              onChange={(value) => setAgendaSettings((prev) => ({ ...prev, checkinReminderTime: value }))}
            />
            <AgendaTimeInput
              label="Avisos de vacinas"
              value={agendaSettings.vaccineReminderTime}
              enabled={agendaSettings.reminders.vaccines}
              onToggle={(enabled) => setAgendaSettings((prev) => ({ ...prev, reminders: { ...prev.reminders, vaccines: enabled } }))}
              onChange={(value) => setAgendaSettings((prev) => ({ ...prev, vaccineReminderTime: value }))}
            />
            <AgendaTimeInput
              label="Alerta de relatório semanal"
              value={agendaSettings.reportReminderTime}
              enabled={agendaSettings.reminders.report}
              onToggle={(enabled) => setAgendaSettings((prev) => ({ ...prev, reminders: { ...prev.reminders, report: enabled } }))}
              onChange={(value) => setAgendaSettings((prev) => ({ ...prev, reportReminderTime: value }))}
            />
          </div>

          <button
            onClick={saveAgendaSettings}
            disabled={isSavingAgenda}
            className="mt-5 w-full h-12 rounded-2xl bg-[#055A43] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {isSavingAgenda ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar agenda
              </>
            )}
          </button>
        </section>
        
        {/* Bloco "Hoje" */}
        <section>
          <div className="flex items-center justify-between mb-4 pb-1 border-b border-gray-200">
            <h2 className="text-[17px] font-bold text-gray-900">Hoje</h2>
            <button 
              onClick={() => setIsEventModalOpen(true)}
              className="text-xs font-semibold text-[#055A43] flex items-center gap-1 bg-[#055A43]/5 px-3 py-1.5 rounded-full border border-[#055A43]/10 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compromisso</span>
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
             {/* Treino do dia */}
             <div 
               onClick={() => navigate('/treino')}
               className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer active:scale-[0.98] transition-all bg-white hover:border-[#055A43]/30 ${agendaState?.hasCompletedTrainingToday ? 'border-[#055A43]/20 shadow-sm' : 'border-[#055A43]/10 shadow-[0_4px_15px_rgba(45,74,58,0.08)]'}`}
             >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${agendaState?.hasCompletedTrainingToday ? 'bg-[#055A43] text-white' : 'bg-[#055A43]/5 text-[#055A43]'}`}>
                  {agendaState?.hasCompletedTrainingToday ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#055A43] mb-0.5 block">Treino diário</span>
                  <p className="text-[15px] font-medium text-gray-900 leading-snug">{sanitizeText(agendaState?.activeTask?.title) || 'Sem treino previsto'}</p>
                </div>
                <div className="text-[12px] font-medium text-[#506352] bg-[#F7F5EF] px-2.5 py-1 rounded-md border border-gray-100">
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
                  <p className="text-[15px] font-medium text-gray-900 leading-snug">Check-in da rotina</p>
                </div>
                <div className="text-[12px] font-medium text-[#506352] bg-[#F7F5EF] px-2.5 py-1 rounded-md border border-gray-100">
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

             {/* Custom Events for Today */}
             {todaysCustomEvents.map(event => {
                const isDone = completions[event.id];
                return (
                  <div 
                    key={event.id}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-[0_4px_15px_rgb(0,0,0,0.01)] transition-all hover:border-[#055A43]/20"
                  >
                     <button
                       onClick={() => toggleEventCompletion(event.id)}
                       className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                         isDone 
                           ? 'bg-[#055A43] text-white shadow-inner shadow-black/10' 
                           : getEventBgColor(event.type)
                       }`}
                     >
                       {isDone ? <Check className="w-5 h-5" /> : getEventIcon(event.type)}
                     </button>
                     
                     <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleEventCompletion(event.id)}>
                       <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 mb-0.5 block">
                         {event.time} • {event.frequency === 'daily' ? 'Diário' : event.frequency === 'weekly' ? 'Semanal' : 'Compromisso'}
                       </span>
                       <p className={`text-[15px] font-medium leading-snug truncate ${isDone ? 'line-through text-gray-400 font-light' : 'text-gray-900 font-medium'}`}>
                         {event.title}
                       </p>
                     </div>

                     <button 
                       onClick={() => handleDeleteEvent(event.id)}
                       className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center active:scale-95 transition-colors hover:bg-red-100 shrink-0 ml-1 cursor-pointer"
                       title="Excluir compromisso"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                );
             })}
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
               <p className="text-sm text-[#6B7A6E] italic">Bloco atual concluído — os próximos treinos aparecem aqui.</p>
            ) : (
               agendaState.upcomingTasks.map((t, i) => (
                 <div key={i} className="flex flex-col gap-1 p-3.5 bg-white rounded-xl border border-gray-100 relative pl-10">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#055A43]/20" />
                   <p className="text-[14px] font-medium text-gray-900 leading-none">{sanitizeText(t.title)}</p>
                   <span className="text-[11px] text-[#6B7A6E]">{t.duration} • Bloco {t.module}</span>
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
                   <div className="w-[50px] flex flex-col items-center justify-center bg-[#F7F5EF] border border-gray-200 rounded-lg py-2 shrink-0">
                     <span className="text-[10px] font-bold uppercase text-[#6B7A6E]">{day.label}</span>
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
                          <Calendar className="w-3.5 h-3.5" /> Relatório semanal
                        </div>
                      )}
                      {getEventsForDate(day.dateValue).map((event) => {
                        const icon = getEventIcon(event.type);
                        return (
                          <div key={event.id} className="flex items-center gap-2 text-[13px] text-gray-700 font-medium">
                            {icon && React.cloneElement(icon as React.ReactElement, { className: "w-3.5 h-3.5 text-gray-500 shrink-0" })}
                            <span>{event.time} • {event.title}</span>
                          </div>
                        );
                      })}
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
                <div onClick={() => navigate('/assinatura')} className="bg-orange-50 border border-orange-200 rounded-2xl p-4 cursor-pointer hover:bg-orange-100 transition-colors">
                  <ShieldPlus className="w-6 h-6 text-orange-600 mb-2" />
                  <p className="text-[13px] font-bold text-gray-900 leading-tight">Trial expirando</p>
                  <p className="text-[11px] text-orange-700 mt-1">{agendaState.todayAlert}</p>
                </div>
             )}

             <div onClick={() => navigate('/relatorio')} className="bg-[#F7F5EF] border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors">
               <Calendar className="w-6 h-6 text-[#6B7A6E] mb-2" />
               <p className="text-[13px] font-bold text-gray-900 leading-tight">Relatório</p>
               <p className="text-[11px] text-[#6B7A6E] mt-1">{agendaState?.reportAvailable ? 'Pronto para ver' : 'Domingo'}</p>
             </div>
             
             {!agendaState?.upcomingVaccine && (
                <div onClick={() => navigate('/vacinas')} className="bg-[#F7F5EF] border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <Syringe className="w-6 h-6 text-[#6B7A6E]/50 mb-2" />
                   <p className="text-[13px] font-bold text-gray-900 leading-tight">Saúde em dia</p>
                   <p className="text-[11px] text-[#6B7A6E] mt-1">Nenhuma vacina</p>
                </div>
             )}
          </div>
        </section>

      </main>

      {/* Modal/BottomSheet para adicionar compromisso */}
      <AnimatePresence>
        {isEventModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEventModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            />
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2rem] shadow-2xl z-50 flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 shrink-0" />
              
              <div className="px-6 pb-8 overflow-y-auto flex-1">
                <h3 className="font-serif text-2xl text-[#055A43] mb-4">Adicionar compromisso</h3>
                
                <div className="flex flex-col gap-4">
                  {/* Título */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Nome do compromisso
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Passeio no parque, Escovar dentes"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-[#F7F5EF] border border-[#055A43]/10 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#055A43]/20"
                    />
                  </div>

                  {/* Horário */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-[#F7F5EF] border border-[#055A43]/10 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#055A43]/20"
                    />
                  </div>

                  {/* Tipo / Categoria */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Categoria
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'walk', label: 'Passeio', icon: <Footprints className="w-4 h-4" /> },
                        { id: 'feed', label: 'Ração', icon: <Utensils className="w-4 h-4" /> },
                        { id: 'grooming', label: 'Banho/Escova', icon: <Scissors className="w-4 h-4" /> },
                        { id: 'vet', label: 'Vet', icon: <Syringe className="w-4 h-4" /> },
                        { id: 'meds', label: 'Remédio', icon: <Pill className="w-4 h-4" /> },
                        { id: 'other', label: 'Outro', icon: <Calendar className="w-4 h-4" /> },
                      ].map((cat) => {
                        const isSelected = eventForm.type === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setEventForm(prev => ({ ...prev, type: cat.id as any }))}
                            className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#055A43] text-white border-transparent shadow-sm'
                                : 'bg-[#F7F5EF] text-gray-600 border-gray-100 hover:border-[#055A43]/20'
                            }`}
                          >
                            {cat.icon}
                            <span className="text-[11px] font-medium">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frequência */}
                  <div>
                    <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Repetição
                    </label>
                    <div className="flex bg-[#F7F5EF] p-1 rounded-2xl border border-gray-100">
                      {[
                        { id: 'daily', label: 'Diário' },
                        { id: 'weekly', label: 'Semanal' },
                        { id: 'once', label: 'Uma vez' }
                      ].map((freq) => {
                        const isSelected = eventForm.frequency === freq.id;
                        return (
                          <button
                            key={freq.id}
                            type="button"
                            onClick={() => setEventForm(prev => ({ ...prev, frequency: freq.id as any }))}
                            className={`flex-1 py-2 px-3 text-[13px] font-semibold rounded-xl text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-[#055A43] shadow-sm font-bold'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            {freq.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Configurações condicionais */}
                  {eventForm.frequency === 'weekly' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Dias da semana
                      </label>
                      <div className="flex justify-between gap-1">
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dayChar, i) => {
                          const isSelected = eventForm.daysOfWeek.includes(i);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setEventForm(prev => {
                                  const alreadyIncluded = prev.daysOfWeek.includes(i);
                                  const updated = alreadyIncluded
                                    ? prev.daysOfWeek.filter(d => d !== i)
                                    : [...prev.daysOfWeek, i];
                                  return { ...prev, daysOfWeek: updated };
                                });
                              }}
                              className={`w-9 h-9 rounded-full text-[13px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#055A43] text-white shadow-sm'
                                  : 'bg-[#F7F5EF] text-gray-600 border border-gray-100 hover:border-[#055A43]/20'
                              }`}
                            >
                              {dayChar}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {eventForm.frequency === 'once' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-[12px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Data do compromisso
                      </label>
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full bg-[#F7F5EF] border border-[#055A43]/10 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#055A43]/20"
                      />
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-3 mt-4 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsEventModalOpen(false)}
                      className="flex-1 h-12 rounded-2xl border border-gray-200 text-gray-700 text-[14px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer bg-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      disabled={isCreatingEvent || !eventForm.title.trim()}
                      className="flex-1 h-12 rounded-2xl bg-[#055A43] text-white text-[14px] font-semibold flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isCreatingEvent ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Adicionar'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function AgendaTimeInput({
  label,
  value,
  enabled,
  onToggle,
  onChange
}: {
  label: string;
  value: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-[#F7F5EF] border border-[#055A43]/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-[13px] font-semibold text-[#506352]">
          <Clock className="w-4.5 h-4.5 text-[#055A43]" />
          {label}
        </span>
        
        {/* iOS-like Toggle Switch */}
        <button
          type="button"
          onClick={() => onToggle(!enabled)}
          className={`w-11 h-6 rounded-full relative transition-colors duration-200 outline-none cursor-pointer ${enabled ? 'bg-[#055A43]' : 'bg-gray-200'}`}
        >
          <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-200 shadow-sm ${enabled ? 'left-5.5' : 'left-0.5'}`} />
        </button>
      </div>

      {enabled && (
        <div className="flex items-center justify-between pt-1.5 border-t border-[#055A43]/5 mt-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
          <span className="text-[12px] text-[#6B7A6E]/80 font-light">Horário do lembrete:</span>
          <input
            type="time"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="bg-white border border-[#055A43]/10 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-[#055A43] focus:outline-none focus:ring-1 focus:ring-[#055A43]"
          />
        </div>
      )}
    </div>
  );
}
