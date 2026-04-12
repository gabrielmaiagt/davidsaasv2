import { db } from '@/lib/firebase-admin';
import { createXML } from '@/app/actions/exports';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.campaignId;

  if (!campaignId) {
    return new Response('No campaign ID provided', { status: 400 });
  }

  try {
    // 1. Fetch creatives tied to this campaign
    const snap = await db.collection('creatives')
      .where('organizationId', '==', 'dev-org')
      .where('campaignId', '==', campaignId)
      .get();
      
    const creatives = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 2. Fetch the Campaign data to map base URLs
    const campaignDoc = await db.collection('campaigns').doc(campaignId).get();
    
    if (!campaignDoc.exists) {
       return new Response('Campaign not found', { status: 404 });
    }

    const campaignsMap = {
      [campaignDoc.id]: campaignDoc.data()
    };

    // 3. Generate XML dynamically
    const xml = createXML(creatives, campaignsMap);

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
