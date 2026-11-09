'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Globe2, 
  Sparkles, 
  Tv, 
  Compass, 
  Star 
} from 'lucide-react';
import { UnifiedAnime } from '@/lib/anime';
import { AnimeCard } from './AnimeCard';

export type SectionIconType = 'flame' | 'globe' | 'sparkles' | 'tv' | 'compass' | 'star';

interface AnimeSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  iconName?: SectionIconType;
  items: UnifiedAnime[];
  viewAllHref?: string;
  badge?: string;
}

const ICON_MAP = {
  flame: Flame,
  globe: Globe2,
  sparkles: Sparkles,
  tv: Tv,
  compass: Compass,
  star: Star,
};

export function AnimeSection({
  id,
  title,
  subtitle,
  iconName,
  items,
  viewAllHref,
  badge
}: AnimeSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = iconName ? ICON_MAP[iconName] : null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    const offset = direction === 'left' ? -scrollAmount : scrollAmount;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section id={id} className="w-full px-3 sm:px-6 lg:px-8 py-3">
      {/* Section Header */}
      <div className="flex items-end justify-between gap-4 mb-2.5 px-1 sm:px-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />}
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Scroll Controls and View All */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl glass-button text-slate-300 hover:text-white transition-all active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl glass-button text-slate-300 hover:text-white transition-all active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 ml-1.5 hover:underline"
            >
              <span>View All</span>
              <span className="text-[11px]">&rarr;</span>
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Carousel with clean snapping & end padding */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto hide-scrollbar scroll-smooth pb-2 pt-0.5 px-1 sm:px-2 snap-x snap-mandatory"
      >
        {items.map((anime, idx) => (
          <div
            key={anime.id + '-' + idx}
            className="w-[140px] sm:w-[170px] md:w-[195px] lg:w-[210px] shrink-0 snap-start"
          >
            <AnimeCard anime={anime} />
          </div>
        ))}
        {/* End spacing element so the last card is never clipped */}
        <div className="w-6 shrink-0" />
      </div>
    </section>
  );
}
