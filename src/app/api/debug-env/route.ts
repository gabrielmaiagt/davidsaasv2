import { NextResponse } from 'next/server';
import { adminApp, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envStatus = {
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyB64: !!process.env.FIREBASE_PRIVATE_KEY_B64,
    privateKeyB64_length: process.env.FIREBASE_PRIVATE_KEY_B64?.length || 0,
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    nodeEnv: process.env.NODE_ENV,
  };

  // Tenta reinicializar ou pegar o erro se o app estiver nulo
  let initError = null;
  if (!adminApp) {
     try {
       // Apenas para diagnóstico, tentamos ver o que acontece
       // Nota: em produção isso pode ser limitado pelo singleton
       initError = "Firebase app is null. Check server logs for initialization stack trace.";
     } catch (e: any) {
       initError = e.message;
     }
  }

  const firebaseStatus = {
    appInitialized: !!adminApp,
    dbInitialized: !!db,
    appName: adminApp?.name,
    initError
  };

  let dbTest = {
    success: false,
    error: null as any
  };

  if (db) {
    try {
      const snap = await db.collection('campaigns').limit(1).get();
      dbTest.success = true;
    } catch (e: any) {
      dbTest.error = e.message;
    }
  }

  return NextResponse.json({
    envStatus,
    firebaseStatus,
    dbTest,
    timestamp: new Date().toISOString()
  });
}
