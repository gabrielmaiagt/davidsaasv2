import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Normalização robusta da chave privada
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Remove aspas duplas/simples envolventes
    rawKey = rawKey.trim().replace(/^["']|["']$/g, '');
    
    // Converte sequências literais '\n' em quebradas de linha REAIS
    // E remove possíveis \r que quebram no Linux/Firebase
    const privateKey = rawKey.replace(/\\n/g, '\n').replace(/\r/g, '');

    console.log('FIREBASE: Initializing for Project:', projectId);
    console.log('FIREBASE: Key starts with BEGIN?', privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
    console.log('FIREBASE: Key ends with END?', privateKey.trim().endsWith('-----END PRIVATE KEY-----'));

    if (projectId && clientEmail && privateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('FIREBASE: Attempting credential.cert initialization...');
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      console.warn('FIREBASE: Missing credentials or malformed key. Access will fail.');
      return admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
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
