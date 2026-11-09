'use client';

import React from 'react';
import Link from 'next/link';
import { Zap, Waves, ArrowUp, Heart } from 'lucide-react';
import { useProvider } from '@/context/ProviderContext';

export function Footer() {
  const { provider, setProvider } = useProvider();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#050608] border-t border-white/5 pt-12 pb-8 mt-16 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-white/5">
          {/* Logo & Tagline */}
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#08090d] rounded-[10px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="text-base font-black tracking-wider text-white">
                NEXUS<span className="text-cyan-400 font-light">ANIME</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 max-w-sm">
              Next-generation anime discovery and stream extractor platform powered by dual upstream providers.
            </p>
          </div>

          {/* Dual Provider Status */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">Yomi:</span>
              <span className="text-emerald-400">Online</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-slate-300 font-medium">AnimeSalt:</span>
              <span className="text-cyan-400">Online</span>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>
            © {new Date().getFullYear()} NexusAnime. Powered by <code className="text-indigo-400">@iamglitch404/qtme</code>.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
