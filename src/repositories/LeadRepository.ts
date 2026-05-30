import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type LeadPayload = {
  name: string;
  email: string;
  whatsapp: string;
};

export class LeadRepository {
  static async createMarketingLead(payload: LeadPayload): Promise<void> {
    await addDoc(collection(db, 'marketingLeads'), {
      name: payload.name.trim().slice(0, 80),
      email: payload.email.trim().toLowerCase().slice(0, 120),
      whatsapp: payload.whatsapp.replace(/[^\d+]/g, '').slice(0, 32),
      source: 'landing_ebook',
      status: 'new',
      page: window.location.pathname,
      userAgent: window.navigator.userAgent.slice(0, 160),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
