import { NextResponse } from 'next/server';
import { searchAnime } from '@/lib/anime';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre');
  const type = searchParams.get('type');

  try {
    const genres = genre ? [genre] : undefined;
    const types = type && type !== 'All' ? [type] : undefined;
    const results = await searchAnime(query, { genres, types });
    return NextResponse.json({ data: results, count: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to search anime' }, { status: 500 });
  }
}
