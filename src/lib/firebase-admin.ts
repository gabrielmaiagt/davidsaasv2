import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    // Limpeza de campos básicos (previne espaços invisíveis no console)
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || (projectId ? `${projectId}.firebasestorage.app` : undefined);
    
    let privateKey = '';
    const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (b64Key) {
      console.log('FIREBASE: Using B64 encoded private key');
      privateKey = Buffer.from(b64Key.trim(), 'base64').toString('utf-8');
    } else if (rawKey) {
      console.log('FIREBASE: Using RAW private key from environment');
      privateKey = rawKey;
    }

    // Limpeza ultra-agressiva (idêntica ao localhost + remoção de caracteres invisíveis)
    privateKey = privateKey
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/[\u200b\u00a0\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, '')
      .replace(/\\n/g, '\n');

    console.log('FIREBASE: Project:', projectId);
    console.log('FIREBASE: Key Length:', privateKey.length);
    console.log('FIREBASE: Ready for Auth?', privateKey.includes('BEGIN PRIVATE KEY'));

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : undefined);

    if (projectId && clientEmail && privateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('FIREBASE: Initializing with formatted PEM...');
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
  } catch (error: any) {
    console.error('FIREBASE: Initialization Error:', error.message);
    throw new Error(`Firebase initialization failed: ${error.message}`);
  }
}

// Singleton pattern to prevent multiple initializations
const globalForAdmin = globalThis as unknown as {
  firebaseAdminApp: admin.app.App | undefined;
};

const app = globalForAdmin.firebaseAdminApp ?? getAdminApp();
globalForAdmin.firebaseAdminApp = app || undefined;

// Export safe accessors
export const db = app ? admin.firestore(app) : null as any;
export const storage = app ? admin.storage(app) : null as any;
export const auth = app ? admin.auth(app) : null as any;
export const adminApp = app;
