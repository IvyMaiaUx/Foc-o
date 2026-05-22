import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Clock, Save, BellOff } from 'lucide-react';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export function Notificacoes() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [trainingTime, setTrainingTime] = useState('09:00');
  const [checkinTime, setCheckinTime] = useState('20:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState({
    training: true,
    checkin: true,
    vaccines: true,
    report: true
  });

  useEffect(() => {
    try {
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    } catch (e) {
      console.warn('Notifications API not available or blocked in this context', e);
    }
    const loadSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const settings = snap.data().settings || {};
          setEnabled(settings.notificationsEnabled ?? false);
          setTrainingTime(settings.trainingReminderTime ?? '09:00');
          setCheckinTime(settings.checkinReminderTime ?? '20:00');
          if (settings.reminders) {
            setReminders({
              training: settings.reminders.training ?? true,
              checkin: settings.reminders.checkin ?? true,
              vaccines: settings.reminders.vaccines ?? true,
              report: settings.reminders.report ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === 'granted') {
      new Notification('Notificações ativadas!', {
        body: 'Você receberá os lembretes do Focão.',
        icon: '/vite.svg'
      });
    }
    return permission === 'granted';
  };

  const handleToggle = async () => {
    const newValue = !enabled;
    setEnabled(newValue); // Toggle visual state immediately

    if (newValue && permissionStatus !== 'granted') {
      try {
        await requestPermission();
      } catch (err) {
        console.error("Erro ao solicitar permissão", err);
      }
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.notificationsEnabled': enabled,
        'settings.trainingReminderTime': trainingTime,
        'settings.checkinReminderTime': checkinTime,
        'settings.reminders': reminders
      });
      navigate(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex flex-col">
      <header className="px-6 py-6 bg-white border-b border-[#055A43]/5 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center active:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[#506352]" />
        </button>
        <span className="font-serif text-[18px] text-[#055A43] tracking-tight">Notificações</span>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col gap-8 max-w-md mx-auto w-full">
        <section>
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#055A43]/10 text-[#055A43] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-[14px] font-medium text-[#055A43] tracking-wide uppercase">Lembretes Diários</h2>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#506352] text-[15px]">Ativar notificações</p>
                <p className="text-[#5C615D]/80 text-[13px] font-light mt-1 max-w-[200px]">
                  Receba avisos para manter a rotina do seu cão em dia.
                </p>
              </div>
              <button 
                onClick={handleToggle}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-[#055A43]' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ x: enabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            {permissionStatus === 'denied' && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 flex items-start gap-2">
                <BellOff className="w-4 h-4 mt-0.5 shrink-0" />
                <p>As notificações estão bloqueadas no seu navegador. Ative-as nas configurações do site para usar este recurso.</p>
              </div>
            )}

            <AnimatePresence>
              {enabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-4 pt-4 border-t border-[#055A43]/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#506352]/60" />
                      <p className="text-[#506352] text-[14px] font-medium">Horário do Treino</p>
                    </div>
                    <input 
                      type="time" 
                      value={trainingTime}
                      onChange={e => setTrainingTime(e.target.value)}
                      className="bg-[#FAFAFA] border border-[#055A43]/10 text-[#055A43] rounded-lg px-3 py-1.5 font-medium text-[15px] focus:outline-none focus:ring-1 focus:ring-[#055A43]"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#506352]/60" />
                      <p className="text-[#506352] text-[14px] font-medium">Horário do Check-in</p>
                    </div>
                    <input 
                      type="time" 
                      value={checkinTime}
                      onChange={e => setCheckinTime(e.target.value)}
                      className="bg-[#FAFAFA] border border-[#055A43]/10 text-[#055A43] rounded-lg px-3 py-1.5 font-medium text-[15px] focus:outline-none focus:ring-1 focus:ring-[#055A43]"
                    />
                  </div>
                  <div className="flex flex-col gap-5 pt-4 border-t border-[#055A43]/5 mt-2">
                    <h3 className="text-[13px] uppercase tracking-wider text-[#055A43] font-semibold mb-1">Tipos de Lembretes</h3>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-[#506352] text-[14px] font-medium">Treino diário</p>
                      <button 
                        onClick={() => setReminders(r => ({...r, training: !r.training}))}
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${reminders.training ? 'bg-[#055A43]' : 'bg-gray-200'}`}
                      >
                        <motion.div 
                          className="w-3 h-3 rounded-full bg-white shadow-sm"
                          animate={{ x: reminders.training ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[#506352] text-[14px] font-medium">Check-in de rotina</p>
                      <button 
                        onClick={() => setReminders(r => ({...r, checkin: !r.checkin}))}
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${reminders.checkin ? 'bg-[#055A43]' : 'bg-gray-200'}`}
                      >
                        <motion.div 
                          className="w-3 h-3 rounded-full bg-white shadow-sm"
                          animate={{ x: reminders.checkin ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[#506352] text-[14px] font-medium">Vacinas e saúde</p>
                      <button 
                        onClick={() => setReminders(r => ({...r, vaccines: !r.vaccines}))}
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${reminders.vaccines ? 'bg-[#055A43]' : 'bg-gray-200'}`}
                      >
                        <motion.div 
                          className="w-3 h-3 rounded-full bg-white shadow-sm"
                          animate={{ x: reminders.vaccines ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[#506352] text-[14px] font-medium">Relatório semanal</p>
                      <button 
                        onClick={() => setReminders(r => ({...r, report: !r.report}))}
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${reminders.report ? 'bg-[#055A43]' : 'bg-gray-200'}`}
                      >
                        <motion.div 
                          className="w-3 h-3 rounded-full bg-white shadow-sm"
                          animate={{ x: reminders.report ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#055A43] text-white h-14 rounded-2xl font-medium text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#055A43]/20 active:scale-[0.98] transition-all disabled:opacity-70 mt-auto"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar preferências
            </>
          )}
        </button>
      </main>
    </div>
  );
}
