require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');

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

const FFMPEG = 'C:\\Users\\Gabri\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe';
const LOCAL_DIR = 'C:\\Users\\Gabri\\Downloads\\dd';

const MAP = [
  { local: '1.MP4', remote: 'videos/1786486086725-1.MP4' },
  { local: '2.MP4', remote: 'videos/1786486091906-2.MP4' },
  { local: '3.MP4', remote: 'videos/1786486096401-3.MP4' },
  { local: '4.MP4', remote: 'videos/1786486100532-4.MP4' },
  { local: '5.MP4', remote: 'videos/1786486105323-5.MP4' },
  { local: '6.MP4', remote: 'videos/1786486109410-6.MP4' },
];

function upscale(input, output) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y', '-i', input,
      '-vf', 'scale=720:1280',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      output,
    ];
    const proc = spawn(FFMPEG, args);
    let stderr = '';
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg saiu com código ${code}: ${stderr.slice(-800)}`)));
  });
}

async function main() {
  const bucket = admin.storage().bucket();

  for (const { local, remote } of MAP) {
    const inputPath = path.join(LOCAL_DIR, local);
    const outputPath = path.join(os.tmpdir(), `upscaled-${local}`);

    console.log(`\n=== ${local} ===`);
    console.log('Escalando pra 720x1280...');
    await upscale(inputPath, outputPath);

    const size = fs.statSync(outputPath).size;
    console.log(`Gerado: ${(size / 1024 / 1024).toFixed(2)}MB`);

    console.log(`Subindo -> ${remote} ...`);
    await bucket.upload(outputPath, {
      destination: remote,
      metadata: { contentType: 'video/mp4', metadata: {} },
    });
    await bucket.file(remote).makePublic();
    console.log(`OK: ${remote} atualizado (720x1280) e público.`);

    fs.unlinkSync(outputPath);
  }

  console.log('\nTodos os 6 vídeos escalados e restaurados com sucesso.');
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
