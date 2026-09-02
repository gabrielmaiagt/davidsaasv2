import { db } from '@/lib/firebase-admin';
import { createXMLWithUtm } from '@/lib/feed-utm';
import { NextRequest } from 'next/server';

/**
 * Feed COM UTM — rota em teste.
 *
 * Espelha a rota de produção (`/api/feed/[campaignId]`), mas usa o gerador
 * isolado de `@/lib/feed-utm`. A rota de produção não foi tocada.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const resolvedParams = await params;
  let campaignId = resolvedParams.campaignId;

  if (campaignId.endsWith('.xml')) {
    campaignId = campaignId.replace('.xml', '');
  }

  if (!campaignId) {
    return new Response('No campaign ID provided', { status: 400 });
  }

  try {
    let campaignDoc = await db.collection('campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      const tokenSnap = await db.collection('campaigns')
        .where('feedToken', '==', campaignId)
        .limit(1)
        .get();
      if (tokenSnap.empty) {
        return new Response('Campaign not found', { status: 404 });
      }
      campaignDoc = tokenSnap.docs[0] as any;
    }

    campaignId = campaignDoc.id;

    const campaignData = campaignDoc.data()!;
    const orgId = campaignData.organizationId;

    const snap = await db.collection('creatives')
      .where('organizationId', '==', orgId)
      .where('campaignId', '==', campaignId)
      .get();

    const creatives = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const campaignsMap = {
      [campaignDoc.id]: campaignData
    };

    const xml = createXMLWithUtm(creatives, campaignsMap);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });

  } catch (error) {
    console.error('Error generating UTM feed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
