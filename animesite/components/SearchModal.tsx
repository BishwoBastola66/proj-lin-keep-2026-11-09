'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2, Sparkles, Star, Zap } from 'lucide-react';
import { UnifiedAnime } from '@/lib/anime';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Romance', 'Sci-Fi', 'Supernatural', 'Mystery', 'Shounen'
];

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('All');
  const [results, setResults] = useState<UnifiedAnime[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search querying all providers simultaneously
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      if (!query.trim() && !selectedGenre) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (selectedGenre) params.set('genre', selectedGenre);
        if (selectedType !== 'All') params.set('type', selectedType);

        const res = await fetch(`/api/anime/search?${params.toString()}`);
        const data = await res.json();
        setResults(data.data || []);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedGenre, selectedType, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 md:pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="w-full max-w-3xl glass-dropdown rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all anime series, movies, dubbed & subbed..."
            className="w-full bg-transparent text-white placeholder-slate-400 outline-none text-base md:text-lg"
          />
          {loading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
          >
            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 border border-white/15">ESC</span>
          </button>
        </div>

        {/* Formats & Genres Toolbar */}
        <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <span className="text-slate-400 shrink-0">Genre:</span>
            {GENRES.slice(0, 6).map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {['All', 'TV', 'Movie'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedType === t
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {results.map((item, idx) => {
                const animeSlug = encodeURIComponent(item.url || item.id);
                return (
                  <Link
                    key={item.id + '-' + idx}
                    href={`/anime/${animeSlug}?provider=${item.provider}`}
                    onClick={onClose}
                    className="flex gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 transition-all group"
                  >
                    <div className="relative w-16 h-22 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="64px"
                        />
                      )}
                      {item.score && (
                        <div className="absolute top-1 right-1 px-1 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {item.score}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                          item.provider === 'animesalt' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {item.provider === 'animesalt' ? 'Salt' : 'Yomi'}
                        </span>
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {item.type && <span className="px-1.5 py-0.5 rounded bg-white/10">{item.type}</span>}
                        {item.episode && <span>{item.episode}</span>}
                        {item.language && <span className="text-cyan-300">{item.language}</span>}
                      </div>
                      {item.genres && item.genres.length > 0 && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {item.genres.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : query || selectedGenre ? (
            !loading && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm">No anime found matching your search across all providers.</p>
                <p className="text-xs text-slate-500 mt-1">Try another keyword or filter.</p>
              </div>
            )
          ) : (
            <div className="py-10 text-center text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto text-indigo-400/50 mb-2" />
              <p className="text-sm text-slate-400">Search anime series, movies, dubbed & subbed streams</p>
              <p className="text-xs text-slate-500 mt-1">Direct stream links & multi-language dubs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
