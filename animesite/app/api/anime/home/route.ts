import { NextResponse } from 'next/server';
import { getHomePageData } from '@/lib/anime';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getHomePageData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch home data' }, { status: 500 });
  }
}
