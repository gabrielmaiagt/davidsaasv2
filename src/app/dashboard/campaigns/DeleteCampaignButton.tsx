'use client';

import { useTransition } from 'react';
import { deleteCampaignAction } from '@/app/actions/campaigns';
import { Loader2, Trash2 } from 'lucide-react';

export default function DeleteCampaignButton({ id, name }: { id: string, name: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir a campanha "${name}"? Os criativos vinculados ficarão órfãos.`)) {
      startTransition(() => deleteCampaignAction(id));
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded transition flex items-center disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
    </button>
  );
}
