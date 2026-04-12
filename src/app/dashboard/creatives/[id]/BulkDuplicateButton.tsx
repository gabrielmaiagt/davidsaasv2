'use client';

import { useState } from 'react';
import { bulkDuplicateAction } from '@/app/actions/creatives';
import { Copy, Loader2, Zap, ChevronRight } from 'lucide-react';

export default function BulkDuplicateButton({ campaignId, count }: { campaignId: string, count: number }) {
  const [isPending, setIsPending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [manualCount, setManualCount] = useState('');

  const handleDuplicate = async (multiplier: number) => {
    if (!confirm(`Isso criará ${multiplier * count} novos criativos (copiando todos os ${count} atuais). Confirmar?`)) return;
    
    setIsPending(true);
    setShowOptions(false);
    
    const result = await bulkDuplicateAction(campaignId, multiplier);
    
    if (result?.error) {
      alert(result.error);
    }
    
    setIsPending(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowOptions(!showOptions)}
        disabled={isPending || count === 0}
        className="h-10 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-4 rounded-xl font-medium text-sm transition-all flex items-center gap-2 border border-zinc-700 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Copy className="w-4 h-4" />}
        Duplicar Pasta
      </button>

      {showOptions && !isPending && (
        <div className="absolute top-12 right-0 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <p className="text-[10px] font-bold text-zinc-500 px-3 py-2 uppercase tracking-widest">Multiplicar por:</p>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {[2, 3, 5, 10].map((n: number) => (
              <button
                key={n}
                onClick={() => handleDuplicate(n)}
                className="text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors flex items-center justify-between group"
              >
                <span>{n}x</span>
                <Zap className="w-3 h-3 text-zinc-600 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>
          
          <div className="border-t border-zinc-800 pt-2 px-1">
             <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 shadow-inner focus-within:border-indigo-500/50 transition-colors">
                <input 
                  type="number" 
                  min="1"
                  max="50"
                  placeholder="Manual..." 
                  value={manualCount}
                  onChange={(e) => setManualCount(e.target.value)}
                  className="bg-transparent border-none text-xs text-white p-1 focus:ring-0 w-full"
                />
                <button 
                  onClick={() => manualCount && handleDuplicate(parseInt(manualCount))}
                  disabled={!manualCount}
                  className="p-1 text-indigo-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                   <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
