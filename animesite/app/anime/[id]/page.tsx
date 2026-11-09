'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Star, 
  Clock, 
  Tv, 
  Building2, 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { UnifiedAnimeDetails } from '@/lib/anime';
import { EpisodeServersExplorer } from '@/components/EpisodeServersExplorer';
import { AnimeSection } from '@/components/AnimeSection';

export default function AnimeDetailPage({
  params: paramsPromise
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const searchParams = useSearchParams();
  const providerHint = searchParams.get('provider') as 'yomi' | 'animesalt' | null;

  const [details, setDetails] = useState<UnifiedAnimeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadDetails = async () => {
      try {
        const idParam = encodeURIComponent(params.id);
        const providerQuery = providerHint ? `&provider=${providerHint}` : '';
        const res = await fetch(`/api/anime/details?id=${idParam}${providerQuery}`);
        if (!res.ok) {
          throw new Error(`Failed to load anime (${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          setDetails(data);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error fetching details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [params.id, providerHint]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 pt-20">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading anime details & stream sources...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 pt-20 px-4 text-center">
        <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Anime Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md">
          We couldn&apos;t load the anime with ID: <code className="text-indigo-300 font-mono text-xs">{decodeURIComponent(params.id)}</code>.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Back to Home Catalog
        </Link>
      </div>
    );
  }

  const backdropImage = details.banner || details.image;

  return (
    <div className="w-full min-h-screen pb-16 pt-16 sm:pt-20">
      {/* Backdrop Header Banner */}
      <div className="relative w-full h-[50vh] min-h-[380px] max-h-[520px] overflow-hidden -mt-16 sm:-mt-20">
        {backdropImage && (
          <Image
            src={backdropImage}
            alt={details.title}
            fill
            priority
            className="object-cover object-center filter brightness-[0.5] contrast-[1.1]"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/70 to-black/30" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 -mt-40 relative z-10 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Anime</span>
          </Link>
        </div>

        {/* Anime Showcase Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-slate-900 group">
              {details.image && (
                <Image
                  src={details.image}
                  alt={details.title}
                  fill
                  priority
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
              )}
              {details.score && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md text-xs font-bold text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {details.score} / 10
                </div>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                {details.type && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">
                    {details.type}
                  </span>
                )}
                {details.status && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {details.status}
                  </span>
                )}
                {details.totalEpisodes && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {details.totalEpisodes} Episodes
                  </span>
                )}
                {details.duration && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {details.duration}
                  </span>
                )}
                {details.studio && (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {details.studio}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {details.title}
              </h1>
            </div>

            {/* Genre Chips */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {details.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/genres?genre=${encodeURIComponent(genre)}`}
                    className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {details.description && (
              <div className="space-y-1.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Synopsis
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl whitespace-pre-line">
                  {details.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Episode & Stream Server Explorer */}
        <div className="pt-4">
          <EpisodeServersExplorer
            episodes={details.episodes}
            animeTitle={details.title}
            provider={details.provider}
          />
        </div>

        {/* Recommended Series */}
        {details.recommended && details.recommended.length > 0 && (
          <div className="pt-6">
            <AnimeSection
              title="Recommended Anime"
              subtitle="Fans who watched this also enjoyed"
              iconName="sparkles"
              items={details.recommended}
            />
          </div>
        )}
      </div>
    </div>
  );
}
