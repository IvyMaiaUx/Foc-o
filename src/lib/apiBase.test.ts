import { describe, it, expect } from 'vitest';
import { readJson, resolveApiBase } from './apiBase';

function makeResponse(contentType: string, body: unknown) {
  return {
    headers: { get: () => contentType },
    json: async () => body,
  } as unknown as Response;
}

describe('resolveApiBase', () => {
  it('usa VITE_API_BASE_URL quando existe, sem barra sobrando', () => {
    expect(resolveApiBase({ VITE_API_BASE_URL: 'https://api.exemplo.com/' }, 'focaoapp.com.br'))
      .toBe('https://api.exemplo.com');
  });

  it('deriva a base da variável antiga do claim-premium', () => {
    expect(resolveApiBase(
      { VITE_PREMIUM_CLAIM_API_URL: 'https://app.focaoapp.com.br/api/claim-premium' },
      'focaoapp.com.br',
    )).toBe('https://app.focaoapp.com.br');
  });

  it('sem env em produção, aponta para a API — nunca para caminho relativo', () => {
    // Caminho relativo faria o Firebase Hosting responder o app.html com HTTP 200, e o app
    // trataria HTML como sucesso. Foi esse o bug do fluxo de cancelamento.
    expect(resolveApiBase({}, 'focaoapp.com.br')).toBe('https://app.focaoapp.com.br');
    expect(resolveApiBase({}, 'focao.web.app')).toBe('https://app.focaoapp.com.br');
  });

  it('em localhost mantém caminho relativo, pra funcionar com vercel dev', () => {
    expect(resolveApiBase({}, 'localhost')).toBe('');
    expect(resolveApiBase({}, '127.0.0.1')).toBe('');
  });
});

describe('readJson', () => {
  it('devolve o corpo quando é JSON', async () => {
    await expect(readJson(makeResponse('application/json; charset=utf-8', { ok: true })))
      .resolves.toEqual({ ok: true });
  });

  it('recusa HTML mesmo com status 200', async () => {
    await expect(readJson(makeResponse('text/html; charset=utf-8', null)))
      .rejects.toThrow('Resposta inesperada do servidor');
  });
});
