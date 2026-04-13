'use client';

import { useTransition } from 'react';
import { duplicateCampaignAction } from '@/app/actions/campaigns';
import { Loader2, CopyPlus } from 'lucide-react';

export default function DuplicateCampaignButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateCampaignAction(id);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      onClick={handleDuplicate}
      disabled={isPending}
      className="text-[10px] font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-lg transition-all border border-primary/20 flex items-center gap-2 disabled:opacity-50"
      title="Duplicar Campanha"
    >
      {isPending ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Clonando...</span>
        </>
      ) : (
        <>
          <CopyPlus className="w-3.5 h-3.5" />
          <span>Duplicar</span>
        </>
      )}
    </button>
  );
}
