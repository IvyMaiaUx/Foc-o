import { describe, it, expect } from 'vitest';
import { ehRotaLegal } from './aceiteLegal';

/**
 * Estes casos existem por um bug real: o modal de aceite cobria as próprias
 * páginas que ele mandava ler. Para ler os Termos era preciso aceitar os Termos.
 *
 * O teste anterior não pegou porque só exercitou as rotas públicas DESLOGADO —
 * e deslogado o modal nem pode aparecer. O caso que quebrava é justamente o
 * outro: logado e sem aceite.
 */
describe('ehRotaLegal', () => {
  it('libera as três páginas de documento', () => {
    expect(ehRotaLegal('/termos')).toBe(true);
    expect(ehRotaLegal('/privacidade')).toBe(true);
    expect(ehRotaLegal('/cookies')).toBe(true);
  });

  it('ignora barra no fim e maiúsculas', () => {
    expect(ehRotaLegal('/termos/')).toBe(true);
    expect(ehRotaLegal('/Termos')).toBe(true);
    expect(ehRotaLegal('/PRIVACIDADE/')).toBe(true);
  });

  it('NÃO libera o resto do app — o bloqueio continua valendo', () => {
    for (const rota of ['/inicio', '/perfil', '/assinatura', '/treino', '/', '/welcome']) {
      expect(ehRotaLegal(rota), rota).toBe(false);
    }
  });

  it('não cai em rota que apenas comece igual', () => {
    expect(ehRotaLegal('/termos-de-uso-antigo')).toBe(false);
    expect(ehRotaLegal('/cookies/preferencias')).toBe(false);
  });
});
