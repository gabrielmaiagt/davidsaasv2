import { db } from '@/lib/firebase-admin';
import Link from 'next/link';
import { Plus, Folder, Video, ChevronRight } from 'lucide-react';
import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';
import FolderCard from './FolderCard';

export const dynamic = 'force-dynamic';

async function getFolders(orgId: string) {
  const [campaignsSnap, creativesSnap] = await Promise.all([
    db.collection('campaigns').where('organizationId', '==', orgId).get(),
    db.collection('creatives').where('organizationId', '==', orgId).get()
  ]);

  const campaigns = campaignsSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
    count: 0
  })) as any[];

  creativesSnap.docs.forEach((doc: any) => {
    const data = doc.data();
    const campaign = campaigns.find(c => c.id === data.campaignId);
    if (campaign) {
      campaign.count++;
    }
  });

  return campaigns;
}

export default async function CreativesPage() {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  let folders: any[] = [];
  let dbError = !db;

  if (db) {
    try {
      folders = await getFolders(orgId);
    } catch (error) {
       console.error('Error fetching folders:', error);
       dbError = true;
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {dbError && (
        <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl text-secondary text-xs font-bold flex items-center gap-2 mb-6">
           <Video className="w-4 h-4 shrink-0" />
           Atenção: A conexão com o banco de dados falhou. Verifique suas chaves no .env.local.
        </div>
      )}
      <div className="flex justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter font-headline">Suas Pastas Operacionais</h2>
          <p className="text-on-surface-variant mt-2 opacity-80 text-sm">Organize seus criativos por oferta e escale o volume de anúncios.</p>
        </div>
        <Link 
          href="/dashboard/creatives/new" 
          className="bg-primary text-on-primary font-headline font-black px-6 py-3 rounded-xl transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary/10 flex items-center gap-2 text-xs uppercase tracking-widest whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Criativo
        </Link>
      </div>

      {folders.length === 0 ? (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-16 text-center">
           <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-6">
              <Folder className="w-10 h-10 text-on-surface-variant/30" />
           </div>
           <h3 className="text-xl font-black font-headline text-white mb-2 tracking-tight">Nenhuma pasta ainda</h3>
           <p className="text-on-surface-variant text-sm mt-1 max-w-xs mx-auto opacity-70">
             Crie sua primeira campanha para começar a organizar seus criativos em pastas automatizadas.
           </p>
           <Link href="/dashboard/campaigns/new" className="text-primary text-xs font-black uppercase tracking-widest mt-8 inline-block hover:underline">
             Criar Campanha Primária →
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {folders.map((folder: any) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}
          
          {/* Action Card: New Campaign Shortcut */}
          <Link 
            href="/dashboard/campaigns/new"
            className="border-2 border-dashed border-outline-variant/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-surface-container-low hover:border-primary/40 transition-all group min-h-[180px]"
          >
             <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">
                <Plus className="w-6 h-6 text-on-surface-variant group-hover:text-primary" />
             </div>
             <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">Nova Pasta</p>
          </Link>
        </div>
      )}
    </div>
  );
}
