'use client';

import { useState, useTransition } from 'react';
import { setDedupeVideosAction } from '@/app/actions/campaigns';
import { Zap, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DedupeVideosToggle({ id, enabled }: { id: string; enabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  const toggle = () => {
    startTransition(async () => {
      await setDedupeVideosAction(id, !enabled);
      setShowInfo(false);
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowInfo(!showInfo)}
        title="Ingestão rápida do catálogo"
        className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all ${
          enabled
            ? 'bg-primary/15 border-primary/40 text-primary'
            : 'bg-white/5 border-white/5 text-on-surface-variant/50 hover:text-on-surface-variant'
        }`}
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
      </button>

      {showInfo && (
        <div className="absolute bottom-10 right-0 w-80 bg-[#171a1f] border border-white/10 rounded-2xl shadow-2xl p-4 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Ingestão Rápida</h4>
            <button type="button" onClick={() => setShowInfo(false)} className="text-on-surface-variant/40 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3">
            Hoje cada cópia recebe um link de vídeo diferente, então o TikTok baixa
            o <strong className="text-on-surface">mesmo arquivo uma vez por cópia</strong> — é o que faz
            o catálogo levar horas para ativar e gera o custo de banda.
          </p>
          <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3">
            Ligando isto, o link fica igual em todas as cópias e o TikTok baixa
            <strong className="text-on-surface"> uma vez só</strong>. A ativação cai de horas para minutos e o
            custo despenca. <strong className="text-on-surface">Nenhum produto é removido</strong> — a
            quantidade do catálogo continua a mesma.
          </p>
          <p className="text-[11px] text-secondary/90 leading-relaxed mb-4">
            Em troca, o TikTok passa a enxergar que o vídeo se repete entre os
            produtos, em vez de tratar cada cópia como criativo distinto.
          </p>

          <button
            type="button"
            onClick={toggle}
            disabled={isPending}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${
              enabled
                ? 'bg-white/5 border border-white/10 text-on-surface-variant hover:text-white'
                : 'bg-primary text-on-primary'
            }`}
          >
            {isPending ? 'Salvando...' : enabled ? 'Desativar ingestão rápida' : 'Ativar ingestão rápida'}
          </button>

          <p className="text-[10px] text-on-surface-variant/40 mt-2 text-center">
            {enabled ? 'Ativo nesta campanha' : 'Desativado — comportamento padrão'}
          </p>
        </div>
      )}
    </div>
  );
}
