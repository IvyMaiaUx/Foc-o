import { getDb } from './_firebase.js';

// Último IP de uma lista "a, b, c" (o penúltimo hop é quem o proxy da Vercel realmente viu).
function lastIp(headerValue) {
  const parts = String(headerValue || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parts[parts.length - 1] || '';
}

// IP do cliente. O primeiro valor de X-Forwarded-For vem do próprio cliente e pode ser
// forjado (o cliente manda "X-Forwarded-For: 1.2.3.4" e a Vercel só ANEXA o IP real no
// final da lista) — usar o primeiro permitiria burlar o rate limit trocando de "IP" a
// cada request. x-vercel-forwarded-for é preenchido pela própria Vercel e é confiável;
// como fallback, pega o ÚLTIMO valor do X-Forwarded-For em vez do primeiro.
export function clientIp(req) {
  return (
    lastIp(req.headers['x-vercel-forwarded-for']) ||
    lastIp(req.headers['x-forwarded-for']) ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Rate-limit por IP em janelas fixas, usando Firestore (Admin SDK, coleção `rateLimits`
 * que é server-only pelas regras). Retorna true se DENTRO do limite (pode seguir),
 * false se estourou. Falha de infra → não bloqueia (não derruba o serviço).
 * Dica: configure TTL no campo `expiresAt` no console do Firestore pra limpar os docs.
 */
export async function withinRateLimit(bucket, ip, max, windowMs) {
  if (!ip || ip === 'unknown') return true;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const id = `${bucket}_${Buffer.from(String(ip)).toString('base64url')}_${windowStart}`;
  const ref = getDb().collection('rateLimits').doc(id);
  try {
    const count = await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const next = (snap.exists ? (snap.data().count || 0) : 0) + 1;
      tx.set(
        ref,
        { bucket, count: next, windowStart, expiresAt: new Date(windowStart + windowMs), updatedAt: Date.now() },
        { merge: true },
      );
      return next;
    });
    return count <= max;
  } catch {
    return true;
  }
}
