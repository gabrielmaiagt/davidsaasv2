import { db } from '@/lib/firebase-admin';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CreativeForm from './CreativeForm';

import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';

async function getCampaigns(orgId: string) {
  const snapshot = await db.collection('campaigns')
    .where('organizationId', '==', orgId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, name: doc.data().name }));
}

export default async function NewCreativePage() {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  const campaigns = await getCampaigns(orgId);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/creatives" className="text-sm font-medium text-[#a1a1aa] hover:text-white flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Criar Novo Ad (Vídeo/Imagem)</h2>
        <p className="text-[#a1a1aa] mt-1">Preencha os metadados do seu criativo focado em performance.</p>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-sm">
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#a1a1aa] mb-4">Parece que você ainda não tem Nenhuma Campanha. Você precisa de uma antes de subir criativos.</p>
            <Link href="/dashboard/campaigns/new" className="text-indigo-400 hover:underline">Ir para Campanhas</Link>
          </div>
        ) : (
          <CreativeForm campaigns={campaigns as any} />
        )}
      </div>
    </div>
  );
}
