'use client';

import { useState, useTransition } from 'react';
import { Shuffle, Loader2, Check } from 'lucide-react';
import { diversifyAllCreativesAction } from '@/app/actions/creatives';

export default function DiversifyButton({ campaignId }: { campaignId: string }) {
  const [result, setResult] = useState('');
  const [isPending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const r = await diversifyAllCreativesAction(campaignId);
      if ('count' in r && r.success) {
        setResult(`${r.count} diversificados`);
      } else {
        setResult('Erro');
      }
      setTimeout(() => setResult(''), 4000);
    });
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-surface-container-highest hover:bg-surface-container-high border border-outline-variant/20 text-on-surface-variant hover:text-white px-3 py-2 rounded-lg transition-all disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : result ? <Check className="w-3 h-3" /> : <Shuffle className="w-3 h-3" />}
      {result || 'Diversificar Todos'}
    </button>
  );
}
