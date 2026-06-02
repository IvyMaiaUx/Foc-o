import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

let serviceAccount;
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-ececf2d5-e671-43f3-8f2c-ce258672a8e7';

try {
  if (serviceAccountRaw) {
    if (serviceAccountRaw.trim().startsWith('{')) {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } else {
      const filePath = path.resolve(serviceAccountRaw);
      serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } else {
    const possiblePaths = [
      path.resolve(__dirname, '../serviceAccountKey.json'),
      path.resolve(__dirname, './serviceAccountKey.json'),
      'C:/Users/Gabri/Downloads/gen-lang-client-0545403021-firebase-adminsdk-fbsvc-b500833d95.json'
    ];
    let foundPath = possiblePaths.find(p => fs.existsSync(p));
    if (foundPath) {
      console.log(`🔍 Carregando credenciais do arquivo: ${foundPath}`);
      serviceAccount = JSON.parse(fs.readFileSync(foundPath, 'utf8'));
    } else {
      console.error('❌ ERRO: Credenciais do Firebase não configuradas (FIREBASE_SERVICE_ACCOUNT_JSON não definida e arquivo de credenciais não encontrado)');
      process.exit(1);
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('❌ Falha ao inicializar o Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = getFirestore(admin.app(), databaseId);

async function syncClaims() {
  console.log(`\n🔍 Lendo membros configurados na base de dados (Database ID: ${databaseId})...`);
  
  try {
    // We get the Firestore doc from adminSettings/auth
    // Note: in Firebase Admin SDK, we might need to specify the databaseId manually if not using the default database.
    // The default SDK firestore instance connects to the configured database.
    const authDoc = await db.collection('adminSettings').doc('auth').get();
    
    if (!authDoc.exists) {
      console.warn('⚠️ Documento adminSettings/auth não encontrado. Nenhuma permissão configurada.');
      return;
    }
    
    const data = authDoc.data();
    console.log('Document data:', JSON.stringify(data, null, 2));
    
    const emailToClaims = new Map();
    
    // 1. Process authorizedEmails
    const authorizedEmails = data.authorizedEmails || [];
    for (const email of authorizedEmails) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (normalizedEmail) {
        emailToClaims.set(normalizedEmail, { admin: true, superAdmin: false });
      }
    }
    
    // 2. Process superAdminEmails (overriding if present)
    const superAdminEmails = data.superAdminEmails || [];
    for (const email of superAdminEmails) {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      if (normalizedEmail) {
        emailToClaims.set(normalizedEmail, { admin: true, superAdmin: true });
      }
    }
    
    // 3. Process members list
    const members = data.members || [];
    for (const member of members) {
      const normalizedEmail = String(member.email || '').trim().toLowerCase();
      const role = member.role;
      if (normalizedEmail) {
        emailToClaims.set(normalizedEmail, {
          admin: true,
          superAdmin: role === 'Super Admin' || (emailToClaims.get(normalizedEmail)?.superAdmin || false)
        });
      }
    }
    
    console.log(`📋 Encontrados ${emailToClaims.size} e-mails únicos de administradores.`);
    
    for (const [email, claims] of emailToClaims.entries()) {
      try {
        console.log(`\n👤 Processando: ${email}...`);
        const user = await admin.auth().getUserByEmail(email);
        
        // Set custom user claims
        await admin.auth().setCustomUserClaims(user.uid, claims);
        
        console.log(`   ✅ Claims atualizados com sucesso para UID: ${user.uid}`);
        console.log(`   ⚙️ Claims aplicados:`, claims);
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          console.warn(`   ⚠️ Usuário com e-mail ${email} ainda não está cadastrado no Firebase Auth. Pulando...`);
        } else {
          console.error(`   ❌ Erro ao atualizar claims para ${email}:`, authError.message);
        }
      }
    }
    
    console.log('\n✨ Sincronização concluída com sucesso!');
  } catch (error) {
    console.error('❌ Falha na sincronização dos claims:', error);
  }
}

syncClaims();
