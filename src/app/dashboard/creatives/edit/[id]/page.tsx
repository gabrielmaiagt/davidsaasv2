import { db } from '@/lib/firebase-admin';
import { getOrganizationId } from '@/lib/session';
import { notFound, redirect } from 'next/navigation';
import EditCreativeForm from './EditCreativeForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getCreative(id: string, orgId: string) {
  const doc = await db.collection('creatives').doc(id).get();
  if (!doc.exists || doc.data()?.organizationId !== orgId) return null;
  return { id: doc.id, ...doc.data() } as any;
}

export default async function EditCreativePage({ params }: { params: Promise<{ id: string }> }) {
  const orgId = await getOrganizationId();
  if (!orgId) redirect('/login');

  const { id: creativeId } = await params;
  const creative = await getCreative(creativeId, orgId);

  if (!creative) return notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <Link 
          href={`/dashboard/creatives/${creative.campaignId}`} 
          className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors group mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para a Pasta
        </Link>
        <h2 className="text-4xl font-black text-white tracking-tighter font-headline">Editar Criativo</h2>
        <p className="text-on-surface-variant mt-2 opacity-80 text-sm">Atualize os metadados do anúncio para sincronia com o TikTok Ads.</p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-8 shadow-xl">
        <EditCreativeForm creative={creative} />
      </div>
    </div>
  );
}
