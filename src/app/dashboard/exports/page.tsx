import { db } from '@/lib/firebase-admin';
import ExportForm from './ExportForm';
import { FileOutput, Download, History, PlusSquare } from 'lucide-react';
import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';

async function getCampaigns(orgId: string) {
  const snapshot = await db.collection('campaigns').where('organizationId', '==', orgId).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, name: doc.data().name }));
}

async function getExports(orgId: string) {
  const snapshot = await db.collection('exports').where('organizationId', '==', orgId).orderBy('createdAt', 'desc').limit(20).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));
}

export default async function ExportsPage() {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  let campaigns: any[] = [];
  let history: any[] = [];
  let dbError = !db;

  if (db) {
    try {
      [campaigns, history] = await Promise.all([
        getCampaigns(orgId),
        getExports(orgId)
      ]);
    } catch (error) {
      console.error('Error fetching export data:', error);
      dbError = true;
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {dbError && (
        <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl text-secondary text-xs font-bold flex items-center gap-2 mb-6">
           <History className="w-4 h-4 shrink-0" />
           Atenção: A conexão com o banco de dados falhou. Verifique suas chaves no .env.local.
        </div>
      )}
      <div className="mb-10">
        <h2 className="text-4xl font-black tracking-tighter text-white font-headline">Gerador de Feeds</h2>
        <p className="text-on-surface-variant mt-2 opacity-80 text-sm">Exporte seus criativos para catálogos do TikTok Ads em escala industrial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* New Export Form Card */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-8 shadow-sm h-fit">
            <div className="flex items-center gap-3 mb-6">
               <PlusSquare className="w-5 h-5 text-primary" />
               <h3 className="text-lg font-black font-headline text-white tracking-tight uppercase tracking-widest text-xs">Novo Feed</h3>
            </div>
            <ExportForm campaigns={campaigns as any} />
          </div>
        </div>

        {/* Export History Card */}
        <div className="lg:col-span-2">
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl overflow-hidden h-full shadow-sm">
            <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-lg font-black font-headline flex items-center gap-3 text-white tracking-tight uppercase tracking-widest text-xs">
                <History className="w-5 h-5 text-primary" /> 
                Histórico Operacional
              </h3>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] bg-surface-container-high px-3 py-1 rounded-full">Últimas 20 Exportações</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container/50 text-on-surface-variant text-[10px] uppercase font-black tracking-[0.2em]">
                    <th className="px-8 py-5">Carimbo de Data</th>
                    <th className="px-8 py-5">Formato</th>
                    <th className="px-8 py-5">Filtro Aplicado</th>
                    <th className="px-8 py-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <FileOutput className="w-10 h-10 text-on-surface-variant/20" />
                           <p className="text-on-surface-variant text-sm font-bold opacity-60">Nenhum feed gerado ainda.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {history.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-container-high/50 transition-all group">
                      <td className="px-8 py-5 text-white font-medium text-xs">
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-8 py-5">
                        <span className="uppercase text-primary font-black text-[10px] bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full tracking-widest">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-on-surface-variant text-xs font-bold transition-colors group-hover:text-white">
                        {item.filtersApplied?.campaignId ? (campaigns as any).find((o: any) => o.id === item.filtersApplied.campaignId)?.name || 'Específica' : 'Feed Global'}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <a 
                          href={item.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all bg-primary/5 hover:bg-primary px-4 py-2 rounded-lg border border-primary/20"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
