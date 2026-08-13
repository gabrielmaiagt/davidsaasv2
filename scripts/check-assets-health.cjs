require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const https = require('https');

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

function headCheck(url) {
  return new Promise((resolve) => {
    if (!url) return resolve({ ok: false, status: 'NO_URL' });
    try {
      const req = https.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode });
        res.resume();
      });
      req.on('error', (e) => resolve({ ok: false, status: 'ERR:' + e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 'THROW:' + e.message });
    }
  });
}

async function mapLimit(items, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function main() {
  const db = admin.firestore();

  const campNameFilter = process.argv[2]; // opcional: nome da campanha pra focar
  let campaignId = null;
  if (campNameFilter) {
    const cs = await db.collection('campaigns').where('name', '==', campNameFilter).get();
    if (!cs.empty) campaignId = cs.docs[0].id;
    console.log('Campanha:', campNameFilter, '-> id:', campaignId);
  }

  let query = db.collection('creatives').where('status', '==', 'active');
  if (campaignId) query = query.where('campaignId', '==', campaignId);

  const snap = await query.limit(500).get();
  console.log('Verificando', snap.size, 'criativos...');

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const results = await mapLimit(items, 20, async (item) => {
    const [video, image] = await Promise.all([
      headCheck(item.videoUrl),
      headCheck(item.imageUrl),
    ]);
    return { sku: item.sku, campaignId: item.campaignId, video, image };
  });

  const brokenVideo = results.filter(r => !r.video.ok);
  const brokenImage = results.filter(r => !r.image.ok);

  console.log('\n=== RESULTADO ===');
  console.log('Total verificado:', results.length);
  console.log('Vídeos quebrados:', brokenVideo.length);
  console.log('Imagens quebradas:', brokenImage.length);

  if (brokenVideo.length) {
    console.log('\n--- Vídeos quebrados (até 20) ---');
    brokenVideo.slice(0, 20).forEach(r => console.log(r.sku, '| campaignId:', r.campaignId, '| status:', r.video.status));
  }
  if (brokenImage.length) {
    console.log('\n--- Imagens quebradas (até 20) ---');
    brokenImage.slice(0, 20).forEach(r => console.log(r.sku, '| campaignId:', r.campaignId, '| status:', r.image.status));
  }
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
