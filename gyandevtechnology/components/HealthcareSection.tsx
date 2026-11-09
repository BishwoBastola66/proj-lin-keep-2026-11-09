'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  LayoutGrid,
  GitFork,
  ShieldCheck,
  Users2,
  ArrowUpRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface HealthcareProps {
  onOpenContact: () => void;
}

interface PillarData {
  id: string;
  number: string;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  capabilities: string[];
  deliverables: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const PILLARS: PillarData[] = [
  {
    id: 'data',
    number: '01',
    title: 'Clinical Data & FHIR',
    badge: 'Interoperability',
    tagline: 'FHIR R4 / HL7 v2 · Data Lakes · Bidirectional Sync',
    description:
      'Unify fragmented EHR records, clinical imaging feeds, and lab databases into a real-time, queryable FHIR data lake.',
    capabilities: [
      'FHIR R4 and HL7 messaging pipelines',
      'Bidirectional EHR & EMR data gateways',
      'Unified Master Patient Index (MPI)',
      'Real-time clinical event streaming',
    ],
    deliverables: ['FHIR R4 Integration Spec', 'EHR Connector Layer', 'Patient Data Pipeline'],
    icon: Database,
  },
  {
    id: 'applications',
    number: '02',
    title: 'Provider & Patient Apps',
    badge: 'Clinical UX',
    tagline: 'Telehealth · Clinician Portals · PACS',
    description:
      'Engineered medical software and responsive clinician portals designed for sub-100ms latency and minimal provider burnout.',
    capabilities: [
      'Custom telehealth & video consultation apps',
      'PACS & medical imaging streamlining',
      'Clinician decision support dashboards',
      'Mobile patient intake & portal apps',
    ],
    deliverables: ['Custom Telehealth Portals', 'PACS Imaging Flow', 'Clinical UX Optimization'],
    icon: LayoutGrid,
  },
  {
    id: 'workflows',
    number: '03',
    title: 'Automated Care Workflows',
    badge: 'Automation',
    tagline: 'Intake · Handoffs · Care Coordination',
    description:
      'Eliminate administrative friction across patient intake, clinical handoffs, and revenue cycle management with targeted automation.',
    capabilities: [
      'Automated patient intake & check-in',
      'Standardized clinical handoff protocols',
      'Care coordination task routing',
      'Real-time bed & resource tracking',
    ],
    deliverables: ['Intake Automation Engine', 'Care Routing Protocols', 'Revenue Cycle Verification'],
    icon: GitFork,
  },
  {
    id: 'infrastructure',
    number: '04',
    title: 'HIPAA Cloud Architecture',
    badge: 'Security',
    tagline: 'Zero-Trust · Multi-Region · 99.999% SLA',
    description:
      'Production-grade cloud topology engineered to satisfy strict HIPAA, HITECH, and SOC2 standards with multi-region high availability.',
    capabilities: [
      'Zero-trust network access & IAM controls',
      'End-to-end encrypted clinical storage',
      'Automated BAA compliance logging',
      'Multi-region automated failover',
    ],
    deliverables: ['Zero-Trust Architecture', 'HIPAA Cloud Governance', 'Disaster Recovery Plan'],
    icon: ShieldCheck,
  },
  {
    id: 'people',
    number: '05',
    title: 'Care Teams & Adoption',
    badge: 'Enablement',
    tagline: 'Clinicians · Operations · Patient Experience',
    description:
      'Align technological infrastructure with human clinical workflows, usability standards, and 24/7 mission-critical support.',
    capabilities: [
      'Clinical usability and workflow audits',
      'Clinician change management programs',
      'Zero-downtime cutover & rollouts',
      'Continuous 24/7 operational support',
    ],
    deliverables: ['Usability Audit Report', 'Clinical Training Guide', 'Rollout & Runbooks'],
    icon: Users2,
  },
];

export const HealthcareSection: React.FC<HealthcareProps> = ({ onOpenContact }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const selectedPillar = PILLARS[activeIdx];

  return (
    <section id="healthcare" className="pt-8 sm:pt-10 md:pt-12 pb-10 sm:pb-12 md:pb-14 bg-white relative overflow-hidden">
      {/* Background Precision Grid & Ambient Aura */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[500px] bg-blue-100/25 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Soft Bottom Atmosphere Transition */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-white/50 to-[#fafafc] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-20 bg-cyan-100/30 blur-3xl rounded-full pointer-events-none" />

      {/* Full-Width Widescreen Container */}
      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          {/* Left Column: Interactive Domain Presentation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 flex flex-col justify-center space-y-4"
          >
            {/* 5 Clean Translucent Interactive Domain Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PILLARS.map((pillar, idx) => {
                const isActive = idx === activeIdx;
                const Icon = pillar.icon;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setActiveIdx(idx)}
                    className={`p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between cursor-pointer backdrop-blur-md ${
                      isActive
                        ? 'bg-slate-800/90 border-slate-700 text-white shadow-md ring-1 ring-slate-600/30'
                        : 'bg-white/50 border-slate-200/70 hover:bg-white/80 hover:border-slate-300 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={isActive ? 'text-blue-400' : 'text-blue-600'}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                        0{idx + 1}
                      </span>
                    </div>
                    <div className="text-xs font-bold tracking-tight leading-snug">
                      {pillar.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Focus Details (Direct Points) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPillar.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                    {selectedPillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                    {selectedPillar.description}
                  </p>
                </div>

                {/* 4 Clean Direct Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-1">
                  {selectedPillar.capabilities.map((cap, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-800 leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>

                {/* Deliverable Badges */}
                <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase mr-1">
                    Deliverables:
                  </span>
                  {selectedPillar.deliverables.map((item, dIdx) => (
                    <span
                      key={dIdx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Right Column: Story Headline & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-4 sm:space-y-5 flex flex-col justify-center"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Modernizing Clinical Data &amp; Healthcare Infrastructure.
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              We bridge clinical operations and modern cloud systems—delivering secure FHIR interoperability, HIPAA-compliant cloud architectures, and seamless provider workflows.
            </p>

            <div className="border-l-2 border-blue-600 pl-4 py-2 space-y-1 bg-blue-50/25 rounded-r-lg">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Clinical SLA Standard</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                Sub-100ms API response · FHIR R4 &amp; HL7 standard · 99.999% uptime.
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={onOpenContact}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Explore Healthcare Advisory</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export default HealthcareSection;
