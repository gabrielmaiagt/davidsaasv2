// Compara campanhas lado a lado para achar o padrao entre as que entregam e as que nao entregam.
// Uso: node scripts/comparar-campanhas.cjs "lava2" "Pan2" "Pato"

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const FFPROBE = 'C:\\Users\\Gabri\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffprobe.exe';

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

const WORK = path.join(os.tmpdir(), 'cmp-campanhas');
if (!fs.existsSync(WORK)) fs.mkdirSync(WORK, { recursive: true });

async function analisar(nome) {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  const cs = await db.collection('campaigns').where('name', '==', nome).get();
  if (cs.empty) return { nome, erro: 'nao encontrada' };
  const doc = cs.docs[0];
  const camp = doc.data();

  const snap = await db.collection('creatives').where('campaignId', '==', doc.id).get();

  // arquivos de video distintos + titulos
  const arquivos = new Map();
  let semPalavra = 0, curtos = 0;
  const exemplos = [];
  snap.docs.forEach((d, i) => {
    const x = d.data();
    const m = (x.videoUrl || '').match(/\/videos\/([^?]+)/);
    if (m) {
      const key = 'videos/' + decodeURIComponent(m[1]);
      arquivos.set(key, (arquivos.get(key) || 0) + 1);
    }
    const t = (x.title || '').trim();
    if (!/[a-zA-ZÀ-ÿ]{3,}/.test(t)) semPalavra++;
    if (t.length < 3) curtos++;
    if (i < 3) exemplos.push(t);
  });

  // inspeciona os arquivos fisicos
  const infos = [];
  for (const [arq] of arquivos) {
    try {
      const [meta] = await bucket.file(arq).getMetadata();
      const local = path.join(WORK, path.basename(arq));
      if (!fs.existsSync(local)) await bucket.file(arq).download({ destination: local });
      const out = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height:format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=0', local], { encoding: 'utf8' });
      infos.push({
        arq,
        mb: Number(meta.size) / 1024 ** 2,
        w: Number(out.match(/width=(\d+)/)?.[1]),
        h: Number(out.match(/height=(\d+)/)?.[1]),
        dur: Number(out.match(/duration=([\d.]+)/)?.[1] || 0),
        criado: meta.timeCreated,
      });
    } catch (e) { infos.push({ arq, erro: e.message.slice(0, 40) }); }
  }

  const mbs = infos.filter(i => i.mb).map(i => i.mb);
  const gbPorVarredura = infos.reduce((a, i) => a + (i.mb || 0) * (arquivos.get(i.arq) || 0), 0) / 1024;

  return {
    nome,
    id: doc.id,
    token: camp.feedToken || null,
    criativos: snap.size,
    atualizada: camp.updatedAt,
    criada: camp.createdAt,
    productName: camp.productName || null,
    brand: camp.brand,
    link: camp.defaultLink,
    videosDistintos: arquivos.size,
    menorMB: mbs.length ? Math.min(...mbs) : 0,
    maiorMB: mbs.length ? Math.max(...mbs) : 0,
    resolucoes: [...new Set(infos.filter(i => i.w).map(i => `${i.w}x${i.h}`))],
    duracoes: infos.filter(i => i.dur).map(i => Math.round(i.dur)),
    acimaDe5MB: infos.filter(i => i.mb > 5).length,
    gbPorVarredura,
    titulosSemPalavra: semPalavra,
    titulosCurtos: curtos,
    exemplos,
    videoMaisNovo: infos.map(i => i.criado).filter(Boolean).sort().pop(),
  };
}

async function main() {
  const nomes = process.argv.slice(2);
  const rs = [];
  for (const n of nomes) { process.stdout.write(`analisando ${n}...\n`); rs.push(await analisar(n)); }

  const linha = (label, fn) => {
    console.log(label.padEnd(26) + rs.map(r => String(fn(r)).padEnd(26)).join(''));
  };

  console.log('\n' + '='.repeat(26 + 26 * rs.length));
  console.log(''.padEnd(26) + rs.map(r => r.nome.padEnd(26)).join(''));
  console.log('='.repeat(26 + 26 * rs.length));
  linha('criativos', r => r.criativos);
  linha('videos distintos', r => r.videosDistintos);
  linha('menor video (MB)', r => r.menorMB.toFixed(1));
  linha('maior video (MB)', r => r.maiorMB.toFixed(1));
  linha('videos acima de 5MB', r => r.acimaDe5MB);
  linha('resolucoes', r => r.resolucoes.join(','));
  linha('duracao (s)', r => r.duracoes.join(','));
  linha('GB por varredura', r => r.gbPorVarredura.toFixed(1));
  linha('titulos sem palavra', r => r.titulosSemPalavra);
  linha('titulos < 3 chars', r => r.titulosCurtos);
  linha('productName setado', r => r.productName ? 'sim' : 'NAO');
  linha('marca', r => (r.brand || '').slice(0, 24));
  linha('criada em', r => (r.criada || '').slice(0, 16));
  linha('atualizada em', r => (r.atualizada || '').slice(0, 16));
  linha('video mais novo', r => (r.videoMaisNovo || '').slice(0, 16));
  console.log('');
  rs.forEach(r => console.log(`${r.nome}: link=${r.link}`));
  console.log('');
  rs.forEach(r => console.log(`${r.nome} — exemplos de titulo: ${JSON.stringify(r.exemplos)}`));
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
