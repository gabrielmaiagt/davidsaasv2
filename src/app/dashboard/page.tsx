import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getStats(orgId: string) {
  const [campaigns, creatives, exportsCount] = await Promise.all([
    db.collection('campaigns').where('organizationId', '==', orgId).count().get(),
    db.collection('creatives').where('organizationId', '==', orgId).count().get(),
    db.collection('exports').where('organizationId', '==', orgId).count().get(),
  ]);

  return {
    campaigns: campaigns.data().count,
    creatives: creatives.data().count,
    exports: exports.data().count,
  };
}

export default async function DashboardPage() {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  const stats = await getStats(orgId);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Bem-vindo, Marketer</h1>
        <p className="text-zinc-400">Aqui está o resumo da sua operação de criativos.</p>
      </div>

      {/* Banner de Onboarding (O Guia) */}
      <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Rocket className="w-40 h-40 text-indigo-500" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            🚀 Como escalar hoje?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p className="text-sm font-medium text-white">Crie uma Campanha</p>
              <p className="text-xs text-zinc-400">Configure o Link da sua loja e o Preço padrão (ex: 19,90).</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p className="text-sm font-medium text-white">Suba os Vídeos</p>
              <p className="text-xs text-zinc-400">Só arraste o MP4. A capa e os dados de catálogo são automáticos.</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p className="text-sm font-medium text-white">Link no TikTok</p>
              <p className="text-xs text-zinc-400">Copie o link do "Live Feed" e cole no seu Catálogo do TikTok Ads.</p>
            </div>
          </div>
          
          <div className="mt-8">
             <Link href="/dashboard/campaigns/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors inline-block">
               Começar Agora
             </Link>
          </div>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:bg-zinc-800/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
              <Megaphone className="w-6 h-6" />
            </div>
            <span className="text-xs text-emerald-500 font-medium">+ Ativas</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.campaigns}</p>
          <p className="text-sm text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Campanhas</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:bg-zinc-800/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <span className="text-xs text-emerald-500 font-medium">Hospedados</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.creatives}</p>
          <p className="text-sm text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Criativos</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:bg-zinc-800/50 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
              <FileDown className="w-6 h-6" />
            </div>
            <span className="text-xs text-amber-500 font-medium">Arquivos</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.exports}</p>
          <p className="text-sm text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Feeds Gerados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
             <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               <CheckCircle2 className="w-5 h-5 text-indigo-500" />
               Dica de Performance
             </h3>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Lembre-se: O TikTok Ads valoriza a renovação de mídias. Tente subir pelo menos 3 criativos novos toda semana dentro da sua campanha padrão para evitar a fadiga do anúncio. O nosso Live Feed cuidará de avisar o TikTok sobre as novidades automaticamente.
             </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
             <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               <Copy className="w-5 h-5 text-indigo-500" />
               Atenção ao Link
             </h3>
             <p className="text-zinc-400 text-sm leading-relaxed">
               Sempre valide se o Link Padrão da sua campanha está correto. Se você esqueceu de colocar UTMs no link da Campanha, elas não aparecerão nos seus anúncios a menos que você as coloque individualmente em cada criativo.
             </p>
          </div>
      </div>
    </div>
  );
}
