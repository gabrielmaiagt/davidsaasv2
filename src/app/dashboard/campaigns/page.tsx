import { db } from '@/lib/firebase-admin';
import { Campaign } from '@/types';
import Link from 'next/link';
import { PlusCircle, Star, Megaphone } from 'lucide-react';
import SetDefaultButton from './SetDefaultButton';
import DeleteCampaignButton from './DeleteCampaignButton';
import FeedUrlInput from './FeedUrlInput';
import { headers } from 'next/headers';
import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  let campaigns: Campaign[] = [];
  let dbError = !db;

  if (db) {
    try {
      const snapshot = await db.collection('campaigns')
        .where('organizationId', '==', orgId)
        .orderBy('createdAt', 'desc')
        .get();

      campaigns = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      dbError = true;
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {dbError && (
        <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl text-secondary text-xs font-bold flex items-center gap-2 mb-6">
           <Megaphone className="w-4 h-4 shrink-0" />
           Atenção: A conexão com o banco de dados falhou. Verifique suas chaves no .env.local.
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2 font-headline">Campanhas (Catálogos)</h1>
          <p className="text-on-surface-variant text-sm opacity-80">Gerencie os containers de testes de criativos. Defina a campanha padrão de tráfego.</p>
        </div>
        
        <Link 
          href="/dashboard/campaigns/new" 
          className="bg-primary text-on-primary font-headline font-black px-6 py-3 rounded-xl transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary/10 inline-flex items-center gap-2 text-xs uppercase tracking-widest whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Campanha
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-surface-container-low border border-outline-variant/10 rounded-2xl">
             <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-on-surface-variant/50" />
             </div>
             <h3 className="text-xl font-black font-headline text-white mb-2">Nenhuma campanha encontrada</h3>
             <p className="text-on-surface-variant max-w-sm mx-auto mb-8 text-sm px-6">Você precisa de ao menos uma campanha para abrigar seus criativos e gerar o feed.</p>
             <Link 
                href="/dashboard/campaigns/new" 
                className="bg-surface-container-highest hover:bg-surface-container-high text-white font-headline font-bold px-6 py-3 rounded-xl transition-colors text-xs uppercase tracking-widest border border-outline-variant/20"
              >
                Criar a primeira
              </Link>
          </div>
        ) : (
          campaigns.map((campaign: any) => (
            <div 
              key={campaign.id} 
              className={`bg-surface-container-low border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all hover:border-primary/30 group ${campaign.isDefault ? 'border-primary/50 shadow-[0_0_20px_rgba(95,255,247,0.05)]' : 'border-outline-variant/10'}`}
            >
              <div className="p-6 flex-1 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 overflow-hidden">
                    <h3 className="text-lg font-black font-headline text-white truncate group-hover:text-primary transition-colors" title={campaign.name}>
                      {campaign.name}
                    </h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                       ID: {campaign.id.slice(0, 8)}
                    </p>
                  </div>
                  {campaign.isDefault && (
                    <span className="shrink-0 bg-primary/10 text-primary border border-primary/20 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest">
                      Padrão
                    </span>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-outline-variant/10">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-3">Live Feed URL (Auto-sync) 👇</p>
                  <FeedUrlInput url={`${baseUrl}/api/feed/${campaign.id}`} />
                </div>
              </div>

              <div className="bg-surface-container-high/50 p-4 border-t border-outline-variant/10 flex items-center justify-between gap-3">
                <SetDefaultButton id={campaign.id} isDefault={campaign.isDefault} />
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/campaigns/${campaign.id}/edit`} className="text-[10px] font-black uppercase tracking-widest bg-surface-container-highest hover:bg-surface-container-high text-on-surface-variant hover:text-white px-3 py-2 rounded-lg transition-all border border-outline-variant/20">
                    Editar
                  </Link>
                  {!campaign.isDefault && (
                    <DeleteCampaignButton id={campaign.id} name={campaign.name} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
