import { admin, getDb } from './_firebase.js';
import { checkAndProcessReferral } from './_referralHelper.js';

// Esse endpoint nunca existiu (404 em produção) — src/services/UserProfileService.ts
// chama ele como reparo quando a leitura do perfil de um usuário JÁ AUTENTICADO
// volta vazia (falha transitória de rede/cache, não conta nova). Sem ele, esse
// reparo sempre falhava e podia deixar o app achando que o usuário não tem perfil,
// mesmo tendo — ver Home.tsx/AuthContext.tsx pro guard que consome isso.
//
// Idempotente de propósito: se o doc já existe, retorna 409 (sucesso do ponto de
// vista do chamador, ver UserProfileService.ensureProfile) e NUNCA sobrescreve
// um perfil existente.
//
// Esse arquivo também atende /api/process-referral (via rewrite em vercel.json) —
// esse endpoint também nunca existiu (mesmo sintoma: 404 lido como erro de CORS
// pelo navegador, ver Checkin.tsx/Analyzing.tsx/Register.tsx). Juntamos os dois
// no mesmo arquivo pra não estourar o limite de 12 funções serverless do plano
// (adicionar um api/process-referral.js separado fazia o deploy inteiro falhar
// silenciosamente, sem erro nenhum no log de build).

function setCors(req, res) {
  const allowedOrigins = new Set([
    'https://focao.web.app',
    'https://app.focaoapp.com.br',
    'https://focao-beta.web.app',
    'https://focaoadm.web.app',
    'https://foc-o.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ]);
  const origin = req.headers.origin || '';
  if (allowedOrigins.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

async function verifyUser(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
}

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `FOC-${code}`;
}

async function generateUniqueReferralCode(db) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    try {
      const existing = await db.collection('users').where('referralCode', '==', code).limit(1).get();
      if (existing.empty) return code;
    } catch {
      return code;
    }
  }
  return `${generateReferralCode()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

export default async function createUserProfile(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const decoded = await verifyUser(req);
  if (!decoded?.uid) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  // Chegou via /api/process-referral (rewrite em vercel.json manda pra cá com
  // ?mode=referral) — chamador é sempre o "amigo" que acabou de se registrar,
  // concluir onboarding ou fazer check-in; checkAndProcessReferral olha o
  // referredBy do próprio perfil dele pra achar quem indicou.
  if (req.query?.mode === 'referral') {
    try {
      const db = getDb();
      const result = await checkAndProcessReferral(db, decoded.uid);
      res.status(200).json({ ok: true, result });
    } catch (error) {
      console.error('[process-referral] failed', error);
      res.status(500).json({ error: 'Internal error' });
    }
    return;
  }

  try {
    const db = getDb();
    const userRef = db.collection('users').doc(decoded.uid);
    const existing = await userRef.get();

    if (existing.exists) {
      // Já existe — não é erro do chamador, é o caso "normal" que UserProfileService
      // trata como sucesso (idempotência). NUNCA sobrescreve o que já está lá.
      res.status(409).json({ created: false, reason: 'already_exists' });
      return;
    }

    const name = String(req.body?.name || decoded.email?.split('@')[0] || 'Tutor').trim().slice(0, 80);
    const referredBy = req.body?.referredBy ? String(req.body.referredBy).slice(0, 40) : null;
    const now = Date.now();
    const referralCode = await generateUniqueReferralCode(db);

    await userRef.set({
      uid: decoded.uid,
      email: (decoded.email || '').toLowerCase(),
      name,
      subscription: {
        plan: 'free',
        status: 'inactive',
        premiumAccess: false,
        createdAt: now,
        updatedAt: now,
      },
      subscriptionTier: 'free',
      onboardingComplete: false,
      referralCode,
      referredBy,
      referralRewardsDays: 0,
      validReferrals: 0,
      referralsLimitReached: false,
      premiumBonusDays: 0,
      lastSeenAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });

    res.status(200).json({ created: true });
  } catch (error) {
    console.error('[create-user-profile] failed', error);
    res.status(500).json({ error: 'Internal error' });
  }
}
