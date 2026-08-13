require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const path = require('path');

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

const LOCAL_DIR = 'C:\\Users\\Gabri\\Downloads\\dd';

// mapeamento confirmado pelos tamanhos de arquivo batendo com os logs da function
const MAP = [
  { local: '1.MP4', remote: 'videos/1786486086725-1.MP4' },
  { local: '2.MP4', remote: 'videos/1786486091906-2.MP4' },
  { local: '3.MP4', remote: 'videos/1786486096401-3.MP4' },
  { local: '4.MP4', remote: 'videos/1786486100532-4.MP4' },
  { local: '5.MP4', remote: 'videos/1786486105323-5.MP4' },
  { local: '6.MP4', remote: 'videos/1786486109410-6.MP4' },
];

async function main() {
  const bucket = admin.storage().bucket();

  for (const { local, remote } of MAP) {
    const localPath = path.join(LOCAL_DIR, local);
    console.log(`Subindo ${local} -> ${remote} ...`);
    await bucket.upload(localPath, {
      destination: remote,
      metadata: {
        contentType: 'video/mp4',
        metadata: { compressed: admin.firestore.FieldValue ? null : undefined }, // limpa qualquer metadata antigo
      },
    });
    // Remove explicitamente o metadata "compressed" (upload acima já sobrescreve tudo, mas garante)
    await bucket.file(remote).setMetadata({ metadata: {} });
    await bucket.file(remote).makePublic();
    console.log(`OK: ${remote} restaurado e público.`);
  }

  console.log('\nTodos os 6 vídeos restaurados com sucesso.');
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
