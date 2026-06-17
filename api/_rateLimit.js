import { getDb } from './_firebase.js';

// IP do cliente (primeiro do X-Forwarded-For). 'unknown' quando não dá pra confiar.
export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'] || '';
  const first = String(xff).split(',')[0].trim();
  return first || req.socket?.remoteAddress || 'unknown';
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
