'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import { Menu, X, ArrowUpRight } from 'lucide-react';

import Link from 'next/link';
import Image from 'next/image';

interface NavbarProps {
  onOpenContact?: () => void;
  hideNavLinks?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact, hideNavLinks = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Framer Motion live scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '/#about' },
    { name: 'Services', href: '/#services' },
    { name: 'Jobs', href: '/#jobs' },
    { name: 'Contact', href: '/#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-2.5 sm:py-3'
          : 'bg-white/70 backdrop-blur-sm border-b border-slate-200/40 py-3 sm:py-3.5'
        }`}
    >
      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-3.5 sm:px-6 md:px-12 lg:px-14 xl:px-16 2xl:px-20 flex items-center justify-between gap-2">
        {/* Official Brand Logo */}
        <Link
          href="/"
          aria-label="Gyanav Solutions - Home"
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-blue-600/30 rounded-lg py-1 transition-transform hover:scale-[1.02]"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
            <Image
              src="/logo.png"
              alt="Gyanav Solutions Logo - Premier IT Consulting and Healthcare Technology Advisory"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-extrabold tracking-tight text-slate-950 text-sm sm:text-base font-sans leading-tight whitespace-nowrap">
              GYANAV SOLUTIONS
            </span>
            <span className="text-[9px] sm:text-[10px] font-sans font-semibold text-slate-500 uppercase tracking-wide leading-none whitespace-nowrap">
              Consulting Services
            </span>
          </div>
        </Link>

        {!hideNavLinks && (
          <>
            {/* Desktop Links (lg and up) */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs sm:text-[13px] font-medium text-slate-600 hover:text-blue-600 transition-colors relative py-1 group"
                >
                  <span>{link.name}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-blue-600 transition-all duration-200 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Action */}
            <div className="hidden lg:flex items-center gap-2.5">

              <Link
                href="/#contact"
                onClick={onOpenContact ? (e) => { e.preventDefault(); onOpenContact(); } : undefined}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-2xs hover:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>Start a Conversation</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Tablet & Mobile Controls (< lg) */}
            <div className="flex lg:hidden items-center gap-2">
              <Link
                href="/#contact"
                onClick={onOpenContact ? (e) => { e.preventDefault(); onOpenContact(); } : undefined}
                className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Contact
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Menu Dropdown (< lg) */}
      {!hideNavLinks && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 py-4 shadow-xl overflow-hidden"
            >
            <div className="flex flex-col gap-1.5">
              {navLinks.map((link, idx) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  href="/#contact"
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (onOpenContact) {
                      e.preventDefault();
                      onOpenContact();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  <span>Start a Conversation</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      )}

      {/* Dynamic Framer Motion Scroll Progress Indicator */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 origin-left pointer-events-none z-50"
        style={{ scaleX }}
      />
    </header>
  );
};
export default Navbar;
