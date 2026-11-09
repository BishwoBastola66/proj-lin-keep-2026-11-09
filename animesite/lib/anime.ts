import { yomi, animesalt } from '@iamglitch404/qtme';

export type ProviderType = 'all' | 'yomi' | 'animesalt';

export interface UnifiedAnime {
  id: string;
  title: string;
  url: string;
  image: string;
  banner?: string;
  episode?: string;
  type?: string;
  status?: string;
  language?: string;
  score?: string;
  genres?: string[];
  description?: string;
  duration?: string;
  studio?: string;
  color?: string;
  provider: 'yomi' | 'animesalt';
}

export interface UnifiedHeroItem extends UnifiedAnime {
  romajiTitle?: string;
  nativeTitle?: string;
}

export interface UnifiedHomePageData {
  hero: UnifiedHeroItem[];
  trending: {
    weekly: UnifiedAnime[];
    monthly: UnifiedAnime[];
    allTime: UnifiedAnime[];
  };
  popular: UnifiedAnime[];
  popularToday: UnifiedAnime[];
  latestEpisodes: UnifiedAnime[];
  latest: UnifiedAnime[];
  ongoing: UnifiedAnime[];
  dubbed: UnifiedAnime[];
  topCompleted: UnifiedAnime[];
  seasons: { name: string; url: string; count: number }[];
}

export interface UnifiedEpisode {
  id: string;
  number: string;
  title?: string;
  url: string;
  date?: string;
  type?: string;
}

export interface UnifiedServer {
  name: string;
  category: string;
  type: 'm3u8' | 'iframe' | string;
  streamUrl?: string;
  url?: string;
  headers?: Record<string, string>;
  subtitles?: Array<{ lang: string; url: string }>;
  intro?: { start: number; end: number };
}

export interface UnifiedEpisodeDetails {
  id: string;
  title: string;
  url: string;
  servers: UnifiedServer[];
  image?: string;
  score?: string;
  description?: string;
  genres?: string[];
  recommended?: UnifiedAnime[];
}

export interface UnifiedAnimeDetails {
  id: string;
  title: string;
  url: string;
  image?: string;
  banner?: string;
  description?: string;
  score?: string;
  status?: string;
  type?: string;
  genres?: string[];
  duration?: string;
  studio?: string;
  totalEpisodes?: string;
  episodes: UnifiedEpisode[];
  recommended: UnifiedAnime[];
  provider: 'yomi' | 'animesalt';
}

export function cleanDescription(text?: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .trim();
}

function normalizeAnime(item: any, provider: 'yomi' | 'animesalt'): UnifiedAnime | null {
  if (!item) return null;
  const meta = item.metadata || {};
  const image = item.image || meta.banner;
  
  // Exclude items with no valid image from the upstream provider
  if (!image || typeof image !== 'string' || image.includes('unsplash.com') || image.trim() === '') {
    return null;
  }

  return {
    id: String(item.id || item.url?.replace(/[^a-zA-Z0-9_-]/g, '') || Math.random()),
    title: item.title || 'Untitled Anime',
    url: item.url || '',
    image,
    banner: meta.banner || image,
    episode: item.episode || (meta.totalEpisodes ? `${meta.totalEpisodes} Eps` : undefined),
    type: item.type || meta.Type || 'TV',
    status: item.status || (meta.status ? String(meta.status) : undefined),
    language: item.language || (provider === 'animesalt' ? 'Multi-Dub' : 'Sub/Dub'),
    score: item.score ? String(item.score) : undefined,
    genres: item.genres || [],
    description: cleanDescription(item.description),
    duration: item.duration ? `${item.duration} min` : meta.Duration,
    studio: meta.studio,
    color: meta.color || '#6366f1',
    provider
  };
}

function deduplicateAnime(items: (UnifiedAnime | null)[]): UnifiedAnime[] {
  const seen = new Set<string>();
  const result: UnifiedAnime[] = [];

  for (const item of items) {
    if (!item || !item.image) continue;
    // Clean normalized title key
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

// Fetch home page data merging both Yomi and AnimeSalt
export async function getHomePageData(): Promise<UnifiedHomePageData> {
  const [yomiRes, saltRes] = await Promise.allSettled([
    yomi.getHomePageData(),
    animesalt.getHomePageData()
  ]);

  const yomiHome = yomiRes.status === 'fulfilled' ? yomiRes.value : null;
  const saltHome = saltRes.status === 'fulfilled' ? saltRes.value : null;

  const yomiPopular = (yomiHome?.popular || []).map(a => normalizeAnime(a, 'yomi'));
  const saltPopular = (saltHome?.popular || []).map(a => normalizeAnime(a, 'animesalt'));

  const yomiLatest = (yomiHome?.latest || []).map(a => normalizeAnime(a, 'yomi'));
  const saltLatest = (saltHome?.latest || []).map(a => normalizeAnime(a, 'animesalt'));

  const yomiOngoing = (yomiHome?.ongoing || []).map(a => normalizeAnime(a, 'yomi'));
  const saltOngoing = (saltHome?.ongoing || []).map(a => normalizeAnime(a, 'animesalt'));

  const yomiTopCompleted = (yomiHome?.topCompleted || []).map(a => normalizeAnime(a, 'yomi'));

  // Weekly / Monthly Trending
  const yomiWeekly = (yomiHome?.trending?.weekly || []).map(a => normalizeAnime(a, 'yomi'));
  const saltWeekly = (saltHome?.trending?.weekly || []).map(a => normalizeAnime(a, 'animesalt'));

  const weekly = deduplicateAnime([...yomiWeekly, ...saltWeekly]);
  const popular = deduplicateAnime([...yomiPopular, ...saltPopular]);
  const latest = deduplicateAnime([...yomiLatest, ...saltLatest]);
  
  // Ongoing Airing anime (filter items with status RELEASING or active episode count)
  const ongoing = deduplicateAnime([
    ...yomiOngoing,
    ...saltOngoing,
    ...latest.filter(a => a.status === 'RELEASING' || (a.episode && !a.episode.toLowerCase().includes('movie'))),
    ...popular.filter(a => a.status === 'RELEASING')
  ]);

  // Multi-language dubbed series with verified covers
  const dubbed = deduplicateAnime(
    saltPopular.concat(saltLatest).filter(a => a !== null)
  );

  // Top Completed Masterpieces
  const topCompleted = deduplicateAnime([
    ...yomiTopCompleted,
    ...popular.filter(a => a.status === 'FINISHED' || (a.score && parseFloat(a.score) >= 8.4))
  ]);

  // Hero Spotlight items (High-res AniList banners prioritized)
  const heroPool = deduplicateAnime([...weekly, ...popular, ...saltPopular]);

  const hero: UnifiedHeroItem[] = heroPool.slice(0, 8).map((item) => ({
    ...item,
    romajiTitle: item.title,
    nativeTitle: undefined
  }));

  const popularToday = deduplicateAnime(saltPopular);
  const latestEpisodes = deduplicateAnime(saltLatest);

  return JSON.parse(JSON.stringify({
    hero,
    trending: {
      weekly: weekly.length > 0 ? weekly : popular.slice(0, 15),
      monthly: popular.slice(5, 20),
      allTime: popular
    },
    popular,
    popularToday: popularToday.length > 0 ? popularToday : popular.slice(0, 15),
    latestEpisodes: latestEpisodes.length > 0 ? latestEpisodes : popular.slice(0, 15),
    latest,
    ongoing: ongoing.length > 0 ? ongoing : latest,
    dubbed: dubbed.length > 0 ? dubbed : popular.slice(0, 15),
    topCompleted: topCompleted.length > 0 ? topCompleted : popular.slice(0, 10),
    seasons: yomiHome?.seasons || saltHome?.seasons || []
  }));
}

// Search anime across BOTH providers simultaneously
export async function searchAnime(
  query: string,
  options?: { genres?: string[]; types?: string[]; page?: number }
): Promise<UnifiedAnime[]> {
  const [yomiRes, saltRes] = await Promise.allSettled([
    yomi.search({
      query,
      genres: options?.genres,
      types: options?.types,
      page: options?.page || 1
    }),
    animesalt.search({
      query,
      genres: options?.genres,
      types: options?.types,
      page: options?.page || 1
    })
  ]);

  const yomiResults = yomiRes.status === 'fulfilled' ? (yomiRes.value.data || []).map(a => normalizeAnime(a, 'yomi')) : [];
  const saltResults = saltRes.status === 'fulfilled' ? (saltRes.value.data || []).map(a => normalizeAnime(a, 'animesalt')) : [];

  // Deduplicate and combine
  return deduplicateAnime([...yomiResults, ...saltResults]);
}

// Fetch anime details with automatic provider resolution
export async function getAnimeDetails(
  idOrUrl: string,
  hintProvider?: 'yomi' | 'animesalt'
): Promise<UnifiedAnimeDetails | null> {
  const decoded = decodeURIComponent(idOrUrl);
  const isSalt = hintProvider === 'animesalt' || decoded.includes('animesalt.ro');

  if (isSalt) {
    try {
      const details = await animesalt.getAnimeDetails(decoded);
      const episodes: UnifiedEpisode[] = (details.episodes || []).map((ep: any, idx: number) => ({
        id: ep.id || `ep-${idx + 1}`,
        number: String(ep.number || idx + 1),
        title: ep.title || `Episode ${ep.number || idx + 1}`,
        url: ep.url || '',
        date: ep.date,
        type: ep.type
      }));
      const recommended = deduplicateAnime((details.recommended || []).map(a => normalizeAnime(a, 'animesalt')));

      return {
        id: String(details.id || idOrUrl),
        title: details.title || 'Anime Details',
        url: details.url || decoded,
        image: details.image || '',
        banner: (details.metadata as any)?.banner || details.image,
        description: cleanDescription(details.description),
        score: details.score ? String(details.score) : undefined,
        status: details.status || (details.metadata as any)?.status,
        type: details.type || (details.metadata as any)?.Type,
        genres: details.genres || [],
        duration: details.duration,
        studio: (details.metadata as any)?.studio,
        totalEpisodes: (details.metadata as any)?.totalEpisodes || String(episodes.length),
        episodes,
        recommended,
        provider: 'animesalt'
      };
    } catch (e) {
      console.error('AnimeSalt details error:', e);
    }
  }

  // Otherwise try Yomi
  try {
    let targetUrl = decoded;
    if (!targetUrl.startsWith('/') && !targetUrl.startsWith('http')) {
      targetUrl = `/anime/${targetUrl}`;
    }
    const details = await yomi.getAnimeDetails(targetUrl);
    const episodes: UnifiedEpisode[] = (details.episodes || []).map((ep: any, idx: number) => ({
      id: ep.id || `ep-${idx + 1}`,
      number: String(ep.number || idx + 1),
      title: ep.title || `Episode ${ep.number || idx + 1}`,
      url: ep.url || '',
      date: ep.date,
      type: ep.type
    }));
    const recommended = deduplicateAnime((details.recommended || []).map(a => normalizeAnime(a, 'yomi')));

    return {
      id: String(details.id || idOrUrl),
      title: details.title || 'Anime Details',
      url: details.url || targetUrl,
      image: details.image || (details.metadata as any)?.banner || '',
      banner: (details.metadata as any)?.banner || details.image,
      description: cleanDescription(details.description),
      score: details.score ? String(details.score) : undefined,
      status: details.status || (details.metadata as any)?.status,
      type: details.type || (details.metadata as any)?.Type,
      genres: details.genres || [],
      duration: details.duration,
      studio: (details.metadata as any)?.studio,
      totalEpisodes: (details.metadata as any)?.totalEpisodes || String(episodes.length),
      episodes,
      recommended,
      provider: 'yomi'
    };
  } catch (err) {
    console.error('Yomi details error, trying AnimeSalt fallback:', err);
    try {
      const details = await animesalt.getAnimeDetails(decoded);
      const episodes: UnifiedEpisode[] = (details.episodes || []).map((ep: any, idx: number) => ({
        id: ep.id || `ep-${idx + 1}`,
        number: String(ep.number || idx + 1),
        title: ep.title || `Episode ${ep.number || idx + 1}`,
        url: ep.url || '',
        date: ep.date,
        type: ep.type
      }));
      return {
        id: String(details.id || idOrUrl),
        title: details.title || 'Anime Details',
        url: details.url || decoded,
        image: details.image || '',
        banner: details.image,
        description: cleanDescription(details.description),
        score: details.score ? String(details.score) : undefined,
        status: details.status,
        type: details.type,
        genres: details.genres || [],
        duration: details.duration,
        studio: (details.metadata as any)?.studio,
        totalEpisodes: String(episodes.length),
        episodes,
        recommended: [],
        provider: 'animesalt'
      };
    } catch (e2) {
      console.error('Final fallback details error:', e2);
      return null;
    }
  }
}

// Fetch episode streams with auto provider detection
export async function getEpisodeStreams(
  url: string,
  hintProvider?: 'yomi' | 'animesalt'
): Promise<UnifiedEpisodeDetails | null> {
  const decodedUrl = decodeURIComponent(url);
  const client = (hintProvider === 'animesalt' || decodedUrl.includes('animesalt.ro')) ? animesalt : yomi;

  try {
    const episodeData = await client.getEpisodeDetails(decodedUrl);
    const servers: UnifiedServer[] = (episodeData.servers || []).map((s: any) => ({
      name: s.name || 'Default Server',
      category: s.category || 'SUB',
      type: s.type || (s.streamUrl ? 'm3u8' : 'iframe'),
      streamUrl: s.streamUrl,
      url: s.url,
      headers: s.headers,
      subtitles: s.subtitles,
      intro: s.intro
    }));

    return {
      id: episodeData.id || decodedUrl,
      title: episodeData.title || 'Episode Watch',
      url: episodeData.url || decodedUrl,
      servers,
      image: episodeData.image,
      score: episodeData.score,
      description: cleanDescription(episodeData.description),
      genres: episodeData.genres,
      recommended: []
    };
  } catch (error) {
    console.error(`Episode stream extraction error for ${url}:`, error);
    return null;
  }
}
