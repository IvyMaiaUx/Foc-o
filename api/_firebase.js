import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.');
  return JSON.parse(raw);
}

export function getAdminApp() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
}

// Auto-initialize default app if configuration is available,
// to avoid "default app does not exist" errors in serverless entrypoints
try {
  getAdminApp();
} catch (e) {
  console.warn('[Firebase Admin] Auto-initialization skipped or failed:', e.message);
}

export function getDb() {
  const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-ececf2d5-e671-43f3-8f2c-ce258672a8e7';
  return getFirestore(getAdminApp(), databaseId);
}

export function emailKey(email) {
  return Buffer.from(String(email || '').trim().toLowerCase()).toString('base64url');
}

export { admin };
