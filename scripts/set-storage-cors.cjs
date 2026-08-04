// Script único para liberar CORS no bucket do Firebase Storage,
// necessário para o navegador subir arquivos direto via Signed URL
// (contorna o limite de 4.5MB de request body da Vercel).
//
// Uso: node scripts/set-storage-cors.cjs

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();

let privateKey = '';
const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (b64Key) {
  privateKey = Buffer.from(b64Key.trim(), 'base64').toString('utf-8');
} else if (rawKey) {
  privateKey = rawKey;
}
privateKey = privateKey
  .trim()
  .replace(/^["']|["']$/g, '')
  .replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey.includes('BEGIN PRIVATE KEY')) {
  console.error('Credenciais do Firebase Admin ausentes ou inválidas em .env.local');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  storageBucket,
});

const ORIGINS = [
  'https://davidsaasv2-tu24.vercel.app',
  'http://localhost:3000',
];

async function main() {
  const bucket = admin.storage().bucket();
  await bucket.setMetadata({
    cors: [
      {
        origin: ORIGINS,
        method: ['PUT', 'GET', 'HEAD'],
        responseHeader: ['Content-Type'],
        maxAgeSeconds: 3600,
      },
    ],
  });
  console.log('CORS configurado com sucesso para:', ORIGINS.join(', '));
}

main().catch((err) => {
  console.error('Falha ao configurar CORS:', err);
  process.exit(1);
});
