import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LeadCaptureError, LeadRepository } from './LeadRepository';

function response(status: number, contentType: string, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => contentType },
    json: async () => body,
  } as unknown as Response;
}

const lead = { name: '  Ana Paula ', email: ' ANA@Exemplo.com ', emailPermission: true };

describe('LeadRepository.createMarketingLead', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { pathname: '/ebook-fim-da-culpa', hostname: 'focaoapp.com.br' } });
    vi.stubGlobal('document', { referrer: '' });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('grava pela API e manda só campos que o servidor aceita', async () => {
    const fetchMock = vi.fn(async () => response(200, 'application/json', { ok: true, id: 'x' }));
    await LeadRepository.createMarketingLead(lead, fetchMock as unknown as typeof fetch);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://app.focaoapp.com.br/api/webhook?type=marketing_lead');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      name: 'Ana Paula',
      email: 'ana@exemplo.com',
      source: 'landing_ebook',
      emailPermission: true,
      page: '/ebook-fim-da-culpa',
    });
    expect(body.privacidadeVersao).toBeTruthy();
    // O opt-in de WhatsApp saiu do formulário: não pode voltar a ir no payload.
    expect(body).not.toHaveProperty('whatsappPermission');
  });

  it.each([
    [400, 'invalid'],
    [429, 'rate_limited'],
    [500, 'unavailable'],
  ])('status %i vira motivo %s, sem expor a resposta', async (status, reason) => {
    const fetchMock = vi.fn(async () => response(status, 'application/json', { error: 'detalhe interno' }));
    await expect(LeadRepository.createMarketingLead(lead, fetchMock as unknown as typeof fetch))
      .rejects.toEqual(new LeadCaptureError(reason as 'invalid'));
  });

  it('HTML com 200 não conta como lead gravado', async () => {
    const fetchMock = vi.fn(async () => response(200, 'text/html', null));
    await expect(LeadRepository.createMarketingLead(lead, fetchMock as unknown as typeof fetch))
      .rejects.toMatchObject({ reason: 'unavailable' });
  });

  it('falha de rede vira indisponível', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(LeadRepository.createMarketingLead(lead, fetchMock as unknown as typeof fetch))
      .rejects.toMatchObject({ reason: 'unavailable' });
  });
});
