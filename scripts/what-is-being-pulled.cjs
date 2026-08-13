require('dotenv').config({ path: '.env.local' });
const { GoogleAuth } = require('google-auth-library');
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

async function series(client, metric, start, end) {
  const filter = `metric.type="${metric}" resource.type="gcs_bucket" metric.labels.method="ReadObject" metric.labels.response_code="OK"`;
  const url = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries` +
    `?filter=${encodeURIComponent(filter)}` +
    `&interval.startTime=${start.toISOString()}&interval.endTime=${end.toISOString()}` +
    `&aggregation.alignmentPeriod=3600s&aggregation.perSeriesAligner=ALIGN_SUM` +
    `&aggregation.crossSeriesReducer=REDUCE_SUM`;
  const res = await client.request({ url });
  const pts = {};
  (res.data.timeSeries || []).forEach(s => (s.points || []).forEach(p => {
    pts[p.interval.startTime] = Number(p.value.int64Value);
  }));
  return pts;
}

async function main() {
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/monitoring.read'],
  });
  const client = await auth.getClient();
  const now = new Date();
  const start = new Date(now.getTime() - 6 * 3600 * 1000);

  const bytes = await series(client, 'storage.googleapis.com/network/sent_bytes_count', start, now);
  const reqs = await series(client, 'storage.googleapis.com/api/request_count', start, now);

  console.log('=== O QUE ESTA SENDO BAIXADO (ultimas 6h) ===\n');
  console.log('Janela (UTC)      |      GB |  Requisicoes | Tamanho medio/req');
  console.log('------------------|---------|--------------|------------------');
  Object.keys(bytes).sort().forEach(t => {
    const gb = bytes[t] / 1024 ** 3;
    const n = reqs[t] || 0;
    const avgMB = n ? (bytes[t] / n / 1024 ** 2) : 0;
    console.log(`${t.slice(0, 16).replace('T', ' ')} | ${gb.toFixed(2).padStart(7)} | ${String(n).padStart(12)} | ${avgMB.toFixed(2).padStart(9)} MB`);
  });

  // Inventario real do bucket
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();
  let total = 0;
  const byFolder = {};
  files.forEach(f => {
    const size = Number(f.metadata.size || 0);
    total += size;
    const folder = f.name.split('/')[0];
    byFolder[folder] = byFolder[folder] || { n: 0, bytes: 0 };
    byFolder[folder].n++;
    byFolder[folder].bytes += size;
  });

  console.log('\n=== CONTEUDO REAL DO BUCKET ===');
  console.log('Total de arquivos:', files.length, '| Tamanho total:', (total / 1024 ** 3).toFixed(2), 'GB');
  Object.entries(byFolder).forEach(([k, v]) =>
    console.log(`  ${k}: ${v.n} arquivos, ${(v.bytes / 1024 ** 2).toFixed(1)} MB`));

  console.log('\n=== 10 MAIORES ARQUIVOS ===');
  files.sort((a, b) => Number(b.metadata.size) - Number(a.metadata.size)).slice(0, 10)
    .forEach(f => console.log(`  ${(Number(f.metadata.size) / 1024 ** 2).toFixed(2).padStart(8)} MB  ${f.name}`));
}

main().catch(e => { console.error('ERRO:', e.response?.data?.error?.message || e.message); process.exit(1); });
