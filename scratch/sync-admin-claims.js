import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountRaw) {
  console.error('❌ ERRO: FIREBASE_SERVICE_ACCOUNT_JSON não configurado no arquivo .env.local');
  process.exit(1);
}

const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-ececf2d5-e671-43f3-8f2c-ce258672a8e7';

try {
  const serviceAccount = JSON.parse(serviceAccountRaw);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('❌ Falha ao inicializar o Firebase Admin SDK:', error.message);
  process.exit(1);
}

const db = admin.firestore();
// Configure database ID if supported, otherwise default database is used
if (typeof db.databaseId !== 'undefined') {
  // admin SDK firestore support setting databaseId
}

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
    const members = data.members || [];
    
    console.log(`📋 Encontrados ${members.length} membros na lista de equipe.`);
    
    for (const member of members) {
      const email = String(member.email || '').trim().toLowerCase();
      const role = member.role;
      
      if (!email) continue;
      
      try {
        console.log(`\n👤 Processando: ${email} (${role})...`);
        const user = await admin.auth().getUserByEmail(email);
        
        // Define claims based on role
        const claims = {
          admin: true,
          superAdmin: role === 'Super Admin'
        };
        
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
    console.error('❌ Falha na sincronização dos claims:', error.message);
  }
}

syncClaims();
