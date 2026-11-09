'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { TrustStatement } from '@/components/TrustStatement';
import { AboutSection } from '@/components/AboutSection';
import { JobSection } from '@/components/JobSection';
import { ContactCTA } from '@/components/ContactCTA';
import { LocationSection } from '@/components/LocationSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const handleOpenContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafc] text-slate-900 font-sans selection:bg-blue-600/15 selection:text-blue-950">
      {/* Sticky Header Navigation with Live Scroll Progress Bar */}
      <Navbar onOpenContact={handleOpenContact} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <Hero onOpenContact={handleOpenContact} />

        {/* 2. Trust / Positioning Statement */}
        <TrustStatement />

        {/* 3. Company Overview & About Section */}
        <AboutSection onOpenContact={handleOpenContact} />

        {/* 4. Careers & Job Opportunities Section */}
        <JobSection />

        {/* 5. Contact & Engagement Hub */}
        <ContactCTA onOpenContact={handleOpenContact} />

        {/* 6. We Are Located In / Interactive Google Map */}
        <LocationSection />
      </main>

      {/* 10. 2-Sided Footer */}
      <Footer onOpenContact={handleOpenContact} />

      {/* Floating Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-40 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 text-slate-700 hover:text-slate-950 hover:bg-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4 h-4 text-blue-600" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
