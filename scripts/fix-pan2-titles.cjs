// Reescreve os titulos dos criativos usando o nome comercial do produto.
// NAO altera sku, videoUrl, imageUrl, finalUrl nem preco.
//
// Uso: node scripts/fix-pan2-titles.cjs "Pan2" "Nome do Produto"          (dry-run)
//      node scripts/fix-pan2-titles.cjs "Pan2" "Nome do Produto" --apply

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const p = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const c = process.env.FIREBASE_CLIENT_EMAIL?.trim();
let k = process.env.FIREBASE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64.trim(), 'base64').toString('utf-8')
  : (process.env.FIREBASE_PRIVATE_KEY || '');
k = k.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert({ projectId: p, clientEmail: c, privateKey: k }) });

const CAMPANHA = process.argv[2];
const PRODUTO = process.argv[3];
const APPLY = process.argv.includes('--apply');
const MAX_LEN = 100; // limite seguro de titulo de produto

if (!CAMPANHA || !PRODUTO) {
  console.error('Uso: node scripts/fix-pan2-titles.cjs "<campanha>" "<nome do produto>" [--apply]');
  process.exit(1);
}

// Mesmas variacoes do diversify, mas aplicadas sobre um nome de produto REAL
const TEMPLATES = [
  b => b,
  b => `${b} | Original`,
  b => `${b} - Premium`,
  b => `${b} | Oferta`,
  b => `${b} - Oficial`,
  b => `${b} | Exclusivo`,
  b => `${b} - Edicao Especial`,
  b => `${b} | Envio Rapido`,
  b => `${b} - Kit Completo`,
  b => `${b} | Pronta Entrega`,
];

function montarTitulo(base, i) {
  const t = TEMPLATES[i % TEMPLATES.length](base).replace(/\s+/g, ' ').trim();
  return t.length > MAX_LEN ? base.slice(0, MAX_LEN) : t;
}

async function main() {
  const db = admin.firestore();

  const cs = await db.collection('campaigns').where('name', '==', CAMPANHA).get();
  if (cs.empty) { console.error('Campanha nao encontrada:', CAMPANHA); process.exit(1); }
  const campDoc = cs.docs[0];

  console.log(APPLY ? '=== MODO APPLY ===' : '=== DRY-RUN (nada sera gravado) ===');
  console.log('Campanha:', CAMPANHA, '| id:', campDoc.id);
  console.log('Produto :', PRODUTO, `(${PRODUTO.length} caracteres)`);
  console.log('');

  const snap = await db.collection('creatives').where('campaignId', '==', campDoc.id).get();
  console.log('Criativos encontrados:', snap.size);

  console.log('\nExemplo do que sera gerado:');
  for (let i = 0; i < 6 && i < snap.size; i++) {
    console.log(`  antes: ${JSON.stringify(snap.docs[i].data().title)}`);
    console.log(`  depois: ${JSON.stringify(montarTitulo(PRODUTO, i))}`);
  }

  if (!APPLY) {
    console.log('\nDry-run. Rode com --apply para gravar.');
    return;
  }

  // campanha: guarda o nome do produto e uma categoria valida do Google
  await campDoc.ref.update({
    productName: PRODUTO,
    googleCategory: 'Home & Garden > Kitchen & Dining > Cookware & Bakeware',
    updatedAt: new Date().toISOString(),
  });
  console.log('\nCampanha atualizada (productName + googleCategory).');

  const docs = snap.docs;
  let n = 0;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = db.batch();
    docs.slice(i, i + 500).forEach((d, j) => {
      batch.update(d.ref, {
        title: montarTitulo(PRODUTO, i + j),
        updatedAt: new Date().toISOString(),
      });
      n++;
    });
    await batch.commit();
    console.log(`  ${n}/${docs.length} titulos atualizados...`);
  }

  console.log('\nConcluido:', n, 'titulos corrigidos.');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
