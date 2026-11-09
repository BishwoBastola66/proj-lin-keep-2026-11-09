import { NextResponse } from 'next/server';
import { getAnimeDetails } from '@/lib/anime';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idOrUrl = searchParams.get('id') || searchParams.get('url') || '';
  const providerParam = searchParams.get('provider');
  const provider = (providerParam === 'yomi' || providerParam === 'animesalt') ? providerParam : undefined;

  if (!idOrUrl) {
    return NextResponse.json({ error: 'Missing anime ID or URL' }, { status: 400 });
  }

  try {
    const details = await getAnimeDetails(idOrUrl, provider);
    if (!details) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }
    return NextResponse.json(details);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch details' }, { status: 500 });
  }
}
