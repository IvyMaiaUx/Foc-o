import { auth } from './firebase';
import { apiUrl } from './apiBase';
import { LEGAL_VERSIONS } from '../config/legal';

/**
 * Aceite dos documentos legais.
 *
 * A gravação passa pela API porque o IP precisa ser resolvido no servidor — o
 * que o navegador manda é forjável e não teria valor como prova.
 */

export type AceiteOrigem = 'cadastro' | 'nova_versao';

export type AceiteAtual = {
  termos_versao?: string;
  privacidade_versao?: string;
  cookies_versao?: string;
  aceito_em?: number;
};

export async function registrarAceite(origem: AceiteOrigem): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sem usuário autenticado para registrar o aceite.');

  const token = await user.getIdToken();
  const response = await fetch(apiUrl('/api/registrar-aceite'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origem,
      // Três campos separados: no dia em que só a Política mudar, o histórico
      // continua respondendo "qual versão dos Termos essa pessoa aceitou?".
      termos_versao: LEGAL_VERSIONS.termos,
      privacidade_versao: LEGAL_VERSIONS.privacidade,
      cookies_versao: LEGAL_VERSIONS.cookies,
    }),
  });

  if (!response.ok) {
    throw new Error('Não foi possível registrar o aceite.');
  }
}

/** True quando o aceite guardado é de uma versão anterior à vigente. */
export function precisaAceitarNovamente(aceite: AceiteAtual | null | undefined): boolean {
  if (!aceite?.aceito_em) return true;
  return (
    aceite.termos_versao !== LEGAL_VERSIONS.termos ||
    aceite.privacidade_versao !== LEGAL_VERSIONS.privacidade ||
    aceite.cookies_versao !== LEGAL_VERSIONS.cookies
  );
}

/** Quais documentos mudaram desde o último aceite — usado no texto do modal. */
export function documentosDesatualizados(aceite: AceiteAtual | null | undefined): string[] {
  const mudou: string[] = [];
  if (aceite?.termos_versao !== LEGAL_VERSIONS.termos) mudou.push('Termos de Uso');
  if (aceite?.privacidade_versao !== LEGAL_VERSIONS.privacidade) mudou.push('Política de Privacidade');
  if (aceite?.cookies_versao !== LEGAL_VERSIONS.cookies) mudou.push('Política de Cookies');
  return mudou;
}

/**
 * Rotas onde o modal de aceite NÃO pode aparecer.
 *
 * O modal manda ler os documentos e linka para eles — mas os links abrem em outra
 * aba do próprio app, com a mesma sessão, e o modal reaparecia por cima. Resultado:
 * para ler os Termos era preciso aceitar os Termos antes.
 *
 * Isso não é só incômodo. Aceite de documento que a pessoa foi impedida de ler não
 * vale como consentimento informado — o registro que guardamos como prova ficaria
 * provando o contrário do que pretende.
 *
 * Liberar estas rotas não afrouxa o bloqueio: todo o resto do app segue barrado
 * até aceitar.
 */
const ROTAS_LEGAIS = ['/termos', '/privacidade', '/cookies'];

export function ehRotaLegal(pathname: string): boolean {
  const limpo = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  return ROTAS_LEGAIS.includes(limpo);
}

