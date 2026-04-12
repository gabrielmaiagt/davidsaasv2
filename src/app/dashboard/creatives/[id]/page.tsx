import { db } from '@/lib/firebase-admin';
import Link from 'next/link';
import { ArrowLeft, Video, ArrowRight } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { getOrganizationId } from '@/lib/session';
import BulkDuplicateButton from './BulkDuplicateButton';
import CreativeCard from './CreativeCard';

export const dynamic = 'force-dynamic';

async function getFolderData(campaignId: string, orgId: string) {
  const [campaignDoc, creativesSnap] = await Promise.all([
    db.collection('campaigns').doc(campaignId).get(),
    db.collection('creatives')
      .where('organizationId', '==', orgId)
      .where('campaignId', '==', campaignId)
      .orderBy('createdAt', 'desc')
      .get()
  ]);

  if (!campaignDoc.exists || campaignDoc.data()?.organizationId !== orgId) return null;

  return {
    campaign: { id: campaignDoc.id, ...campaignDoc.data() } as any,
    creatives: creativesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[]
  };
}

export default async function FolderContentPage({ params }: { params: Promise<{ id: string }> }) {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  const { id: campaignId } = await params;
  
  let data: any = null;
  let dbError = !db;

  if (db) {
    try {
      data = await getFolderData(campaignId, orgId);
    } catch (error) {
      console.error('Error fetching folder data:', error);
      dbError = true;
    }
  }

  if (dbError) {
    return (
      <div className="bg-secondary/10 border border-secondary/20 p-8 rounded-2xl text-center">
         <h3 className="text-secondary font-black font-headline text-xl mb-2">Erro de Conexão</h3>
         <p className="text-on-surface-variant text-sm opacity-80">Não foi possível conectar ao banco de dados. Verifique a chave FIREBASE_PRIVATE_KEY no .env.local.</p>
      </div>
    );
  }

  if (!data) return notFound();

  const { campaign, creatives } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-6">
          <Link 
            href="/dashboard/creatives" 
            className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar para as Pastas
          </Link>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-black text-white tracking-tighter font-headline">{campaign.name}</h2>
              <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">Operacional</span>
            </div>
            <p className="text-on-surface-variant text-sm opacity-80 max-w-xl">Gerencie, multiplique e sincronize seus anúncios desta oferta diretamente com o TikTok Ads.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <BulkDuplicateButton campaignId={campaignId} count={creatives.length} />
          <Link 
            href={`/dashboard/creatives/new?campaignId=${campaignId}`}
            className="h-12 bg-primary text-on-primary px-8 rounded-xl font-headline font-black text-xs uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/10"
          >
            + Adicionar Vídeo
          </Link>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-24 text-center">
           <Video className="w-16 h-16 text-on-surface-variant/20 mx-auto mb-6" />
           <p className="text-on-surface-variant text-sm font-bold opacity-60">Esta pasta está vazia.</p>
           <Link href={`/dashboard/creatives/new?campaignId=${campaignId}`} className="text-primary text-[10px] font-black uppercase tracking-widest mt-4 inline-flex items-center gap-2 hover:underline">
              Subir primeiro vídeo agora <ArrowRight className="w-3 h-3" />
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
          {creatives.map((creative: any) => (
            <CreativeCard key={creative.id} creative={creative} />
          ))}
        </div>
      )}
    </div>
  );
}
