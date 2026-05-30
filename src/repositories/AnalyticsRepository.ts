import { db, auth } from '@/src/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

export type AnalyticsEventType = 
  | 'session_started'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'training_started'
  | 'training_completed'
  | 'checkin_created'
  | 'report_viewed'
  | 'premium_viewed'
  | 'premium_clicked'
  | 'premium_subscribed'
  | 'premium_cancelled';

export class AnalyticsRepository {
  /**
   * Registra um evento de analytics no Firestore.
   * Executa de forma silenciosa para não bloquear a experiência do usuário.
   */
  static async logEvent(
    event: AnalyticsEventType,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      const userId = user ? user.uid : 'anonymous';
      
      const eventId = `${event}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const payload = {
        id: eventId,
        userId,
        event,
        timestamp: Date.now(),
        ...(metadata ? { metadata } : {})
      };

      // Gravação assíncrona não-bloqueante
      await setDoc(doc(db, 'analytics_events', eventId), payload);
    } catch (error) {
      console.warn('[AnalyticsRepository] Erro ao registrar evento:', event, error);
    }
  }
}
