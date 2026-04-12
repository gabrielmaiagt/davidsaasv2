'use client';

import { useActionState, useEffect } from 'react';
import { generateExportAction } from '@/app/actions/exports';
import { Loader2, DownloadCloud } from 'lucide-react';

export default function ExportForm({ offers }: { offers: { id: string, name: string }[] }) {
  const [state, formAction, isPending] = useActionState(generateExportAction as unknown as any, null);

  useEffect(() => {
    // Se a exportação funcionou e retornou a URL, abre numa nova aba para download direto
    if (state?.fileUrl) {
      window.open(state.fileUrl, '_blank');
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="offerId">Filtrar por Oferta</label>
        <select 
          id="offerId" 
          name="offerId" 
          className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors text-sm"
        >
          <option value="">Todas as Ofertas</option>
          {offers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="type">Formato de Exportação</label>
        <select 
          id="type" 
          name="type" 
          required
          className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors text-sm"
        >
          <option value="xml">TikTok Ads XML (Padrão Catálogo)</option>
          <option value="csv">CSV Padrão</option>
          <option value="xlsx">Planilha Excel (XLSX)</option>
        </select>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Gerando feed...</>
        ) : (
          <><DownloadCloud className="w-4 h-4" /> Gerar Arquivo</>
        )}
      </button>

      {state?.fileUrl && (
        <p className="text-xs text-emerald-400 text-center mt-2 font-medium">Exportação gerada com sucesso!</p>
      )}
    </form>
  );
}
