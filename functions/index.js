const { onObjectFinalized } = require('firebase-functions/v2/storage');
const { initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const { spawn } = require('child_process');

initializeApp();

const BUCKET = 'davidsaas-d74b2.firebasestorage.app';

// Roda automaticamente toda vez que um vídeo novo entra em videos/.
// Baixa, recomprime (menor resolução/bitrate) e sobrescreve o mesmo arquivo
// no mesmo caminho — a URL pública do criativo nunca muda, então nada no
// app (CreativeForm, createCreativeAction, feed) precisa saber disso.
exports.compressCreativeVideo = onObjectFinalized(
  {
    bucket: BUCKET,
    region: 'us-east1',
    memory: '2GiB',
    cpu: 2,
    timeoutSeconds: 540,
  },
  async (event) => {
    const object = event.data;
    const filePath = object.name;
    const contentType = object.contentType || '';

    if (!filePath || !filePath.startsWith('videos/')) return;
    if (!contentType.startsWith('video/')) return;

    // Evita loop infinito: quando a própria function sobrescreve o arquivo,
    // ela marca esse metadata — na próxima chamada (disparada pela sobrescrita), pula.
    if (object.metadata?.compressed === 'true') {
      console.log(`Já comprimido, pulando: ${filePath}`);
      return;
    }

    const bucket = getStorage().bucket(object.bucket);
    const fileName = path.basename(filePath);
    const tempIn = path.join(os.tmpdir(), `in-${Date.now()}-${fileName}`);
    const tempOut = path.join(os.tmpdir(), `out-${Date.now()}-${fileName}`);

    try {
      console.log(`Baixando ${filePath} (${object.size} bytes)...`);
      await bucket.file(filePath).download({ destination: tempIn });

      console.log('Comprimindo com ffmpeg...');
      await new Promise((resolve, reject) => {
        const args = [
          '-y',
          '-i', tempIn,
          // Reduz resolução só se for maior que 1280px no lado maior; nunca amplia vídeo pequeno
          '-vf', "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'",
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '26',
          '-c:a', 'aac',
          '-b:a', '96k',
          '-movflags', '+faststart',
          tempOut,
        ];
        const proc = spawn(ffmpegPath, args);
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', reject);
        proc.on('exit', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg saiu com código ${code}: ${stderr.slice(-500)}`));
        });
      });

      const originalSize = fs.statSync(tempIn).size;
      const compressedSize = fs.statSync(tempOut).size;
      console.log(`Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> Comprimido: ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);

      // Só substitui se realmente ficou menor (não regrava por nada / não piora)
      if (compressedSize > 0 && compressedSize < originalSize) {
        await bucket.upload(tempOut, {
          destination: filePath,
          metadata: {
            contentType: 'video/mp4',
            metadata: { compressed: 'true' },
          },
        });
        await bucket.file(filePath).makePublic();
        console.log(`Substituído com sucesso: ${filePath}`);
      } else {
        console.log(`Compressão não reduziu o tamanho, mantendo original: ${filePath}`);
      }
    } catch (err) {
      console.error(`Erro comprimindo ${filePath}:`, err);
    } finally {
      for (const f of [tempIn, tempOut]) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
      }
    }
  }
);
