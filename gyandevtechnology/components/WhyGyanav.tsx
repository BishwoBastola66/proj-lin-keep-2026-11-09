'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import { PRINCIPLES } from '@/types';
import { UserCheck, ShieldCheck, Target, Cpu, CheckCircle2, Sparkles, ArrowUpRight } from 'lucide-react';

export const WhyGyanav: React.FC = () => {
  const getIcon = (index: number) => {
    switch (index) {
      case 0:
        return <UserCheck className="w-5 h-5 text-blue-600" />;
      case 1:
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 2:
        return <Target className="w-5 h-5 text-sky-600" />;
      case 3:
      default:
        return <Cpu className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getGlow = (index: number) => {
    switch (index) {
      case 0:
        return 'from-blue-500/10 via-transparent to-transparent';
      case 1:
        return 'from-indigo-500/10 via-transparent to-transparent';
      case 2:
        return 'from-sky-500/10 via-transparent to-transparent';
      case 3:
      default:
        return 'from-emerald-500/10 via-transparent to-transparent';
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
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
    <section id="principles" className="py-10 sm:py-12 lg:py-14 bg-white relative overflow-hidden">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />

      {/* Soft Bottom Atmosphere Transition (No hard line) */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-white/50 to-[#fafafc] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-28 bg-blue-100/35 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        {/* Clean Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mb-8 sm:mb-10 lg:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 shadow-2xs text-xs font-semibold text-blue-700 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consulting Principles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Focused Expertise. Practical Execution.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1.5 leading-relaxed font-normal">
            As an agile, dedicated IT consulting practice, we provide senior attention, unbiased technology advisory, and grounded implementation support.
          </p>
        </motion.div>

        {/* 4 Clean Principle Cards in a 1-Row Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {PRINCIPLES.map((item, idx) => (
            <motion.div
              key={item.id}
              custom={idx}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
              className="relative p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
            >
              {/* Top Accent Hover Glow */}
              <div
                className={`absolute -inset-px bg-gradient-to-br ${getGlow(idx)} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl`}
              />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shadow-2xs group-hover:bg-white group-hover:shadow-sm transition-all">
                    {getIcon(idx)}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-lg">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-950 mb-2.5 tracking-tight group-hover:text-blue-900 transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  {item.description}
                </p>
              </div>

              <div className="relative z-10 pt-4 border-t border-slate-100 flex items-start gap-2 text-xs font-medium text-slate-800 leading-snug">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{item.application}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default WhyGyanav;
