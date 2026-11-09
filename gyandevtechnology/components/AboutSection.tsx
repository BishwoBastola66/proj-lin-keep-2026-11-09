'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface AboutSectionProps {
  onOpenContact?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = () => {
  return (
    <section id="services" className="py-16 sm:py-20 md:py-24 bg-white relative overflow-hidden border-t border-slate-200/80">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />

      {/* Subtle Atmosphere Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-white/50 to-[#fafafc] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-28 bg-blue-100/25 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-start">
          
          {/* Left Column: Mission & Identity */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-5"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-950 tracking-tight leading-[1.16]">
              A Dedicated Consulting Partner for Complex Systems.
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed font-normal">
              Gyanav Solutions is an IT consulting and implementation company founded in 2021 and based in Virginia, USA. We partner with organizations to understand technology challenges, identify practical solutions, and deliver dependable implementations.
            </p>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Rather than generic one-size-fits-all software delivery, we focus on thoughtful analysis, robust integration, and dependable engineering execution tailored to the unique operational environments of our clients.
            </p>
          </motion.div>

          {/* Right Column: Architectural Practice Registry (No Card Containers!) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6 lg:border-l lg:border-slate-200/90 lg:pl-10 xl:pl-12 space-y-6"
          >

            {/* Firm Metadata - Hairline Architectural Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
              <div>
                <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  ESTABLISHED
                </span>
                <span className="block text-2xl font-extrabold text-slate-950 mt-1">
                  2021
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  LOCATED IN
                </span>
                <span className="block text-2xl font-extrabold text-slate-950 mt-1">
                  Virginia, USA
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  United States
                </span>
              </div>
            </div>

            {/* Core Advisory Capabilities - Clean Hairline Ledger */}
            <div className="pt-6 border-t border-slate-200/90 space-y-3">
              <div className="text-xs font-sans font-bold uppercase tracking-wider text-slate-500">
                Core Advisory Capabilities
              </div>

              <div className="space-y-3 pt-1">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  className="flex items-start gap-3 text-xs sm:text-sm text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">
                    Strategic IT Consulting &amp; Modern Systems Architecture
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="flex items-start gap-3 text-xs sm:text-sm text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">
                    Healthcare Systems &amp; Clinical Data Interoperability (FHIR R4 / HL7)
                  </span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="flex items-start gap-3 text-xs sm:text-sm text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">
                    Production-Grade Engineering, Zero-Trust Infrastructure &amp; Implementation
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
