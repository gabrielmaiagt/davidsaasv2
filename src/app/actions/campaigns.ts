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

export async function refreshCampaignFeedAction(id: string) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error('Não autorizado');

  const doc = await db.collection('campaigns').doc(id).get();
  if (!doc.exists || doc.data()?.organizationId !== orgId) throw new Error('Acesso negado');

  const newToken = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

  // Atualiza o token da campanha
  await db.collection('campaigns').doc(id).update({
    feedToken: newToken,
    updatedAt: new Date().toISOString(),
  });

  // Atualiza metadados (updatedAt) de todos os criativos da campanha
  const creativesSnap = await db.collection('creatives')
    .where('campaignId', '==', id)
    .where('organizationId', '==', orgId)
    .get();

  if (!creativesSnap.empty) {
    const chunkSize = 500;
    const docs = creativesSnap.docs;
    for (let i = 0; i < docs.length; i += chunkSize) {
      const batch = db.batch();
      docs.slice(i, i + chunkSize).forEach((d: any) => {
        batch.update(d.ref, { updatedAt: new Date().toISOString() });
      });
      await batch.commit();
    }
  }

  revalidatePath('/dashboard/campaigns');
  return { token: newToken };
}

export async function duplicateCampaignAction(id: string) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error('Não autorizado');

  try {
    const campaignDoc = await db.collection('campaigns').doc(id).get();
    if (!campaignDoc.exists || campaignDoc.data()?.organizationId !== orgId) {
      throw new Error('Campanha não encontrada ou acesso negado');
    }

    const originalData = campaignDoc.data() as Campaign;
    const newName = `${originalData.name} (Cópia)`;
    const newSlug = `${originalData.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Criar a nova campanha com o contador zerado inicialmente
    const newCampaignData: Partial<Campaign> = {
      ...originalData,
      name: newName,
      slug: newSlug,
      isDefault: false,
      creativeCount: 0, // Será atualizado após a cópia dos criativos
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newCampaignRef = await db.collection('campaigns').add(newCampaignData);
    const newCampaignId = newCampaignRef.id;

    // 2. Buscar criativos vinculados
    const creativesSnap = await db.collection('creatives')
      .where('campaignId', '==', id)
      .where('organizationId', '==', orgId)
      .get();

    let duplicatedCount = 0;

    if (!creativesSnap.empty) {
      const docs = creativesSnap.docs;
      const chunkSize = 500;
      
      // Processar em pacotes de 500 para não travar o Firebase
      for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        const batch = db.batch();
        
        chunk.forEach((doc: any) => {
          const creativeData = doc.data();
          const newDocRef = db.collection('creatives').doc(); // Gera novo ID
          batch.set(newDocRef, {
            ...creativeData,
            campaignId: newCampaignId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          duplicatedCount++;
        });

        await batch.commit();
        console.log(`BATCH: Processados ${i + chunk.length} de ${docs.length} criativos...`);
      }
    }

    // 3. Atualizar o contador final na nova campanha
    await newCampaignRef.update({
      creativeCount: duplicatedCount,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true, newId: newCampaignId };
  } catch (error: any) {
    console.error('Error duplicating campaign:', error);
    return { error: error.message || 'Falha ao duplicar campanha' };
  }
}


