import { auth, db } from '@/src/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc,
  updateDoc,
  getDocs, 
  query, 
  where, 
  limit, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

export interface WhatsAppProvider {
  sendTemplateMessage(to: string, templateName: string, variables: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }>;
  getProviderName(): string;
}

export class MockWhatsAppProvider implements WhatsAppProvider {
  async sendTemplateMessage(to: string, templateName: string, variables: Record<string, string>) {
    console.log(`[MockWhatsAppProvider] Enviando template "${templateName}" para "${to}" com variáveis:`, variables);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  }
  
  getProviderName() {
    return 'mock';
  }
}

/*
// Deixado preparado para futura integração com API oficial do WhatsApp Cloud API
export class WhatsAppCloudApiProvider implements WhatsAppProvider {
  private accessToken: string;
  private phoneNumberId: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async sendTemplateMessage(to: string, templateName: string, variables: Record<string, string>) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: Object.entries(variables).map(([_, val]) => ({
                  type: 'text',
                  text: val
                }))
              }
            ]
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, messageId: data.messages?.[0]?.id };
      }
      return { success: false, error: data.error?.message || 'Erro na resposta do WhatsApp' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de rede' };
    }
  }

  getProviderName() {
    return 'whatsapp_cloud_api';
  }
}
*/

export interface WhatsappNotificationDoc {
  userId: string;
  dogId: string;
  dogName: string;
  type:
    | 'welcome'
    | 'agenda_day'
    | 'training_reminder'
    | 'checkin_reminder'
    | 'vaccine_reminder'
    | 'weekly_report'
    | 'monthly_report'
    | 'inactivity_3d'
    | 'trial_ending'
    | 'payment_failed'
    | 'renewal_success'
    | 'premium_activated'
    | 'test'
    | 'referral_reward';
  status: 'pending' | 'sent' | 'mock_sent' | 'skipped' | 'failed';
  provider: 'mock' | 'whatsapp_cloud_api' | 'zapresponder';
  templateName: string;
  payload: Record<string, any>;
  scheduledFor: number;
  sentAt: number | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
}

export class WhatsAppNotificationService {
  private static provider: WhatsAppProvider = new MockWhatsAppProvider();
  private static apiEndpoint = import.meta.env.VITE_WHATSAPP_SEND_API_URL || 'https://foc-o.vercel.app/api/send-whatsapp-message';

  static setProvider(newProvider: WhatsAppProvider) {
    this.provider = newProvider;
  }

  static async getUserWhatsappPreferences(userId: string) {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      whatsappEnabled: data.whatsappEnabled ?? false,
      whatsappPhone: data.whatsappPhone ?? '',
      whatsappNotificationTypes: data.whatsappNotificationTypes ?? {
        weeklyReport: true,
        trainingReminder: true,
        inactivity: true,
        trialAndBilling: true,
      },
      whatsappStatus: data.whatsappStatus ?? 'disabled'
    };
  }

  static async shouldSkipNotification(userId: string, type: string): Promise<{ skip: boolean; reason?: string }> {
    const prefs = await this.getUserWhatsappPreferences(userId);
    if (!prefs) {
      return { skip: true, reason: 'user_not_found' };
    }

    if (!prefs.whatsappEnabled) {
      return { skip: true, reason: 'opt_out' };
    }

    if (!prefs.whatsappPhone) {
      return { skip: true, reason: 'missing_phone' };
    }

    // Check notification type filter
    const mapping: Record<string, keyof typeof prefs.whatsappNotificationTypes> = {
      welcome: 'trialAndBilling',
      agenda_day: 'agendaDay',
      training_reminder: 'trainingReminder',
      checkin_reminder: 'trainingReminder',
      vaccine_reminder: 'trainingReminder',
      weekly_report: 'weeklyReport',
      monthly_report: 'weeklyReport',
      inactivity_3d: 'inactivity',
      trial_ending: 'trialAndBilling',
      payment_failed: 'trialAndBilling',
      renewal_success: 'trialAndBilling',
      premium_activated: 'trialAndBilling',
      referral_reward: 'trialAndBilling',
      test: 'weeklyReport' // Test messages bypass but classified under weekly
    };
    const prefKey = mapping[type];
    if (prefKey && !prefs.whatsappNotificationTypes[prefKey]) {
      return { skip: true, reason: `disabled_type_${type}` };
    }

    if (type === 'weekly_report') {
      const now = new Date();
      const cutoff = new Date(now);
      cutoff.setDate(now.getDate() - 6);
      const toDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const cutoffKey = toDateKey(cutoff);
      const todayKey = toDateKey(now);
      const checkinsSnap = await getDocs(query(
        collection(db, 'users', userId, 'checkins'),
        orderBy('date', 'desc'),
        limit(7)
      ));
      const activeDays = new Set(
        checkinsSnap.docs
          .map((docSnap) => docSnap.data()?.date || docSnap.id)
          .filter((date) => typeof date === 'string' && date >= cutoffKey && date <= todayKey)
      );

      if (activeDays.size < 3) {
        return { skip: true, reason: 'insufficient_weekly_checkins' };
      }
    }

    // Prevent duplicate messages of the same type on the same calendar day (UTC-3 / Brazilian standard)
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, 'whatsapp_notifications'),
      where('userId', '==', userId),
      where('type', '==', type),
      where('createdAt', '>=', startOfDay.getTime())
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const alreadySent = snap.docs.some(doc => doc.data().status === 'mock_sent' || doc.data().status === 'pending');
      if (alreadySent) {
        return { skip: true, reason: 'duplicate_today' };
      }
    }

    return { skip: false };
  }

  static async enqueueNotification(params: {
    userId: string;
    dogId?: string;
    dogName?: string;
    type: WhatsappNotificationDoc['type'];
    templateName: string;
    payload: Record<string, any>;
    variables?: Record<string, any> | string[];
    scheduledFor?: number;
  }): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não autenticado para envio de WhatsApp.');
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || 'Falha ao enviar mensagem pelo WhatsApp.');
    }

    return data.notificationId;
  }

  static async sendMockMessage(notificationId: string): Promise<void> {
    const docRef = doc(db, 'whatsapp_notifications', notificationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const notification = snap.data() as WhatsappNotificationDoc;

    try {
      const prefs = await this.getUserWhatsappPreferences(notification.userId);
      const recipientPhone = prefs?.whatsappPhone || '';
      
      if (!recipientPhone) {
        await this.markAsFailed(notificationId, 'Telefone não disponível para envio');
        return;
      }

      const res = await this.provider.sendTemplateMessage(recipientPhone, notification.templateName, notification.payload);
      
      if (res.success) {
        await this.markAsMockSent(notificationId);
        // Update last sent date/time on user profile
        await updateDoc(doc(db, 'users', notification.userId), {
          lastWhatsappSentAt: Date.now(),
          whatsappStatus: 'active'
        });
      } else {
        await this.markAsFailed(notificationId, res.error || 'Falha no disparo do template');
      }
    } catch (err: any) {
      await this.markAsFailed(notificationId, err.message || 'Erro inesperado no envio de simulação');
    }
  }

  static async markAsMockSent(notificationId: string): Promise<void> {
    const docRef = doc(db, 'whatsapp_notifications', notificationId);
    await updateDoc(docRef, {
      status: 'mock_sent',
      sentAt: Date.now(),
      updatedAt: Date.now()
    });
  }

  static async markAsFailed(notificationId: string, error: string): Promise<void> {
    const docRef = doc(db, 'whatsapp_notifications', notificationId);
    await updateDoc(docRef, {
      status: 'failed',
      error: error,
      updatedAt: Date.now()
    });
    
    // Check if we have userId to update profile status
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(doc(db, 'users', data.userId), {
        whatsappStatus: 'failed'
      });
    }
  }
}
