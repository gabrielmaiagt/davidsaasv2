import { db } from '@/lib/firebase-admin';
import Link from 'next/link';
import { ArrowLeft, Video, Copy, Zap, MoreVertical } from 'lucide-react';
import { notFound } from 'next/navigation';
import BulkDuplicateButton from './BulkDuplicateButton';
import CreativeCard from './CreativeCard';

export const dynamic = 'force-dynamic';

async function getFolderData(campaignId: string) {
  const [campaignDoc, creativesSnap] = await Promise.all([
    db.collection('campaigns').doc(campaignId).get(),
    db.collection('creatives')
      .where('organizationId', '==', 'dev-org')
      .where('campaignId', '==', campaignId)
      .orderBy('createdAt', 'desc')
      .get()
  ]);

  if (!campaignDoc.exists) return null;

  return {
    campaign: { id: campaignDoc.id, ...campaignDoc.data() } as any,
    creatives: creativesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
  };
}

export default async function FolderContentPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const data = await getFolderData(campaignId);

  if (!data) return notFound();

  const { campaign, creatives } = data;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-4">
          <Link 
            href="/dashboard/creatives" 
            className="inline-flex items-center text-sm text-zinc-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Voltar para as Pastas
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-white tracking-tight">{campaign.name}</h2>
              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Pasta</span>
            </div>
            <p className="text-zinc-500 text-sm">Gerencie e multiplique seus anúncios nesta oferta.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BulkDuplicateButton campaignId={campaignId} count={creatives.length} />
          <Link 
            href={`/dashboard/creatives/new?campaignId=${campaignId}`}
            className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2"
          >
            + Vídeo
          </Link>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-20 text-center">
           <Video className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
           <p className="text-zinc-500 text-sm">Esta pasta está vazia.</p>
           <Link href={`/dashboard/creatives/new?campaignId=${campaignId}`} className="text-indigo-400 text-sm font-medium mt-2 inline-block">
              Subir primeiro vídeo agora
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {creatives.map((creative) => (
            <CreativeCard key={creative.id} creative={creative} />
          ))}
        </div>
      )}
    </div>
  );
}
