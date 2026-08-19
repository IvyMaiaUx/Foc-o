import { auth } from '@/src/lib/firebase';
import { apiUrl, readJson } from '@/src/lib/apiBase';
import type { BillingCharge, RefundEventView, RefundRequestView, RefundStatus } from '@/src/types';

const CHARGES_URL = apiUrl('/api/billing-charges', import.meta.env.VITE_BILLING_CHARGES_API_URL);
const REFUND_URL = apiUrl('/api/refund-request', import.meta.env.VITE_REFUND_REQUEST_API_URL);

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  requested: 'Solicitação recebida',
  under_review: 'Em análise',
  needs_information: 'Precisamos de mais informações',
  approved: 'Reembolso aprovado',
  processing: 'Estorno em processamento',
  refunded: 'Reembolso concluído',
  rejected: 'Solicitação não aprovada',
  canceled: 'Solicitação cancelada',
  failed: 'Falha no processamento',
};

// O que o usuário precisa fazer (ou esperar) em cada estado. Vazio = nada da parte dele.
export const REFUND_NEXT_STEP: Record<RefundStatus, string> = {
  requested: 'Sua solicitação entrou na fila. Nossa equipe analisa em até 5 dias úteis.',
  under_review: 'Estamos analisando. Você recebe um e-mail assim que houver decisão.',
  needs_information: 'Precisamos da sua resposta pra continuar. Fale com a gente pelo suporte do app.',
  approved: 'Aprovado. Estamos enviando o estorno ao seu meio de pagamento.',
  processing: 'O estorno foi enviado. O prazo de crédito depende do banco emissor do cartão.',
  refunded: 'Reembolso concluído. O valor volta pela mesma forma de pagamento da compra.',
  rejected: 'A solicitação foi analisada e não foi aprovada. O motivo está aqui embaixo.',
  canceled: 'Você cancelou esta solicitação. Se precisar, dá pra abrir uma nova.',
  failed: 'Tivemos um problema ao processar o estorno. Nossa equipe já foi avisada e retoma o caso.',
};

export const REFUND_TIMELINE_ORDER: RefundStatus[] = [
  'requested',
  'under_review',
  'approved',
  'processing',
  'refunded',
];

export function formatCurrency(amountInCents: number, currency = 'brl') {
  return (amountInCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
}

async function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sessão expirada. Entre de novo pra continuar.');

  const token = await currentUser.getIdToken();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  // readJson recusa resposta que não seja JSON: um HTML 200 (o app.html do Hosting, quando
  // a URL da API está errada) não pode passar por sucesso.
  const data = await readJson<any>(response).catch((error) => {
    if (response.ok) throw error;
    return {};
  });
  if (!response.ok) {
    throw new Error(data?.error || 'Não conseguimos concluir a operação. Tente de novo.');
  }
  return data as T;
}

/**
 * Toda leitura de reembolso passa pela API: o doc no Firestore guarda campo interno
 * (quem decidiu, id na Stripe, erro técnico) e o cliente não tem permissão de lê-lo.
 */
export class RefundRepository {
  static async getCharges(): Promise<{
    charges: BillingCharge[];
    reasons: Record<string, string>;
    refundWindowDays: number;
  }> {
    return post(CHARGES_URL, {});
  }

  static async createRequest(input: { chargeId: string; reason: string; description?: string }) {
    return post<{ protocol: string; status: RefundStatus; amount: number; currency: string; createdAt: number }>(
      REFUND_URL,
      { action: 'create', ...input },
    );
  }

  static async getRequest(protocol: string): Promise<{ request: RefundRequestView; events: RefundEventView[] }> {
    return post(REFUND_URL, { action: 'get', protocol });
  }

  static async listRequests(): Promise<{ requests: RefundRequestView[] }> {
    return post(REFUND_URL, { action: 'list' });
  }

  static async cancelRequest(protocol: string) {
    return post<{ protocol: string; status: RefundStatus }>(REFUND_URL, { action: 'cancel', protocol });
  }
}
