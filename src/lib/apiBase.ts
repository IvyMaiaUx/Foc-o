// O site é servido pelo Firebase Hosting e a API roda na Vercel, em OUTRO domínio.
// Se a base ficar vazia, as chamadas viram relativas (`/api/...`) e o Hosting responde o
// catch-all `app.html` com HTTP 200 e content-type text/html: o `response.ok` fica true, o
// app engole HTML achando que é JSON e a tela mostra sucesso sem nada ter acontecido.
// Foi exatamente assim que o pedido de cancelamento passou muito tempo "registrando"
// solicitações que nunca chegaram no backend (a coleção `cancellations` nunca existiu).
//
// Por isso o fallback aqui NÃO é caminho relativo: fora do localhost, é o domínio da API.
const PRODUCTION_API_BASE = 'https://app.focaoapp.com.br';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function baseFromClaimUrl(claimUrl: string) {
  // Compatibilidade com a variável antiga, que guardava a URL inteira do claim-premium.
  return claimUrl.includes('/api/') ? claimUrl.substring(0, claimUrl.indexOf('/api/')) : '';
}

/**
 * Ordem: VITE_API_BASE_URL → base derivada da VITE_PREMIUM_CLAIM_API_URL (legado) →
 * localhost usa caminho relativo (onde `vercel dev` atende no mesmo host) → produção.
 */
export function resolveApiBase(
  env: Record<string, string | undefined> = import.meta.env as any,
  hostname: string = typeof window !== 'undefined' ? window.location.hostname : '',
): string {
  const explicit = (env.VITE_API_BASE_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const legacy = baseFromClaimUrl(env.VITE_PREMIUM_CLAIM_API_URL || '');
  if (legacy) return legacy.replace(/\/+$/, '');

  return LOCAL_HOSTS.has(hostname) ? '' : PRODUCTION_API_BASE;
}

export function apiUrl(path: string, override?: string): string {
  if (override) return override;
  const base = resolveApiBase();
  return base ? `${base}${path}` : path;
}

/**
 * Lê a resposta como JSON e falha alto quando não é JSON — sem isso, um HTML 200 vindo do
 * Hosting passaria por resposta válida.
 */
export async function readJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Resposta inesperada do servidor. Tente de novo em instantes.');
  }
  return (await response.json()) as T;
}
