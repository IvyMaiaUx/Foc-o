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
  const [whatsappPreferredTime, setWhatsappPreferredTime] = useState('18:00');
  const [whatsappTypes, setWhatsappTypes] = useState({
    weeklyReport: true,
    trainingReminder: true,
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
          setWhatsappPreferredTime(userData.whatsappPreferredTime ?? '18:00');
          if (userData.whatsappNotificationTypes) {
            setWhatsappTypes({
              weeklyReport: userData.whatsappNotificationTypes.weeklyReport ?? true,
              trainingReminder: userData.whatsappNotificationTypes.trainingReminder ?? true,
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
        whatsappPreferredTime,
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
        {saved && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#055A43]/10 bg-white px-4 py-3 text-sm font-medium text-[#055A43] shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
            Alterações salvas com sucesso.
          </div>
        )}

        <section>
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#055A43]/10 text-[#055A43] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-[14px] font-medium text-[#055A43] tracking-wide uppercase">Lembretes no App</h2>
          </div>

          <div className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#506352] text-[15px]">Ativar notificações push</p>
                <p className="text-[#5C615D]/80 text-[13px] font-light mt-1 max-w-[220px]">
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
                  className="overflow-hidden flex flex-col gap-4 pt-4 border-t border-[#055A43]/5"
                >
                  <TimeRow label="Horário do treino" value={trainingTime} onChange={setTrainingTime} />
                  <TimeRow label="Horário do check-in" value={checkinTime} onChange={setCheckinTime} />
                  <TimeRow label="Horário de vacinas" value={vaccineTime} onChange={setVaccineTime} />

                  <div className="flex flex-col gap-5 pt-4 border-t border-[#055A43]/5 mt-2">
                    <h3 className="text-[13px] uppercase tracking-wider text-[#055A43] font-semibold mb-1">Tipos de lembretes</h3>
                    <ReminderToggle label="Treino diário" active={reminders.training} onClick={() => setReminders((r) => ({ ...r, training: !r.training }))} />
                    <ReminderToggle label="Check-in de rotina" active={reminders.checkin} onClick={() => setReminders((r) => ({ ...r, checkin: !r.checkin }))} />
                    <ReminderToggle label="Vacinas e saúde" active={reminders.vaccines} onClick={() => setReminders((r) => ({ ...r, vaccines: !r.vaccines }))} />
                    <ReminderToggle label="Relatório semanal" active={reminders.report} onClick={() => setReminders((r) => ({ ...r, report: !r.report }))} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* WhatsApp notifications section */}
        <section>
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[#055A43]/10 text-[#055A43] flex items-center justify-center">
              <span className="text-sm">📱</span>
            </div>
            <h2 className="text-[14px] font-medium text-[#055A43] tracking-wide uppercase">Notificações por WhatsApp</h2>
          </div>

          <div className="bg-white rounded-[1.5rem] p-5 border border-[#055A43]/5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#506352] text-[15px]">Ativar WhatsApp</p>
                <p className="text-[#5C615D]/80 text-[13px] font-light mt-1 max-w-[220px]">
                  Receba lembretes, dicas e relatórios no WhatsApp.
                </p>
              </div>
              <button 
                onClick={() => setWhatsappEnabled(!whatsappEnabled)} 
                className={`w-12 h-6 rounded-full p-1 transition-colors ${whatsappEnabled ? 'bg-[#055A43]' : 'bg-gray-200'}`}
              >
                <motion.div className="w-4 h-4 rounded-full bg-white shadow-sm" animate={{ x: whatsappEnabled ? 24 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
              </button>
            </div>

            <AnimatePresence>
              {whatsappEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-4 pt-4 border-t border-[#055A43]/5"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[#506352] text-xs font-semibold">Número de WhatsApp (com DDD)</label>
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="+55 (61) 99999-9999"
                      className="bg-[#FAFAFA] border border-[#055A43]/10 text-[#055A43] rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#055A43] w-full"
                    />
                  </div>

                  <TimeRow label="Horário preferido" value={whatsappPreferredTime} onChange={setWhatsappPreferredTime} />

                  <div className="flex flex-col gap-4 pt-4 border-t border-[#055A43]/5 mt-2">
                    <h3 className="text-[12px] uppercase tracking-wider text-[#055A43] font-semibold mb-1">Tipos de notificações</h3>
                    <ReminderToggle label="Relatório semanal" active={whatsappTypes.weeklyReport} onClick={() => setWhatsappTypes((w) => ({ ...w, weeklyReport: !w.weeklyReport }))} />
                    <ReminderToggle label="Lembretes de treino" active={whatsappTypes.trainingReminder} onClick={() => setWhatsappTypes((w) => ({ ...w, trainingReminder: !w.trainingReminder }))} />
                    <ReminderToggle label="Avisos de inatividade" active={whatsappTypes.inactivity} onClick={() => setWhatsappTypes((w) => ({ ...w, inactivity: !w.inactivity }))} />
                    <ReminderToggle label="Trial e assinatura" active={whatsappTypes.trialAndBilling} onClick={() => setWhatsappTypes((w) => ({ ...w, trialAndBilling: !w.trialAndBilling }))} />
                  </div>

                  <p className="text-[11px] text-gray-400 font-light leading-relaxed mt-2 p-3 bg-gray-50 rounded-xl">
                    Ao ativar, você autoriza o Focão a enviar lembretes, relatórios e avisos importantes pelo WhatsApp. Você pode desativar quando quiser.
                  </p>
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
        className="bg-[#FAFAFA] border border-[#055A43]/10 text-[#055A43] rounded-lg px-3 py-1.5 font-medium text-[15px] focus:outline-none focus:ring-1 focus:ring-[#055A43]"
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
