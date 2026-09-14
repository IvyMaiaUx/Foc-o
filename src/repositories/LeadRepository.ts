import { apiUrl, readJson } from '../lib/apiBase';
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
};

/**
 * Motivo da falha, sem detalhe técnico: a tela escolhe o texto a partir disto e nunca
 * mostra a resposta crua do servidor.
 */
export type LeadCaptureFailure = 'invalid' | 'rate_limited' | 'unavailable';

export class LeadCaptureError extends Error {
  constructor(public readonly reason: LeadCaptureFailure) {
    super(`lead_capture_failed:${reason}`);
    this.name = 'LeadCaptureError';
  }
}

const TIMEOUT_MS = 15_000;

/**
 * Por que o lead passa pela API, e não mais por `addDoc` direto do navegador:
 * a regra `isValidMarketingLeadCreate` usa `hasOnly([...])`, e em 02/09/2026 o formulário
 * passou a gravar `whatsappPermission` e `privacidadeVersao`, que a regra não lista. Toda
 * gravação virou PERMISSION_DENIED — na LP de e-book e na presell — e a tela mostrava só
 * "Não foi possível enviar agora". O `/api/webhook?type=marketing_lead` grava com Admin SDK,
 * valida o e-mail, limita por IP e já aceita `privacidadeVersao`, então o registro da versão
 * da política aceita continua existindo sem depender de a regra acompanhar o payload.
 */
export class LeadRepository {
  static async createMarketingLead(payload: LeadPayload, fetchImpl: typeof fetch = fetch): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetchImpl(apiUrl('/api/webhook?type=marketing_lead'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          type: 'marketing_lead',
          name: payload.name.trim().slice(0, 80),
          email: payload.email.trim().toLowerCase().slice(0, 120),
          whatsapp: (payload.whatsapp || '').replace(/[^\d+]/g, '').slice(0, 32),
          source: payload.source || 'landing_ebook',
          ...(payload.dogName ? { dogName: payload.dogName.trim().slice(0, 80) } : {}),
          ...(payload.quizProfile ? { quizProfile: payload.quizProfile.trim().slice(0, 80) } : {}),
          emailPermission: payload.emailPermission === true,
          // Versão do documento vigente no momento do aceite: sem isso não dá para
          // saber com o que a pessoa concordou quando o texto mudar.
          privacidadeVersao: LEGAL_VERSIONS.privacidade,
          page: window.location.pathname,
          referrer: document.referrer,
        }),
      });
    } catch {
      throw new LeadCaptureError('unavailable');
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 400) throw new LeadCaptureError('invalid');
    if (response.status === 429) throw new LeadCaptureError('rate_limited');
    if (!response.ok) throw new LeadCaptureError('unavailable');

    // 200 que não é JSON, ou JSON sem `ok`, não é gravação confirmada.
    const body = await readJson<{ ok?: boolean }>(response).catch(() => null);
    if (body?.ok !== true) throw new LeadCaptureError('unavailable');
  }
}
