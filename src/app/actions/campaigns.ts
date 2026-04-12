'use server';

import { db } from '@/lib/firebase-admin';
import { Campaign } from '@/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getOrganizationId } from '@/lib/session';

export async function createCampaignAction(state: any, formData: FormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { error: 'Não autorizado' };

  const name = formData.get('name') as string;
  const defaultLink = formData.get('defaultLink') as string;
  const defaultDescription = formData.get('defaultDescription') as string || '';
  const defaultPrice = Number(formData.get('defaultPrice')) || 19.90;
  const currency = formData.get('currency') as string || 'BRL';
  const brand = formData.get('brand') as string || 'Premium Store';
  const category = formData.get('category') as string || 'Anúncios';
  
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  if (!name) {
    return { error: 'O nome da Campanha é obrigatório.' };
  }

  try {
    const campaignsRef = db.collection('campaigns');
    
    // Check if it's the first campaign for this org to make it default
    const existing = await campaignsRef.where('organizationId', '==', orgId).limit(1).get();
    const isDefault = existing.empty;

    const newCampaign: Partial<Campaign> = {
      name,
      slug,
      isDefault,
      defaultLink,
      defaultDescription,
      defaultPrice,
      currency,
      brand,
      category,
      organizationId: orgId,
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
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error('Não autorizado');

  try {
    const campaignsRef = db.collection('campaigns');
    const snapshot = await campaignsRef.where('organizationId', '==', orgId).get();
    
    const batch = db.batch();
    
    snapshot.docs.forEach((doc: any) => {
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

export async function updateCampaignAction(id: string, state: any, formData: FormData) {
  const orgId = await getOrganizationId();
  if (!orgId) return { error: 'Não autorizado' };

  const name = formData.get('name') as string;
  const defaultLink = formData.get('defaultLink') as string;
  const defaultDescription = formData.get('defaultDescription') as string;
  const currency = formData.get('currency') as string;
  const brand = formData.get('brand') as string;
  const category = formData.get('category') as string;

  if (!name || !id) {
    return { error: 'O nome da Campanha é obrigatório.' };
  }

  try {
    // Validate ownership before update
    const doc = await db.collection('campaigns').doc(id).get();
    if (!doc.exists || doc.data()?.organizationId !== orgId) {
      return { error: 'Acesso negado' };
    }

    await db.collection('campaigns').doc(id).update({
      name,
      defaultLink,
      defaultDescription,
      currency,
      brand,
      category,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating campaign', error);
    return { error: 'Erro ao atualizar a campanha.' };
  }

  revalidatePath('/dashboard/campaigns');
  redirect('/dashboard/campaigns');
}

export async function deleteCampaignAction(id: string) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error('Não autorizado');

  try {
    // Validate ownership
    const doc = await db.collection('campaigns').doc(id).get();
    if (doc.exists && doc.data()?.organizationId === orgId) {
      await db.collection('campaigns').doc(id).delete();
    }
  } catch (error) {
    console.error('Error deleting campaign', error);
    throw new Error('Fallback action failure');
  }
  
  revalidatePath('/dashboard/campaigns');
}
