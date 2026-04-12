import { db } from '@/lib/firebase-admin';
import Link from 'next/link';
import { Plus, Clapperboard, Pencil } from 'lucide-react';
import { Creative } from '@/types';
import DeleteCreativeButton from './DeleteCreativeButton';

async function getCreatives() {
  const snapshot = await db.collection('creatives').where('organizationId', '==', 'dev-org').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creative));
}

async function getOffers() {
  const snapshot = await db.collection('offers').where('organizationId', '==', 'dev-org').get();
  return snapshot.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data().name;
    return acc;
  }, {} as Record<string, string>);
}

export default async function CreativesPage() {
  const creatives = await getCreatives();
  const offersMap = await getOffers();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Criativos</h2>
          <p className="text-[#a1a1aa] mt-1">Gerencie seus vídeos e variações para campanhas.</p>
        </div>
        <Link 
          href="/dashboard/creatives/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Criativo
        </Link>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#27272a]/50 text-[#a1a1aa] text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Mídia</th>
              <th className="px-6 py-4">Título (SKU)</th>
              <th className="px-6 py-4">Oferta</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {creatives.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#a1a1aa]">
                  Nenhum criativo encontrado. Comece a subir seus vídeos!
                </td>
              </tr>
            )}
            {creatives.map(item => (
              <tr key={item.id} className="hover:bg-[#27272a]/20 transition-colors">
                <td className="px-6 py-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded-md border border-[#27272a]" />
                  ) : item.videoUrl ? (
                    <video src={item.videoUrl} className="w-16 h-16 object-cover rounded-md border border-[#27272a]" muted />
                  ) : (
                     <div className="w-16 h-16 bg-[#27272a] rounded-md flex items-center justify-center">
                        <Clapperboard className="w-6 h-6 text-[#52525b]" />
                     </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="text-xs text-[#a1a1aa] mt-1">{item.sku}</div>
                </td>
                <td className="px-6 py-4 text-[#a1a1aa]">
                  {offersMap[item.offerId] || 'Oferta Excluída'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                    {item.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-3 h-[90px]">
                  <Link href={`/dashboard/creatives/${item.id}/edit`} className="text-[#a1a1aa] hover:text-indigo-400 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteCreativeButton id={item.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
