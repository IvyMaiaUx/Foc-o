import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCircle2, ChevronLeft, Clock, Save } from 'lucide-react';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export function Notificacoes() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [trainingTime, setTrainingTime] = useState('09:00');
  const [checkinTime, setCheckinTime] = useState('20:00');
  const [vaccineTime, setVaccineTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [reminders, setReminders] = useState({
    training: true,
    checkin: true,
    vaccines: true,
    report: true,
  });

  // WhatsApp states V1.2
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappTypes, setWhatsappTypes] = useState({
    welcome: true,
    agendaDay: false,
    weeklyReport: true,
    trainingReminder: true,
    achievements: true,
    inactivity: true,
    trialAndBilling: true,
  });

  useEffect(() => {
    try {
      if ('Notification' in window) setPermissionStatus(Notification.permission);
    } catch (e) {
      console.warn('Notifications API not available or blocked in this context', e);
    }

    const loadSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const userData = snap.data();
          const settings = userData.settings || {};
          setEnabled(settings.notificationsEnabled ?? false);
          setTrainingTime(settings.trainingReminderTime ?? '09:00');
          setCheckinTime(settings.checkinReminderTime ?? '20:00');
          setVaccineTime(settings.vaccineReminderTime ?? settings.trainingReminderTime ?? '09:00');
          if (settings.reminders) {
            setReminders({
              training: settings.reminders.training ?? true,
              checkin: settings.reminders.checkin ?? true,
              vaccines: settings.reminders.vaccines ?? true,
              report: settings.reminders.report ?? true,
            });
          }

          // Load WhatsApp settings from user root
          setWhatsappEnabled(userData.whatsappEnabled ?? false);
          setWhatsappPhone(userData.whatsappPhone ?? '');
          if (userData.whatsappNotificationTypes) {
            setWhatsappTypes({
              welcome: userData.whatsappNotificationTypes.welcome ?? true,
              agendaDay: userData.whatsappNotificationTypes.agendaDay ?? false,
              weeklyReport: userData.whatsappNotificationTypes.weeklyReport ?? true,
              trainingReminder: userData.whatsappNotificationTypes.trainingReminder ?? true,
              achievements: userData.whatsappNotificationTypes.achievements ?? true,
              inactivity: userData.whatsappNotificationTypes.inactivity ?? true,
              trialAndBilling: userData.whatsappNotificationTypes.trialAndBilling ?? true,
            });
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
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
      new Notification('Notificações ativadas', {
        body: 'Você receberá os lembretes do Focão.',
        icon: '/icon-192.png',
      });
    }
    return permission === 'granted';
  };

  const handleToggle = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    if (newValue && permissionStatus !== 'granted') {
      try {
        await requestPermission();
      } catch (err) {
        console.error('Erro ao solicitar permissão', err);
      }
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};
      
      const optInAt = whatsappEnabled ? (currentData.whatsappOptInAt || Date.now()) : null;
      const optOutAt = !whatsappEnabled && currentData.whatsappEnabled ? Date.now() : (currentData.whatsappOptOutAt || null);
      const status = whatsappEnabled ? (whatsappPhone ? 'active' : 'missing_phone') : 'disabled';

      await updateDoc(userRef, {
        'settings.notificationsEnabled': enabled,
        'settings.trainingReminderTime': trainingTime,
        'settings.checkinReminderTime': checkinTime,
        'settings.vaccineReminderTime': vaccineTime,
        'settings.reminders': reminders,

        // WhatsApp V1.2 root fields
        whatsappEnabled,
        whatsappPhone,
        whatsappNotificationTypes: whatsappTypes,
        whatsappOptInAt: optInAt,
        whatsappOptOutAt: optOutAt,
        whatsappStatus: status
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#F7F5EF] flex items-center justify-center min-h-screen">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#055A43]/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans flex flex-col">
      <header className="px-6 pt-6 pb-6 bg-[#F7F5EF] sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#055A43]/5 shadow-sm flex items-center justify-center active:bg-gray-100 transition-colors mb-5"
        >
          <ChevronLeft className="w-5 h-5 text-[#506352]" />
        </button>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7A6E]/70 mb-1.5">Preferências</p>
        <h1 className="font-serif text-[28px] font-semibold text-[#055A43] tracking-tight leading-tight">Notificações &amp; lembretes</h1>
      </header>

      <main className="flex-1 px-6 pb-10 pt-1 flex flex-col gap-8 max-w-md mx-auto w-full">
        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#055A43]/10 bg-white px-4 py-3 text-sm font-medium text-[#055A43] shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
            Alterações salvas.
          </div>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3 px-2">
            <Bell className="w-3.5 h-3.5 text-[#055A43]/50" />
            <h2 className="text-[10px] font-medium text-[#6B7A6E] tracking-[0.15em] uppercase">Lembretes no app</h2>
          </div>

          <div className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_24px_rgba(45,74,58,0.08)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#506352] text-[15px]">Ativar notificações push</p>
                <p className="text-[#6B7A6E]/80 text-[13px] font-light mt-1 max-w-[220px]">
                  Receba avisos conforme a agenda do seu cão.
                </p>
              </div>
              <button onClick={handleToggle} className={`w-12 h-6 rounded-full p-1 transition-colors ${enabled ? 'bg-[#055A43]' : 'bg-gray-200'}`}>
                <motion.div className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: enabled ? 24 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
              </button>
            </div>

            {permissionStatus === 'denied' && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 flex items-start gap-2">
                <BellOff className="w-4 h-4 mt-0.5 shrink-0" />
                <p>As notificações do sistema estão bloqueadas no navegador. Os lembretes dentro do app continuam disponíveis.</p>
              </div>
            )}

            <AnimatePresence>
              {enabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-5 pt-5 border-t border-[#055A43]/5"
                >
                  <div className="flex flex-col gap-4">
                    <TimeRow label="Horário do treino" value={trainingTime} onChange={setTrainingTime} />
                    <TimeRow label="Horário do check-in" value={checkinTime} onChange={setCheckinTime} />
                    <TimeRow label="Horário de vacinas" value={vaccineTime} onChange={setVaccineTime} />
                  </div>

                  <div className="flex flex-col gap-4 pt-5 border-t border-[#055A43]/5">
                    <h3 className="text-[11px] uppercase tracking-[0.15em] text-[#055A43] font-semibold">Tipos de lembretes</h3>
                    <div className="flex flex-col gap-4">
                      <ReminderToggle label="Treino diário" active={reminders.training} onClick={() => setReminders((r) => ({ ...r, training: !r.training }))} />
                      <ReminderToggle label="Check-in de rotina" active={reminders.checkin} onClick={() => setReminders((r) => ({ ...r, checkin: !r.checkin }))} />
                      <ReminderToggle label="Vacinas e saúde" active={reminders.vaccines} onClick={() => setReminders((r) => ({ ...r, vaccines: !r.vaccines }))} />
                      <ReminderToggle label="Relatório semanal" active={reminders.report} onClick={() => setReminders((r) => ({ ...r, report: !r.report }))} />
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
          className="w-full bg-[#C2703E] text-white h-14 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-[#C2703E]/20 active:scale-[0.98] transition-all disabled:opacity-70 mt-auto"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /> Salvar preferências</>}
        </button>
      </main>
    </div>
  );
}

function TimeRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#506352]/60" />
        <p className="text-[#506352] text-[14px] font-medium">{label}</p>
      </div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#F7F5EF] border border-[#055A43]/10 text-[#055A43] rounded-lg px-3 py-1.5 font-medium text-[15px] focus:outline-none focus:ring-1 focus:ring-[#055A43]"
      />
    </div>
  );
}

function ReminderToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-[#506352] text-[14px] font-medium">{label}</p>
      <button onClick={onClick} className={`w-10 h-5 rounded-full p-1 transition-colors ${active ? 'bg-[#055A43]' : 'bg-gray-200'}`}>
        <motion.div className="w-3 h-3 rounded-full bg-white shadow-sm" animate={{ x: active ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
      </button>
    </div>
  );
}
