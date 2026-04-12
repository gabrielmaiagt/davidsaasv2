'use server';

import { db, storage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { create } from 'xmlbuilder2';
import * as Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { Creative, Campaign } from '@/types';
import { getOrganizationId, getSession } from '@/lib/session';

const GENERIC_PRICES = [19.90, 24.90, 29.90, 39.90, 40.00, 44.90, 49.90, 59.90, 79.90];

function getRandomPrice(seed: string) {
  // Usa o ID do item para garantir que o preço seja "aleatório" mas consistente para o mesmo item
  const charCodeSum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GENERIC_PRICES[charCodeSum % GENERIC_PRICES.length];
}

export async function createXML(creatives: any[], campaignsMap: any) {
  // TikTok Ads standard catalog format
  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' }).ele('channel');
  
  root.ele('title').txt('Creative Feed');
  root.ele('link').txt('https://creative-feed.local');
  root.ele('description').txt('Products feed for direct response ads');

  creatives.forEach(item => {
    const campaign = campaignsMap[item.campaignId] || {};
    const defaultUrl = campaign.defaultLink || '';
    const link = item.finalUrl || defaultUrl || 'https://creative-feed.local';

    const xmlItem = root.ele('item');
    xmlItem.ele('g:id').txt(item.sku || item.id);
    xmlItem.ele('g:title').txt(item.title);
    xmlItem.ele('g:description').txt(item.description || campaign.defaultDescription || item.title);
    xmlItem.ele('g:link').txt(link);
    xmlItem.ele('g:image_link').txt(item.imageUrl || '');
    if (item.videoUrl) xmlItem.ele('g:video_link').txt(item.videoUrl);
    xmlItem.ele('g:availability').txt(item.availability || campaign.availability || 'in stock');
    xmlItem.ele('g:condition').txt(item.condition || campaign.condition || 'new');
    
    // Preço inteligente: Usa o do item, da campanha ou gera um aleatório genérico (Ghost Price)
    const priceVal = item.price || campaign.defaultPrice || getRandomPrice(item.id);
    const currencyVal = campaign.currency || 'BRL';
    xmlItem.ele('g:price').txt(`${priceVal} ${currencyVal}`);
    
    xmlItem.ele('g:brand').txt(item.brand || campaign.brand || 'Loja Oficial');
    
    // Melhorando a performance de entrega com categorias
    const categoryVal = item.category || campaign.category || 'Geral';
    xmlItem.ele('g:google_product_category').txt(categoryVal);
    xmlItem.ele('g:product_type').txt(categoryVal);
  });

  return root.end({ prettyPrint: true });
}

function createCSV(creatives: any[], campaignsMap: any) {
  const data = creatives.map((item: any) => {
    const campaign = campaignsMap[item.campaignId] || {};
    const defaultUrl = campaign.defaultLink || '';
    const priceVal = item.price || campaign.defaultPrice || getRandomPrice(item.id);
    const currencyVal = campaign.currency || 'BRL';

    return {
      id: item.sku || item.id,
      title: item.title,
      description: item.description || campaign.defaultDescription || item.title,
      availability: item.availability || campaign.availability || 'in stock',
      condition: item.condition || campaign.condition || 'new',
      price: `${priceVal} ${currencyVal}`,
      link: item.finalUrl || defaultUrl || '',
      image_link: item.imageUrl || '',
      video_link: item.videoUrl || '',
      brand: item.brand || campaign.brand || 'Loja Oficial',
      product_type: item.category || campaign.category || 'Geral'
    };
  });
  return Papa.unparse(data);
}

function createXLSX(creatives: any[], campaignsMap: any) {
  const data = creatives.map((item: any) => {
    const campaign = campaignsMap[item.campaignId] || {};
    const defaultUrl = campaign.defaultLink || '';
    const priceVal = item.price || campaign.defaultPrice || getRandomPrice(item.id);
    const currencyVal = campaign.currency || 'BRL';

    return {
      id: item.sku || item.id,
      title: item.title,
      description: item.description || campaign.defaultDescription || item.title,
      availability: item.availability || campaign.availability || 'in stock',
      condition: item.condition || campaign.condition || 'new',
      price: `${priceVal} ${currencyVal}`,
      link: item.finalUrl || defaultUrl || '',
      image_link: item.imageUrl || '',
      video_link: item.videoUrl || '',
      brand: item.brand || campaign.brand || 'Loja Oficial',
      product_type: item.category || campaign.category || 'Geral'
    };
  });
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, "Feed");
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function generateExportAction(state: any, formData: FormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { error: 'Não autorizado' };

  const session = await getSession();

  const type = formData.get('type') as 'xml' | 'csv' | 'xlsx';
  const campaignId = formData.get('campaignId') as string;

  // 1. Fetch creatives
  let query: any = db.collection('creatives').where('organizationId', '==', orgId);
  if (campaignId) {
    query = query.where('campaignId', '==', campaignId);
  }
  
  const snap = await query.get();
  const creatives = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

  // 2. Fetch Campaigns for Mapping URLs
  const campaignsSnap = await db.collection('campaigns').where('organizationId', '==', orgId).get();
  const campaignsMap = campaignsSnap.docs.reduce((acc: any, doc: any) => {
    acc[doc.id] = doc.data();
    return acc;
  }, {} as any);

  let buffer: Buffer;
  let contentType = '';
  let extension = '';

  if (type === 'xml') {
    const xml = await createXML(creatives, campaignsMap);
    buffer = Buffer.from(xml, 'utf-8');
    contentType = 'application/xml';
    extension = 'xml';
  } else if (type === 'csv') {
    const csv = createCSV(creatives, campaignsMap);
    buffer = Buffer.from(csv, 'utf-8');
    contentType = 'text/csv';
    extension = 'csv';
  } else {
    buffer = createXLSX(creatives, campaignsMap) as Buffer;
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    extension = 'xlsx';
  }

  // Upload to Storage
  const filename = `exports/${orgId}/${Date.now()}-feed.${extension}`;
  const bucket = storage.bucket();
  const fileRef = bucket.file(filename);

  await fileRef.save(buffer, {
    metadata: { contentType },
  });
  await fileRef.makePublic();

  const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  // Save to History
  const exportRecord = {
    organizationId: orgId,
    campaignId: campaignId || null,
    type,
    filtersApplied: { campaignId },
    fileUrl,
    createdAt: new Date().toISOString(),
    createdBy: session?.userId || 'System',
  };

  await db.collection('exports').add(exportRecord);
  revalidatePath('/dashboard/exports');
  
  return { fileUrl };
}
