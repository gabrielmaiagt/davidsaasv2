'use client';

import { useTransition } from 'react';
import { setDefaultCampaignAction } from '@/app/actions/campaigns';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SetDefaultButton({ id, isDefault }: { id: string, isDefault: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (isDefault) {
    return (
      <div className="flex items-center text-xs text-indigo-400 font-medium px-2 py-1">
        <CheckCircle className="w-4 h-4 mr-1.5" />
        Configuração Ativa
      </div>
    );
  }

  return (
    <button
      onClick={() => startTransition(() => setDefaultCampaignAction(id))}
      disabled={isPending}
      className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-medium px-3 py-1.5 rounded transition flex items-center disabled:opacity-50"
    >
      {isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
      Set as Default
    </button>
  );
}
