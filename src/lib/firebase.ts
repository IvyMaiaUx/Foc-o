import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json'; // using relative from src/lib

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  {
    // Ignora campos `undefined` em vez de lançar erro (footgun comum do Firestore):
    // evita que um campo ausente trave gravações como a do onboarding.
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  },
  firebaseConfig.firestoreDatabaseId
);

export const storage = getStorage(app);

/**
 * App Check: prova que a requisição veio DESTE app, e não de um script qualquer
 * apontando pro mesmo banco.
 *
 * É o que mais se aproxima de um captcha aqui, e cobre de uma vez o que o rate
 * limit da API não alcança: login e cadastro vão direto do navegador pro Firebase
 * Auth, sem passar por endpoint nosso, então não há onde pendurar limite.
 *
 * Inerte enquanto `VITE_APPCHECK_SITE_KEY` não existir. É de propósito: o código
 * pode subir antes do registro no console, e sem chave ele simplesmente não liga,
 * em vez de quebrar o app inteiro de quem já está usando.
 *
 * ATENÇÃO ao ligar a APLICAÇÃO (enforcement) no console: enquanto o parque de
 * navegadores não estiver rodando esta versão, exigir o token derruba quem está
 * numa versão antiga em cache. O caminho é subir isto, olhar as métricas de
 * "requisições verificadas" por alguns dias e só então exigir.
 */
const APPCHECK_SITE_KEY = (import.meta.env.VITE_APPCHECK_SITE_KEY || '').trim();

if (APPCHECK_SITE_KEY) {
  // Em desenvolvimento o navegador não passa no reCAPTCHA: o token de depuração
  // é registrado no console e vale só pra máquina de quem desenvolve.
  if (import.meta.env.DEV) {
    (self as unknown as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (erro) {
    // Falha aqui não pode derrubar o app: sem App Check ele continua funcionando
    // como funcionava antes, só sem a camada extra.
    console.error('[AppCheck] não inicializou', erro);
  }
}
