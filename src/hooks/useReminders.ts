import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc, collection, onSnapshot, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function showInAppNotification(title: string, message: string, navigatePath?: string, navigate?: (path: string) => void) {
  const existing = document.getElementById('focao-inapp-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'focao-inapp-toast';
  toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#055A43]/10 p-4 w-[90%] max-w-sm z-[9999] flex items-center gap-4 transition-all duration-300 transform translate-y-0 opacity-100 cursor-pointer';
  toast.style.animation = 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  
  toast.innerHTML = `
    <div class="relative w-10 h-10 rounded-full bg-[#055A43]/10 flex items-center justify-center shrink-0">
      <span class="text-[#055A43] text-lg">💬</span>
      <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
    </div>
    <div class="flex-1">
      <h4 class="font-medium text-[#055A43] text-sm">${title}</h4>
      <p class="text-[12px] text-[#5C615D] leading-tight mt-0.5">${message}</p>
    </div>
  `;

  toast.onclick = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -20px)';
    setTimeout(() => toast.remove(), 300);
    if (navigatePath && navigate) {
       navigate(navigatePath);
    }
  };

  document.body.appendChild(toast);

  // Add the keyframes to head if not exists
  if (!document.getElementById('focao-toast-style')) {
    const style = document.createElement('style');
    style.id = 'focao-toast-style';
    style.innerHTML = `
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
    let unsubscribeAuth: () => void;
    let unsubscribeUser: () => void;
    let unsubscribeSupport: () => void;
    let timeoutId: NodeJS.Timeout;

    let currentUserData: any = null;
    let userSettings: any = null;
    let wasUnread = false;

    const checkReminders = async (uid: string) => {
      if (!('Notification' in window)) return;
      
      let permission = 'default';
      try {
        permission = Notification.permission;
      } catch (e) {
        return; // Safely exit if accessing permission throws (e.g. cross-origin iframe security error)
      }

      if (permission !== 'granted') return;
      if (!userSettings?.notificationsEnabled) return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const todayStr = now.toLocaleDateString();

      const pendingNotifications = currentUserData?.pendingNotifications || {};

      let updates: any = {};

      const remindersConf = userSettings?.reminders || {};
      const enabledTraining = remindersConf.training !== false;
      const enabledCheckin = remindersConf.checkin !== false;
      const enabledVaccines = remindersConf.vaccines !== false;
      const enabledReport = remindersConf.report !== false;

      // 1. Training Reminder
      if (enabledTraining && userSettings.trainingReminderTime && 
          currentTime >= userSettings.trainingReminderTime && 
          pendingNotifications.training !== todayStr) {
        
        showInAppNotification('Focão', '🐾 Está na hora do treino do seu cão!', '/treino', navigate);
        
        if (permission === 'granted') {
          new Notification('Focão', {
            body: '🐾 Está na hora do treino do seu cão!',
            icon: '/vite.svg'
          });
        }

        updates['pendingNotifications.training'] = todayStr;
      }

      // 2. Check-in Reminder
      if (enabledCheckin && userSettings.checkinReminderTime && 
          currentTime >= userSettings.checkinReminderTime && 
          pendingNotifications.checkin !== todayStr) {
        
        showInAppNotification('Focão', '📝 Já registrou como foi o dia do seu cão?', '/checkin', navigate);
        
        if (permission === 'granted') {
          new Notification('Focão', {
            body: '📝 Já registrou como foi o dia do seu cão?',
            icon: '/vite.svg'
          });
        }

        updates['pendingNotifications.checkin'] = todayStr;
      }

      // 3. Vaccine Reminder (check once a day, let's say at 09:00 or at trainingReminderTime)
      // We'll check if any vaccine is due in exactly 3 days, 1 day, or today.
      const vaccineCheckTime = userSettings.trainingReminderTime || '09:00';
      if (enabledVaccines && currentTime >= vaccineCheckTime && pendingNotifications.vaccines !== todayStr) {
        try {
          const vaccinesRef = collection(db, 'users', uid, 'vaccines');
          const snap = await getDocs(vaccinesRef);
          
          let upcomingVaccines: string[] = [];

          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            if (data.nextDose) {
              const nextDose = new Date(`${data.nextDose}T12:00:00`);
              const diffTime = nextDose.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 3 || diffDays === 1 || diffDays === 0) {
                upcomingVaccines.push(data.name);
              }
            }
          });

          if (upcomingVaccines.length > 0) {
            showInAppNotification('Focão', `💉 Lembrete de vacina: ${upcomingVaccines.join(', ')} está(ão) próxima(s) ou vence(m) hoje!`, '/vacinas', navigate);
            
            if (permission === 'granted') {
              new Notification('Focão', {
                body: `💉 Lembrete de vacina: ${upcomingVaccines.join(', ')} está(ão) próxima(s) ou vence(m) hoje!`,
                icon: '/vite.svg'
              });
            }
          }

          updates['pendingNotifications.vaccines'] = todayStr;
        } catch (err) {
          console.error("Error checking vaccines", err);
        }
      }

      // 4. Weekly Report Reminder (Sundays at '09:00')
      const reportCheckTime = '09:00';
      if (enabledReport && now.getDay() === 0 && currentTime >= reportCheckTime && pendingNotifications.report !== todayStr) {
        showInAppNotification('Focão', '📊 Seu relatório semanal está pronto! Veja a evolução.', '/relatorio', navigate);
        
        if (permission === 'granted') {
          new Notification('Focão', {
            body: '📊 Seu relatório semanal está pronto! Veja a evolução do seu cão.',
            icon: '/vite.svg'
          });
        }
        updates['pendingNotifications.report'] = todayStr;
      }

      if (Object.keys(updates).length > 0) {
        try {
          await updateDoc(doc(db, 'users', uid), updates);
        } catch (err) {
          console.error("Error updating pending notifications", err);
        }
      }
    };

    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeSupport) unsubscribeSupport();
      clearInterval(timeoutId);

      if (user) {
        unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            currentUserData = docSnap.data();
            userSettings = currentUserData.settings || {};
          }
        }, () => {
          // Ignore
        });

        let initialLoad = true;
        const msgsQuery = query(
          collection(db, 'supportThreads', user.uid, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );

        unsubscribeSupport = onSnapshot(msgsQuery, (snapshot) => {
          if (!snapshot.empty) {
            const latestMsg = snapshot.docs[0].data();
            
            // Only trigger for new messages that come AFTER the initial load and are NOT from the user
            if (!initialLoad && latestMsg.sender !== 'user') {
              let permission = 'default';
              try { permission = Notification.permission; } catch (e) {}

              // Show the in-app notification always on new message
              showInAppNotification('Equipe Focão', 'Você tem uma nova mensagem no suporte!', '/suporte', navigate);

              // Try system notification if allowed
              if (permission === 'granted' && userSettings?.notificationsEnabled) {
                new Notification('Equipe Focão', {
                  body: 'Você tem uma nova mensagem no suporte!',
                  icon: '/vite.svg'
                });
              }
            }
          }
          initialLoad = false;
        }, () => {
          // Ignore
        });

        // Check every minute
        timeoutId = setInterval(() => checkReminders(user.uid), 60000);
        // Check right away after a short delay to get initial snapshot
        setTimeout(() => checkReminders(user.uid), 2000);
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeSupport) unsubscribeSupport();
      clearInterval(timeoutId);
    };
  }, []);
}
