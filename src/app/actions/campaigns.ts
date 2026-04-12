'use server';

import { db } from '@/lib/firebase-admin';
import { Campaign } from '@/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const DEFAULT_ORG = 'dev-org';

export async function createCampaignAction(state: any, formData: FormData) {
  const name = formData.get('name') as string;
  
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  if (!name) {
    return { error: 'O nome da Campanha é obrigatório.' };
  }

  try {
    const campaignsRef = db.collection('campaigns');
    
    // Check if it's the first campaign to make it default
    const existing = await campaignsRef.where('organizationId', '==', DEFAULT_ORG).limit(1).get();
    const isDefault = existing.empty;

    const newCampaign: Partial<Campaign> = {
      name,
      slug,
      isDefault,
      organizationId: DEFAULT_ORG,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await campaignsRef.add(newCampaign);
  } catch (error) {
    console.error('Error creating campaign', error);
    return { error: 'Erro ao criar a campanha. Tente novamente.' };
  }

  revalidatePath('/dashboard/campaigns');
  redirect('/dashboard/campaigns');
}

export async function setDefaultCampaignAction(campaignId: string) {
  try {
    const campaignsRef = db.collection('campaigns');
    const snapshot = await campaignsRef.where('organizationId', '==', DEFAULT_ORG).get();
    
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      if (doc.id === campaignId) {
        batch.update(doc.ref, { isDefault: true, updatedAt: new Date().toISOString() });
      } else if (doc.data().isDefault) {
        // Remove default from others
        batch.update(doc.ref, { isDefault: false, updatedAt: new Date().toISOString() });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error setting default campaign', error);
    throw new Error('Erro ao definir padrão');
  }

  revalidatePath('/dashboard/campaigns');
  revalidatePath('/dashboard/creatives');
}

export async function deleteCampaignAction(id: string) {
  try {
    await db.collection('campaigns').doc(id).delete();
  } catch (error) {
    console.error('Error deleting campaign', error);
    throw new Error('Fallback action failure');
  }
  
  revalidatePath('/dashboard/campaigns');
}
