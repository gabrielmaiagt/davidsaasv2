'use client';

import { useActionState } from 'react';
import { createOfferAction } from '@/app/actions/offers';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function NewOfferPage() {
  const [, formAction, isPending] = useActionState(createOfferAction as any, null);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/offers" className="text-sm font-medium text-[#a1a1aa] hover:text-white flex items-center gap-2 mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Criar Nova Oferta</h2>
        <p className="text-[#a1a1aa] mt-1">Configure os dados base da sua oferta para adicionar criativos.</p>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-8 shadow-sm">
        <form action={formAction} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="name">Nome da Oferta</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                required 
                placeholder="Ex: Produto X Black Friday"
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="status">Status</label>
              <select 
                id="status" 
                name="status" 
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors text-sm"
              >
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="description">Descrição (Interna)</label>
            <textarea 
              id="description" 
              name="description" 
              rows={3}
              placeholder="Descreva sobre o que é esta oferta..."
              className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="defaultFinalUrl">URL Final Padrão</label>
              <input 
                id="defaultFinalUrl" 
                name="defaultFinalUrl" 
                type="url" 
                placeholder="https://seu-checkout.com/..."
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm"
              />
              <p className="text-xs text-[#71717a]">A URL que será usada pelos criativos caso não tenham uma própria.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="defaultCategory">Categoria Padrão</label>
              <input 
                id="defaultCategory" 
                name="defaultCategory" 
                type="text" 
                placeholder="Ex: Health & Beauty"
                className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors placeholder:text-[#52525b] text-sm"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Oferta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
