require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
let privateKey = '';
const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (b64Key) privateKey = Buffer.from(b64Key.trim(), 'base64').toString('utf-8');
else if (rawKey) privateKey = rawKey;
privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  storageBucket,
});

async function main() {
  const bucket = admin.storage().bucket();

  const [meta] = await bucket.getMetadata();
  console.log('iamConfiguration:', JSON.stringify(meta.iamConfiguration, null, 2));

  const [files] = await bucket.getFiles({ prefix: 'videos/', maxResults: 200 });
  const sorted = files.sort((a, b) => new Date(b.metadata.timeCreated) - new Date(a.metadata.timeCreated));
  for (const f of sorted.slice(0, 3)) {
    console.log('---');
    console.log('name:', f.name, 'created:', f.metadata.timeCreated, 'size:', f.metadata.size, 'contentType:', f.metadata.contentType);
    try {
      const [acl] = await f.acl.get();
      console.log('ACL:', JSON.stringify(acl));
    } catch (e) {
      console.log('ACL fetch error:', e.message);
    }
  }
}
main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
