// Auditoria rigorosa do XML que a gente entrega pro TikTok.
// Uso: node scripts/audit-feed.cjs <feedToken-ou-id>
const https = require('https');

const token = process.argv[2] || 'h6womyhynuio892b';
const url = `https://davidnovov3.vercel.app/api/feed/${token}.xml`;

function get(u) {
  return new Promise((resolve, reject) => {
    https.get(u, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

function tag(item, name) {
  const m = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1] : null;
}

(async () => {
  console.log('Baixando', url);
  const res = await get(url);
  const xml = res.body;
  console.log('Status:', res.status, '| Tamanho:', (xml.length / 1024 ** 2).toFixed(2), 'MB');
  console.log('Content-Type:', res.headers['content-type']);

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  console.log('Itens:', items.length, '\n');

  // ---- cabecalho do canal
  const channelLink = xml.match(/<channel>[\s\S]*?<link>([\s\S]*?)<\/link>/)?.[1];
  console.log('=== CABECALHO ===');
  console.log('channel <link>:', channelLink);
  if (channelLink && /\.local|localhost|example\./i.test(channelLink)) {
    console.log('  >> PROBLEMA: dominio inexistente/inacessivel no <link> do canal');
  }
  console.log('');

  // ---- analise item a item
  const ids = new Map();
  const problemas = {
    idDuplicado: [], tituloVazio: [], tituloCurto: [], tituloEstranho: [],
    semImagem: [], semVideo: [], linkInvalido: [], categoriaInvalida: [],
    precoInvalido: [], caracteresInvalidos: [], descVazia: [],
  };
  const categorias = new Set(), brands = new Set(), links = new Set();
  const videos = new Set(), imagens = new Set();

  for (const it of items) {
    const id = tag(it, 'g:id');
    const title = tag(it, 'g:title');
    const desc = tag(it, 'g:description');
    const link = tag(it, 'g:link');
    const img = tag(it, 'g:image_link');
    const vid = tag(it, 'g:video_link');
    const cat = tag(it, 'g:google_product_category');
    const price = tag(it, 'g:price');
    const brand = tag(it, 'g:brand');

    if (id) { if (ids.has(id)) problemas.idDuplicado.push(id); ids.set(id, true); }

    if (!title || !title.trim()) problemas.tituloVazio.push(id);
    else {
      if (title.trim().length < 3) problemas.tituloCurto.push(`${id}: "${title}"`);
      // titulo que é só simbolo/numero, sem palavra real
      if (!/[a-zA-ZÀ-ÿ]{3,}/.test(title)) problemas.tituloEstranho.push(`${id}: "${title}"`);
    }
    if (!desc || !desc.trim()) problemas.descVazia.push(id);
    if (!img) problemas.semImagem.push(id); else imagens.add(img);
    if (!vid) problemas.semVideo.push(id); else videos.add(vid.split('?')[0]);
    if (!link || !/^https?:\/\//.test(link)) problemas.linkInvalido.push(`${id}: ${link}`);
    else links.add(link);
    if (cat) { categorias.add(cat); if (!/^\d+$/.test(cat) && !cat.includes('>')) problemas.categoriaInvalida.push(cat); }
    if (!price || !/^\d+(\.\d+)?\s+[A-Z]{3}$/.test(price)) problemas.precoInvalido.push(`${id}: ${price}`);
    if (brand) brands.add(brand);

    // caracteres de controle invalidos em XML
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(it)) problemas.caracteresInvalidos.push(id);
  }

  console.log('=== DIVERSIDADE ===');
  console.log('IDs unicos:', ids.size, '/', items.length);
  console.log('Videos fisicos distintos:', videos.size);
  console.log('Imagens distintas:', imagens.size);
  console.log('Links de destino distintos:', links.size, links.size <= 3 ? `-> ${[...links].slice(0, 3).join(' , ')}` : '');
  console.log('Categorias:', [...categorias].join(', '));
  console.log('Marcas:', [...brands].slice(0, 5).join(', '));
  console.log('');

  console.log('=== PROBLEMAS ===');
  const sev = {
    idDuplicado: 'CRITICO', semVideo: 'CRITICO', semImagem: 'CRITICO',
    linkInvalido: 'CRITICO', caracteresInvalidos: 'CRITICO', precoInvalido: 'ALTO',
    tituloVazio: 'ALTO', tituloEstranho: 'ALTO', tituloCurto: 'MEDIO',
    categoriaInvalida: 'MEDIO', descVazia: 'BAIXO',
  };
  let achou = false;
  for (const [k, v] of Object.entries(problemas)) {
    if (!v.length) continue;
    achou = true;
    const uniq = [...new Set(v)];
    console.log(`[${sev[k]}] ${k}: ${v.length} ocorrencia(s)`);
    uniq.slice(0, 5).forEach(x => console.log('      ex:', x));
  }
  if (!achou) console.log('Nenhum problema estrutural encontrado.');
})();
