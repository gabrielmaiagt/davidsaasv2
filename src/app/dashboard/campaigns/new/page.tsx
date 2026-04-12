'use client';

import { useActionState } from 'react';
import { createCampaignAction } from '@/app/actions/campaigns';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const initialState = {
  error: '',
};

export default function NewCampaignPage() {
  const [state, formAction, isPending] = useActionState(createCampaignAction as any, initialState);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/campaigns" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Campanhas
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Nova Campanha</h1>
        <p className="text-zinc-400 text-sm">Crie um agrupador lógico (catálogo) para testar seus criativos.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6 shadow-sm">
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="name">Nome da Campanha</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              placeholder="Ex: Coleção Inverno 2024"
              required 
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors text-sm placeholder:text-zinc-600"
            />
            <p className="text-xs text-zinc-500">Este nome será a sua referência interna de catálogo.</p>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-zinc-800/60 mt-6">
            <Link 
              href="/dashboard/campaigns"
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Campanha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
