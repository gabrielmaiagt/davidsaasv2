import { db } from '@/lib/firebase-admin';
import { FolderKanban, Clapperboard, Activity, FileOutput } from 'lucide-react';
import Link from 'next/link';

// Componente Server para buscar estatísticas
async function getDashboardStats() {
  try {
    const defaultOrg = 'dev-org'; // Em um SaaS real, tiraríamos da sessão (session.organizationId)
    
    // Na falta de dados, vamos proteger contra erros retornando zero em caso de erro no firebase-admin
    if (!db) throw new Error("Firebase Admin DB not initialized");
    
    const [offersSnap, creativesSnap, activeCreativesSnap, exportsSnap] = await Promise.all([
      db.collection('offers').where('organizationId', '==', defaultOrg).count().get(),
      db.collection('creatives').where('organizationId', '==', defaultOrg).count().get(),
      db.collection('creatives').where('organizationId', '==', defaultOrg).where('status', '==', 'active').count().get(),
      db.collection('exports').where('organizationId', '==', defaultOrg).count().get(),
    ]);

    return {
      totalOffers: offersSnap.data().count,
      totalCreatives: creativesSnap.data().count,
      activeCreatives: activeCreativesSnap.data().count,
      totalExports: exportsSnap.data().count,
    };
  } catch (error) {
    console.error(error);
    return {
      totalOffers: 0,
      totalCreatives: 0,
      activeCreatives: 0,
      totalExports: 0,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-[#a1a1aa] mt-1">Bem-vindo ao Creative Feed Manager.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/offers/new" className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white text-sm font-medium rounded-md transition-colors">
            Nova Oferta
          </Link>
          <Link href="/dashboard/creatives/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2">
            <Clapperboard className="w-4 h-4" />
            Novo Criativo
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Qtd de Ofertas', value: stats.totalOffers, icon: FolderKanban, color: 'text-blue-400' },
          { label: 'Total de Criativos', value: stats.totalCreatives, icon: Clapperboard, color: 'text-indigo-400' },
          { label: 'Criativos Ativos', value: stats.activeCreatives, icon: Activity, color: 'text-emerald-400' },
          { label: 'Total de Exportações', value: stats.totalExports, icon: FileOutput, color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-sm flex flex-col items-start">
            <div className={`p-2 rounded-lg bg-[#27272a]/50 ${stat.color} mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-[#a1a1aa]">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Blank state for tables yet to be fully implemented */}
         <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
           <h3 className="text-base font-semibold border-b border-[#27272a] pb-4 mb-4">Criativos Recentes</h3>
           <div className="flex flex-col items-center justify-center py-12 text-center">
             <Clapperboard className="w-8 h-8 text-[#3f3f46] mb-3" />
             <p className="text-sm font-medium text-[#a1a1aa]">Nenhum criativo cadastrado.</p>
             <Link href="/dashboard/creatives/new" className="text-indigo-400 text-sm mt-1 hover:underline">
               Comece criando um agora.
             </Link>
           </div>
         </div>

         <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6">
           <h3 className="text-base font-semibold border-b border-[#27272a] pb-4 mb-4">Exportações Recentes</h3>
           <div className="flex flex-col items-center justify-center py-12 text-center">
             <FileOutput className="w-8 h-8 text-[#3f3f46] mb-3" />
             <p className="text-sm font-medium text-[#a1a1aa]">Nenhuma exportação realizada.</p>
           </div>
         </div>
      </div>
    </div>
  );
}
