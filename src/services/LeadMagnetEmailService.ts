import { readJson } from '../lib/apiBase';

const LEAD_MAGNET_ENDPOINT = import.meta.env.VITE_LEAD_MAGNET_API_URL || 'https://app.focaoapp.com.br/api/send-lead-magnet';

export type LeadMagnetDelivery = { ok: true; status: 'sent' | 'cooldown' };

export async function sendFimDaCulpaEmail(input: { name: string; email: string; consent: boolean }) {
  const response = await fetch(LEAD_MAGNET_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`lead_magnet_delivery_failed:${response.status}`);
  // Sem isto, um HTML 200 (catch-all do Hosting) passaria por "e-mail enviado".
  const body = await readJson<Partial<LeadMagnetDelivery>>(response);
  if (body.ok !== true) throw new Error('lead_magnet_delivery_failed:unexpected_body');
  return body as LeadMagnetDelivery;
}
