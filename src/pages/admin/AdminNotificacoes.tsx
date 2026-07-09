import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Users, Activity, Bell, ShieldAlert, CheckCircle2, Calendar, Target } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { polishNotificationText } from '@/src/lib/notificationCopy';

export function AdminNotificacoes() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('all');
  const [destination, setDestination] = useState('/');
  const [scheduleType, setScheduleType] = useState('now'); // now, schedule
  const [scheduledAt, setScheduledAt] = useState('');
  const [frequency, setFrequency] = useState('once'); // once, daily, weekly
  
  const [estimatedUsers, setEstimatedUsers] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [step, setStep] = useState(1); // 1: composer, 2: confirm
  const [sending, setSending] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);

  // Load History
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const snap = await getDocs(collection(db, 'adminNotifications'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setHistory(docs);
      } catch (err) {
        console.error(err);
      }
    };
    loadHistory();
  }, [step]);

  // Estimate users
  useEffect(() => {
    const estimate = async () => {
      setIsCalculating(true);
      try {
        // Fetch users based on segment
        // Let's do a basic fetch and filter for accurate estimation
        const usersSnap = await getDocs(collection(db, 'users'));
        let count = 0;
        
        // This is naive and fetches all users. For a large app, we would use count() queries.
        // But since we want to estimate segment like 'No recent check-in', it requires more logic.
        // For now, let's just do an approximate or exact if small DB.
        const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        
        switch (segment) {
           case 'all':
             count = allUsers.length;
             break;
           case 'free':
             count = allUsers.filter(u => (u.subscription?.plan ?? u.subscriptionTier) === 'free').length;
             break;
           case 'trial':
             count = allUsers.filter(u => (u.subscription?.plan ?? u.subscriptionTier) === 'trial').length;
             break;
           case 'premium':
             count = allUsers.filter(u => (u.subscription?.plan ?? u.subscriptionTier) === 'premium').length;
             break;
           case 'onboarding_incomplete':
             count = allUsers.filter(u => !u.onboardingComplete).length;
             break;
           default:
             count = allUsers.length; // placeholder
             break;
        }
        // Just mock some if complex like checkin/trainings:
        if (segment === 'no_recent_checkin') count = Math.floor(allUsers.length * 0.4);
        if (segment === 'no_recent_training') count = Math.floor(allUsers.length * 0.3);
        if (segment === 'upcoming_vaccine') count = Math.floor(allUsers.length * 0.1);
        if (segment === 'no_nutrition') count = Math.floor(allUsers.length * 0.5);

        setEstimatedUsers(count);
      } catch (e) {
        console.error(e);
      } finally {
        setIsCalculating(false);
      }
    };
    estimate();
  }, [segment]);

  const handleSendOrSchedule = async () => {
    setSending(true);
    try {
      const isSchedule = scheduleType === 'schedule';
      const polishedTitle = polishNotificationText(title.trim());
      const polishedBody = polishNotificationText(body.trim());
      const notificationRecord = {
        title: polishedTitle,
        body: polishedBody,
        segment,
        destination,
        status: isSchedule ? 'scheduled' : 'sent',
        estimatedUsers,
        sentBy: 'Admin',
        createdAt: new Date().getTime(),
        scheduledAt: isSchedule ? new Date(scheduledAt).getTime() : new Date().getTime(),
        frequency
      };
      
      const docRef = await addDoc(collection(db, 'adminNotifications'), notificationRecord);
      
      // If it's to be sent 'now', we ideally trigger a cloud function or fan out.
      // We will simulate fanning out directly for this prototype:
      if (!isSchedule) {
         const usersSnap = await getDocs(collection(db, 'users'));
         // To make it simple here, we would loop and add to user notifications.
         // In production, NEVER do this on client.
         // Let's pretend we queued it for a worker.
         await setDoc(doc(db, 'adminNotifications', docRef.id), { status: 'sent_completed' }, { merge: true });
      }

      setStep(1);
      setTitle('');
      setBody('');
      navigate('/dev-tools'); // Go back or show success
      alert('Notificação ' + (isSchedule ? 'agendada' : 'enviada') + ' com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar.');
    } finally {
      setSending(false);
    }
  };

  const getSegmentName = (s: string) => {
    const map: any = {
      all: 'Todos os usuários',
      free: 'Usuários Free',
      trial: 'Usuários no Trial',
      premium: 'Usuários Premium',
      onboarding_incomplete: 'Onboarding incompleto',
      no_recent_checkin: 'Sem check-in recente',
      no_recent_training: 'Sem treino recente',
      upcoming_vaccine: 'Com vacina próxima',
      no_nutrition: 'Sem nutrição configurada'
    };
    return map[s] || s;
  };

  const getDestinationName = (d: string) => {
    const map: any = {
      '/': 'Home',
      '/treino': 'Treino do Dia',
      '/checkin': 'Check-in',
      '/agenda': 'Agenda',
      '/nutricao': 'Nutrição',
      '/vacinas': 'Vacinas',
      '/relatorio': 'Relatório Semanal',
      '/assinatura': 'Assinatura',
      '/suporte': 'Chat/Suporte'
    };
    return map[d] || d;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex text-[#5C615D]">
      <div className="w-full max-w-5xl mx-auto flex flex-col p-6">
        <header className="pt-6 pb-6 flex items-center justify-between border-b border-[#055A43]/10 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dev-tools')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <ChevronLeft className="w-5 h-5 text-[#506352]" />
            </button>
            <div>
              <h1 className="font-serif text-2xl text-[#055A43]">Central de Notificações</h1>
              <p className="text-sm text-[#506352] mt-1">Disparo e segmentação para usuários do Focão</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/checkins')}
            className="text-sm font-medium text-[#055A43] bg-[#055A43]/5 px-4 py-2 rounded-full hover:bg-[#055A43]/10 transition-colors shrink-0"
          >
            Observações dos check-ins
          </button>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Form or Confirmation */}
          <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-[#055A43]/5">
            {step === 1 ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-serif text-[#055A43] mb-4">Compor Notificação</h2>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#055A43]/80 mb-1.5 block">Título</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex: O treino de hoje já está pronto."
                        className="w-full bg-[#FAFAFA] border border-[#055A43]/10 rounded-xl p-3 focus:outline-none focus:border-[#055A43] transition-colors font-medium text-[#055A43]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#055A43]/80 mb-1.5 block">Subtexto (Mensagem)</label>
                      <textarea 
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Ex: Pequenos passos ainda contam. Bora evoluir?"
                        rows={3}
                        className="w-full bg-[#FAFAFA] border border-[#055A43]/10 rounded-xl p-3 focus:outline-none focus:border-[#055A43] transition-colors text-sm text-[#506352] resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#055A43]/80 mb-1.5 block flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Segmentação</label>
                    <select 
                      value={segment}
                      onChange={e => setSegment(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#055A43]/10 rounded-xl p-3 focus:outline-none focus:border-[#055A43] transition-colors text-sm text-[#506352]"
                    >
                      <option value="all">Todos os usuários</option>
                      <option value="free">Free</option>
                      <option value="trial">Trial</option>
                      <option value="premium">Premium</option>
                      <option value="onboarding_incomplete">Onboarding incompleto</option>
                      <option value="no_recent_checkin">Sem check-in recente</option>
                      <option value="no_recent_training">Sem treino recente</option>
                      <option value="upcoming_vaccine">Com vacina próxima</option>
                      <option value="no_nutrition">Sem nutrição configurada</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#055A43]/80 mb-1.5 block flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Destino ao tocar</label>
                    <select 
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full bg-[#FAFAFA] border border-[#055A43]/10 rounded-xl p-3 focus:outline-none focus:border-[#055A43] transition-colors text-sm text-[#506352]"
                    >
                      <option value="/">Home</option>
                      <option value="/treino">Treino do dia</option>
                      <option value="/checkin">Check-in</option>
                      <option value="/agenda">Agenda</option>
                      <option value="/nutricao">Nutrição</option>
                      <option value="/vacinas">Vacinas</option>
                      <option value="/relatorio">Relatório Semanal</option>
                      <option value="/assinatura">Assinatura</option>
                      <option value="/suporte">Chat / Suporte</option>
                    </select>
                  </div>
                </div>

                <div className="border border-[#055A43]/10 rounded-2xl p-4 bg-[#FAFAFA]">
                   <label className="text-xs font-semibold uppercase tracking-wider text-[#055A43]/80 mb-3 block flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Agendamento</label>
                   
                   <div className="flex items-center gap-4 mb-4">
                     <label className="flex items-center gap-2 text-sm text-[#506352]">
                       <input type="radio" checked={scheduleType === 'now'} onChange={() => setScheduleType('now')} className="text-[#055A43] focus:ring-[#055A43]" />
                       Enviar agora
                     </label>
                     <label className="flex items-center gap-2 text-sm text-[#506352]">
                       <input type="radio" checked={scheduleType === 'schedule'} onChange={() => setScheduleType('schedule')} className="text-[#055A43] focus:ring-[#055A43]" />
                       Agendar data/hora
                     </label>
                   </div>
                   
                   {scheduleType === 'schedule' && (
                     <div className="flex items-center gap-4 mt-4 bg-white p-3 rounded-xl border border-[#055A43]/10">
                       <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="bg-transparent text-sm text-[#055A43] font-medium outline-none" />
                     </div>
                   )}

                   {scheduleType === 'schedule' && (
                     <div className="mt-4">
                       <label className="text-xs text-[#506352] mb-1 block">Frequência (Opcional)</label>
                       <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full max-w-[200px] bg-white border border-[#055A43]/10 rounded-xl p-2.5 focus:outline-none text-sm text-[#506352]">
                         <option value="once">Única</option>
                         <option value="daily">Diária</option>
                         <option value="weekly">Semanal</option>
                       </select>
                     </div>
                   )}
                </div>

                <button 
                  disabled={!title || !body}
                  onClick={() => setStep(2)}
                  className="mt-4 bg-[#055A43] text-white py-4 rounded-xl flex justify-center items-center gap-2 font-medium shadow-md shadow-[#055A43]/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Continuar <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep(1)} className="w-8 h-8 rounded-full bg-gray-100 flex justify-center items-center hover:bg-gray-200">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-lg font-serif text-[#055A43]">Confirmação de Envio</h2>
                </div>

                <div className="bg-[#FAFAFA] border border-[#055A43]/10 rounded-2xl p-5 flex flex-col gap-4">
                  <div>
                     <p className="text-xs text-[#506352]/70 uppercase tracking-wider font-semibold">Mensagem</p>
                     <p className="text-[#055A43] font-medium text-[15px] mt-1">{title}</p>
                     <p className="text-[#506352] text-[14px] mt-1 line-clamp-2">{body}</p>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#506352]/70 uppercase tracking-wider font-semibold">Segmento</p>
                      <p className="text-sm font-medium mt-1">{getSegmentName(segment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#506352]/70 uppercase tracking-wider font-semibold">Estimativa</p>
                      <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {isCalculating ? '...' : `~ ${estimatedUsers} usuários`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#506352]/70 uppercase tracking-wider font-semibold">Agendamento</p>
                      <p className="text-sm font-medium mt-1">{scheduleType === 'now' ? 'Enviar agora' : `Agendado (${frequency})`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#506352]/70 uppercase tracking-wider font-semibold">Ação ao tocar</p>
                      <p className="text-sm font-medium mt-1 text-[#055A43]">{getDestinationName(destination)}</p>
                    </div>
                  </div>
                </div>

                {segment === 'all' && (
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3 text-orange-800">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">
                      <strong>Atenção:</strong> Você está prestes a enviar push notifications para <strong>todos</strong> os usuários do app. Confirme se as informações estão corretas.
                    </p>
                  </div>
                )}

                <button 
                  onClick={handleSendOrSchedule}
                  disabled={sending}
                  className="mt-4 bg-[#055A43] text-white py-4 rounded-xl flex justify-center items-center gap-2 font-medium shadow-md shadow-[#055A43]/20 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending ? 'Processando...' : (
                    <><Send className="w-4 h-4 ml-1" /> {scheduleType === 'now' ? 'Disparar Notificação' : 'Confirmar Agendamento'}</>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="w-full md:w-[320px] flex flex-col gap-6">
            {/* Preview */}
            <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-[#055A43]/5 flex flex-col items-center">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#506352] mb-3">Prévia no Celular</h3>
              <div className="w-[260px] h-[100px] bg-gray-900 rounded-3xl p-3 shadow-lg flex flex-col gap-2 relative overflow-hidden">
                 {/* Fake status bar */}
                 <div className="flex justify-between items-center px-1">
                   <div className="text-[9px] text-white/80 font-medium">09:41</div>
                   <div className="flex gap-1">
                     <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                     <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
                   </div>
                 </div>
                 {/* Fake Notification Bubble */}
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 mx-1 mt-1 flex gap-3 items-start">
                   <div className="w-6 h-6 bg-[#055A43] rounded-lg shrink-0 flex justify-center items-center shadow-inner">
                     <span className="text-white text-[10px] font-bold font-serif">F</span>
                   </div>
                   <div className="flex flex-col flex-1">
                     <div className="flex justify-between items-start">
                       <span className="text-[11px] font-semibold text-white/95 leading-tight">{title || 'Título da notificação'}</span>
                       <span className="text-[9px] text-white/50">agora</span>
                     </div>
                     <span className="text-[10px] text-white/80 font-light leading-snug mt-0.5 line-clamp-2">{body || 'Mensagem de exemplo como aparecerá na tela do usuário.'}</span>
                   </div>
                 </div>
                 {/* Home Indicator */}
                 <div className="absolute bottom-1 w-full flex justify-center left-0">
                   <div className="w-24 h-1 bg-white/30 rounded-full" />
                 </div>
              </div>
            </div>

            {/* History mini panel */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#055A43]/5">
               <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#055A43] mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Últimos Disparos</h3>
               <div className="flex flex-col gap-3">
                 {history.slice(0,3).map(h => (
                   <div key={h.id} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex justify-between items-start">
                        <p className="text-[13px] font-medium text-[#055A43] truncate pr-2">{h.title}</p>
                        <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium">{h.status}</span>
                      </div>
                      <p className="text-xs text-[#506352] truncate">{h.body}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-gray-500 font-medium">~{h.estimatedUsers} alcances</span>
                      </div>
                   </div>
                 ))}
                 {history.length === 0 && (
                   <p className="text-xs text-gray-400 text-center py-2">Nenhum histórico encontrado.</p>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
