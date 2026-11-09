"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Clock,
  Bell,
  Building2,
  UserCheck,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  getCachedFollowups,
  getCachedFollowupsSync,
  subscribeOverviewCache,
} from "@/lib/overviewCache";

export interface TickerFollowup {
  id: string;
  entityType: "client" | "candidate" | "account" | "other";
  entityId: string;
  entityName: string;
  title: string;
  followUpDate: string;
  shouldNotify: boolean;
  priority: string;
  status: string;
}

interface FollowupNewsTickerProps {
  onNavigateToPipeline?: () => void;
}

export default function FollowupNewsTicker({
  onNavigateToPipeline,
}: FollowupNewsTickerProps) {
  const initialCache = getCachedFollowupsSync();
  const [items, setItems] = useState<TickerFollowup[]>(() => {
    if (Array.isArray(initialCache)) {
      return (initialCache as TickerFollowup[])
        .filter((d) => d.status !== "completed")
        .sort((a, b) => {
          const diffA = new Date(a.followUpDate).getTime();
          const diffB = new Date(b.followUpDate).getTime();
          return diffA - diffB;
        });
    }
    return [];
  });

  useEffect(() => {
    let isMounted = true;
    async function load(forceRefresh = false) {
      try {
        const data = await getCachedFollowups(forceRefresh);
        if (isMounted && Array.isArray(data)) {
          // Keep active pending items, sorted by nearest follow-up date
          const pending = (data as TickerFollowup[])
            .filter((d) => d.status !== "completed")
            .sort((a, b) => {
              const diffA = new Date(a.followUpDate).getTime();
              const diffB = new Date(b.followUpDate).getTime();
              return diffA - diffB;
            });
          setItems(pending);
        }
      } catch (err) {
        console.error("Error loading ticker followups:", err);
      }
    }
    load();

    const unsubscribe = subscribeOverviewCache((key) => {
      if (key === "followups" || key === "all") {
        load(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const marqueeItems = items.length > 0 ? [...items, ...items] : [];

  return (
    <div className="w-full bg-white border-b border-slate-200/90 shrink-0 select-none z-20 relative">
      {/* ── White Shares News Stock Ticker Floating Bar ── */}
      <div className="w-full bg-white text-slate-800 flex items-center h-9 sm:h-10 overflow-hidden relative">
        {/* Left Fixed Ticker Badge */}
        <div className="h-full bg-slate-900 text-white px-2.5 sm:px-4 flex items-center shrink-0 z-20 font-bold text-[10px] sm:text-xs tracking-wider uppercase shadow-xs whitespace-nowrap">
          <span>Follow Ups</span>
        </div>

        {/* Scrolling Ticker Track */}
        <div className="flex-1 min-w-0 overflow-hidden h-full flex items-center px-2.5 sm:px-4 relative">
          {/* Ambient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-6 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-3 sm:w-6 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          {items.length === 0 ? (
            <span className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap truncate">
              No pending follow-ups<span className="hidden sm:inline"> scheduled in the active pipeline</span>
            </span>
          ) : (
            <div
              className="animate-ticker flex items-center gap-4 sm:gap-6 whitespace-nowrap cursor-pointer"
              style={{ animationDuration: `${Math.max(80, items.length * 8)}s` }}
            >
            {marqueeItems.map((item, idx) => {
              const diffDays = getDaysDiff(item.followUpDate);
              const isOverdue = diffDays < 0;
              const isToday = diffDays === 0;
              const isTomorrow = diffDays === 1;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={onNavigateToPipeline}
                  className="inline-flex items-center gap-2 sm:gap-2.5 text-xs text-slate-700 hover:text-indigo-600 transition-colors py-1 shrink-0"
                >
                  {/* Entity Tag */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      item.entityType === "client"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {item.entityType === "client" ? (
                      <Building2 className="w-2.5 h-2.5" />
                    ) : (
                      <UserCheck className="w-2.5 h-2.5" />
                    )}
                    <span>{item.entityName}</span>
                  </span>

                  {/* Title / Objective */}
                  <span className="font-semibold text-slate-800 max-w-[200px] sm:max-w-[280px] truncate">
                    {item.title}
                  </span>

                  {/* Stock Market Style Delta / Due Badge */}
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full ${
                      isOverdue
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : isToday
                        ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                        : isTomorrow
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <span>
                      {isOverdue
                        ? `▼ ${Math.abs(diffDays)}d OVERDUE`
                        : isToday
                        ? "▲ DUE TODAY"
                        : isTomorrow
                        ? "◆ TOMORROW"
                        : `● IN ${diffDays}D`}
                    </span>
                  </span>

                  {/* Bell Icon if notification is on */}
                  {item.shouldNotify && (
                    <span title="Alert Notification Active">
                      <Bell className="w-3 h-3 text-amber-500" />
                    </span>
                  )}

                  {/* Stock Market News Ticker Separator */}
                  <span className="text-slate-300 font-bold text-sm px-1">
                    &bull;
                  </span>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Right CTA button */}
        {onNavigateToPipeline && (
          <button
            type="button"
            onClick={onNavigateToPipeline}
            className="h-full bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 px-2.5 sm:px-4 flex items-center gap-1 text-[11px] font-bold shrink-0 z-20 border-l border-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Pipeline</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
