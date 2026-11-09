'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Activity,
  Workflow,
  Code2,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface ServicesProps {
  onOpenContact: () => void;
}

interface ServiceItem {
  id: string;
  number: string;
  title: string;
  badge: string;
  tagline: string;
  highlights: {
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  metric: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICES: ServiceItem[] = [
  {
    id: 'cloud-devops',
    number: '01',
    title: 'Cloud & DevOps',
    badge: 'Infrastructure',
    tagline: 'Ship faster on resilient, auto-scaling cloud architectures.',
    highlights: [
      {
        title: 'Cloud Modernization',
        desc: 'Scalable AWS & GCP architectures built for speed and uptime.',
        icon: Cloud,
      },
      {
        title: 'CI/CD & Automation',
        desc: 'Zero-downtime deployment pipelines and automated rollbacks.',
        icon: Zap,
      },
      {
        title: 'Cost Optimization',
        desc: 'Eliminate infrastructure waste while boosting throughput.',
        icon: Workflow,
      },
    ],
    metric: '99.99% Target Uptime · Automated CI/CD',
    icon: Cloud,
  },
  {
    id: 'healthcare-apis',
    number: '02',
    title: 'Healthcare Data & APIs',
    badge: 'Interoperability',
    tagline: 'Seamless, secure connectivity across EHR and clinical ecosystems.',
    highlights: [
      {
        title: 'FHIR & HL7 Pipelines',
        desc: 'Fast, bidirectional clinical data flows and messaging standard.',
        icon: Activity,
      },
      {
        title: 'EHR & Telehealth Connectors',
        desc: 'Clean API layers bridging modern apps with legacy health records.',
        icon: Database,
      },
      {
        title: 'HIPAA-Grade Security',
        desc: 'Zero-trust encryption and verifiable patient data compliance.',
        icon: Lock,
      },
    ],
    metric: 'HIPAA Compliant · FHIR / HL7 Native',
    icon: Activity,
  },
  {
    id: 'data-integration',
    number: '03',
    title: 'Systems & Data Integration',
    badge: 'Pipelines',
    tagline: 'Connect databases, legacy backends, and modern apps in real time.',
    highlights: [
      {
        title: 'Event-Driven Streams',
        desc: 'Real-time Kafka, webhook, and message bus orchestration.',
        icon: Workflow,
      },
      {
        title: 'Legacy Modernization',
        desc: 'Bridge legacy on-prem backends to cloud without downtime.',
        icon: Database,
      },
      {
        title: 'Unified Data Sync',
        desc: 'Single source of truth across all tools and databases.',
        icon: Zap,
      },
    ],
    metric: 'Real-Time Sync · Zero-Loss Pipelines',
    icon: Workflow,
  },
  {
    id: 'software-engineering',
    number: '04',
    title: 'Software & Platform Engineering',
    badge: 'Engineering',
    tagline: 'High-performance backends and web applications engineered to scale.',
    highlights: [
      {
        title: 'Modern Microservices',
        desc: 'Fast, type-safe API services with extreme reliability.',
        icon: Code2,
      },
      {
        title: 'Full-Stack Web Apps',
        desc: 'Responsive, lightning-fast interfaces built with modern web tech.',
        icon: Zap,
      },
      {
        title: 'Full Observability',
        desc: 'Telemetry, logging, and error tracking out of the box.',
        icon: Activity,
      },
    ],
    metric: 'Production Ready · Test-Covered',
    icon: Code2,
  },
  {
    id: 'security-governance',
    number: '05',
    title: 'Security & Zero-Trust',
    badge: 'Security',
    tagline: 'Enterprise-grade access control and proactive compliance by default.',
    highlights: [
      {
        title: 'Zero-Trust Architecture',
        desc: 'Strict identity verification and granular RBAC permissions.',
        icon: ShieldCheck,
      },
      {
        title: 'Continuous Auditing',
        desc: 'Automated audit logs and real-time security alerts.',
        icon: Lock,
      },
      {
        title: 'IaC Hardening',
        desc: 'Secure infrastructure as code with vulnerability scanning.',
        icon: Cloud,
      },
    ],
    metric: 'Zero-Trust · Automated Compliance',
    icon: ShieldCheck,
  },
];

export const Services: React.FC<ServicesProps> = ({ onOpenContact }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeService = SERVICES[activeIndex];

  // Auto-cycle services every 5.5s
  useEffect(() => {
    if (isPaused) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const duration = 5500;
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((current) => (current + 1) % SERVICES.length);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPaused, activeIndex]);

  const handleSelectService = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  return (
    <section
      id="services"
      className="pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-16 md:pb-20 bg-[#fafafc] relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />

      {/* Soft Bottom Atmosphere Transition (No hard line) */}
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-[#fafafc]/50 to-white pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-28 bg-blue-100/35 blur-3xl rounded-full pointer-events-none" />

      {/* Full-Width Widescreen Container */}
      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        {/* Startup-Style Punchy Header (Anchored cleanly at top) */}
        <div className="max-w-3xl mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-slate-800 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>What We Build &amp; Ship</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Engineering solutions for modern teams.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1.5 leading-relaxed font-normal">
            From cloud infrastructure to custom software and clinical data pipelines.
          </p>
        </div>

        {/* Desktop Interactive Layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 xl:gap-8 items-stretch">
          {/* Left Column: 5 Minimalist Practice Cards */}
          <div className="lg:col-span-5 space-y-2.5 flex flex-col justify-between">
            {SERVICES.map((service, idx) => {
              const isSelected = idx === activeIndex;
              const Icon = service.icon;

              return (
                <div
                  key={service.id}
                  onClick={() => handleSelectService(idx)}
                  className={`cursor-pointer p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 relative group overflow-hidden ${
                    isSelected
                      ? 'bg-white border-blue-600 shadow-md shadow-blue-500/5 ring-1 ring-blue-600/20'
                      : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Animated Left Progress Line */}
                  {isSelected && (
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                      style={{
                        height: '100%',
                        scaleY: isPaused ? 1 : progress / 100,
                        transformOrigin: 'top',
                      }}
                      transition={{ duration: 0.05, ease: 'linear' }}
                    />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200/80 group-hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm sm:text-base font-bold tracking-tight leading-snug ${
                              isSelected ? 'text-slate-950' : 'text-slate-700 group-hover:text-slate-950'
                            }`}
                          >
                            {service.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-normal">
                          {service.tagline}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-slate-400 transition-all duration-200 ${
                        isSelected ? 'translate-x-0.5 text-blue-600' : 'group-hover:text-slate-700'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Crisp Startup Feature Inspector */}
          <div className="lg:col-span-7 flex">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeService.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 xl:p-8 shadow-xl shadow-slate-900/5 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
                        {React.createElement(activeService.icon, { className: 'w-5 h-5' })}
                      </div>
                      <div>
                        <span className="text-[11px] font-mono font-bold text-blue-600 uppercase tracking-wider block">
                          {activeService.badge}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-snug">
                          {activeService.title}
                        </h3>
                      </div>
                    </div>

                    <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-medium">
                      {activeService.metric}
                    </span>
                  </div>

                  {/* Punchy 1-Liner Tagline */}
                  <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed mb-4">
                    {activeService.tagline}
                  </p>

                  {/* 3 Crisp Capability Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {activeService.highlights.map((h, hIdx) => {
                      const HIcon = h.icon;
                      return (
                        <motion.div
                          key={hIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: hIdx * 0.05 }}
                          className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                              <HIcon className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-950 mb-1 leading-snug">
                              {h.title}
                            </h4>
                            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-normal">
                              {h.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Clean Bottom Action Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Fast turnaround · Dedicated engineering
                  </div>
                  <button
                    onClick={onOpenContact}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Discuss Your Project</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Accordion / Stack Layout */}
        <div className="lg:hidden space-y-3">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                      {service.badge}
                    </span>
                    <h3 className="text-sm font-bold text-slate-950">
                      {service.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {service.tagline}
                </p>
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {service.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="text-xs text-slate-700">
                      <strong className="text-slate-950 font-semibold">{h.title}:</strong> {h.desc}
                    </div>
                  ))}
                </div>
                <button
                  onClick={onOpenContact}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-semibold"
                >
                  <span>Discuss Your Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
export default Services;
