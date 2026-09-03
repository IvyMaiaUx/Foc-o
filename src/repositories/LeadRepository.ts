import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LEGAL_VERSIONS } from '../config/legal';

export type LeadPayload = {
  name: string;
  email: string;
  whatsapp?: string;
  source?: 'landing_ebook' | 'ebook' | 'presell_quiz';
  dogName?: string;
  quizProfile?: string;
  /** Aceite de receber o material e comunicação por e-mail. */
  emailPermission?: boolean;
  /**
   * Aceite de receber mensagem no WhatsApp. Separado do e-mail de propósito:
   * um não cobre o outro. E-mail entrega o material que a pessoa pediu;
   * WhatsApp é canal de mensagem ativa, e a política do WhatsApp Business
   * exige opt-in registrado — disparar sem ele derruba a qualidade do número.
   */
  whatsappPermission?: boolean;
};

export class LeadRepository {
  static async createMarketingLead(payload: LeadPayload): Promise<void> {
    await addDoc(collection(db, 'marketingLeads'), {
      name: payload.name.trim().slice(0, 80),
      email: payload.email.trim().toLowerCase().slice(0, 120),
      whatsapp: (payload.whatsapp || '').replace(/[^\d+]/g, '').slice(0, 32),
      source: payload.source || 'landing_ebook',
      ...(payload.dogName ? { dogName: payload.dogName.trim().slice(0, 80) } : {}),
      ...(payload.quizProfile ? { quizProfile: payload.quizProfile.trim().slice(0, 80) } : {}),
      emailPermission: payload.emailPermission === true,
      whatsappPermission: payload.whatsappPermission === true,
      // Versão do documento vigente no momento do aceite: sem isso não dá para
      // saber com o que a pessoa concordou quando o texto mudar.
      privacidadeVersao: LEGAL_VERSIONS.privacidade,
      status: 'new',
      page: window.location.pathname,
      userAgent: window.navigator.userAgent.slice(0, 160),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
