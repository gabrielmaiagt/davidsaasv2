import { create } from 'xmlbuilder2';

/**
 * Gerador de feed COM UTM — versão em teste.
 *
 * Arquivo isolado de propósito: não importa nada de `exports.ts` e não é
 * importado por nenhuma rota de produção. O feed que está no ar hoje
 * (`/api/feed/[campaignId]`) continua rodando exatamente o mesmo código de
 * antes, sem nenhuma linha alterada.
 */

const GENERIC_PRICES = [19.90, 24.90, 29.90, 39.90, 40.00, 44.90, 49.90, 59.90, 79.90];

function getRandomPrice(seed: string) {
  const charCodeSum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GENERIC_PRICES[charCodeSum % GENERIC_PRICES.length];
}

const GOOGLE_CATEGORY_FALLBACK = 'Home & Garden';

function resolveGoogleCategory(value?: string) {
  if (!value) return GOOGLE_CATEGORY_FALLBACK;
  const v = value.trim();
  const ehValido = /^\d+$/.test(v) || v.includes('>');
  return ehValido ? v : GOOGLE_CATEGORY_FALLBACK;
}

/**
 * Acrescenta o rastreamento ao link de destino.
 *
 * utm_content recebe o SKU porque ele é o único campo realmente único por
 * criativo — os títulos se repetem (na campanha atual são 510 títulos para
 * 6.668 produtos), então usar título não permitiria identificar a venda.
 *
 * As demais macros são preenchidas pelo próprio TikTok no momento do clique.
 */
export function appendUtm(url: string, campaign: any, item: any): string {
  if (!url) return url;

  const params = new URLSearchParams({
    utm_source: 'tiktok',
    utm_medium: 'cpc',
    utm_campaign: '__CAMPAIGN_NAME__',
    utm_content: item?.sku || item?.id || '',
    utm_term: '__CID__',
  });

  const cid = campaign?.cid || campaign?.slug || '';
  if (cid) params.set('cid', cid);

  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${params.toString()}`;
}

export function createXMLWithUtm(creatives: any[], campaignsMap: any) {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
    .ele('channel');

  const primeiraCampanha: any = Object.values(campaignsMap || {})[0] || {};
  const siteDaLoja = primeiraCampanha.defaultLink || '';

  root.ele('title').txt(primeiraCampanha.name ? `${primeiraCampanha.name} - Catálogo` : 'Creative Feed');
  if (siteDaLoja) root.ele('link').txt(siteDaLoja);
  root.ele('description').txt(primeiraCampanha.defaultDescription || 'Catálogo de produtos');

  creatives.forEach(item => {
    const campaign = campaignsMap[item.campaignId] || {};
    const defaultUrl = campaign.defaultLink || '';
    const linkBase = item.finalUrl || defaultUrl || 'https://creative-feed.local';
    const link = appendUtm(linkBase, campaign, item);

    const xmlItem = root.ele('item');
    xmlItem.ele('g:id').txt(item.sku || item.id);
    xmlItem.ele('g:title').txt(item.title);
    xmlItem.ele('g:description').txt(item.description || campaign.defaultDescription || item.title);
    xmlItem.ele('g:link').txt(link);
    xmlItem.ele('g:image_link').txt(item.imageUrl || '');

    const videoLink = campaign.dedupeVideos && item.videoUrl
      ? item.videoUrl.split('?')[0]
      : item.videoUrl;
    if (videoLink) xmlItem.ele('g:video_link').txt(videoLink);

    xmlItem.ele('g:availability').txt(item.availability || campaign.availability || 'in stock');
    xmlItem.ele('g:condition').txt(item.condition || campaign.condition || 'new');

    const priceVal = item.price || campaign.defaultPrice || getRandomPrice(item.id);
    const currencyVal = campaign.currency || 'BRL';
    xmlItem.ele('g:price').txt(`${priceVal} ${currencyVal}`);

    xmlItem.ele('g:brand').txt(item.brand || campaign.brand || 'Loja Oficial');

    const categoryVal = item.category || campaign.category || 'Geral';
    xmlItem.ele('g:google_product_category').txt(
      resolveGoogleCategory(campaign.googleCategory || item.category || campaign.category)
    );
    xmlItem.ele('g:product_type').txt(categoryVal);
  });

  return root.end({ prettyPrint: true });
}
