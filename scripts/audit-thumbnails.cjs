// Mede a resolucao real das imagens (thumbnails) no bucket.
// Uso: node scripts/audit-thumbnails.cjs [--fix]
//   sem --fix: so audita
//   com --fix: regera as imagens pequenas em >=500x500 com NOME NOVO e
//              aponta os criativos para a nova URL (TikTok so reprocessa se a URL mudar)

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const BIN = 'C:\\Users\\Gabri\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\';
const FFMPEG = BIN + 'ffmpeg.exe';
const FFPROBE = BIN + 'ffprobe.exe';
const MIN = 500;
const FIX = process.argv.includes('--fix');

const p = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const c = process.env.FIREBASE_CLIENT_EMAIL?.trim();
let k = process.env.FIREBASE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64.trim(), 'base64').toString('utf-8')
  : (process.env.FIREBASE_PRIVATE_KEY || '');
k = k.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
admin.initializeApp({
  credential: admin.credential.cert({ projectId: p, clientEmail: c, privateKey: k }),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
});

const WORK = path.join(os.tmpdir(), 'thumb-audit');
if (!fs.existsSync(WORK)) fs.mkdirSync(WORK, { recursive: true });

function dims(file) {
  const out = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file], { encoding: 'utf8' });
  const [w, h] = out.trim().split(',').map(Number);
  return { w, h };
}

async function main() {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // quantos criativos usam cada imagem
  const creatives = await db.collection('creatives').get();
  const uso = {};
  creatives.docs.forEach(d => {
    const m = (d.data().imageUrl || '').match(/\/images\/([^?]+)/);
    if (m) { const key = 'images/' + decodeURIComponent(m[1]); uso[key] = (uso[key] || 0) + 1; }
  });

  const [files] = await bucket.getFiles({ prefix: 'images/' });
  console.log(`Imagens no bucket: ${files.length}\n`);

  const pequenas = [];
  for (const f of files) {
    const refs = uso[f.name] || 0;
    if (refs === 0) continue; // ignora imagens orfas
    const local = path.join(WORK, path.basename(f.name));
    if (!fs.existsSync(local)) await f.download({ destination: local });
    let d;
    try { d = dims(local); } catch { continue; }
    const ok = d.w >= MIN && d.h >= MIN;
    if (!ok) pequenas.push({ nome: f.name, ...d, refs, local });
    console.log(`${ok ? ' OK ' : 'BAIXA'} ${String(d.w).padStart(5)}x${String(d.h).padEnd(5)} | ${String(refs).padStart(6)} criativos | ${f.name.replace('images/', '')}`);
  }

  console.log(`\n=== ${pequenas.length} imagem(ns) abaixo de ${MIN}x${MIN} ===`);
  pequenas.forEach(x => console.log(`   ${x.w}x${x.h} — ${x.refs} criativos — ${x.nome}`));

  if (!pequenas.length) { console.log('Nada a corrigir.'); return; }
  if (!FIX) { console.log('\nRode com --fix para corrigir.'); return; }

  console.log('\n=== CORRIGINDO ===');
  for (const x of pequenas) {
    // escala mantendo proporcao ate o menor lado bater MIN
    const escala = Math.max(MIN / x.w, MIN / x.h);
    const nw = Math.ceil(x.w * escala), nh = Math.ceil(x.h * escala);
    const out = path.join(WORK, 'fix-' + path.basename(x.nome));
    execFileSync(FFMPEG, ['-y', '-i', x.local, '-vf', `scale=${nw}:${nh}`, '-q:v', '3', out],
      { stdio: ['ignore', 'ignore', 'pipe'] });

    const check = dims(out);
    if (check.w < MIN || check.h < MIN) { console.log(`   FALHOU ${x.nome}`); continue; }

    // NOME NOVO: o TikTok so reprocessa a imagem se a URL mudar
    const novoNome = x.nome.replace(/(\.[^.]+)$/, `-hd${Date.now()}$1`);
    await bucket.upload(out, { destination: novoNome, metadata: { contentType: 'image/jpeg' } });
    await bucket.file(novoNome).makePublic();
    const novaUrl = `https://storage.googleapis.com/${bucket.name}/${novoNome}`;
    const urlAntiga = `https://storage.googleapis.com/${bucket.name}/${x.nome}`;

    // repontar os criativos
    const alvo = creatives.docs.filter(d => (d.data().imageUrl || '').startsWith(urlAntiga));
    for (let i = 0; i < alvo.length; i += 500) {
      const batch = db.batch();
      alvo.slice(i, i + 500).forEach(d => batch.update(d.ref, { imageUrl: novaUrl, updatedAt: new Date().toISOString() }));
      await batch.commit();
    }
    console.log(`   ${x.w}x${x.h} -> ${check.w}x${check.h} | ${alvo.length} criativos repontados | ${novoNome}`);
  }
  console.log('\nConcluido.');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
