const TITLE_TEMPLATES = [
  (b: string) => b,
  (b: string) => `✦ ${b}`,
  (b: string) => `${b} | Original`,
  (b: string) => `${b} • Exclusivo`,
  (b: string) => `${b} - Premium`,
  (b: string) => `${b} | Destaque`,
  (b: string) => `Exclusivo ${b}`,
  (b: string) => `${b} ✓`,
  (b: string) => `${b} - Oficial`,
  (b: string) => `${b} | Especial`,
  (b: string) => `Descubra ${b}`,
  (b: string) => `${b} • Único`,
  (b: string) => `${b} - Autêntico`,
  (b: string) => `${b} | Top Pick`,
  (b: string) => `${b} ✦`,
  (b: string) => `Original ${b}`,
  (b: string) => `${b} → Confira`,
  (b: string) => `${b} - Selecionado`,
  (b: string) => `Premium ${b}`,
  (b: string) => `Garanta ${b}`,
];

const DESC_OPENERS = [
  '',
  'Produto de alta qualidade. ',
  'Item premium e original. ',
  'Selecionado especialmente para você. ',
  'Qualidade garantida. ',
  'Oferta exclusiva. ',
  'Produto autêntico e original. ',
  'Escolha inteligente. ',
  'Alta performance e qualidade. ',
  'Item exclusivo e diferenciado. ',
];

const DESC_CLOSERS = [
  '',
  ' Aproveite!',
  ' Garanta o seu.',
  ' Estoque limitado.',
  ' Entrega garantida.',
  ' Qualidade certificada.',
  ' Melhor custo-benefício.',
  ' Produto verificado.',
  ' Satisfação garantida.',
  ' Compre agora.',
];

// Micro price variations that stay realistic (±R$3, always ending naturally)
const PRICE_OFFSETS = [0, -1, -2, -3, 1, -0.1, -1.1, -2.1, 0.9, -0.9];

function cleanBaseTitle(title: string): string {
  return title
    .replace(/\s*\(Clone\s*\d+\)\s*/gi, '')
    .replace(/\s*-\s*(BC|C)\d+-[A-Z0-9]+\s*/g, '')
    .replace(/\s*(✦|✓|→)\s*/g, '')
    .replace(/\s*\|\s*(Original|Exclusivo|Premium|Destaque|Especial|Top Pick|Único|Autêntico|Oficial)\s*/gi, '')
    .replace(/\s*•\s*(Exclusivo|Único|Autêntico)\s*/gi, '')
    .replace(/^(Exclusivo|Original|Premium|Descubra|Garanta|Selecionado)\s+/gi, '')
    .replace(/\s+(Oficial|Exclusivo|Autêntico|Selecionado|Genuíno)\s*$/gi, '')
    .replace(/\s*-\s*(Oficial|Premium|Autêntico|Selecionado)\s*/gi, '')
    .trim();
}

export function diversifyCreative(original: any, globalIndex: number) {
  const n = globalIndex;

  // Title
  const base = cleanBaseTitle(original.title || '');
  const titleFn = TITLE_TEMPLATES[n % TITLE_TEMPLATES.length];
  const newTitle = base ? titleFn(base) : original.title;

  // URL — add unique ref per SKU so every URL is distinct
  let newUrl = original.finalUrl || '';
  if (newUrl) {
    const sep = newUrl.includes('?') ? '&' : '?';
    // Remove previous ref param if exists to avoid stacking
    newUrl = newUrl.replace(/[?&]ref=[^&]*/g, '').replace(/\?$/, '');
    const sep2 = newUrl.includes('?') ? '&' : '?';
    newUrl = `${newUrl}${sep2}ref=${original.sku}`;
  }

  // Description
  const baseDesc = (original.description || '').replace(/^(Produto de alta qualidade\.|Item premium e original\.|Selecionado especialmente para você\.|Qualidade garantida\.|Oferta exclusiva\.|Produto autêntico e original\.|Escolha inteligente\.|Alta performance e qualidade\.|Item exclusivo e diferenciado\.)\s*/i, '').replace(/\s*(Aproveite!|Garanta o seu\.|Estoque limitado\.|Entrega garantida\.|Qualidade certificada\.|Melhor custo-benefício\.|Produto verificado\.|Satisfação garantida\.|Compre agora\.)$/i, '').trim();
  const opener = DESC_OPENERS[n % DESC_OPENERS.length];
  const closer = DESC_CLOSERS[Math.floor(n / DESC_OPENERS.length) % DESC_CLOSERS.length];
  const newDesc = `${opener}${baseDesc}${closer}`.trim();

  // Price micro-variation
  const basePrice = typeof original.price === 'number' ? original.price : 0;
  const offset = PRICE_OFFSETS[n % PRICE_OFFSETS.length];
  const newPrice = basePrice > 0 ? Math.max(1, Math.round((basePrice + offset) * 100) / 100) : basePrice;

  // videoUrl — append ?v={sku} so each creative has a unique video URL
  let newVideoUrl = original.videoUrl || '';
  if (newVideoUrl) {
    newVideoUrl = newVideoUrl.replace(/[?&]v=[^&]*/g, '').replace(/\?$/, '');
    const vSep = newVideoUrl.includes('?') ? '&' : '?';
    newVideoUrl = `${newVideoUrl}${vSep}v=${original.sku}`;
  }

  return {
    title: newTitle,
    finalUrl: newUrl || original.finalUrl,
    videoUrl: newVideoUrl || original.videoUrl,
    description: newDesc || original.description,
    price: newPrice || original.price,
  };
}
