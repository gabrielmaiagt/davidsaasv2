import { db } from '@/lib/firebase-admin';
import { createXML } from '@/app/actions/exports';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const resolvedParams = await params;
  let campaignId = resolvedParams.campaignId;

  // Se o ID vier com .xml (ex: ID.xml), limpamos para buscar no banco
  if (campaignId.endsWith('.xml')) {
    campaignId = campaignId.replace('.xml', '');
  }

  if (!campaignId) {
    return new Response('No campaign ID provided', { status: 400 });
  }

  try {
    // 1. Fetch campaign — first try by document ID, then by feedToken
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

    const campaignData = campaignDoc.data()!;
    const orgId = campaignData.organizationId;

    // 2. Fetch creatives tied to this campaign AND organization
    const snap = await db.collection('creatives')
      .where('organizationId', '==', orgId)
      .where('campaignId', '==', campaignId)
      .get();
      
    const creatives = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    const campaignsMap = {
      [campaignDoc.id]: campaignData
    };

    // 3. Generate XML dynamically
    const xml = await createXML(creatives, campaignsMap);

    // 4. Return as XML proper response
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });

  } catch (error) {
    console.error('Error generating live feed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
