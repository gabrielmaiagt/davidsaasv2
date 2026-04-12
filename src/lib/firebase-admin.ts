import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      // Inicialização via Chaves Manuais (Local ou Secrets)
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with service account keys.');
    } else {
      // Inicialização via Application Default Credentials (ADC) - Ideal para App Hosting/GCP
      // No ambiente de Build do Next.js, isso pode falhar se não houver credenciais,
      // mas o catch impedirá que o build quebre.
      admin.initializeApp({
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      console.log('Firebase Admin initialized with Application Default Credentials.');
    }
  } catch (error) {
    // Durante o 'npm run build', o Firebase Admin pode reclamar de falta de credenciais.
    // O catch evita que o processo de build do Next.js seja interrompido.
    console.warn('Firebase Admin initialization skipped or failed (common during build):', (error as any).message);
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();
