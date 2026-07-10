import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/src/lib/firebase';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toLocalDateKey } from '@/src/lib/dateKeys';

function showInAppNotification(title: string, message: string, navigatePath?: string, navigate?: (path: string) => void) {
  const existing = document.getElementById('focao-inapp-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'focao-inapp-toast';
  toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#055A43]/10 p-4 w-[90%] max-w-sm z-[9999] flex items-center gap-4 transition-all duration-300 transform translate-y-0 opacity-100 cursor-pointer';
  toast.style.animation = 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

  const iconWrap = document.createElement('div');
  iconWrap.className = 'relative w-10 h-10 rounded-full bg-[#055A43]/10 flex items-center justify-center shrink-0';

  const icon = document.createElement('span');
  icon.className = 'text-[#055A43] text-lg';
  icon.textContent = 'F';

  const dot = document.createElement('div');
  dot.className = 'absolute -top-1 -right-1 w-3 h-3 bg-[#D8C3A5] rounded-full border-2 border-white';

  const content = document.createElement('div');
  content.className = 'flex-1';

  const heading = document.createElement('h4');
  heading.className = 'font-medium text-[#055A43] text-sm';
  heading.textContent = title;

  const paragraph = document.createElement('p');
  paragraph.className = 'text-[12px] text-[#6B7A6E] leading-tight mt-0.5';
  paragraph.textContent = message;

  iconWrap.append(icon, dot);
  content.append(heading, paragraph);
  toast.append(iconWrap, content);

  toast.onclick = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => toast.remove(), 300);
    if (navigatePath && navigate) navigate(navigatePath);
  };

  document.body.appendChild(toast);

  if (!document.getElementById('focao-toast-style')) {
    const style = document.createElement('style');
    style.id = 'focao-toast-style';
    style.textContent = `
      @keyframes slideDown {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px)';
      setTimeout(() => {
        if (document.body.contains(toast)) toast.remove();
      }, 300);
    }
  }, 6000);
}

export function useReminders() {
  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribeSupport: (() => void) | undefined;
    let timeoutId: ReturnType<typeof setInterval> | undefined;

    let currentUserData: any = null;
    let userSettings: any = null;

    const getNotificationPermission = () => {
      try {
        return 'Notification' in window ? Notification.permission : 'unsupported';
      } catch {
        return 'unsupported';
      }
    };

    const pushSystemNotification = (title: string, body: string) => {
      if (getNotificationPermission() !== 'granted') return;
      new Notification(title, { body, icon: '/icon-192.png' });
    };

    const hasMinimumWeeklyCheckins = async (uid: string) => {
      const today = new Date();
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 6);
      const cutoffKey = toLocalDateKey(cutoff);
      const todayKey = toLocalDateKey(today);
      const snap = await getDocs(query(collection(db, 'users', uid, 'checkins'), orderBy('date', 'desc'), limit(7)));
      const activeDays = new Set(
        snap.docs
          .map((docSnap) => docSnap.data()?.date || docSnap.id)
          .filter((date) => typeof date === 'string' && date >= cutoffKey && date <= todayKey)
      );

      return activeDays.size >= 3;
    };

    const checkReminders = async (uid: string) => {
      if (!userSettings?.notificationsEnabled) return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = toLocalDateKey(now);
      const pendingNotifications = currentUserData?.pendingNotifications || {};
      const remindersConf = userSettings?.reminders || {};
      const updates: Record<string, string> = {};

      if (remindersConf.training !== false && userSettings.trainingReminderTime && currentTime >= userSettings.trainingReminderTime && pendingNotifications.training !== todayStr) {
        const body = 'Hora do treino do seu cão.';
        showInAppNotification('Focão', body, '/treino', navigate);
        pushSystemNotification('Focão', body);
        updates['pendingNotifications.training'] = todayStr;
      }

      if (remindersConf.checkin !== false && userSettings.checkinReminderTime && currentTime >= userSettings.checkinReminderTime && pendingNotifications.checkin !== todayStr) {
        const body = 'Já registrou como foi o dia do seu cão?';
        showInAppNotification('Focão', body, '/checkin', navigate);
        pushSystemNotification('Focão', body);
        updates['pendingNotifications.checkin'] = todayStr;
      }

      const vaccineCheckTime = userSettings.vaccineReminderTime || userSettings.trainingReminderTime || '09:00';
      if (remindersConf.vaccines !== false && currentTime >= vaccineCheckTime && pendingNotifications.vaccines !== todayStr) {
        try {
          const snap = await getDocs(collection(db, 'users', uid, 'vaccines'));
          const upcomingVaccines: string[] = [];

          snap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.nextDose) return;
            const nextDose = new Date(`${data.nextDose}T12:00:00`);
            const diffDays = Math.ceil((nextDose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 3 || diffDays === 1 || diffDays === 0) upcomingVaccines.push(data.name);
          });

          if (upcomingVaccines.length > 0) {
            const body = `Lembrete de vacina: ${upcomingVaccines.join(', ')} está próxima ou vence hoje.`;
            showInAppNotification('Focão', body, '/vacinas', navigate);
            pushSystemNotification('Focão', body);
          }

          updates['pendingNotifications.vaccines'] = todayStr;
        } catch (err) {
          console.error('Error checking vaccines', err);
        }
      }

      if (remindersConf.report !== false && now.getDay() === 1 && currentTime >= '09:00' && pendingNotifications.report !== todayStr) {
        try {
          if (await hasMinimumWeeklyCheckins(uid)) {
            const body = 'Seu relatório semanal está pronto. Veja a evolução.';
            showInAppNotification('Focão', body, '/relatorio', navigate);
            pushSystemNotification('Focão', body);
            updates['pendingNotifications.report'] = todayStr;
          }
        } catch (err) {
          console.error('Error checking weekly report eligibility', err);
        }
      }

      if (Object.keys(updates).length > 0) {
        try {
          await updateDoc(doc(db, 'users', uid), updates);
        } catch (err) {
          console.error('Error updating pending notifications', err);
        }
      }
    };

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeSupport) unsubscribeSupport();
      if (timeoutId) clearInterval(timeoutId);

      if (!user) return;

      unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          currentUserData = docSnap.data();
          userSettings = currentUserData.settings || {};
        }
      });

      let initialLoad = true;
      const msgsQuery = query(collection(db, 'supportThreads', user.uid, 'messages'), orderBy('createdAt', 'desc'), limit(1));

      unsubscribeSupport = onSnapshot(msgsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const latestMsg = snapshot.docs[0].data();
          if (!initialLoad && latestMsg.sender !== 'user') {
            const body = 'Você tem uma nova mensagem no suporte.';
            showInAppNotification('Equipe Focão', body, '/suporte', navigate);
            pushSystemNotification('Equipe Focão', body);
          }
        }
        initialLoad = false;
      });

      timeoutId = setInterval(() => checkReminders(user.uid), 60000);
      setTimeout(() => checkReminders(user.uid), 2000);
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeSupport) unsubscribeSupport();
      if (timeoutId) clearInterval(timeoutId);
    };
  }, [navigate]);
}
