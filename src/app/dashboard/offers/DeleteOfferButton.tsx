'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteOfferAction } from '@/app/actions/offers';

export default function DeleteOfferButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta oferta? Todos os criativos associados também serão excluídos.')) {
      startTransition(() => {
        deleteOfferAction(id);
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
