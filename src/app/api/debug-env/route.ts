import { NextResponse } from 'next/server';
import { adminApp, db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envStatus = {
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKey_length: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    privateKey_starts_with_dash: process.env.FIREBASE_PRIVATE_KEY?.trim().startsWith('-'),
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    nodeEnv: process.env.NODE_ENV,
  };

  const firebaseStatus = {
    appInitialized: !!adminApp,
    dbInitialized: !!db,
    appName: adminApp?.name,
  };

  let dbTest = {
    success: false,
    error: null as any,
    count: 0
  };

  if (db) {
    try {
      const snap = await db.collection('campaigns').limit(1).get();
      dbTest.success = true;
      dbTest.count = snap.size;
    } catch (e: any) {
      dbTest.error = {
        message: e.message,
        code: e.code,
        details: e.details
      };
    }
  }

  return NextResponse.json({
    envStatus,
    firebaseStatus,
    dbTest,
    timestamp: new Date().toISOString()
  });
}
