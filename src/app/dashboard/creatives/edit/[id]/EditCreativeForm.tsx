'use client';

import { useState } from 'react';
import { updateCreativeAction } from '@/app/actions/creatives';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditCreativeForm({ creative }: { creative: any }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: creative.title || '',
    description: creative.description || '',
    finalUrl: creative.finalUrl || '',
    price: creative.price || '',
    brand: creative.brand || '',
    category: creative.category || '',
    status: creative.status || 'active',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError('');

    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value.toString());
    });

    try {
      const result = await updateCreativeAction(creative.id, fd);
      if (result.success) {
        router.push(`/dashboard/creatives/${creative.campaignId}`);
      } else {
        setError(result.error || 'Falha ao atualizar');
      }
    } catch (err) {
      setError('Erro de conexão ao servidor');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Título do Criativo</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Link de Destino (URL Transparente)</label>
          <input
            name="finalUrl"
            value={formData.finalUrl}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
          >
            <option value="active">Ativo (Live)</option>
            <option value="paused">Pausado (Idle)</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Descrição / Corpo do Anúncio</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Marca</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-1">Preço (Opcional)</label>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>
      </div>

      {error && <p className="text-xs text-secondary font-bold text-center">{error}</p>}

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-on-primary font-headline font-black px-8 py-3 rounded-xl uppercase tracking-widest text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}
