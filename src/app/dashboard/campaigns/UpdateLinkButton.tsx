'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { refreshCampaignFeedAction } from '@/app/actions/campaigns';

export default function UpdateLinkButton({ id }: { id: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await refreshCampaignFeedAction(id);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    });
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-3 py-2 rounded-lg transition-all disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : done ? (
        <Check className="w-3 h-3" />
      ) : (
        <RefreshCw className="w-3 h-3" />
      )}
      {done ? 'Atualizado!' : 'Atualizar Link'}
    </button>
  );
}
