// RESTAURACAO A PARTIR DE UM BACKUP FEITO POR backup-full.cjs
//
// Uso:
//   node scripts/restore-full.cjs --from "<pasta>"                 (simulacao, nao grava)
//   node scripts/restore-full.cjs --from "<pasta>" --apply          (restaura TUDO)
//   node scripts/restore-full.cjs --from "<pasta>" --apply --so-firestore
//   node scripts/restore-full.cjs --from "<pasta>" --apply --so-storage
//   ... --apagar-extras   remove documentos/arquivos que NAO existem no backup
//
// Sem --apply nada e gravado: ele so mostra o que faria.

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

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

const APPLY = process.argv.includes('--apply');
const SO_FS = process.argv.includes('--so-firestore');
const SO_ST = process.argv.includes('--so-storage');
const APAGAR_EXTRAS = process.argv.includes('--apagar-extras');

function argFrom() {
  const i = process.argv.indexOf('--from');
  if (i > -1 && process.argv[i + 1]) return process.argv[i + 1];
  console.error('Informe a pasta do backup: --from "<pasta>"');
  process.exit(1);
}

function mb(n) { return (n / 1024 ** 2).toFixed(1) + ' MB'; }

async function main() {
  const raiz = argFrom();
  if (!fs.existsSync(raiz)) { console.error('Pasta nao encontrada:', raiz); process.exit(1); }

  const meta = JSON.parse(fs.readFileSync(path.join(raiz, 'meta.json'), 'utf8'));
  console.log('=== RESTAURACAO ===');
  console.log(APPLY ? '*** MODO APPLY — VAI GRAVAR NA PRODUCAO ***' : 'SIMULACAO (nada sera gravado)');
  console.log('');
  console.log('Backup de:', meta.feitoEm);
  console.log('Projeto:  ', meta.projeto);
  console.log('Codigo:   ', meta.git?.commitCurto, '-', meta.git?.mensagem);
  console.log('Feeds no backup:');
  (meta.feeds || []).forEach(f => console.log('   ', f.campanha.padEnd(24), 'token:', f.token, '|', f.produtos, 'produtos'));
  console.log('');

  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  // ---------- FIRESTORE ----------
  if (!SO_ST) {
    console.log('[FIRESTORE]');
    const dirFs = path.join(raiz, 'firestore');
    for (const arq of fs.readdirSync(dirFs)) {
      const col = path.basename(arq, '.json');
      const docs = JSON.parse(fs.readFileSync(path.join(dirFs, arq), 'utf8'));

      const atuais = await db.collection(col).get();
      const idsBackup = new Set(docs.map(d => d.__id));
      const extras = atuais.docs.filter(d => !idsBackup.has(d.id));

      console.log(`   ${col}: ${docs.length} no backup | ${atuais.size} hoje | ${extras.length} nao existem no backup`);

      if (!APPLY) continue;

      for (let i = 0; i < docs.length; i += 400) {
        const batch = db.batch();
        docs.slice(i, i + 400).forEach(d => {
          const { __id, ...dados } = d;
          batch.set(db.collection(col).doc(__id), dados); // set = volta exatamente ao estado do backup
        });
        await batch.commit();
        process.stdout.write(`\r      restaurados ${Math.min(i + 400, docs.length)}/${docs.length}`);
      }
      process.stdout.write('\n');

      if (APAGAR_EXTRAS && extras.length) {
        for (let i = 0; i < extras.length; i += 400) {
          const batch = db.batch();
          extras.slice(i, i + 400).forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
        console.log(`      ${extras.length} documentos extras removidos`);
      }
    }
  }

  // ---------- STORAGE ----------
  if (!SO_FS) {
    console.log('\n[STORAGE]');
    const indice = JSON.parse(fs.readFileSync(path.join(raiz, 'storage-index.json'), 'utf8'));
    const dirSt = path.join(raiz, 'storage');

    const [atuais] = await bucket.getFiles();
    const mapaAtual = {};
    atuais.forEach(f => mapaAtual[f.name] = Number(f.metadata.size || 0));
    const nomesBackup = new Set(indice.map(i => i.nome));
    const extras = atuais.filter(f => !nomesBackup.has(f.name));

    let diferentes = 0, faltando = 0;
    indice.forEach(i => {
      if (!(i.nome in mapaAtual)) faltando++;
      else if (mapaAtual[i.nome] !== i.tamanho) diferentes++;
    });

    console.log(`   ${indice.length} arquivos no backup`);
    console.log(`   ${faltando} faltando na producao | ${diferentes} com conteudo diferente | ${extras.length} extras`);

    if (APPLY) {
      let enviados = 0;
      for (const i of indice) {
        const local = path.join(dirSt, i.nome.replace(/\//g, path.sep));
        if (!fs.existsSync(local)) continue;
        if (mapaAtual[i.nome] === i.tamanho) continue; // ja identico
        await bucket.upload(local, {
          destination: i.nome,
          metadata: { contentType: i.contentType, metadata: i.metadata || {} },
        });
        await bucket.file(i.nome).makePublic();
        enviados++;
        process.stdout.write(`\r      ${enviados} arquivos restaurados`);
      }
      process.stdout.write('\n');

      if (APAGAR_EXTRAS && extras.length) {
        for (const f of extras) await f.delete();
        console.log(`      ${extras.length} arquivos extras removidos`);
      }
    }

    // CORS
    if (APPLY && meta.corsDoBucket) {
      await bucket.setMetadata({ cors: meta.corsDoBucket });
      console.log('   CORS do bucket restaurado');
    }
  }

  console.log('\n=== ' + (APPLY ? 'RESTAURACAO CONCLUIDA' : 'SIMULACAO CONCLUIDA') + ' ===');
  if (!APPLY) console.log('Rode de novo com --apply para gravar de verdade.');
  else console.log('Lembrete: o codigo volta com "git checkout ' + (meta.git?.commitCurto || '<commit>') + '"');
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
