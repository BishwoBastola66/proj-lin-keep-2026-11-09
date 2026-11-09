"use client";

import { UserCheck, Plus, CheckSquare, Clock, Users, ArrowRight } from "lucide-react";

export default function HROnboardingView() {
  return (
    <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-lg text-slate-900 tracking-tight">
                Employee Onboarding
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                HR Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track new hire documentation, verification, background checks, and welcome checklists
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Onboarding</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
            <CheckSquare className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-bold text-base sm:text-lg text-slate-800">
              Onboarding Workspace
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No employee onboarding workflows currently in progress. Start an onboarding workflow to provision checklist items, I-9 verification, and IT access credentials.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/80">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Ready for onboarding checklist configuration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
