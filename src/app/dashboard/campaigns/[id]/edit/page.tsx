import { db } from '@/lib/firebase-admin';
import { Campaign } from '@/types';
import EditCampaignForm from './EditCampaignForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const doc = await db.collection('campaigns').doc(id).get();
  
  if (!doc.exists) {
    return notFound();
  }

  const campaign = { id: doc.id, ...doc.data() } as Campaign;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/dashboard/campaigns" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Campanhas
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Editar Campanha</h1>
        <p className="text-zinc-400 text-sm">Ajuste os padrões desta oferta. As mudanças afetarão o Feed XML dinamicamente.</p>
      </div>

      <EditCampaignForm campaign={campaign} />
    </div>
  );
}
