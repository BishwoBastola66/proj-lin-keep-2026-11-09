'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  GitMerge,
  ShieldCheck,
  Zap,
  BarChart3,
  Code2,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  Cpu,
  TestTube2,
} from 'lucide-react';

const METRICS = [
  { value: '99.9%', label: 'Uptime SLA', color: 'text-blue-600' },
  { value: '<72h', label: 'First Deploy', color: 'text-emerald-600' },
  { value: '100%', label: 'Test Coverage', color: 'text-violet-600' },
  { value: '0', label: 'Handoff Gaps', color: 'text-amber-600' },
];

const CAPABILITIES = [
  {
    icon: Code2,
    title: 'Production-Grade Engineering',
    desc: 'Type-safe, tested, and peer-reviewed code shipped to production from day one.',
    tag: 'Engineering',
  },
  {
    icon: GitMerge,
    title: 'CI/CD & Automation',
    desc: 'Fully automated pipelines with staged rollouts, canary releases, and instant rollback.',
    tag: 'DevOps',
  },
  {
    icon: TestTube2,
    title: 'Automated Verification',
    desc: 'Unit, integration, and end-to-end test suites built alongside every feature.',
    tag: 'QA',
  },
  {
    icon: ShieldCheck,
    title: 'Security by Default',
    desc: 'RBAC, encryption in transit & at rest, and dependency scanning baked into every build.',
    tag: 'Security',
  },
  {
    icon: Layers,
    title: 'System Integration',
    desc: 'APIs, message buses, and legacy connectors wired cleanly into your architecture.',
    tag: 'Integration',
  },
  {
    icon: BarChart3,
    title: 'Observability & Telemetry',
    desc: 'Metrics, distributed tracing, and structured logging configured before go-live.',
    tag: 'Monitoring',
  },
];

const PIPELINE_STEPS = [
  { label: 'Build', status: 'done', color: 'bg-emerald-500' },
  { label: 'Test', status: 'done', color: 'bg-emerald-500' },
  { label: 'Scan', status: 'done', color: 'bg-emerald-500' },
  { label: 'Stage', status: 'done', color: 'bg-emerald-500' },
  { label: 'Prod', status: 'active', color: 'bg-blue-600' },
];

export const ProcessTimeline: React.FC = () => {
  return (
    <section
      id="approach"
      className="py-14 sm:py-18 md:py-22 bg-[#fafafc] relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-28 bg-blue-100/25 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-950 tracking-tight leading-tight">
              Implement &amp; Deliver
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 font-normal max-w-xl leading-relaxed">
              We translate architecture into live, verified, and production-hardened software — fast.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Production Ready
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">

          {/* Left column */}
          <div className="lg:col-span-5 flex flex-col gap-5 lg:gap-6">

            {/* Metrics strip */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm"
            >
              {METRICS.map((m) => (
                <div key={m.label} className="flex flex-col gap-0.5">
                  <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${m.color}`}>
                    {m.value}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium leading-snug">{m.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CI/CD Pipeline Card */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="flex-1 p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Deployment Pipeline
                  </div>
                  <div className="text-base font-bold text-white">main → production</div>
                </div>
                <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-600/20">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>

              {/* Steps */}
              <div className="flex items-center gap-2 mb-5">
                {PIPELINE_STEPS.map((step, i) => (
                  <React.Fragment key={step.label}>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${step.color} ${step.status === 'active' ? 'ring-2 ring-blue-400/40 ring-offset-1 ring-offset-slate-950' : ''}`} />
                      <span className="text-[10px] font-mono text-slate-400">{step.label}</span>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="flex-1 h-px bg-slate-700 mb-3" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Terminal lines */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-emerald-400">✓ Tests passed · 847 assertions</div>
                <div className="text-emerald-400">✓ Security scan · 0 critical CVEs</div>
                <div className="text-blue-400 animate-pulse">⟳ Deploying to production...</div>
              </div>
            </motion.div>
          </div>

          {/* Right column: Capability cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {CAPABILITIES.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: idx * 0.06 }}
                  whileHover={{ y: -4, transition: { duration: 0.18 } }}
                  className="group p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {cap.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 mb-1 leading-snug">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {cap.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Included in every engagement</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom delivery guarantee bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 lg:mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {['Zero-downtime deployments', 'Staged rollouts', 'Full test coverage', 'Instant rollback'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Zap className="w-3 h-3 text-blue-600" />
                {item}
              </div>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer">
            <span>See Our Process</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>
    </section>
  );
};

export default ProcessTimeline;

