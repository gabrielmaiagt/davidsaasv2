require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

async function testConnection() {
  console.log('--- Diagnóstico Firebase Admin ---');
  console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
  
  const pk = process.env.FIREBASE_PRIVATE_KEY;
  if (!pk) {
    console.error('❌ ERRO: FIREBASE_PRIVATE_KEY está ausente no .env.local');
    return;
  }

  try {
    const formattedPk = pk.replace(/\\n/g, '\n');
    console.log('Chave Privada detectada. Tamanho:', formattedPk.length);

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formattedPk,
        }),
      });
    }

    const db = admin.firestore();
    const snap = await db.collection('campaigns').limit(1).get();
    console.log('✅ SUCESSO: Conexão com Firestore estabelecida!');
    console.log('Documentos encontrados na coleção campaigns:', snap.size);
  } catch (error) {
    console.error('❌ ERRO NA CONEXÃO:');
    console.error(error.message);
    if (error.message.includes('PEM')) {
      console.error('DICA: O formato da chave privada está inválido (problema nos \n).');
    }
  }
}

testConnection();
