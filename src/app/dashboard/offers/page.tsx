import { db } from '@/lib/firebase-admin';
import Link from 'next/link';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Offer } from '@/types';
import DeleteOfferButton from './DeleteOfferButton';

async function getOffers() {
  const snapshot = await db.collection('offers').where('organizationId', '==', 'dev-org').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
}

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ofertas</h2>
          <p className="text-[#a1a1aa] mt-1">Gerencie suas ofertas e campanhas.</p>
        </div>
        <Link 
          href="/dashboard/offers/new" 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Oferta
        </Link>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#27272a]/50 text-[#a1a1aa] text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Nome da Oferta</th>
              <th className="px-6 py-4">Slug</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {offers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-[#a1a1aa]">
                  Nenhuma oferta encontrada. Comece criando a primeira!
                </td>
              </tr>
            )}
            {offers.map(offer => (
              <tr key={offer.id} className="hover:bg-[#27272a]/20 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{offer.name}</td>
                <td className="px-6 py-4 text-[#a1a1aa]">{offer.slug}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${offer.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'}`}>
                    {offer.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#a1a1aa]">{new Date(offer.updatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                  <Link href={`/dashboard/offers/${offer.id}/edit`} className="text-[#a1a1aa] hover:text-indigo-400 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <DeleteOfferButton id={offer.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
