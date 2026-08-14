// Liga/desliga o experimento de deduplicacao de video em UMA campanha.
// Nao muda nada na interface — o time cria e sobe campanha do jeito de sempre.
//
// Uso: node scripts/toggle-dedupe-videos.cjs "<campanha>" on|off
//      node scripts/toggle-dedupe-videos.cjs --status

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const p = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const c = process.env.FIREBASE_CLIENT_EMAIL?.trim();
let k = process.env.FIREBASE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64.trim(), 'base64').toString('utf-8')
  : (process.env.FIREBASE_PRIVATE_KEY || '');
k = k.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert({ projectId: p, clientEmail: c, privateKey: k }) });

async function main() {
  const db = admin.firestore();

  if (process.argv.includes('--status')) {
    const s = await db.collection('campaigns').get();
    console.log('Estado do experimento por campanha:\n');
    s.docs.forEach(d => {
      const x = d.data();
      if (!x.feedToken) return;
      console.log((x.name || '?').padEnd(16), x.dedupeVideos ? 'DEDUPE LIGADO  (?v= removido)' : 'normal         (?v=SKU)');
    });
    return;
  }

  const nome = process.argv[2];
  const modo = (process.argv[3] || '').toLowerCase();
  if (!nome || !['on', 'off'].includes(modo)) {
    console.error('Uso: node scripts/toggle-dedupe-videos.cjs "<campanha>" on|off');
    console.error('     node scripts/toggle-dedupe-videos.cjs --status');
    process.exit(1);
  }

  const cs = await db.collection('campaigns').where('name', '==', nome).get();
  if (cs.empty) { console.error('Campanha nao encontrada:', nome); process.exit(1); }

  const doc = cs.docs[0];
  const ligar = modo === 'on';
  await doc.ref.update({ dedupeVideos: ligar, updatedAt: new Date().toISOString() });

  const snap = await db.collection('creatives').where('campaignId', '==', doc.id).get();
  const arquivos = new Set();
  snap.docs.forEach(d => {
    const m = (d.data().videoUrl || '').match(/\/videos\/([^?]+)/);
    if (m) arquivos.add(m[1]);
  });

  console.log(`Campanha "${nome}": dedupe ${ligar ? 'LIGADO' : 'desligado'}`);
  console.log(`Produtos: ${snap.size} | arquivos de video distintos: ${arquivos.size}`);
  console.log(ligar
    ? `Downloads por varredura: ${snap.size} -> ${arquivos.size}`
    : `Downloads por varredura: ${arquivos.size} -> ${snap.size}`);
  console.log('\nNada muda na interface. O feed ja reflete a mudanca na proxima leitura.');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
