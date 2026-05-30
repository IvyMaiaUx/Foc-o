import { db } from '@/src/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

export class NotificationRepository {
  static async scheduleCheckupReminders(userId: string, dogName: string, nextCheckupDate: string): Promise<void> {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const notifId = Date.now().toString() + '_checkup';
    // Ensure we correctly parse date strings like "2026-05-10" to local time without shifting
    const [year, month, day] = nextCheckupDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    
    // Notify 3 days before
    const notifyAt = new Date(dueDate.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    await setDoc(doc(notifsRef, notifId), {
      title: 'Lembrete de Check-up',
      body: `O check-up veterinário de ${dogName} está chegando (marcado para ${dueDate.toLocaleDateString('pt-BR')}).`,
      notifyAt: notifyAt.toISOString(),
      dueDate: nextCheckupDate,
      read: false,
      createdAt: Date.now()
    });
  }

  static async scheduleVaccineReminders(userId: string, dogName: string, vaccineName: string, nextDoseDate: string): Promise<void> {
    // In a real mobile app, here we would call local notifications API (e.g. from react-native-push-notification) 
    // or register in a backend worker to push through FCM.
    // In this web context, we can just save it to a notifications collection to show in app.
    
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const notifId = Date.now().toString();
    const dueDate = new Date(nextDoseDate);
    
    // We notify 3 days before
    const notifyAt = new Date(dueDate.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    await setDoc(doc(notifsRef, notifId), {
      title: 'Lembrete de Vacina',
      body: `A vacina ${vaccineName} de ${dogName} precisa ser aplicada em breve (vence em ${dueDate.toLocaleDateString()}).`,
      notifyAt: notifyAt.toISOString(),
      dueDate: nextDoseDate,
      read: false,
      createdAt: Date.now()
    });
  }

  static async getActiveNotifications(userId: string): Promise<any[]> {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    // Fetch unread notifications
    const q = query(notifsRef, where('read', '==', false));
    const snap = await getDocs(q);
    
    // Filter by timestamp and return those that are due
    const now = new Date().toISOString();
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((n: any) => n.notifyAt <= now);
  }

  static async markAsRead(notifId: string, userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { read: true });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    const activeNotifications = await NotificationRepository.getActiveNotifications(userId);
    await Promise.all(
      activeNotifications.map((notification) =>
        updateDoc(doc(db, 'users', userId, 'notifications', notification.id), { read: true })
      )
    );
  }
}
