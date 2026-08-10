require('dotenv').config({ path: '.env.local' });
const { GoogleAuth } = require('google-auth-library');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
let privateKey = '';
const b64Key = process.env.FIREBASE_PRIVATE_KEY_B64;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
if (b64Key) privateKey = Buffer.from(b64Key.trim(), 'base64').toString('utf-8');
else if (rawKey) privateKey = rawKey;
privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

async function query(client, filter, start, end, alignmentPeriod) {
  const url = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries` +
    `?filter=${encodeURIComponent(filter)}` +
    `&interval.startTime=${start.toISOString()}` +
    `&interval.endTime=${end.toISOString()}` +
    `&aggregation.alignmentPeriod=${alignmentPeriod}` +
    `&aggregation.perSeriesAligner=ALIGN_SUM` +
    `&aggregation.crossSeriesReducer=REDUCE_SUM` +
    `&aggregation.groupByFields=metric.labels.method`;
  const res = await client.request({ url });
  return res.data.timeSeries || [];
}

async function main() {
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/monitoring.read'],
  });
  const client = await auth.getClient();
  const now = new Date();

  // 1. Contagem de requisições ReadObject por dia (últimos 6 dias)
  console.log('=== CONTAGEM DE REQUISIÇÕES (ReadObject, OK) POR DIA ===');
  const start6d = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const countSeries = await query(
    client,
    `metric.type="storage.googleapis.com/api/request_count" resource.type="gcs_bucket" metric.labels.method="ReadObject" metric.labels.response_code="OK"`,
    start6d, now, '86400s'
  );
  countSeries.forEach(s => {
    s.points.slice().reverse().forEach(p => {
      console.log(p.interval.startTime.slice(0,10), '->', p.interval.endTime.slice(0,10), ':', p.value.int64Value, 'requisições');
    });
  });

  // 2. Egress por HORA nas últimas 30 horas, pra ver o padrão de horário
  console.log('\n=== EGRESS POR HORA (últimas 30h) — ReadObject OK ===');
  const start30h = new Date(now.getTime() - 30 * 60 * 60 * 1000);
  const hourly = await query(
    client,
    `metric.type="storage.googleapis.com/network/sent_bytes_count" resource.type="gcs_bucket" metric.labels.method="ReadObject" metric.labels.response_code="OK"`,
    start30h, now, '3600s'
  );
  hourly.forEach(s => {
    s.points.slice().reverse().forEach(p => {
      const gb = (Number(p.value.int64Value) / 1024 / 1024 / 1024).toFixed(2);
      console.log(p.interval.startTime.slice(0,16).replace('T',' '), '->', p.interval.endTime.slice(11,16), ':', gb, 'GB');
    });
  });

  // 3. Contagem de requisições por hora também, pra separar "mais requests" de "requests maiores"
  console.log('\n=== CONTAGEM DE REQUISIÇÕES POR HORA (últimas 30h) ===');
  const hourlyCount = await query(
    client,
    `metric.type="storage.googleapis.com/api/request_count" resource.type="gcs_bucket" metric.labels.method="ReadObject" metric.labels.response_code="OK"`,
    start30h, now, '3600s'
  );
  hourlyCount.forEach(s => {
    s.points.slice().reverse().forEach(p => {
      console.log(p.interval.startTime.slice(0,16).replace('T',' '), '->', p.interval.endTime.slice(11,16), ':', p.value.int64Value, 'requisições');
    });
  });
}

main().catch(e => { console.error('ERRO:', e.response?.data?.error?.message || e.message); process.exit(1); });
