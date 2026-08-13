require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const FFPROBE = 'C:\\Users\\Gabri\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffprobe.exe';

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

const WORK = path.join(os.tmpdir(), 'video-audit');
if (!fs.existsSync(WORK)) fs.mkdirSync(WORK, { recursive: true });

const TOP_N = Number(process.argv[2] || 12);

async function main() {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // mapa: arquivo fisico -> quantos criativos apontam pra ele (peso real no egress)
  const creatives = await db.collection('creatives').get();
  const usage = {};
  creatives.docs.forEach(d => {
    const u = d.data().videoUrl;
    if (!u) return;
    const m = u.match(/\/videos\/([^?]+)/);
    if (m) {
      const key = 'videos/' + decodeURIComponent(m[1]);
      usage[key] = (usage[key] || 0) + 1;
    }
  });

  const [files] = await bucket.getFiles({ prefix: 'videos/' });
  const ranked = files
    .map(f => ({
      name: f.name,
      bytes: Number(f.metadata.size || 0),
      refs: usage[f.name] || 0,
    }))
    .map(r => ({ ...r, custoRelativo: r.bytes * r.refs }))
    .sort((a, b) => b.custoRelativo - a.custoRelativo)
    .slice(0, TOP_N);

  console.log('=== ARQUIVOS ORDENADOS POR CUSTO REAL (tamanho x nº de criativos) ===\n');
  console.log('    MB | criativos |    GB/varredura | resolucao | duracao | arquivo');
  console.log('-------|-----------|-----------------|-----------|---------|--------');

  for (const r of ranked) {
    const local = path.join(WORK, path.basename(r.name));
    if (!fs.existsSync(local)) {
      await bucket.file(r.name).download({ destination: local });
    }
    let res = '?', dur = '?';
    try {
      const out = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height:format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=0', local], { encoding: 'utf8' });
      const w = out.match(/width=(\d+)/)?.[1];
      const h = out.match(/height=(\d+)/)?.[1];
      const d = out.match(/duration=([\d.]+)/)?.[1];
      res = `${w}x${h}`;
      dur = d ? `${Number(d).toFixed(0)}s` : '?';
    } catch (e) { res = 'ERRO'; }

    const gbPass = (r.custoRelativo / 1024 ** 3).toFixed(1);
    console.log(
      `${(r.bytes / 1024 ** 2).toFixed(1).padStart(6)} | ${String(r.refs).padStart(9)} | ${gbPass.padStart(15)} | ${res.padStart(9)} | ${dur.padStart(7)} | ${r.name}`
    );
  }

  const totalGB = ranked.reduce((a, r) => a + r.custoRelativo, 0) / 1024 ** 3;
  console.log(`\nEsses ${TOP_N} arquivos sozinhos custam ~${totalGB.toFixed(0)} GB por varredura completa do catalogo.`);
  console.log(`Arquivos baixados para inspecao em: ${WORK}`);
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
