// BACKUP COMPLETO DO SISTEMA (somente leitura na producao).
// Salva: Firestore (todas as colecoes) + Storage (todos os arquivos) + metadados.
//
// Uso: node scripts/backup-full.cjs
//      node scripts/backup-full.cjs --dest "D:\\meus-backups"
//
// O destino padrao fica FORA do repositorio, pra nao entrar no Git.

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
let privateKey = process.env.FIREBASE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64.trim(), 'base64').toString('utf-8')
  : (process.env.FIREBASE_PRIVATE_KEY || '');
privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  storageBucket,
});

const COLECOES = ['campaigns', 'creatives', 'users', 'exports', 'organizations'];

function argDest() {
  const i = process.argv.indexOf('--dest');
  if (i > -1 && process.argv[i + 1]) return process.argv[i + 1];
  return path.resolve(process.cwd(), '..', 'BACKUPS-CATALOGO');
}

function carimbo() {
  const d = new Date();
  const z = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}h${z(d.getMinutes())}`;
}

function mb(n) { return (n / 1024 ** 2).toFixed(1) + ' MB'; }

async function main() {
  const raiz = path.join(argDest(), carimbo());
  const dirFs = path.join(raiz, 'firestore');
  const dirSt = path.join(raiz, 'storage');
  fs.mkdirSync(dirFs, { recursive: true });
  fs.mkdirSync(dirSt, { recursive: true });

  console.log('=== BACKUP COMPLETO ===');
  console.log('Destino:', raiz);
  console.log('');

  const db = admin.firestore();
  const bucket = admin.storage().bucket();
  const resumo = { firestore: {}, storage: {} };

  // ---------- 1. FIRESTORE ----------
  console.log('[1/3] Firestore');
  for (const col of COLECOES) {
    const snap = await db.collection(col).get();
    if (snap.empty) { console.log(`   ${col}: vazia (pulando)`); continue; }
    const docs = snap.docs.map(d => ({ __id: d.id, ...d.data() }));
    const arquivo = path.join(dirFs, `${col}.json`);
    fs.writeFileSync(arquivo, JSON.stringify(docs, null, 1));
    resumo.firestore[col] = docs.length;
    console.log(`   ${col}: ${docs.length} documentos (${mb(fs.statSync(arquivo).size)})`);
  }

  // ---------- 2. STORAGE ----------
  console.log('\n[2/3] Storage');
  const [files] = await bucket.getFiles();
  let baixados = 0, bytes = 0, pulados = 0;
  const indice = [];

  for (const f of files) {
    const destino = path.join(dirSt, f.name.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    const tam = Number(f.metadata.size || 0);

    indice.push({
      nome: f.name,
      tamanho: tam,
      contentType: f.metadata.contentType,
      criadoEm: f.metadata.timeCreated,
      metadata: f.metadata.metadata || null,
    });

    if (fs.existsSync(destino) && fs.statSync(destino).size === tam) { pulados++; continue; }
    await f.download({ destination: destino });
    baixados++; bytes += tam;
    if (baixados % 20 === 0) console.log(`   ${baixados} arquivos baixados (${mb(bytes)})...`);
  }
  fs.writeFileSync(path.join(raiz, 'storage-index.json'), JSON.stringify(indice, null, 1));
  resumo.storage = { total: files.length, baixados, pulados, bytes };
  console.log(`   ${files.length} arquivos | ${baixados} baixados (${mb(bytes)}) | ${pulados} ja existiam`);

  // ---------- 3. METADADOS ----------
  console.log('\n[3/3] Metadados');
  let git = {};
  try {
    git = {
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
      commitCurto: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
      mensagem: execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
      sujo: execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0,
    };
  } catch { git = { erro: 'git indisponivel' }; }

  let cors = null;
  try { const [m] = await bucket.getMetadata(); cors = m.cors || null; } catch {}

  const meta = {
    feitoEm: new Date().toISOString(),
    projeto: projectId,
    bucket: storageBucket,
    git,
    corsDoBucket: cors,
    resumo,
    // URLs de feed no momento do backup — util pra conferir o que estava no TikTok
    feeds: null,
  };

  const camps = JSON.parse(fs.readFileSync(path.join(dirFs, 'campaigns.json'), 'utf8'));
  meta.feeds = camps.filter(c => c.feedToken).map(c => ({
    campanha: c.name, id: c.__id, token: c.feedToken,
    produtos: c.creativeCount || 0, dedupeVideos: !!c.dedupeVideos,
  }));

  fs.writeFileSync(path.join(raiz, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('   git:', git.commitCurto, '|', git.mensagem);
  console.log('   feeds ativos:', meta.feeds.length);

  console.log('\n=== BACKUP CONCLUIDO ===');
  console.log('Pasta:', raiz);
  console.log('Para restaurar: node scripts/restore-full.cjs --from "' + raiz + '"');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
