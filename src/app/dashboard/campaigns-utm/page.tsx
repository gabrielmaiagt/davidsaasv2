import { db } from '@/lib/firebase-admin';
import { Campaign } from '@/types';
import Link from 'next/link';
import { Megaphone, FlaskConical, AlertTriangle } from 'lucide-react';
import FeedUrlInputUtm from './FeedUrlInputUtm';
import { getOrganizationId } from '@/lib/session';
import { redirect } from 'next/navigation';

/**
 * Tela duplicada — versão COM UTM, em teste.
 *
 * Somente leitura: não tem botão de editar, duplicar, excluir nem atualizar
 * feed. Serve apenas para copiar a URL com rastreamento. A tela de produção
 * (/dashboard/campaigns) não foi alterada.
 */
export const dynamic = 'force-dynamic';

export default async function CampaignsUtmPage() {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

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
      console.error('Error fetching campaigns (utm):', error);
      dbError = true;
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {dbError && (
        <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl text-secondary text-xs font-bold flex items-center gap-2 mb-6">
          <Megaphone className="w-4 h-4 shrink-0" />
          Atenção: A conexão com o banco de dados falhou.
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-black tracking-tighter text-white font-headline">Feeds com UTM</h1>
          <span className="bg-secondary/15 text-secondary border border-secondary/30 text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5">
            <FlaskConical className="w-3 h-3" />
            Em teste
          </span>
        </div>
        <p className="text-on-surface-variant text-sm opacity-80 max-w-3xl">
          Mesmas campanhas, mesmos produtos e mesmos vídeos da tela normal — muda
          só o link de destino, que sai com rastreamento.
        </p>
      </div>

      <div className="bg-surface-container-low border border-secondary/20 rounded-2xl p-5 space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-secondary" />
          Antes de usar, leia
        </h2>
        <ul className="text-[11px] text-on-surface-variant leading-relaxed space-y-2 list-disc pl-4">
          <li>
            Use estas URLs <strong className="text-on-surface">apenas em catálogo novo</strong>. Trocar
            a URL de uma campanha que já está entregando faz o TikTok reprocessar
            tudo, e ela some por horas até a fila terminar.
          </li>
          <li>
            A tela normal (<Link href="/dashboard/campaigns" className="text-primary underline">Campanhas</Link>)
            continua funcionando igual. Quem está no ar hoje não é afetado.
          </li>
          <li>
            O <code className="text-on-surface">utm_content</code> leva o <strong className="text-on-surface">SKU</strong> do
            criativo, que é único por cópia — é por ele que você descobre exatamente
            qual criativo gerou a venda.
          </li>
        </ul>
        <div className="bg-black/40 rounded-lg px-3 py-2 font-mono text-[10px] text-on-surface-variant/80 overflow-x-auto">
          ?utm_source=tiktok&amp;utm_medium=cpc&amp;utm_campaign=__CAMPAIGN_NAME__&amp;utm_content=&#123;SKU&#125;&amp;utm_term=__CID__
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-surface-container-low border border-outline-variant/10 rounded-2xl">
            <h3 className="text-xl font-black font-headline text-white mb-2">Nenhuma campanha</h3>
            <p className="text-on-surface-variant text-sm">Crie uma campanha na tela normal primeiro.</p>
          </div>
        ) : (
          campaigns.map((campaign: any) => (
            <div
              key={campaign.id}
              className="bg-surface-container-low border border-outline-variant/10 rounded-2xl overflow-hidden shadow-sm flex flex-col hover:border-secondary/30 transition-all"
            >
              <div className="p-6 flex-1 space-y-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-white font-headline tracking-tight truncate">
                      {campaign.name}
                    </h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                      {campaign.creativeCount || 0} criativos · ID: {campaign.id.slice(0, 8)}
                    </p>
                  </div>
                  {campaign.dedupeVideos && (
                    <span className="shrink-0 bg-primary/10 text-primary border border-primary/20 text-[9px] px-2 py-1 rounded-full font-black uppercase tracking-widest">
                      Ingestão rápida
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-outline-variant/10">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3">
                    URL do feed com UTM
                  </p>
                  <FeedUrlInputUtm id={campaign.id} token={campaign.feedToken} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
