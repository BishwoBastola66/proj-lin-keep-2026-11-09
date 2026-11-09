'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onOpenContact?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {

  return (
    <footer className="bg-white border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.03)] pt-8 sm:pt-10 pb-6 text-slate-700 text-sm relative overflow-hidden font-sans">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-30 pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-3.5 sm:px-6 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 sm:gap-x-8 gap-y-8 lg:gap-12 pb-8 border-b border-slate-200/80">
          <div className="col-span-2 lg:col-span-6 space-y-3.5 max-w-lg">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Gyanav Solutions Logo"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold tracking-tight text-slate-950 text-sm sm:text-base leading-tight block font-sans">
                    GYANAV SOLUTIONS
                  </span>
                  <span className="text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wider block">
                    CONSULTING SERVICES
                  </span>
                </div>
              </div>

              {/* Social & Web SVG Squircles */}
              <div className="flex items-center gap-2">
                <a
                  href="https://www.linkedin.com/company/gyanav-solutions"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#0A66C2] transition-all shadow-2xs hover:shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>

                <Link
                  href="/"
                  aria-label="Website"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-2xs hover:shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </svg>
                </Link>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Providing strategic IT consulting, healthcare data interoperability, and production-grade engineering implementation for organizations with complex requirements.
            </p>
          </div>

          {/* Column 2: EXPLORE (1 col on mobile, 3 cols on desktop) */}
          <div className="col-span-1 lg:col-span-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-sans">
              EXPLORE
            </h4>
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm font-sans">
              <a
                href="#about"
                className="group inline-flex items-center gap-1.5 text-slate-900 hover:text-blue-600 transition-colors font-medium whitespace-nowrap"
              >
                <span>About</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 stroke-[2.2]" />
              </a>
              <a
                href="#services"
                className="group inline-flex items-center gap-1.5 text-slate-900 hover:text-blue-600 transition-colors font-medium whitespace-nowrap"
              >
                <span>Services</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 stroke-[2.2]" />
              </a>
              <a
                href="#jobs"
                className="group inline-flex items-center gap-1.5 text-slate-900 hover:text-blue-600 transition-colors font-medium whitespace-nowrap"
              >
                <span>Careers &amp; Jobs</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 stroke-[2.2]" />
              </a>
              <a
                href="#contact"
                className="group inline-flex items-center gap-1.5 text-slate-900 hover:text-blue-600 transition-colors font-medium whitespace-nowrap"
              >
                <span>Contact</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 stroke-[2.2]" />
              </a>
            </div>
          </div>

          {/* Column 3: CONNECT (1 col on mobile, 3 cols on desktop) */}
          <div className="col-span-1 lg:col-span-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 font-sans">
              CONNECT
            </h4>
            <div className="flex flex-col gap-2.5 text-xs sm:text-sm font-sans">
              <div className="flex items-start gap-2 text-slate-900">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5 stroke-[2.2]" />
                <a
                  href="mailto:hr@gyanavsolutions.com"
                  className="hover:text-blue-600 transition-colors font-medium text-slate-900 break-all"
                >
                  hr@gyanavsolutions.com
                </a>
              </div>

              <div className="flex items-start gap-2 text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5 stroke-[2.2]" />
                <span className="font-medium text-slate-900 leading-snug">
                  Virginia, USA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Balanced Left/Right Layout */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-sans">
          <p className="font-medium text-slate-600">
            &copy; 2026 Gyanav Solutions. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500">
            <a href="#about" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <span className="text-slate-300">·</span>
            <a href="#about" className="hover:text-slate-900 transition-colors">Terms</a>
            <span className="text-slate-300">·</span>
            <span>Consulting &amp; Implementations</span>
            <span className="text-slate-300">·</span>
            <span>Virginia, USA</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
