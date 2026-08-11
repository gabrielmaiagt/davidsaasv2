'use client';

import { Creative } from '@/types';
import { Pencil, Trash2, Copy, Play, Loader2, ChevronRight, Video } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { duplicateCreativeAction, deleteCreativeAction } from '@/app/actions/creatives';
import { useRouter } from 'next/navigation';

export default function CreativeCard({ creative }: { creative: any }) {
  const [isPending, setIsPending] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [manualCount, setManualCount] = useState('');
  const router = useRouter();

  const handleDuplicate = async (multiplier: number) => {
    console.log('Duplicando criativo:', creative.id, 'x', multiplier);
    setIsPending(true);
    setShowOptions(false);
    try {
      const result = await duplicateCreativeAction(creative.id, multiplier);
      if (result?.error) {
        console.error('Erro na duplicação:', result.error);
        alert(result.error);
      } else {
        console.log('Duplicação concluída com sucesso');
        router.refresh();
      }
    } catch (err) {
      console.error('Falha catastrófica na duplicação:', err);
      alert('Erro ao tentar duplicar');
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique "vaze"
    console.log('Iniciando exclusão via API REST do criativo:', creative.id);
    
    // UI Otimista: mostramos o loading mas assumimos o sucesso visual se possível
    setIsPending(true);
    
    try {
      const response = await fetch(`/api/creatives/${creative.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();

      if (result?.error || !response.ok) {
        console.error('Erro ao deletar via API:', result.error);
        alert(result.error || 'Falha na exclusão');
        setIsPending(false);
      } else {
        console.log('Criativo deletado com sucesso via API');
        router.refresh(); 
      }
    } catch (err) {
      console.error('Falha catastrófica ao deletar via API:', err);
      alert('Ocorreu um erro de conexão ao tentar excluir.');
      setIsPending(false);
    }
  };

  return (
    <div className="group relative bg-[#111318] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-300 flex flex-col h-full shadow-2xl hover:shadow-primary/5">
      {/* Media Preview */}
      <div className="relative aspect-[9/16] bg-black overflow-hidden">
        {creative.imageUrl ? (
          <img 
            src={creative.imageUrl} 
            alt={creative.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-[0.85] group-hover:brightness-100" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
             <Video className="w-8 h-8 text-on-surface-variant/10" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e12] via-transparent to-transparent opacity-90"></div>
        
        {/* Play Highlight */}
        {creative.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <Link href={creative.videoUrl} target="_blank" className="w-14 h-14 bg-primary/10 backdrop-blur-xl border border-primary/30 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_30px_rgba(95,255,247,0.2)]">
              <Play className="w-6 h-6 text-primary fill-primary" />
            </Link>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 left-4 z-30">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md ${
            creative.status === 'active' 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-white/5 text-on-surface-variant border-white/10'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${creative.status === 'active' ? 'bg-primary animate-pulse shadow-[0_0_8px_#5ffff7]' : 'bg-on-surface-variant'}`}></span>
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">
              {creative.status === 'active' ? 'LIVE' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col bg-[#111318]">
        <h4 className="text-xs font-black text-white truncate mb-1 font-headline tracking-tight group-hover:text-primary transition-colors">{creative.title}</h4>
        <p className="text-[9px] text-on-surface-variant/50 font-bold uppercase tracking-widest flex items-center gap-1 mb-4">
           SKU: <span className="text-on-surface-variant">{creative.sku.slice(-8)}</span>
        </p>
        
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
           {/* Actions */}
           <div className="flex items-center bg-white/5 rounded-xl p-1 shrink-0 h-9">
              <button 
                onClick={handleDelete}
                disabled={isPending}
                className="p-2 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all z-50 relative"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
           </div>

           {/* Duplicate Action */}
           <div className="relative shrink-0 flex-1 sm:flex-initial">
             <button 
               onClick={() => setShowOptions(!showOptions)}
               disabled={isPending}
               className="h-10 w-full sm:w-auto px-3 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary rounded-xl transition-all flex items-center justify-center gap-2 border border-primary/20 group/btn"
               title="Duplicar este vídeo"
             >
               {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />}
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">CLONAR</span>
             </button>

             {showOptions && !isPending && (
               <div className="absolute bottom-12 right-0 w-40 bg-[#171a1f] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-[60] animate-in fade-in slide-in-from-bottom-3 duration-200">
                  <p className="text-[8px] font-black text-on-surface-variant/50 uppercase tracking-[0.2em] mb-2 px-1">Quantidade</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                     {[2, 3, 5, 10].map((n: number) => (
                      <button
                          key={n}
                          onClick={() => handleDuplicate(n)}
                          className="w-full text-center py-2 text-[10px] text-on-surface/70 hover:bg-primary hover:text-on-primary rounded-lg transition-all font-black border border-white/5"
                      >
                          {n}x
                      </button>
                     ))}
                  </div>
                  
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2">
                     <input 
                       type="number" 
                       min="1"
                       placeholder="Mais..." 
                       value={manualCount}
                       onChange={(e) => setManualCount(e.target.value)}
                       className="bg-transparent border-none text-[10px] text-on-surface p-0 focus:ring-0 w-full font-bold placeholder:text-on-surface-variant/20"
                     />
                     <button 
                       onClick={() => manualCount && handleDuplicate(parseInt(manualCount))}
                       disabled={!manualCount}
                       className="text-primary hover:text-white disabled:opacity-30"
                     >
                         <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
