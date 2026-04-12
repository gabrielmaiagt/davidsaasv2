'use server';

import { db, storage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_ORG = 'dev-org';

export async function uploadFileToStorage(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) return '';
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  const bucket = storage.bucket();
  const fileRef = bucket.file(filename);
  
  await fileRef.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  // Make public to get url easily (or use makePublic())
  await fileRef.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

export async function createCreativeAction(state: any, formData: FormData) {
  const campaignId = formData.get('campaignId') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const finalUrl = formData.get('finalUrl') as string;
  const brand = formData.get('brand') as string;
  const category = formData.get('category') as string;
  const tagsStr = formData.get('tags') as string;
  const skuInput = formData.get('sku') as string;
  const status = formData.get('status') as string;
  const condition = formData.get('condition') as string;
  const availability = formData.get('availability') as string;
  const price = formData.get('price') ? Number(formData.get('price')) : null;

  const videoFile = formData.get('video') as File;
  const imageFile = formData.get('image') as File;

  const videoUrl = await uploadFileToStorage(videoFile, 'videos');
  const imageUrl = await uploadFileToStorage(imageFile, 'images');

  const generatedSku = skuInput || `SKU-${uuidv4().split('-')[0].toUpperCase()}`;

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  const creative = {
    organizationId: DEFAULT_ORG,
    campaignId,
    title,
    description,
    finalUrl,
    videoUrl,
    imageUrl,
    sku: generatedSku,
    externalId: generatedSku,
    brand,
    category,
    tags,
    price,
    availability,
    condition,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection('creatives').add(creative);
  
  revalidatePath('/dashboard/creatives');
  redirect('/dashboard/creatives');
}

export async function deleteCreativeAction(id: string) {
  await db.collection('creatives').doc(id).delete();
  revalidatePath('/dashboard/creatives');
}
