'use server';

import { db, storage } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { getOrganizationId } from '@/lib/session';

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

  await fileRef.makePublic();
  
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

export async function createCreativeAction(state: any, formData: FormData, redirectResponse: boolean = true) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) return { error: 'Não autorizado' };

    // Verificação de segurança para o Firebase Admin
    if (!db || !storage) {
      console.error('FIREBASE CRITICAL: Admin SDK not initialized. Check environment variables.');
      return { error: 'O servidor não está configurado corretamente (Firebase Keys faltando). Verifique as variáveis de ambiente de produção.' };
    }

    const campaignId = formData.get('campaignId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const finalUrl = formData.get('finalUrl') as string;
    const brand = formData.get('brand') as string;
    const category = formData.get('category') as string;
    const tagsStr = formData.get('tags') as string;
    const skuInput = formData.get('sku') as string;
    const status = formData.get('status') as string || 'active';
    const condition = formData.get('condition') as string || 'new';
    const availability = formData.get('availability') as string || 'in stock';
    const price = formData.get('price') ? Number(formData.get('price')) : null;

    const videoFile = formData.get('video') as File;
    const imageFile = formData.get('image') as File;

    if (!videoFile || videoFile.size === 0) {
      return { error: 'Nenhum vídeo enviado ou arquivo corrompido.' };
    }

    // O upload pode falhar se as permissões do Storage estiverem incorretas
    let videoUrl = '';
    let imageUrl = '';
    
    try {
      videoUrl = await uploadFileToStorage(videoFile, 'videos');
      imageUrl = imageFile && imageFile.size > 0 
        ? await uploadFileToStorage(imageFile, 'images') 
        : '';
    } catch (storageErr: any) {
      console.error('STORAGE ERROR:', storageErr);
      return { error: `Falha no upload para o Storage: ${storageErr.message || 'Erro desconhecido'}` };
    }

    const generatedSku = skuInput || `SKU-${uuidv4().split('-')[0].toUpperCase()}`;
    const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

    const creative = {
      organizationId: orgId,
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

    const docRef = await db.collection('creatives').add(creative);
    
    // Incrementar o contador na campanha (Denormalização)
    await db.collection('campaigns').doc(campaignId).update({
      creativeCount: admin.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    });
    
    revalidatePath('/dashboard/creatives');
    return { success: true, creativeId: generatedSku, shouldRedirect: redirectResponse };
  } catch (err: any) {
    console.error('CREATE CREATIVE ERROR:', err);
    return { error: err.message || 'Ocorreu um erro inesperado no servidor.' };
  }
}

// ... (duas funções de duplicação aqui se mantêm, mas a duplicarCampanha no campaigns.ts será a principal)

export async function updateCreativeAction(id: string, formData: FormData) {
  // ... (sem mudanças)
}

export async function deleteCreativeAction(id: string) {
  console.log('SERVER: Chamando deleteCreativeAction para id:', id);
  const orgId = await getOrganizationId();
  if (!orgId) return { error: 'Não autorizado' };

  try {
    const docRef = db.collection('creatives').doc(id);
    const doc = await docRef.get();
    
    if (doc.exists && doc.data()?.organizationId === orgId) {
      const campaignId = doc.data()?.campaignId;
      await docRef.delete();

      // Decrementar o contador na campanha (Denormalização)
      if (campaignId) {
        await db.collection('campaigns').doc(campaignId).update({
          creativeCount: admin.firestore.FieldValue.increment(-1),
          updatedAt: new Date().toISOString()
        });
      }

      revalidatePath('/dashboard/creatives', 'layout');
      return { success: true };
    }
    return { error: 'Criativo não encontrado ou acesso negado' };
  } catch (error) {
    console.error('SERVER: deleteCreativeAction - ERRO FATAL:', error);
    return { error: 'Falha ao excluir criativo' };
  }
}

