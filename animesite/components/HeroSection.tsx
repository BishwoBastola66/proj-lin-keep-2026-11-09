'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Play, 
  Info, 
  Star, 
  Flame,
  Building2
} from 'lucide-react';
import { UnifiedHeroItem } from '@/lib/anime';

interface HeroSectionProps {
  items: UnifiedHeroItem[];
}

const SLIDE_DURATION = 5000; // 5 seconds per slide

export function HeroSection({ items }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Auto rotate slides with smooth progress animation
  useEffect(() => {
    if (!items || items.length <= 1) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);

      if (elapsed >= SLIDE_DURATION) {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setProgress(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [items, currentIndex]);

  if (!items || items.length === 0) {
    return null;
  }

  const current = items[currentIndex] || items[0];
  const animeSlug = encodeURIComponent(current.url || current.id);
  const backdropImage = current.banner || current.image;

  return (
    <section className="relative w-full min-h-[580px] md:h-[84vh] md:max-h-[820px] overflow-hidden bg-[#08090d] flex items-center">
      {/* 1. Backdrop Banner Image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {backdropImage && (
          <Image
            key={backdropImage}
            src={backdropImage}
            alt={current.title}
            fill
            priority
            className="object-cover object-top sm:object-center filter brightness-[0.75] contrast-[1.1] transition-all duration-1000 transform scale-100 animate-in fade-in duration-700"
            sizes="100vw"
          />
        )}

        {/* Subtle cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090d] via-[#08090d]/65 to-transparent/30" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="relative z-10 w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Title, Synopsis, Metadata, Action Buttons */}
          <div className="lg:col-span-8 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white shadow-lg flex items-center gap-1.5 font-bold">
                <Flame className="w-3.5 h-3.5 fill-white" />
                #{currentIndex + 1} Spotlight
              </span>

              {current.score && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {current.score} / 10
                </span>
              )}

              {current.type && (
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-200 backdrop-blur-xs border border-white/15 uppercase font-mono">
                  {current.type}
                </span>
              )}

              {current.episode && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {current.episode}
                </span>
              )}

              {current.studio && (
                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {current.studio}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-2xl">
                {current.title}
              </h1>
              {current.romajiTitle && current.romajiTitle !== current.title && (
                <p className="text-sm sm:text-base text-slate-300 font-medium italic drop-shadow">
                  {current.romajiTitle}
                </p>
              )}
            </div>

            {/* Genres */}
            {current.genres && current.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {current.genres.slice(0, 5).map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10 backdrop-blur-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {current.description && (
              <p className="text-sm sm:text-base text-slate-200 line-clamp-3 leading-relaxed drop-shadow max-w-2xl">
                {current.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/anime/${animeSlug}?provider=${current.provider}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm sm:text-base shadow-xl glow-indigo transition-all transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Explore Series</span>
              </Link>

              <Link
                href={`/anime/${animeSlug}?provider=${current.provider}`}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl glass-button text-white font-semibold text-sm sm:text-base hover:bg-white/15"
              >
                <Info className="w-4 h-4 text-slate-300" />
                <span>Details & Servers</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Featured Anime Poster Card with bottom overlay and auto-slide progress line */}
          <div className="hidden lg:flex lg:col-span-4 justify-end">
            <Link
              href={`/anime/${animeSlug}?provider=${current.provider}`}
              className="relative w-64 sm:w-72 lg:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900"
            >
              {current.image && (
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 300px, 360px"
                />
              )}

              {/* Score badge */}
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-bold text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {current.score || '8.5'}
              </div>

              {/* Bottom Spotlight Title Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest font-bold block">
                  FEATURED SPOTLIGHT
                </span>
                <p className="text-xs sm:text-sm font-bold text-white truncate">{current.title}</p>
              </div>

              {/* Auto-Slide Progress Bar line at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
