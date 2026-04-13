import * as admin from 'firebase-admin';

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Normalização simplificada e robusta
    let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Remove aspas e espaços extras que o painel pode colocar
    rawKey = rawKey.trim().replace(/^["']|["']$/g, '');
    
    // Converte \n literal para quebra de linha real (essencial para Linux/Produção)
    const privateKey = rawKey.replace(/\\n/g, '\n');

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
