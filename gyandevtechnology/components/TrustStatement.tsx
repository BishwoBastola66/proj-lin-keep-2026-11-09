'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';

export const TrustStatement: React.FC = () => {
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="about" className="py-16 sm:py-20 md:py-24 bg-white relative overflow-hidden">
      {/* Precision Background Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />

      {/* Subtle Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[500px] bg-blue-50/40 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-white/60 to-[#fafafc] pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        {/* Editorial Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeInUp}
          className="max-w-4xl xl:max-w-5xl mx-auto text-center mb-6 sm:mb-16"
        >

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-extrabold text-slate-950 tracking-tight leading-[1.18] mb-5">
            &ldquo;Quiet confidence rather than loud marketing. We partner with organizations to solve genuine technology complexities with precision and practical execution.&rdquo;
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Gyanav Solutions operates as an independent technical advisory and hands-on engineering firm. We do not resell software licenses, we do not push vendor quotas, and we never hand critical client architecture to junior staff.
          </p>
        </motion.div>

        {/* Practice Credentials Masthead — Hidden on mobile as requested */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0.1 },
            },
          }}
          className="hidden sm:grid border-y border-slate-200/90 sm:divide-x divide-slate-200/90 sm:grid-cols-2 lg:grid-cols-4 py-4 sm:py-6 bg-slate-50/40"
        >
          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="px-5 py-3 sm:py-2 transition-transform"
          >
            <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
              LOCATION
            </span>
            <span className="block text-sm sm:text-base font-bold text-slate-950 mt-1">
              Virginia, USA
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Primary Advisory Center
            </span>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="px-5 py-3 sm:py-2 transition-transform"
          >
            <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
              ESTABLISHED
            </span>
            <span className="block text-sm sm:text-base font-bold text-slate-950 mt-1">
              Founded in 2021
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Serving Enterprise &amp; Healthcare
            </span>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="px-5 py-3 sm:py-2 transition-transform"
          >
            <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
              PRACTICE MODEL
            </span>
            <span className="block text-sm sm:text-base font-bold text-slate-950 mt-1">
              100% Vendor-Neutral
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Zero Proprietary Lock-In
            </span>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="px-5 py-3 sm:py-2 transition-transform"
          >
            <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
              ENGAGEMENT
            </span>
            <span className="block text-sm sm:text-base font-bold text-slate-950 mt-1">
              Direct Senior Execution
            </span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Principal Engineers On-Keyboard
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustStatement;
