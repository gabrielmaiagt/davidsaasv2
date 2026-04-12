import { db } from '@/lib/firebase-admin';
import { getOrganizationId } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const orgId = await getOrganizationId();

  if (!orgId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const docRef = db.collection('creatives').doc(id);
    const doc = await docRef.get();

    if (doc.exists && doc.data()?.organizationId === orgId) {
      await docRef.delete();
      // Revalida o dashboard principal e o específico
      revalidatePath('/dashboard/creatives', 'layout');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Criativo não encontrado ou acesso negado' }, { status: 404 });
  } catch (error: any) {
    console.error('API ERROR: Deleting creative:', error);
    return NextResponse.json({ error: 'Falha interna ao excluir' }, { status: 500 });
  }
}
