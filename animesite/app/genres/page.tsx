'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layers, Loader2, Sparkles } from 'lucide-react';
import { UnifiedAnime } from '@/lib/anime';
import { AnimeCard } from '@/components/AnimeCard';

const ALL_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Shounen', 'Shoujo', 'Seinen', 'Josei'
];

function GenresContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'Action';

  const [activeGenre, setActiveGenre] = useState(initialGenre);
  const [activeType, setActiveType] = useState('All');
  const [items, setItems] = useState<UnifiedAnime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadGenreAnime = async () => {
      try {
        const params = new URLSearchParams();
        params.set('genre', activeGenre);
        if (activeType !== 'All') params.set('type', activeType);

        const res = await fetch(`/api/anime/search?${params.toString()}`);
        const data = await res.json();
        if (isMounted) {
          setItems(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching genre items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGenreAnime();

    return () => {
      isMounted = false;
    };
  }, [activeGenre, activeType]);

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Browse Anime by Category & Genre
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Explore thousands of anime series and movies across all upstream sources.
          </p>
        </div>
      </div>

      {/* Genre Pills Cloud */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Select Category:
          </span>
          <div className="flex items-center gap-1 text-xs">
            {['All', 'TV', 'Movie'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  activeType === t
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ALL_GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeGenre === g
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg glow-indigo scale-105'
                  : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/5'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Results Title & Grid */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <span>{activeGenre} Anime</span>
          {activeType !== 'All' && <span className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 font-normal">({activeType})</span>}
        </h2>
        <span className="text-xs text-slate-400 font-mono">{items.length} titles aggregated</span>
      </div>

      {loading ? (
        <div className="py-24 text-center text-slate-400 space-y-3">
          <Loader2 className="w-10 h-10 mx-auto text-indigo-400 animate-spin" />
          <p className="text-sm font-medium">Filtering {activeGenre} anime...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 sm:gap-5">
          {items.map((anime, idx) => (
            <AnimeCard key={anime.id + '-' + idx} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm">No titles found for {activeGenre}.</p>
          <p className="text-xs text-slate-500">Try selecting another genre or format.</p>
        </div>
      )}
    </div>
  );
}

export default function GenresPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
      </div>
    }>
      <GenresContent />
    </Suspense>
  );
}
