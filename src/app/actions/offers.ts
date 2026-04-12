'use server';

import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const DEFAULT_ORG = 'dev-org';

export async function createOfferAction(data: { name: string, status: string, description: string, defaultFinalUrl: string, defaultCategory: string }) {
  const { name, status, description, defaultFinalUrl, defaultCategory } = data;
  
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const offer = {
    organizationId: DEFAULT_ORG,
    name,
    slug,
    description,
    defaultFinalUrl,
    defaultCategory,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection('offers').add(offer);
  
  revalidatePath('/dashboard/offers');
  redirect('/dashboard/offers');
}

export async function updateOfferAction(id: string, data: { name: string, status: string, description: string, defaultFinalUrl: string, defaultCategory: string }) {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  await db.collection('offers').doc(id).update({
    ...data,
    slug,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath('/dashboard/offers');
  redirect('/dashboard/offers');
}

export async function deleteOfferAction(id: string) {
  // Lidar com criativos relacionados: em um sistema real faríamos um batch delete ou marcaríamos como inativo.
  // Para este MVP vamos deletar os criativos relacionados também via queries.
  const batch = db.batch();
  
  const offerRef = db.collection('offers').doc(id);
  batch.delete(offerRef);
  
  const creativesSnap = await db.collection('creatives').where('offerId', '==', id).get();
  creativesSnap.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  revalidatePath('/dashboard/offers');
}
