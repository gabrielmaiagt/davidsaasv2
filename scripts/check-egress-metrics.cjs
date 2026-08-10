// Consulta métricas reais do Cloud Monitoring (bytes de rede enviados pelo Storage)
// usando as mesmas credenciais do Firebase Admin, só em memória (nunca grava a chave em disco).
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

async function main() {
  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/monitoring.read'],
  });

  const client = await auth.getClient();

  // 1. Quem é essa service account e quais papéis ela tem no projeto (se conseguirmos ler)
  try {
    const iam = await client.request({
      url: `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`,
      method: 'POST',
    });
    const bindings = iam.data.bindings || [];
    const mine = bindings.filter(b => b.members.some(m => m.includes(clientEmail)));
    console.log('=== PAPÉIS DESSA SERVICE ACCOUNT NO PROJETO ===');
    console.log(JSON.stringify(mine, null, 2));
  } catch (e) {
    console.log('Não consegui ler IAM policy:', e.response?.data?.error?.message || e.message);
  }

  // 2. Métrica real de bytes de rede enviados pelo Cloud Storage (egress), últimos 10 dias
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const filter = `metric.type="storage.googleapis.com/network/sent_bytes_count" resource.type="gcs_bucket"`;
    const url = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries` +
      `?filter=${encodeURIComponent(filter)}` +
      `&interval.startTime=${start.toISOString()}` +
      `&interval.endTime=${now.toISOString()}` +
      `&aggregation.alignmentPeriod=86400s` +
      `&aggregation.perSeriesAligner=ALIGN_SUM`;

    const res = await client.request({ url });
    console.log('\n=== EGRESS REAL (bytes enviados/dia, Cloud Monitoring) ===');
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('\nNão consegui ler métrica de egress:', e.response?.data?.error?.message || e.message);
  }
}

main().catch(e => { console.error('ERRO GERAL:', e.message); process.exit(1); });
