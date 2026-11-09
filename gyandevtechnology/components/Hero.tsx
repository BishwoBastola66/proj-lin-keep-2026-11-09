'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, ChevronRight } from 'lucide-react';

const Hero3DArchitecture = dynamic(
  () => import('./canvas/Hero3DArchitecture'),
  {
    ssr: false,
    loading: () => <div className="w-full h-full min-h-[220px]" />,
  }
);

interface HeroProps {
  onOpenContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenContact }) => {
  const [, setModelState] = useState('INITIALIZING TOPOLOGY...');
  const [, setActiveClusterName] = useState<string | null>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <section className="relative min-h-[85dvh] sm:min-h-[92dvh] pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 lg:pb-20 overflow-hidden bg-white flex items-center justify-center">
      {/* 1. Background Fine Grid Pattern */}
      <div className="absolute inset-0 bg-grid-light pointer-events-none opacity-60 z-0" />
      
      {/* Soft Bottom Atmosphere Transition */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-sky-50/20 to-white pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-24 bg-sky-200/25 blur-3xl rounded-full pointer-events-none" />
      
      {/* 2. Soft Ambient Light Gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[800px] bg-radial from-blue-100/50 via-sky-50/25 to-transparent blur-3xl pointer-events-none z-0" />

      {/* 3. Three.js 3D Architecture Canvas as Living Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-auto opacity-75 sm:opacity-85">
        <Hero3DArchitecture
          onStateChange={(state, clusterName) => {
            setModelState(state);
            setActiveClusterName(clusterName);
          }}
        />
        {/* Soft edge gradient and atmospheric depth */}
        <div className="absolute inset-0 bg-radial from-transparent via-white/10 to-white/35 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white via-white/60 to-transparent pointer-events-none" />
      </div>

      {/* 4. Foreground Content Layer */}
      <div className="w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6 sm:px-8 md:px-10 lg:px-12 relative z-10 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center"
        >
          {/* Refined Minimalist Capsule Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/40 shadow-xs text-xs sm:text-sm font-sans font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span>Strategic IT Advisory &amp; Implementation</span>
            </div>
          </motion.div>

          {/* Main Headline - Balanced Font Size */}
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] xl:text-[64px] font-extrabold tracking-tight leading-[1.12] mb-4 sm:mb-5 font-sans max-w-4xl mx-auto"
          >
            <span className="block text-slate-950">Enterprise IT Consulting</span>
            <span className="block text-slate-800">
              Built for Complex Problems.
            </span>
          </motion.h1>

          {/* Clean Supporting Copy */}
          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 font-normal px-2"
          >
            Gyanav Solutions delivers strategic IT advisory, healthcare technology interoperability (FHIR R4 / HL7), and production engineering for organizations navigating high-stakes technical environments.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <a
              href="#contact"
              aria-label="Start a consulting conversation with Gyanav Solutions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-sm sm:text-base font-bold shadow-md hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 group focus:outline-none focus:ring-4 focus:ring-slate-900/20 cursor-pointer"
            >
              <span>Start a Conversation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#services"
              aria-label="Explore IT consulting and healthcare data interoperability services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-xs hover:bg-white text-slate-900 text-sm sm:text-base font-bold border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-slate-200/50"
            >
              <span>Explore Services</span>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
export default Hero;
