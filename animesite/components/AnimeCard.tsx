'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Play, Tv } from 'lucide-react';
import { UnifiedAnime } from '@/lib/anime';
import { useProvider } from '@/context/ProviderContext';

interface AnimeCardProps {
  anime: UnifiedAnime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const { provider } = useProvider();
  const animeSlug = encodeURIComponent(anime.url || anime.id);

  return (
    <Link
      href={`/anime/${animeSlug}?provider=${anime.provider || provider}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
        {anime.image ? (
          <Image
            src={anime.image}
            alt={anime.title}
            fill
            className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
            <Tv className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {anime.score && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[11px] font-bold text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow">
              <Star className="w-3 h-3 fill-amber-400" />
              {anime.score}
            </span>
          )}
          {anime.type && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-semibold text-slate-200 border border-white/10 uppercase tracking-wider ml-auto">
              {anime.type}
            </span>
          )}
        </div>

        {/* Bottom Badge inside image */}
        {anime.episode && (
          <div className="absolute bottom-2 left-2 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur-xs text-[10px] font-bold text-white shadow">
              {anime.episode}
            </span>
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-xl glow-indigo">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Anime Info */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1">
        <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 leading-snug">
          {anime.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span className="truncate">{anime.genres?.[0] || anime.language || 'Anime'}</span>
          {anime.status && (
            <span className="text-[10px] text-emerald-400 font-medium shrink-0">
              {anime.status}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
