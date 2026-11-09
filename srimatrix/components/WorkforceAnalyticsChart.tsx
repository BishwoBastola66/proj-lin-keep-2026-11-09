"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  getCachedAnalytics,
  getCachedAnalyticsSync,
  subscribeOverviewCache,
} from "@/lib/overviewCache";

export type TimeframeKey = "week" | "month" | "quarter" | "year";

interface DataPoint {
  label: string;
  subLabel?: string;
  hours: number;
  targetHours: number;
  attendancePct: number;
  sessions: number;
}

interface Dataset {
  title: string;
  periodLabel: string;
  data: DataPoint[];
  totalHours: number;
  avgHours: string;
  changePct: string;
  trendPositive?: boolean;
  onTimeRate: string;
  capacityRate: string;
  peakLabel: string;
}

const EMPTY_DATASET: Dataset = {
  title: "Workforce Output",
  periodLabel: "Current Cycle",
  data: [],
  totalHours: 0,
  avgHours: "0.0 hrs/day",
  changePct: "0 hrs logged",
  trendPositive: true,
  onTimeRate: "100%",
  capacityRate: "0%",
  peakLabel: "None",
};

export default function WorkforceAnalyticsChart() {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("week");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Instant render from cache if available (0ms delay, no loading spinner)
  const initialCache = getCachedAnalyticsSync();
  const [analyticsData, setAnalyticsData] = useState<Record<TimeframeKey, Dataset> | null>(() => initialCache);
  const [isLoading, setIsLoading] = useState(() => !initialCache);

  useEffect(() => {
    let isMounted = true;
    async function load(forceRefresh = false) {
      try {
        const res = await getCachedAnalytics(forceRefresh);
        if (isMounted && res) {
          setAnalyticsData(res as Record<TimeframeKey, Dataset>);
        }
      } catch (err) {
        console.error("Error loading workforce analytics:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();

    // Re-fetch when timesheets or analytics are invalidated
    const unsubscribe = subscribeOverviewCache((key) => {
      if (key === "analytics" || key === "all") {
        load(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const current = analyticsData?.[timeframe] || EMPTY_DATASET;
  const maxHours = Math.max(...(current.data.map((d) => d.hours) || [1]), 1) * 1.15;

  if (isLoading) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs p-8 text-center py-20 flex flex-col items-center justify-center">
        <img
          src="/srimatrix-health-logo.png"
          alt="Loading analytics..."
          className="h-14 sm:h-16 w-auto animate-pulse object-contain select-none"
        />
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
      {/* ── Top Header & Executive Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Analytics
            </h3>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-semibold self-start sm:self-auto">
          {(
            [
              { key: "week", label: "7D" },
              { key: "month", label: "30D" },
              { key: "quarter", label: "Quarter" },
              { key: "year", label: "Year" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTimeframe(t.key);
                setHoveredIndex(null);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                timeframe === t.key
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Key Stat Pill Summary Row ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {current.totalHours.toLocaleString()} hrs
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {current.changePct}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
            <span className="font-semibold text-slate-700">Recorded Workday Output</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-indigo-300 border-b border-indigo-400 border-dashed" />
            <span className="text-slate-400">Target Benchmark</span>
          </div>
        </div>
      </div>

      {/* ── CLEAN & CRISP BAR CHART CONTAINER ── */}
      <div className="relative w-full pt-4 pb-2">
        <div className="w-full flex flex-col space-y-2">
          {/* Bars Canvas with Target Benchmark Line */}
          <div className="relative w-full h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-3 px-2 sm:px-4">
            {/* Subtle Horizontal Guide Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="w-full border-b border-slate-200 border-dashed" />
              <div className="w-full border-b border-slate-200 border-dashed" />
              <div className="w-full border-b border-slate-200 border-dashed" />
              <div className="w-full border-b border-slate-200" />
            </div>

            {/* Benchmark dashed line for standard target */}
            {current.data.length > 0 && current.data[0]?.targetHours ? (
              <div
                className="absolute left-0 right-0 border-b-2 border-indigo-400/50 border-dashed z-10 pointer-events-none transition-all duration-300"
                style={{
                  bottom: `${Math.min(
                    (current.data[0].targetHours / maxHours) * 100,
                    85
                  )}%`,
                }}
              >
                <span className="absolute right-2 -top-4 text-[10px] font-mono text-indigo-400 font-bold bg-white/80 px-1 rounded-sm">
                  Target {current.data[0].targetHours}h
                </span>
              </div>
            ) : null}

            {/* Individual Bar Columns */}
            {current.data.map((item, idx) => {
              const maxHoursVal = Math.max(...current.data.map((d) => d.hours));
              const heightPct = maxHoursVal > 0
                ? Math.max(Math.min((item.hours / maxHours) * 100, 100), 6)
                : 6;
              const isHovered = hoveredIndex === idx;
              const isHighest = maxHoursVal > 0 && item.hours === maxHoursVal;

              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                >
                  {/* Floating White Value Pill on hover or peak */}
                  {(isHovered || isHighest) && (
                    <div
                      className={`absolute -top-7 pointer-events-none font-mono text-[11px] font-black px-2 py-0.5 rounded-md shadow-xs z-20 transition-transform duration-150 ${
                        isHovered
                          ? "bg-white text-indigo-600 border border-indigo-200 shadow-sm scale-105"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:block"
                      }`}
                    >
                      {item.hours}h
                    </div>
                  )}

                  {/* The Bar */}
                  <div
                    className={`w-full max-w-[48px] rounded-t-xl transition-colors duration-200 relative overflow-hidden ${
                      isHovered
                        ? "bg-gradient-to-t from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/30"
                        : isHighest
                        ? "bg-gradient-to-t from-indigo-500 to-indigo-400 shadow-xs"
                        : "bg-gradient-to-t from-indigo-200/80 to-indigo-300/90 group-hover:from-indigo-400 group-hover:to-indigo-500"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Subtle Glass Sheen on Top of Bar */}
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-white/40" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels (Pure HTML Flex — Crisp & Non-Distorted) */}
          <div className="w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4 pt-2 border-t border-slate-100">
            {current.data.map((item, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 text-center cursor-pointer transition-colors"
                >
                  <p
                    className={`text-xs font-bold ${
                      isHovered ? "text-indigo-600" : "text-slate-700"
                    }`}
                  >
                    {item.label}
                  </p>
                  {item.subLabel && (
                    <p className="text-[10px] text-slate-400 font-mono hidden md:block">
                      {item.subLabel}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stable Detail Inspection Card (Fixed Height Slot — Zero Layout Shift, Zero Shaking) */}
        <div className="min-h-[58px] mt-3.5 flex items-center">
          {hoveredIndex !== null && current.data[hoveredIndex] ? (
            <div className="w-full p-3.5 bg-white text-slate-900 rounded-2xl flex items-center justify-between text-xs shadow-xs border border-indigo-100 transition-all duration-150 animate-in fade-in-50">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    {current.data[hoveredIndex].label} ({current.data[hoveredIndex].subLabel || current.periodLabel})
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {current.data[hoveredIndex].sessions} verified timesheet entries
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right shrink-0">
                <div>
                  <p className="font-mono text-emerald-600 font-extrabold text-sm">
                    {current.data[hoveredIndex].hours} hrs
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Output</p>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <p className="font-mono text-indigo-600 font-extrabold text-sm">
                    {current.data[hoveredIndex].attendancePct}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">On-Time</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full p-3 bg-slate-50/70 rounded-2xl flex items-center justify-between text-xs text-slate-400 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span className="font-medium text-[11px] text-slate-500">
                  Hover over any day to inspect timesheet breakdown &amp; on-time rate
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Period: {current.periodLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 4 Executive Metric KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Avg Daily Output</span>
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{current.avgHours}</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>Optimal velocity</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Period Peak</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900">{current.peakLabel}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Highest logged cycle
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Timesheet Compliance</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">{current.onTimeRate}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            On-time verified logs
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 hover:border-violet-200 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
            <span>Staffing Capacity</span>
            <Users className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div className="text-xl font-black text-slate-900">{current.capacityRate}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Active department staffing
          </div>
        </div>
      </div>
    </div>
  );
}
