// Reduz o PESO dos videos mais caros do bucket sem violar o minimo de resolucao.
// Regras de seguranca:
//   - NUNCA faz upscale.
//   - Só reduz resolucao se o video for MAIOR que 720x1280 (e nunca abaixo disso).
//   - Verifica com ffprobe DEPOIS de gerar; só sobe se passar na verificacao.
//   - Sobrescreve o mesmo caminho => as duplicatas continuam validas (URL nao muda).
//
// Uso:  node scripts/shrink-heavy-videos.cjs           (dry-run, nao sobe nada)
//       node scripts/shrink-heavy-videos.cjs --apply   (gera, verifica e sobe)

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const BIN = 'C:\\Users\\Gabri\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\';
const FFMPEG = BIN + 'ffmpeg.exe';
const FFPROBE = BIN + 'ffprobe.exe';

const APPLY = process.argv.includes('--apply');
const TARGET_MB = 4.2;          // alvo de tamanho final
const HARD_MAX_MB = 5.0;        // teto: acima disso nao sobe
const MIN_W = 720, MIN_H = 1280; // piso de resolucao (nunca reduzir abaixo)

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
let privateKey = '';
const b64 = process.env.FIREBASE_PRIVATE_KEY_B64, raw = process.env.FIREBASE_PRIVATE_KEY;
privateKey = (b64 ? Buffer.from(b64.trim(), 'base64').toString('utf-8') : raw || '')
  .trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  storageBucket,
});

// Alvos escolhidos: apenas arquivos JA >= 720x1280 (nenhum upscale envolvido)
const TARGETS = [
  'videos/1785946842393-CTV04OK.mp4',
  'videos/1785946850319-CTV05OK.mp4',
  'videos/1785946835255-CTV03OK.mp4',
  'videos/1786486109410-6.MP4',
  'videos/1786486096401-3.MP4',
  'videos/1786486100532-4.MP4',
  'videos/1786486105323-5.MP4',
  'videos/1786486086725-1.MP4',
  'videos/1786486091906-2.MP4',
];

const WORK = path.join(os.tmpdir(), 'video-shrink');
if (!fs.existsSync(WORK)) fs.mkdirSync(WORK, { recursive: true });

function probe(file) {
  const out = execFileSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=0', file], { encoding: 'utf8' });
  return {
    width: Number(out.match(/width=(\d+)/)?.[1]),
    height: Number(out.match(/height=(\d+)/)?.[1]),
    duration: Number(out.match(/duration=([\d.]+)/)?.[1]),
  };
}

function encode(input, output, info) {
  // Reduz para 720x1280 apenas se for MAIOR; caso contrario preserva resolucao original.
  const shouldDownscale = info.width > MIN_W && info.height > MIN_H;
  const vf = shouldDownscale ? ['-vf', `scale=${MIN_W}:${MIN_H}`] : [];

  // bitrate de video para atingir ~TARGET_MB (descontando audio)
  const targetBits = TARGET_MB * 8 * 1024 * 1024;
  const audioBps = 64000;
  let vBps = Math.floor(targetBits / info.duration) - audioBps;
  vBps = Math.max(vBps, 520000); // nao descer abaixo de ~520kbps (referencia TikTok)

  const common = [
    '-c:v', 'libx264', '-b:v', String(vBps),
    '-maxrate', String(Math.floor(vBps * 1.5)), '-bufsize', String(vBps * 2),
    '-preset', 'medium', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
  ];
  const passlog = path.join(WORK, 'pass-' + path.basename(output));

  execFileSync(FFMPEG, ['-y', '-i', input, ...vf, ...common,
    '-pass', '1', '-passlogfile', passlog, '-an', '-f', 'mp4', 'NUL'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  execFileSync(FFMPEG, ['-y', '-i', input, ...vf, ...common,
    '-pass', '2', '-passlogfile', passlog,
    '-c:a', 'aac', '-b:a', '64k', output],
    { stdio: ['ignore', 'ignore', 'pipe'] });

  return { downscaled: shouldDownscale, vBps };
}

async function main() {
  const bucket = admin.storage().bucket();
  console.log(APPLY ? '=== MODO APPLY (vai sobrescrever no Storage) ===\n'
                    : '=== DRY-RUN (nada sera enviado) ===\n');

  let antes = 0, depois = 0;
  const resultados = [];

  for (const remote of TARGETS) {
    const base = path.basename(remote);
    const src = path.join(WORK, 'src-' + base);
    const out = path.join(WORK, 'out-' + base);

    if (!fs.existsSync(src)) await bucket.file(remote).download({ destination: src });

    const info = probe(src);
    const sizeAntes = fs.statSync(src).size;

    const { downscaled } = encode(src, out, info);
    const check = probe(out);
    const sizeDepois = fs.statSync(out).size;

    // VERIFICACOES DE SEGURANCA
    const erros = [];
    if (check.width < MIN_W || check.height < MIN_H) erros.push(`resolucao final ${check.width}x${check.height} abaixo do piso`);
    if (check.width > info.width || check.height > info.height) erros.push('houve upscale (proibido)');
    if (sizeDepois > HARD_MAX_MB * 1024 ** 2) erros.push(`ficou com ${(sizeDepois / 1024 ** 2).toFixed(1)}MB (acima do teto)`);
    if (sizeDepois >= sizeAntes) erros.push('nao reduziu');
    if (Math.abs(check.duration - info.duration) > 1) erros.push('duracao divergente');

    const ok = erros.length === 0;
    antes += sizeAntes; depois += sizeDepois;

    console.log(`${base}`);
    console.log(`   ${info.width}x${info.height} ${(sizeAntes / 1024 ** 2).toFixed(1)}MB  ->  ${check.width}x${check.height} ${(sizeDepois / 1024 ** 2).toFixed(1)}MB  ${downscaled ? '(reduzido p/ 720x1280)' : '(resolucao preservada)'}`);
    console.log(`   ${ok ? 'OK - passou na verificacao' : 'FALHOU: ' + erros.join('; ')}`);

    if (ok && APPLY) {
      await bucket.upload(out, { destination: remote, metadata: { contentType: 'video/mp4', metadata: {} } });
      await bucket.file(remote).makePublic();
      console.log('   ENVIADO para ' + remote);
    }
    console.log('');
    resultados.push({ remote, ok });
  }

  console.log('=== RESUMO ===');
  console.log(`Total antes:  ${(antes / 1024 ** 2).toFixed(1)} MB`);
  console.log(`Total depois: ${(depois / 1024 ** 2).toFixed(1)} MB`);
  console.log(`Reducao: ${(100 - (depois / antes) * 100).toFixed(1)}%`);
  console.log(`Aprovados: ${resultados.filter(r => r.ok).length}/${resultados.length}`);
  if (!APPLY) console.log('\nDry-run: rode com --apply para enviar.');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
