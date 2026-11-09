'use client';

import React from 'react';
import { motion } from 'motion/react';
import { MapPin, ShieldCheck, Building2 } from 'lucide-react';

export const LocationSection: React.FC = () => {
  return (
    <section id="location" className="hidden md:block py-14 sm:py-18 md:py-22 bg-white border-t border-slate-200/80 relative overflow-hidden font-sans">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-35 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[300px] bg-blue-50/40 blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-3.5 sm:px-6 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Google Maps Interactive Embed */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7"
          >
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
              <iframe
                title="Gyanav Solutions Location - Virginia, USA"
                src="https://maps.google.com/maps?q=Virginia,+USA&t=&z=9&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="380"
                className="w-full h-[320px] sm:h-[380px] lg:h-[420px] block border-0 filter contrast-[1.02]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>

          {/* Right Column: Location Details & Authority */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                LOCATION &amp; OPERATIONS
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                We are located in Virginia, USA.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3 font-normal">
                Headquartered in the Northern Virginia / Washington D.C. technology corridor, Gyanav Solutions provides strategic IT consulting, healthcare data interoperability, and production engineering services across the United States.
              </p>
            </div>

            {/* Address & Facility Specifications */}
            <div className="border-t border-slate-200/90 pt-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-slate-950">
                    Virginia, USA
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Fairfax &amp; Loudoun County Technology Corridor · Washington D.C. Metro
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">US-Based Principal Engineers</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">Secure HIPAA &amp; Cloud Facilities</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default LocationSection;
