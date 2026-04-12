import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Reconstrução RÍGIDA do envelope PEM para evitar erros de DECODER
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // 1. Limpeza total de aspas e espaços
    rawKey = rawKey.trim().replace(/^["']|["']$/g, '');
    
    // 2. Extrai apenas o conteúdo Base64 (remove cabeçalhos e quebras de linha se existirem)
    let body = rawKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\\n/g, '')
      .replace(/\s/g, '');

    // 3. Reconstrói o envelope PEM com quebras de linha a cada 64 caracteres (Padrão RFC 7468)
    const matches = body.match(/.{1,64}/g);
    const formattedBody = matches ? matches.join('\n') : body;
    const privateKey = `-----BEGIN PRIVATE KEY-----\n${formattedBody}\n-----END PRIVATE KEY-----`;

    console.log('FIREBASE: Project:', projectId);
    console.log('FIREBASE: Key Length (final):', privateKey.length);
    console.log('FIREBASE: Key Sample:', privateKey.substring(0, 35) + '...');

    // Fallback inteligente para o nome do bucket se a variável estiver faltando
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : undefined);

    if (projectId && clientEmail && privateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('FIREBASE: Attempting credential.cert initialization...');
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      });
    } else {
      console.warn('FIREBASE: Missing credentials or malformed key. Access will fail.');
      return admin.initializeApp({
        storageBucket,
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    return null;
  }
}

// Singleton pattern for Next.js hot-reloading
const globalForAdmin = globalThis as unknown as {
  firebaseAdminApp: admin.app.App | undefined;
};

const app = globalForAdmin.firebaseAdminApp ?? getAdminApp();

if (process.env.NODE_ENV !== 'production') {
  globalForAdmin.firebaseAdminApp = app || undefined;
}

// Export safe accessors
export const db = app ? admin.firestore(app) : null as any;
export const storage = app ? admin.storage(app) : null as any;
export const auth = app ? admin.auth(app) : null as any;
export const adminApp = app;
