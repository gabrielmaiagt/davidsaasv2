import { db } from '@/lib/firebase-admin';
import ExportForm from './ExportForm';
import { FileOutput, Download } from 'lucide-react';

async function getCampaigns() {
  const snapshot = await db.collection('campaigns').where('organizationId', '==', 'dev-org').get();
  return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
}

async function getExports() {
  const snapshot = await db.collection('exports').where('organizationId', '==', 'dev-org').orderBy('createdAt', 'desc').limit(20).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

export default async function ExportsPage() {
  const campaigns = await getCampaigns();
  const history = await getExports();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Gerador de Feeds</h2>
        <p className="text-[#a1a1aa] mt-1">Exporte seus criativos para catálogos do TikTok Ads e outras plataformas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Novo Feed</h3>
            <ExportForm campaigns={campaigns as any} />
          </div>
        </div>

        <div className="lg:col-span-2 shadow-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden h-full">
            <div className="p-6 border-b border-[#27272a]">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileOutput className="w-5 h-5" /> 
                Histórico de Exportações
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#27272a]/50 text-[#a1a1aa] text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Formato</th>
                    <th className="px-6 py-4">Filtro (Oferta)</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#a1a1aa]">
                        Nenhuma exportação encontrada. Gere seu primeiro feed!
                      </td>
                    </tr>
                  )}
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-[#27272a]/20 transition-colors">
                      <td className="px-6 py-4 text-white">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="uppercase text-indigo-400 font-bold text-xs bg-indigo-500/10 px-2 py-1 rounded">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#a1a1aa]">
                        {item.filtersApplied?.offerId ? offers.find(o => o.id === item.filtersApplied.offerId)?.name || 'Específica' : 'Todas as Ofertas'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={item.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                        >
                          <Download className="w-4 h-4" /> Baixar
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
