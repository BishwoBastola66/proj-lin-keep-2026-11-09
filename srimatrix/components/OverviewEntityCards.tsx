"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  ArrowRight,
  Bell,
} from "lucide-react";
import {
  getCachedCandidates,
  getCachedFollowups,
  getCachedCandidatesSync,
  getCachedFollowupsSync,
  subscribeOverviewCache,
} from "@/lib/overviewCache";
import { getUserAvatar } from "@/lib/avatarHelper";

interface OverviewEntityCardsProps {
  accounts: any[];
  onNavigateTab: (tab: string) => void;
}

interface FollowupItem {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  title: string;
  followUpDate: string;
  status: string;
  priority?: string;
  shouldNotify?: boolean;
}

interface CandidateDisplayItem {
  id: string;
  name: string;
  email: string;
  position: string;
  status: string;
  hasFollowUp: boolean;
  followup?: FollowupItem;
}

function getRelativeDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `in ${diffDays}d`;
}

function buildEntities(
  dbCandidates: any[],
  followupsData: any[]
) {
  const activeFollowups: FollowupItem[] = Array.isArray(followupsData)
    ? followupsData.filter((f: any) => f.status !== "completed")
    : [];

  const candItems: CandidateDisplayItem[] = (dbCandidates || []).map((c) => {
    const name = c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name || "Candidate";
    const id = `cand-${c.id}`;
    const email = c.email || "";
    const position = c.licenseStatus || c.pipelineStage || "Specialist";
    const status = c.pipelineStage || c.status || "Lead";

    const match = activeFollowups.find(
      (f) =>
        f.entityType === "candidate" &&
        ((f.entityId && (f.entityId === id || f.entityId === String(c.id))) ||
          (f.entityName && f.entityName.trim().toLowerCase() === name.trim().toLowerCase()))
    );

    return {
      id,
      name,
      email,
      position,
      status,
      hasFollowUp: !!match,
      followup: match,
    };
  });

  candItems.sort((a, b) => {
    if (a.hasFollowUp && !b.hasFollowUp) return -1;
    if (!a.hasFollowUp && b.hasFollowUp) return 1;
    if (a.hasFollowUp && b.hasFollowUp && a.followup && b.followup) {
      return new Date(a.followup.followUpDate).getTime() - new Date(b.followup.followUpDate).getTime();
    }
    return 0;
  });

  return { candItems };
}

export default function OverviewEntityCards({
  accounts,
  onNavigateTab,
}: OverviewEntityCardsProps) {
  const initialCache = (() => {
    const can = getCachedCandidatesSync();
    const f = getCachedFollowupsSync();
    if (can !== null && f !== null) {
      return buildEntities(can, f);
    }
    return null;
  })();

  const [candidates, setCandidates] = useState<CandidateDisplayItem[]>(() => initialCache?.candItems || []);

  useEffect(() => {
    let isMounted = true;

    async function loadAll(forceRefresh = false) {
      try {
        const [followupsData, dbCandidates] = await Promise.all([
          getCachedFollowups(forceRefresh),
          getCachedCandidates(forceRefresh),
        ]);

        const { candItems } = buildEntities(dbCandidates, followupsData);

        if (isMounted) {
          setCandidates(candItems);
        }
      } catch (err) {
        console.error("Error initializing overview cards:", err);
      }
    }

    loadAll();

    const unsubscribe = subscribeOverviewCache((key) => {
      if (key === "candidates" || key === "followups" || key === "all") {
        loadAll(true);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const candidateFollowupCount = candidates.filter((c) => c.hasFollowUp).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ── BOX 1: EMPLOYEES ── */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-indigo-200">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  Employee Profiles
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Internal workforce directory
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("accounts")}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>See All ({accounts?.length || 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List of Employees */}
          <div className="divide-y divide-slate-100 pt-1">
            {accounts && accounts.length > 0 ? (
              accounts.slice(0, 4).map((acc: any) => (
                <div
                  key={acc.id}
                  onClick={() => onNavigateTab("accounts")}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 rounded-xl px-1.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getUserAvatar(acc.avatarUrl, acc.gender)}
                      alt={acc.name || "Avatar"}
                      className="w-8 h-8 rounded-xl object-cover border border-slate-200/80 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {acc.email}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 shrink-0 border border-slate-200/60 ml-2">
                    {acc.position || acc.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active employee profiles found.
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100/80 mt-2">
          <button
            onClick={() => onNavigateTab("accounts")}
            className="w-full py-2 rounded-xl text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 transition-colors cursor-pointer"
          >
            Manage Accounts Directory &rarr;
          </button>
        </div>
      </div>

      {/* ── BOX 2: CANDIDATES (Follow-ups on top) ── */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 flex flex-col justify-between transition-all hover:border-purple-200">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  Candidates
                </h3>
                <p className="text-[11px] font-medium">
                  {candidateFollowupCount > 0 ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {candidateFollowupCount} follow-up scheduled
                    </span>
                  ) : (
                    <span className="text-slate-500">Applicant recruitment pool</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab("candidates")}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>See All ({candidates.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List of Candidates (Follow-up items displayed at TOP) */}
          <div className="divide-y divide-slate-100 pt-1">
            {candidates.length > 0 ? (
              candidates.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigateTab(c.hasFollowUp ? "pipeline" : "candidates")}
                  className={`py-3 flex items-center justify-between text-xs rounded-xl px-1.5 transition-colors cursor-pointer group ${
                    c.hasFollowUp
                      ? "bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200/60 my-1"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 text-xs ${
                        c.hasFollowUp
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-purple-50/80 border border-purple-100 text-purple-700"
                      }`}
                    >
                      {c.hasFollowUp ? (
                        <Bell className="w-4 h-4 text-white animate-bounce" />
                      ) : (
                        c.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate group-hover:text-purple-700 transition-colors">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {c.position || c.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {c.hasFollowUp && c.followup ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                        <span>Follow-up:</span>
                        <span>{getRelativeDateLabel(c.followup.followUpDate)}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-100/80">
                        {c.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No candidate profiles registered.
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100/80 mt-2">
          <button
            onClick={() => onNavigateTab("candidates")}
            className="w-full py-2 rounded-xl text-center text-xs font-semibold text-purple-600 hover:bg-purple-50/50 transition-colors cursor-pointer"
          >
            Open Candidates Directory &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
