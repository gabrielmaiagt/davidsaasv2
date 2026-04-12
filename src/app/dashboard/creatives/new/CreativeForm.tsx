'use client';

import { useActionState, useState } from 'react';
import { createCreativeAction } from '@/app/actions/creatives';
import { Loader2, Upload, Play, Image as ImageIcon } from 'lucide-react';
import { Campaign } from '@/types';

export default function CreativeForm({ campaigns }: { campaigns: Campaign[] }) {
  const [, formAction, isPending] = useActionState(createCreativeAction as any, null);
  
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    } else {
      setVideoPreview(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Coluna 1: Midias */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]">Upload de Vídeo (Obrigatório / TikTok-First)</label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#27272a] hover:border-indigo-500/50 rounded-xl cursor-pointer bg-[#09090b] transition-colors relative overflow-hidden group">
               {videoPreview ? (
                 <>
                  <video src={videoPreview} className="w-full h-full object-cover" muted autoPlay loop />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium flex items-center gap-2">Trocar Vídeo</span>
                  </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                   <div className="p-3 bg-[#27272a]/50 rounded-full mb-3"><Play className="w-5 h-5 text-[#a1a1aa]" /></div>
                   <p className="mb-2 text-sm text-[#a1a1aa]"><span className="font-semibold text-white">Clique para upload</span> ou arraste</p>
                   <p className="text-xs text-[#71717a]">MP4, MOV (Máx. 50MB no MVP)</p>
                 </div>
               )}
               <input id="video" name="video" type="file" accept="video/mp4,video/quicktime" className="hidden" required onChange={handleVideoChange} />
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]">Imagem de Capa (Opcional)</label>
             <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#27272a] hover:border-indigo-500/50 rounded-xl cursor-pointer bg-[#09090b] transition-colors relative overflow-hidden group">
               {imagePreview ? (
                 <>
                  <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Trocar Imagem</span>
                  </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                   <ImageIcon className="w-5 h-5 text-[#a1a1aa] mb-2" />
                   <p className="text-xs text-[#a1a1aa]">Capa/Thumbnail do anúncio</p>
                 </div>
               )}
               <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        {/* Coluna 2: Dados do Catálogo */}
        <div className="space-y-5">
           <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="campaignId">Campanha Vinculada</label>
            <select id="campaignId" name="campaignId" required className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2.5 text-sm">
              <option value="">Selecione uma campanha...</option>
              {campaigns.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="title">Título do Produto / Criativo</label>
            <input id="title" name="title" type="text" required placeholder="Ex: Cinto Modelador Premium" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="description">Descrição</label>
            <textarea id="description" name="description" rows={3} placeholder="Descrição compatível com catálogos" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="sku">SKU (opcional, auto-gerado)</label>
                <input id="sku" name="sku" type="text" placeholder="Gera automático..." className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="price">Preço (Opcional)</label>
                <input id="price" name="price" type="number" step="0.01" placeholder="99.90" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm" />
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="category">Categoria</label>
                <input id="category" name="category" type="text" placeholder="Moda" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="brand">Marca</label>
                <input id="brand" name="brand" type="text" placeholder="Genérica" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="availability">Estoque</label>
                <select id="availability" name="availability" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-2 py-2 text-sm">
                  <option value="in stock">Com Estoque</option>
                  <option value="out of stock">Sem Estoque</option>
                </select>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="condition">Condição</label>
            <select id="condition" name="condition" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-2 py-2 text-sm">
              <option value="new">Novo</option>
              <option value="used">Usado</option>
              <option value="refurbished">Recondicionado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#e4e4e7]" htmlFor="finalUrl">URL Final de Destino (UTMs?)</label>
            <input id="finalUrl" name="finalUrl" type="url" placeholder="https://... deixa em branco para usar a da Oferta" className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] rounded-md px-4 py-2 text-sm" />
          </div>
          
          <div className="space-y-2 hidden">
             <input type="hidden" name="status" value="active" />
          </div>

        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPending ? (
            <>
             <Loader2 className="w-4 h-4 animate-spin" /> Fazendo upload e salvando...
            </>
          ) : (
            <>
             <Upload className="w-4 h-4" /> Finalizar e Subir
            </>
          )}
        </button>
      </div>
    </form>
  );
}
