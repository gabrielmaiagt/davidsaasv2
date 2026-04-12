import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getFolders(orgId: string) {
  const [campaignsSnap, creativesSnap] = await Promise.all([
    db.collection('campaigns').where('organizationId', '==', orgId).get(),
    db.collection('creatives').where('organizationId', '==', orgId).get()
  ]);

  const campaigns = campaignsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    count: 0
  })) as any[];

  creativesSnap.docs.forEach(doc => {
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

  const folders = await getFolders(orgId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Suas Pastas</h2>
          <p className="text-zinc-400 mt-1">Organize seus criativos por oferta e escale o volume.</p>
        </div>
        <Link 
          href="/dashboard/creatives/new" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Criativo
        </Link>
      </div>

      {folders.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
           <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-zinc-600" />
           </div>
           <h3 className="text-white font-medium">Nenhuma pasta ainda</h3>
           <p className="text-zinc-500 text-sm mt-1 max-w-xs mx-auto">
             Crie sua primeira campanha para começar a organizar seus criativos em pastas.
           </p>
           <Link href="/dashboard/campaigns/new" className="text-indigo-400 text-sm font-medium mt-4 inline-block hover:underline">
             Criar Campanha →
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {folders.map((folder) => (
            <Link 
              key={folder.id} 
              href={`/dashboard/creatives/${folder.id}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:bg-zinc-800/50 hover:border-indigo-500/30 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <Folder className="w-5 h-5" />
                 </div>
                 <div className="flex -space-x-2">
                    {[...Array(Math.min(folder.count, 3))].map((_, i) => (
                      <div key={i} className="w-6 h-6 border-2 border-zinc-900 bg-zinc-800 rounded-full flex items-center justify-center">
                         <Video className="w-3 h-3 text-zinc-500" />
                      </div>
                    ))}
                 </div>
              </div>
              
              <h3 className="text-white font-semibold truncate group-hover:text-indigo-400 transition-colors">
                {folder.name}
              </h3>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  {folder.count} Criativos
                </span>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
          
          {/* Action Card: New Campaign Shortcut */}
          <Link 
            href="/dashboard/campaigns/new"
            className="border-2 border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-colors group min-h-[140px]"
          >
             <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-zinc-500" />
             </div>
             <p className="text-xs font-medium text-zinc-400">Nova Pasta</p>
          </Link>
        </div>
      )}
    </div>
  );
}
