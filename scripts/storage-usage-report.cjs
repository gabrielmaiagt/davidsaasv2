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
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // 1. Tamanho total do bucket por pasta
  const [files] = await bucket.getFiles();
  let totalBytes = 0;
  const byFolder = {};
  let earliestDate = null;
  let latestDate = null;

  files.forEach((f) => {
    const size = Number(f.metadata.size || 0);
    totalBytes += size;
    const folder = f.name.split('/')[0];
    byFolder[folder] = byFolder[folder] || { count: 0, bytes: 0 };
    byFolder[folder].count += 1;
    byFolder[folder].bytes += size;
    const created = new Date(f.metadata.timeCreated);
    if (!earliestDate || created < earliestDate) earliestDate = created;
    if (!latestDate || created > latestDate) latestDate = created;
  });

  console.log('=== BUCKET ===');
  console.log('Total de arquivos:', files.length);
  console.log('Tamanho total:', (totalBytes / 1024 / 1024 / 1024).toFixed(2), 'GB');
  console.log('Arquivo mais antigo:', earliestDate);
  console.log('Arquivo mais recente:', latestDate);
  console.log('Por pasta:', JSON.stringify(Object.fromEntries(
    Object.entries(byFolder).map(([k, v]) => [k, { count: v.count, gb: (v.bytes / 1024 / 1024 / 1024).toFixed(2) }])
  ), null, 2));

  // 2. Criativos no Firestore, por campanha
  const creativesSnap = await db.collection('creatives').get();
  console.log('\n=== CREATIVES (Firestore) ===');
  console.log('Total de documentos creatives:', creativesSnap.size);

  const byCampaign = {};
  const skuBaseCount = {};
  creativesSnap.docs.forEach((doc) => {
    const d = doc.data();
    byCampaign[d.campaignId] = (byCampaign[d.campaignId] || 0) + 1;
    // sku base antes dos sufixos -C1-, -BC1-, -CP- etc
    const base = (d.sku || '').split('-C')[0].split('-BC')[0].split('-CP')[0];
    skuBaseCount[base] = (skuBaseCount[base] || 0) + 1;
  });
  console.log('Criativos por campanha:', JSON.stringify(byCampaign, null, 2));

  const topDuplicated = Object.entries(skuBaseCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log('Top 10 SKUs-base com mais variantes/duplicatas:', JSON.stringify(topDuplicated, null, 2));

  // 3. Campanhas e se têm feedToken (indicativo de refresh já usado)
  const campSnap = await db.collection('campaigns').get();
  console.log('\n=== CAMPANHAS ===');
  campSnap.docs.forEach((doc) => {
    const d = doc.data();
    console.log(`- ${d.name} | creativeCount=${d.creativeCount} | feedToken=${d.feedToken ? 'sim' : 'não'} | updatedAt=${d.updatedAt}`);
  });

  // 4. Exports gerados (histórico)
  const exportsSnap = await db.collection('exports').get();
  console.log('\n=== EXPORTS ===');
  console.log('Total de exports gerados:', exportsSnap.size);
  const exportDates = exportsSnap.docs.map(d => d.data().createdAt).sort();
  console.log('Primeiro export:', exportDates[0]);
  console.log('Último export:', exportDates[exportDates.length - 1]);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
