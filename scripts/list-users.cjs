require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
let privateKey = '';
const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (b64Key) privateKey = Buffer.from(b64Key.trim(), 'base64').toString('utf-8');
else if (rawKey) privateKey = rawKey;
privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

async function main() {
  const db = admin.firestore();
  const snap = await db.collection('users').get();
  console.log(`Total de usuários no Firestore (fora do admin@cfm.com hardcoded): ${snap.size}`);
  snap.docs.forEach((doc) => {
    const d = doc.data();
    console.log('---');
    console.log('id:', doc.id);
    console.log('name:', d.name);
    console.log('email:', d.email);
    console.log('role:', d.role);
    console.log('createdAt:', d.createdAt);
  });

  // Também mostra quantas campanhas cada organizationId tem, pra ver se algum
  // desses usuários chegou a criar dados de verdade.
  const campSnap = await db.collection('campaigns').get();
  const byOrg = {};
  campSnap.docs.forEach((doc) => {
    const orgId = doc.data().organizationId;
    byOrg[orgId] = (byOrg[orgId] || 0) + 1;
  });
  console.log('\nCampanhas por organizationId:', JSON.stringify(byOrg, null, 2));
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
