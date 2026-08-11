'use client';

import { useActionState } from 'react';
import { createCampaignAction } from '@/app/actions/campaigns';
import { Loader2, ArrowLeft, Globe, Link as LinkIcon, DollarSign } from 'lucide-react';
import Link from 'next/link';

const initialState = {
  error: '',
};

export default function NewCampaignPage() {
  const [state, formAction, isPending] = useActionState(createCampaignAction as any, initialState);

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/dashboard/campaigns" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Campanhas
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Configurar Nova Campanha</h1>
        <p className="text-zinc-400 text-sm">Defina os padrões desta oferta. Todos os vídeos adicionados herdarão estas configurações.</p>
      </div>

      <form action={formAction} className="space-y-8">
        {state?.error && (
          <div className="p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
            {state.error}
          </div>
        )}

        {/* Seção 1: Identificação */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            Identificação
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="name">Nome da Campanha</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              placeholder="Ex: Oferta Detox Verão"
              required 
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300" htmlFor="defaultDescription">Texto do Anúncio Padrão (Copy)</label>
            <textarea 
              id="defaultDescription" 
              name="defaultDescription" 
              rows={4}
              placeholder="Digite aqui a copy que aparecerá nos seus anúncios..."
              className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors text-sm"
            ></textarea>
            <p className="text-xs text-zinc-500">Esta copy será usada em todos os vídeos que não tiverem uma descrição própria.</p>
          </div>
        </div>

        {/* Seção 2: Padrões do TikTok Feed */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            Padrões de Catálogo (Auto-fill)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2" htmlFor="currency">
                <Globe className="w-4 h-4 text-zinc-500" />
                País / Moeda
              </label>
              <select 
                id="currency" 
                name="currency" 
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              >
                <option value="BRL">Brasil (BRL - R$)</option>
                <option value="USD">EUA (USD - $)</option>
                <option value="EUR">Europa (EUR - €)</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2" htmlFor="defaultLink">
                <LinkIcon className="w-4 h-4 text-zinc-500" />
                Link de Destino Padrão (Landing Page)
              </label>
              <input 
                id="defaultLink" 
                name="defaultLink" 
                type="url" 
                placeholder="https://sualoja.com/produto-exemplo"
                required
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
              <p className="text-xs text-zinc-500">Este link será usado em qualquer vídeo que não tiver um link próprio.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300" htmlFor="brand">Nome da Loja / Identidade</label>
              <input id="brand" name="brand" type="text" placeholder="Ex: Boutique Premium" defaultValue="Loja Oficial" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300" htmlFor="category">Nicho da Oferta</label>
              <input id="category" name="category" type="text" placeholder="Ex: Saúde, Beleza, Drop" defaultValue="Geral" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md px-4 py-2.5 focus:outline-none text-sm" />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3 items-center">
          <Link 
            href="/dashboard/campaigns"
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 rounded-md transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar Campanha e Ativar Padrões
          </button>
        </div>
      </form>
    </div>
  );
}
