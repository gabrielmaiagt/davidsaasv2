import { db } from '@/lib/firebase-admin';
import { Campaign } from '@/types';
import Link from 'next/link';
import { PlusCircle, Star } from 'lucide-react';
import SetDefaultButton from './SetDefaultButton';
import DeleteCampaignButton from './DeleteCampaignButton';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const snapshot = await db.collection('campaigns')
    .where('organizationId', '==', 'dev-org')
    .orderBy('createdAt', 'desc')
    .get();

  const campaigns = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Campaign[];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Campanhas (Catálogos)</h1>
          <p className="text-zinc-400 text-sm">Gerencie os containers de testes de criativos. Defina a campanha padrão de tráfego.</p>
        </div>
        
        <Link 
          href="/dashboard/campaigns/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md transition-colors inline-flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Campanha
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-zinc-900 border border-zinc-800/60 rounded-xl">
             <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-zinc-600" />
             </div>
             <h3 className="text-lg font-medium text-white mb-2">Nenhuma campanha</h3>
             <p className="text-zinc-400 max-w-sm mx-auto mb-6">Você precisa de ao menos uma campanha para abrigar seus criativos e gerar o feed.</p>
             <Link 
                href="/dashboard/campaigns/new" 
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
              >
                Criar a primeira
              </Link>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className={`bg-zinc-900 border rounded-xl overflow-hidden shadow-sm flex flex-col ${campaign.isDefault ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-zinc-800/60'}`}
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-white truncate pr-4" title={campaign.name}>
                    {campaign.name}
                  </h3>
                  {campaign.isDefault && (
                    <span className="shrink-0 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                      Padrão
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-zinc-400 space-y-2">
                  <p>ID: <span className="text-zinc-500">{campaign.id.slice(0, 8)}...</span></p>
                  
                  <div className="mt-4 pt-3 border-t border-zinc-800/60">
                    <p className="text-xs text-zinc-500 mb-1">Live Feed URL (Auto-sync) 👇</p>
                    <input 
                      type="text" 
                      readOnly 
                      value={`http://localhost:3000/api/feed/${campaign.id}`}
                      className="w-full bg-zinc-950 text-xs text-indigo-300 border border-zinc-800 rounded px-2 py-1 focus:outline-none"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      title="Copie e cole no Gerenciador de Catálogo da plataforma de anúncios"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/30 p-4 border-t border-zinc-800/60 flex items-center justify-between gap-3">
                <SetDefaultButton id={campaign.id} isDefault={campaign.isDefault} />
                <div className="flex items-center gap-2">
                  {/* <Link href={`/dashboard/campaigns/${campaign.id}/edit`} className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition">Editar</Link> */}
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
