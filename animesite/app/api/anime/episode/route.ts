import { NextResponse } from 'next/server';
import { getEpisodeStreams } from '@/lib/anime';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || '';
  const providerParam = searchParams.get('provider');
  const provider = (providerParam === 'yomi' || providerParam === 'animesalt') ? providerParam : undefined;

  if (!url) {
    return NextResponse.json({ error: 'Missing episode URL parameter' }, { status: 400 });
  }

  try {
    const streamData = await getEpisodeStreams(url, provider);
    if (!streamData) {
      return NextResponse.json({ error: 'Failed to extract episode streams' }, { status: 404 });
    }
    return NextResponse.json(streamData);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Stream extraction error' }, { status: 500 });
  }
}
