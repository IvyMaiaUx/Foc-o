import { db } from '@/src/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

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
      title: 'Lembrete de check-up',
      body: `O check-up veterinário de ${dogName} está chegando (marcado para ${dueDate.toLocaleDateString('pt-BR')}).`,
      notifyAt: notifyAt.toISOString(),
      dueDate: nextCheckupDate,
      read: false,
      createdAt: Date.now()
    });
  }

  /**
   * Lembrete de vacina.
   *
   * Recebe `vaccineId` para o lembrete ficar amarrado ao registro que o gerou.
   * Sem esse vinculo, editar a data criava um segundo lembrete e o antigo
   * continuava avisando de uma dose que mudou; e excluir a vacina deixava o
   * lembrete orfao, avisando de dose que nao existe mais.
   */
  static async scheduleVaccineReminders(userId: string, dogName: string, vaccineName: string, nextDoseDate: string, vaccineId?: string): Promise<void> {
    // Antes de agendar, limpa o que ja havia para esta vacina.
    if (vaccineId) await NotificationRepository.deleteVaccineReminders(userId, vaccineId);
    // In a real mobile app, here we would call local notifications API (e.g. from react-native-push-notification) 
    // or register in a backend worker to push through FCM.
    // In this web context, we can just save it to a notifications collection to show in app.
    
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const notifId = Date.now().toString();
    const dueDate = new Date(nextDoseDate);
    
    // We notify 3 days before
    const notifyAt = new Date(dueDate.getTime() - (3 * 24 * 60 * 60 * 1000));
    
    await setDoc(doc(notifsRef, notifId), {
      vaccineId: vaccineId || null,
      title: 'Lembrete de vacina',
      body: `A vacina ${vaccineName} de ${dogName} precisa ser aplicada em breve (vence em ${dueDate.toLocaleDateString()}).`,
      notifyAt: notifyAt.toISOString(),
      dueDate: nextDoseDate,
      read: false,
      createdAt: Date.now()
    });
  }

  static async deleteVaccineReminders(userId: string, vaccineId: string): Promise<void> {
    const notifsRef = collection(db, 'users', userId, 'notifications');
    const snap = await getDocs(query(notifsRef, where('vaccineId', '==', vaccineId)));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
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
