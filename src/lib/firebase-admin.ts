import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // 1. Tenta pegar a versão blindada (Base64) - Melhor para Produção
    let privateKey = '';
    const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;

    if (b64Key) {
      console.log('FIREBASE: Using B64 encoded private key');
      privateKey = Buffer.from(b64Key, 'base64').toString('utf-8');
    } else {
      // Fallback para a versão padrão
      let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
      rawKey = rawKey.trim().replace(/^["']|["']$/g, '');
      privateKey = rawKey.replace(/\\n/g, '\n');
    }

    console.log('FIREBASE: Project:', projectId);
    console.log('FIREBASE: Key Length:', privateKey.length);
    console.log('FIREBASE: Ready for Auth?', privateKey.includes('BEGIN PRIVATE KEY'));

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
