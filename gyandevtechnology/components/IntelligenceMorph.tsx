'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ArrowRight } from 'lucide-react';

const STAGES = [
  { word: 'CONSULTING', sub: 'Problem Formulation & Advisory', code: '01.DIAGNOSE' },
  { word: 'STRATEGY', sub: 'Target Architecture & Roadmap', code: '02.ARCHITECT' },
  { word: 'IMPLEMENTATION', sub: 'Precision Execution & Delivery', code: '03.EXECUTE' },
  { word: 'SOLUTIONS', sub: 'Scalable Systems & Integrations', code: '04.STABILIZE' },
  { word: 'IMPACT', sub: 'Measurable Organizational Value', code: '05.SUSTAIN' },
];

export const IntelligenceMorph: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const current = STAGES[index];

  return (
    <div className="w-full max-w-xl mx-auto panel-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-700 tracking-wider">CONSULTING PIPELINE</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
          <span>{current.code}</span>
        </div>
      </div>

      <div className="relative h-14 sm:h-16 flex flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.word}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between"
          >
            <div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {current.word}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                {current.sub}
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-1 text-slate-400 font-mono text-xs">
              <span>Next</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Track */}
      <div className="grid grid-cols-5 gap-1.5 pt-3 mt-1 border-t border-slate-100">
        {STAGES.map((s, i) => {
          const isActive = i === index;
          const isPassed = i < index;
          return (
            <button
              key={s.word}
              onClick={() => setIndex(i)}
              className="group text-left focus:outline-none cursor-pointer"
              title={`Jump to ${s.word}`}
            >
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden relative">
                <motion.div
                  className="h-full bg-blue-600 rounded-full"
                  initial={false}
                  animate={{
                    width: isActive ? '100%' : isPassed ? '100%' : '0%',
                    backgroundColor: isActive ? '#2563eb' : isPassed ? '#94a3b8' : '#e2e8f0',
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="mt-1 text-[10px] font-mono tracking-tighter truncate text-slate-400 group-hover:text-slate-700 transition-colors">
                {s.word}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
