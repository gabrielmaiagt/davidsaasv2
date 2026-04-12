'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCreativeAction } from '@/app/actions/creatives';

export default function DeleteCreativeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este criativo? Os dados não poderão ser recuperados.')) {
      startTransition(() => {
        deleteCreativeAction(id);
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className={`text-[#a1a1aa] hover:text-red-400 transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Excluir"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
