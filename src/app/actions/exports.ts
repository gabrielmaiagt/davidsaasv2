'use server';

import { db, storage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { create } from 'xmlbuilder2';
import * as Papa from 'papaparse';
import * as xlsx from 'xlsx';
import { Creative, Offer } from '@/types';

function createXML(creatives: any[], offersMap: any) {
  // TikTok Ads standard catalog format
  const root = create({ version: '1.0', encoding: 'UTF-8' }).ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' }).ele('channel');
  
  root.ele('title').txt('Creative Feed');
  root.ele('link').txt('https://creative-feed.local');
  root.ele('description').txt('Products feed for direct response ads');

  creatives.forEach(item => {
    const offerUrl = offersMap[item.offerId]?.defaultFinalUrl || '';
    const link = item.finalUrl || offerUrl || 'https://creative-feed.local/product';

    const xmlItem = root.ele('item');
    xmlItem.ele('g:id').txt(item.sku || item.id);
    xmlItem.ele('g:title').txt(item.title);
    xmlItem.ele('g:description').txt(item.description || item.title);
    xmlItem.ele('g:link').txt(link);
    xmlItem.ele('g:image_link').txt(item.imageUrl || '');
    if (item.videoUrl) xmlItem.ele('g:video_link').txt(item.videoUrl); // TikTok uses video_link or video_url
    xmlItem.ele('g:availability').txt(item.availability || 'in stock');
    xmlItem.ele('g:condition').txt('new');
    if (item.price) xmlItem.ele('g:price').txt(`${item.price} USD`);
    xmlItem.ele('g:brand').txt(item.brand || 'Generic');
    xmlItem.ele('g:product_type').txt(item.category || '');
  });

  return root.end({ prettyPrint: true });
}

function createCSV(creatives: any[], offersMap: any) {
  const data = creatives.map(item => {
    const offerUrl = offersMap[item.offerId]?.defaultFinalUrl || '';
    return {
      id: item.sku || item.id,
      title: item.title,
      description: item.description,
      availability: item.availability || 'in stock',
      condition: 'new',
      price: item.price ? `${item.price} USD` : '',
      link: item.finalUrl || offerUrl || '',
      image_link: item.imageUrl || '',
      video_link: item.videoUrl || '',
      brand: item.brand || 'Generic',
      product_type: item.category || ''
    };
  });
  return Papa.unparse(data);
}

function createXLSX(creatives: any[], offersMap: any) {
  const data = creatives.map(item => {
    const offerUrl = offersMap[item.offerId]?.defaultFinalUrl || '';
    return {
      id: item.sku || item.id,
      title: item.title,
      description: item.description,
      availability: item.availability || 'in stock',
      condition: 'new',
      price: item.price ? `${item.price} USD` : '',
      link: item.finalUrl || offerUrl || '',
      image_link: item.imageUrl || '',
      video_link: item.videoUrl || '',
      brand: item.brand || 'Generic',
      product_type: item.category || ''
    };
  });
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(wb, ws, "Feed");
  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export async function generateExportAction(formData: FormData) {
  const type = formData.get('type') as 'xml' | 'csv' | 'xlsx';
  const offerId = formData.get('offerId') as string;

  // 1. Fetch creatives
  let query: admin.firestore.Query = db.collection('creatives').where('organizationId', '==', 'dev-org');
  if (offerId) {
    query = query.where('offerId', '==', offerId);
  }
  
  const snap = await query.get();
  const creatives = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Fetch Offers for Mapping URLs
  const offersSnap = await db.collection('offers').where('organizationId', '==', 'dev-org').get();
  const offersMap = offersSnap.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data();
    return acc;
  }, {} as any);

  let buffer: Buffer;
  let contentType = '';
  let extension = '';

  if (type === 'xml') {
    const xml = createXML(creatives, offersMap);
    buffer = Buffer.from(xml, 'utf-8');
    contentType = 'application/xml';
    extension = 'xml';
  } else if (type === 'csv') {
    const csv = createCSV(creatives, offersMap);
    buffer = Buffer.from(csv, 'utf-8');
    contentType = 'text/csv';
    extension = 'csv';
  } else {
    buffer = createXLSX(creatives, offersMap) as Buffer;
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    extension = 'xlsx';
  }

  // Upload to Storage
  const filename = `exports/${Date.now()}-feed.${extension}`;
  const bucket = storage.bucket();
  const fileRef = bucket.file(filename);

  await fileRef.save(buffer, {
    metadata: { contentType },
  });
  await fileRef.makePublic();

  const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

  // Save to History
  const exportRecord = {
    organizationId: 'dev-org',
    offerId: offerId || null,
    type,
    filtersApplied: { offerId },
    fileUrl,
    createdAt: new Date().toISOString(),
    createdBy: 'Admin', // Pegaria do session handler
  };

  await db.collection('exports').add(exportRecord);
  revalidatePath('/dashboard/exports');
  
  return { fileUrl };
}
