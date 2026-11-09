'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import { LAYERS } from '@/types';
import { CheckCircle2, Sparkles, ArrowUpRight } from 'lucide-react';

export const ArchitectureVisual: React.FC = () => {
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: i * 0.08,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-[#fafafc] relative overflow-hidden">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />

      {/* Soft Bottom Atmosphere Transition */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#fafafc]/50 to-white pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-28 bg-indigo-100/30 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        {/* Clean Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mb-8 sm:mb-10 lg:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Architecture &amp; Systems Stack</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            How We Structure Complex Systems.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1.5 leading-relaxed font-normal">
            From initial strategy to cloud integration, security boundaries, and reliable production delivery.
          </p>
        </motion.div>

        {/* 4 Clean Architecture Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {LAYERS.map((layer, idx) => (
            <motion.div
              key={layer.id}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Layer Index & Category Badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    0{idx + 1}
                  </span>
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                    {layer.category}
                  </span>
                </div>

                {/* Layer Title */}
                <h3 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight mb-2 group-hover:text-blue-900 transition-colors flex items-center justify-between">
                  <span>{layer.name}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
                </h3>

                {/* Layer Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal mb-6">
                  {layer.description}
                </p>

                {/* 4 Clean Capabilities */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  {layer.components.map((comp, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex items-start gap-2.5 text-xs text-slate-700 font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default ArchitectureVisual;
