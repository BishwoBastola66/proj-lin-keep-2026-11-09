"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Calendar,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  Trash2,
  Car,
  Lock,
  History,
} from "lucide-react";
import {
  submitTimesheetAction,
  deleteTimesheetAction,
  getMileageEntriesAction,
  createMileageEntryAction,
  deleteMileageEntryAction,
} from "@/app/actions/auth";

interface DayEntry {
  hours: number;
  project: string;
  note: string;
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun, 1=Mon...
  // go back to Saturday (start week from Sat like the screenshot)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) - 1; // Mon-1 = Sun... let's do Sat
  // Actually let's start the week from Saturday like the screenshot
  const satDiff = date.getDate() - ((day + 1) % 7);
  const sat = new Date(date);
  sat.setDate(satDiff);
  return sat;
}

function formatShortDay(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

function formatMonthDay(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatWeekRange(start: Date, end: Date): string {
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  user: { name: string; email: string; role: string };
  timesheets?: any[];
  onSubmitted?: () => Promise<void> | void;
  onSubmit?: (entries: DayEntry[]) => void;
  onNavigateToHistory?: () => void;
}

export default function EmployeeTimeEntryView({
  user,
  timesheets = [],
  onSubmitted,
  onSubmit,
  onNavigateToHistory,
}: Props) {
  const today = new Date();

  // Week start = Saturday of current week
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(today));
  const weekDays = getWeekDays(weekStart);
  const weekEnd = weekDays[6];

  // Per-day entries keyed by YYYY-MM-DD
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});

  // Add Time Modal state
  const [addModalDay, setAddModalDay] = useState<Date | null>(null);
  const [modalHours, setModalHours] = useState("8");

  // Submission & Timesheet Server State
  const [submitted, setSubmitted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmittingTimesheet, setIsSubmittingTimesheet] = useState(false);
  const [isDeletingTimesheet, setIsDeletingTimesheet] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Track which week-start keys have been submitted (green in calendar)
  const [submittedWeeks, setSubmittedWeeks] = useState<Set<string>>(new Set());
  const [isMobileSubmitSlideOpen, setIsMobileSubmitSlideOpen] = useState(false);

  // Mileage state
  const [mileageList, setMileageList] = useState<any[]>([]);
  const [isMileageModalOpen, setIsMileageModalOpen] = useState(false);
  const [mileageDate, setMileageDate] = useState(() => dayKey(today));
  const [mileageDistance, setMileageDistance] = useState("");
  const [mileageDescription, setMileageDescription] = useState("");
  const [isSubmittingMileage, setIsSubmittingMileage] = useState(false);
  const [deletingMileageId, setDeletingMileageId] = useState<number | null>(null);
  const [mileageSuccessMsg, setMileageSuccessMsg] = useState<string | null>(null);

  // Existing timesheet matching for selected week
  const pLabel = formatWeekRange(weekStart, weekEnd);
  const existingTimesheet = useMemo(() => {
    const yr = weekStart.getFullYear();
    const mo = weekStart.getMonth() + 1;
    const wk = Math.ceil(weekStart.getDate() / 7);
    return (timesheets || []).find(
      (ts: any) =>
        ts.periodLabel === pLabel ||
        (ts.year === yr && ts.month === mo && ts.weekNumber === wk)
    );
  }, [timesheets, pLabel, weekStart]);

  useEffect(() => {
    if (existingTimesheet) {
      const dayMap: Record<string, DayEntry> = {};
      weekDays.forEach((d) => {
        const dayNum = d.getDay();
        let hrs = 0;
        if (dayNum === 1) hrs = existingTimesheet.mondayHours || 0;
        else if (dayNum === 2) hrs = existingTimesheet.tuesdayHours || 0;
        else if (dayNum === 3) hrs = existingTimesheet.wednesdayHours || 0;
        else if (dayNum === 4) hrs = existingTimesheet.thursdayHours || 0;
        else if (dayNum === 5) hrs = existingTimesheet.fridayHours || 0;
        else if (dayNum === 6) hrs = existingTimesheet.saturdayHours || 0;
        else if (dayNum === 0) hrs = existingTimesheet.sundayHours || 0;

        if (hrs > 0) {
          dayMap[dayKey(d)] = {
            hours: hrs,
            project: "",
            note: "",
          };
        }
      });
      setEntries(dayMap);
      setSubmitted(true);
      setSubmitSuccess(true);
      setSubmittedWeeks((prev) => new Set([...prev, dayKey(weekStart)]));
    } else {
      setEntries({});
      setSubmitted(false);
      setSubmitSuccess(false);
    }
    setSubmitError(null);
  }, [weekStart.getTime(), existingTimesheet?.id]);

  // Calendar popup
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const calendarRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarOpen]);

  useEffect(() => {
    let active = true;
    getMileageEntriesAction().then((entries) => {
      if (active && Array.isArray(entries)) {
        setMileageList(entries);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const currentWeekMileageList = useMemo(() => {
    const startKey = dayKey(weekStart);
    const endKey = dayKey(weekEnd);
    return mileageList.filter((m) => {
      if (!m.entryDate) return false;
      return m.entryDate >= startKey && m.entryDate <= endKey;
    });
  }, [mileageList, weekStart, weekEnd]);

  const totalWeekMileage = useMemo(() => {
    return currentWeekMileageList.reduce(
      (sum, m) => sum + (parseFloat(m.distance) || 0),
      0
    );
  }, [currentWeekMileageList]);

  const handleSaveMileage = async (e: React.FormEvent) => {
    e.preventDefault();
    const distNum = parseFloat(mileageDistance);
    if (isNaN(distNum) || distNum <= 0) {
      alert("Please enter a valid mileage distance.");
      return;
    }
    setIsSubmittingMileage(true);
    try {
      const res = await createMileageEntryAction({
        entryDate: mileageDate,
        distance: String(distNum),
        description: mileageDescription.trim() || "Travel miles",
      });
      if (res.success) {
        setIsMileageModalOpen(false);
        setMileageDistance("");
        setMileageDescription("");
        setMileageSuccessMsg(res.message);
        setTimeout(() => setMileageSuccessMsg(null), 3000);
        const updated = await getMileageEntriesAction();
        if (Array.isArray(updated)) setMileageList(updated);
        onSubmitted?.();
      } else {
        alert(res.message || "Failed to log mileage.");
      }
    } catch {
      alert("An error occurred while logging mileage.");
    } finally {
      setIsSubmittingMileage(false);
    }
  };

  const handleDeleteMileage = async (id: number, desc: string, dist: string) => {
    if (!confirm(`Delete ${dist} mi entry ("${desc}")?`)) return;
    setDeletingMileageId(id);
    try {
      const res = await deleteMileageEntryAction(id);
      if (res.success) {
        setMileageList((prev) => prev.filter((m) => m.id !== id));
        onSubmitted?.();
      } else {
        alert(res.message || "Failed to delete mileage entry.");
      }
    } catch {
      alert("Error deleting mileage entry.");
    } finally {
      setDeletingMileageId(null);
    }
  };

  const getEntry = (d: Date): DayEntry =>
    entries[dayKey(d)] || { hours: 0, project: "", note: "" };

  const totalHours = weekDays.reduce((sum, d) => sum + getEntry(d).hours, 0);

  const totalApprovedHours = useMemo(() => {
    return (timesheets || [])
      .filter((t: any) => t.status?.toLowerCase() === "approved")
      .reduce((acc: number, t: any) => acc + (Number(t.totalHours) || 0), 0);
  }, [timesheets]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
    setSubmitted(false);
    setSubmitSuccess(false);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
    setSubmitted(false);
    setSubmitSuccess(false);
  };

  const goToday = () => {
    setWeekStart(getMondayOfWeek(today));
    setSubmitted(false);
    setSubmitSuccess(false);
  };

  const openAddModal = (d: Date) => {
    const existing = getEntry(d);
    setAddModalDay(d);
    setModalHours(existing.hours > 0 ? String(existing.hours) : "8");
  };

  const saveEntry = () => {
    if (!addModalDay) return;
    setEntries((prev) => ({
      ...prev,
      [dayKey(addModalDay)]: {
        hours: Math.max(0, Math.min(24, Number(modalHours) || 0)),
        project: "",
        note: "",
      },
    }));
    setAddModalDay(null);
  };

  const removeEntry = (d: Date) => {
    setEntries((prev) => {
      const next = { ...prev };
      delete next[dayKey(d)];
      return next;
    });
  };

  const quickFillStandardWeek = () => {
    const nextEntries: Record<string, DayEntry> = { ...entries };
    weekDays.forEach((d) => {
      const dayNum = d.getDay();
      // Mon (1) through Fri (5)
      if (dayNum >= 1 && dayNum <= 5) {
        nextEntries[dayKey(d)] = {
          hours: 8,
          project: "",
          note: "",
        };
      }
    });
    setEntries(nextEntries);
    setSubmitted(false);
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (totalHours === 0 || isSubmittingTimesheet) return;
    setIsSubmittingTimesheet(true);
    setSubmitError(null);

    try {
      const dayHours: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

      weekDays.forEach((d) => {
        const ent = getEntry(d);
        const dayNum = d.getDay();
        dayHours[dayNum] = Math.round(ent.hours || 0);
      });

      const fd = new FormData();
      fd.append("year", String(weekStart.getFullYear()));
      fd.append("month", String(weekStart.getMonth() + 1));
      fd.append("weekNumber", String(Math.ceil(weekStart.getDate() / 7)));
      fd.append("startDate", dayKey(weekStart));
      fd.append("endDate", dayKey(weekEnd));
      fd.append("periodLabel", formatWeekRange(weekStart, weekEnd));
      fd.append("project", "");
      fd.append("notes", "");
      fd.append("mondayHours", String(dayHours[1] || 0));
      fd.append("tuesdayHours", String(dayHours[2] || 0));
      fd.append("wednesdayHours", String(dayHours[3] || 0));
      fd.append("thursdayHours", String(dayHours[4] || 0));
      fd.append("fridayHours", String(dayHours[5] || 0));
      fd.append("saturdayHours", String(dayHours[6] || 0));
      fd.append("sundayHours", String(dayHours[0] || 0));

      const res = await submitTimesheetAction(fd);

      if (res.success) {
        setSubmitted(true);
        setSubmitSuccess(true);
        setSubmittedWeeks((prev) => new Set([...prev, dayKey(weekStart)]));
        onSubmit?.(weekDays.map((d) => getEntry(d)));
        if (onSubmitted) {
          await onSubmitted();
        }
      } else {
        setSubmitError(res.message || "Failed to submit timesheet.");
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred while submitting.");
    } finally {
      setIsSubmittingTimesheet(false);
    }
  };

  const handleDeleteTimesheet = async () => {
    if (!existingTimesheet?.id) return;
    if (existingTimesheet.status !== "rejected") {
      alert("Only rejected timesheets can be deleted.");
      return;
    }
    if (!window.confirm(`Delete rejected timesheet for ${pLabel}?`)) return;
    setIsDeletingTimesheet(true);
    try {
      const res = await deleteTimesheetAction(existingTimesheet.id);
      if (res.success) {
        setEntries({});
        setSubmitted(false);
        setSubmitSuccess(false);
        setSubmittedWeeks((prev) => {
          const next = new Set(prev);
          next.delete(dayKey(weekStart));
          return next;
        });
        if (onSubmitted) await onSubmitted();
      } else {
        setSubmitError(res.message);
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to delete timesheet.");
    } finally {
      setIsDeletingTimesheet(false);
    }
  };

  // Calendar helpers
  function getCalendarDays(monthDate: Date): (Date | null)[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }

  // Blue = day has a logged entry
  function dayHasEntry(d: Date): boolean {
    return (entries[dayKey(d)]?.hours ?? 0) > 0;
  }

  function isInSubmittedWeek(d: Date): boolean {
    const ws = getMondayOfWeek(d);
    return submittedWeeks.has(dayKey(ws));
  }

  function selectWeekFromCalendar(d: Date) {
    // Shift the week view directly to the selected week without opening a prompt modal
    setWeekStart(getMondayOfWeek(d));
    setCalendarOpen(false);
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative">


      {/* ── Week Nav & View Toggle ── */}
      <div className="px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white shrink-0">
        {/* Left: Today + Prev/Next + Date Range */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={goToday}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => setCalendarOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{formatWeekRange(weekStart, weekEnd)}</span>
            </button>

            {/* ── Calendar Popup ── */}
            {calendarOpen && (
              <div className="absolute top-10 left-0 z-50 w-72 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      const d = new Date(calendarMonth);
                      d.setMonth(d.getMonth() - 1);
                      setCalendarMonth(d);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-slate-900">
                    {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => {
                      const d = new Date(calendarMonth);
                      d.setMonth(d.getMonth() + 1);
                      setCalendarMonth(d);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day of week headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-y-0.5">
                  {getCalendarDays(calendarMonth).map((day, i) => {
                    if (!day) return <div key={i} />;
                    const hasEntry = dayHasEntry(day);
                    const inSubmitted = isInSubmittedWeek(day);
                    const isToday2 = isSameDay(day, today);
                    return (
                      <button
                        key={i}
                        onClick={() => selectWeekFromCalendar(day)}
                        title={`Shift to week of ${day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        className={`relative w-8 h-8 mx-auto flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer
                          ${
                            hasEntry
                              ? "bg-indigo-600 text-white"
                              : inSubmitted
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : isToday2
                              ? "ring-2 ring-indigo-400 text-indigo-700 hover:bg-indigo-50"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                      >
                        {day.getDate()}
                        {isToday2 && !hasEntry && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                    Time logged
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300 inline-block" />
                    Submitted week
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions & Enter Time CTA */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              title="View your submitted timesheet history and approval records"
            >
              <History className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="whitespace-nowrap">Timesheet History</span>
            </button>
          )}

          <button
            onClick={quickFillStandardWeek}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer"
            title="Populate Monday to Friday with 8 hours each"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="whitespace-nowrap">Quick Fill (40h)</span>
          </button>

          <button
            onClick={() => openAddModal(today)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Enter Time</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Day Grid + Summary Panel ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Day Columns Grid */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Mobile 2-Row Split Grid: 4 days up (Sat, Sun, Mon, Tue) & 3 days down (Wed, Thu, Fri) */}
          <div className="lg:hidden flex-1 flex flex-col w-full divide-y divide-slate-200 bg-white min-h-0">
            {/* Row 1 ("Up"): Sat, Sun, Mon, Tue */}
            <div className="flex-1 grid grid-cols-4 w-full divide-x divide-slate-100 min-h-0">
              {weekDays.slice(0, 4).map((day, i) => {
                const isToday = isSameDay(day, today);
                const entry = getEntry(day);
                const hasEntry = entry.hours > 0;

                return (
                  <div
                    key={i}
                    className={`flex flex-col h-full min-h-0 ${
                      isToday ? "bg-indigo-50/40" : "bg-white"
                    }`}
                  >
                    {/* Day Header */}
                    <div
                      className={`px-1.5 py-2 border-b text-center shrink-0 ${
                        isToday ? "border-indigo-200 bg-indigo-600/5" : "border-slate-100"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-black uppercase tracking-wider truncate ${
                          isToday ? "text-indigo-600" : "text-slate-600"
                        }`}
                      >
                        {formatShortDay(day)} {formatMonthDay(day)}
                      </div>
                      <div
                        className={`text-[10px] font-bold mt-0.5 ${
                          isToday ? "text-indigo-500" : "text-slate-400"
                        }`}
                      >
                        {entry.hours > 0 ? `${entry.hours}h` : "0h"}
                      </div>
                    </div>

                    {/* Entry Content */}
                    <div className="flex-1 p-1.5 flex flex-col gap-1 overflow-y-auto">
                      {hasEntry && (
                        <div className="group relative bg-indigo-600 text-white rounded-xl p-1.5 text-center text-[11px] font-bold shadow-xs">
                          <div>{entry.hours} hrs</div>
                          <button
                            onClick={() => removeEntry(day)}
                            className="absolute top-1 right-1 p-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                            title="Remove entry"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add Time CTA */}
                    <button
                      onClick={() => openAddModal(day)}
                      className={`flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer border-t border-slate-100 shrink-0 ${
                        isToday
                          ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Row 2 ("Down"): Wed, Thu, Fri (3 equal columns) */}
            <div className="flex-1 grid grid-cols-3 w-full divide-x divide-slate-100 min-h-0">
              {weekDays.slice(4, 7).map((day, i) => {
                const isToday = isSameDay(day, today);
                const entry = getEntry(day);
                const hasEntry = entry.hours > 0;

                return (
                  <div
                    key={i + 4}
                    className={`flex flex-col h-full min-h-0 ${
                      isToday ? "bg-indigo-50/40" : "bg-white"
                    }`}
                  >
                    {/* Day Header */}
                    <div
                      className={`px-1.5 py-2 border-b text-center shrink-0 ${
                        isToday ? "border-indigo-200 bg-indigo-600/5" : "border-slate-100"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-black uppercase tracking-wider truncate ${
                          isToday ? "text-indigo-600" : "text-slate-600"
                        }`}
                      >
                        {formatShortDay(day)} {formatMonthDay(day)}
                      </div>
                      <div
                        className={`text-[10px] font-bold mt-0.5 ${
                          isToday ? "text-indigo-500" : "text-slate-400"
                        }`}
                      >
                        {entry.hours > 0 ? `${entry.hours}h` : "0h"}
                      </div>
                    </div>

                    {/* Entry Content */}
                    <div className="flex-1 p-1.5 flex flex-col gap-1 overflow-y-auto">
                      {hasEntry && (
                        <div className="group relative bg-indigo-600 text-white rounded-xl p-1.5 text-center text-[11px] font-bold shadow-xs">
                          <div>{entry.hours} hrs</div>
                          <button
                            onClick={() => removeEntry(day)}
                            className="absolute top-1 right-1 p-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                            title="Remove entry"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Add Time CTA */}
                    <button
                      onClick={() => openAddModal(day)}
                      className={`flex items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer border-t border-slate-100 shrink-0 ${
                        isToday
                          ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Single-Row 7-Column Layout */}
          <div className="hidden lg:flex flex-1 w-full min-w-0">
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, today);
              const entry = getEntry(day);
              const hasEntry = entry.hours > 0;

              return (
                <div
                  key={i}
                  className={`flex-1 flex flex-col border-r border-slate-100 min-h-[380px] ${
                    isToday ? "bg-indigo-50/40" : "bg-white"
                  }`}
                >
                  {/* Day Header */}
                  <div
                    className={`px-3 py-3 border-b text-center shrink-0 ${
                      isToday ? "border-indigo-200 bg-indigo-600/5" : "border-slate-100"
                    }`}
                  >
                    <div
                      className={`text-[11px] font-black uppercase tracking-wider ${
                        isToday ? "text-indigo-600" : "text-slate-500"
                      }`}
                    >
                      {formatShortDay(day)}, {formatMonthDay(day)}
                    </div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        isToday ? "text-indigo-500" : "text-slate-400"
                      }`}
                    >
                      Hours: {entry.hours}
                    </div>
                  </div>

                  {/* Entry Content */}
                  <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto">
                    {hasEntry && (
                      <div className="group relative bg-indigo-600 text-white rounded-xl p-2.5 text-xs shadow-sm">
                        <div className="font-bold">{entry.hours} hrs</div>
                        <button
                          onClick={() => removeEntry(day)}
                          className="absolute top-1.5 right-1.5 p-0.5 rounded-md bg-white/20 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add Time CTA at bottom */}
                  <button
                    onClick={() => openAddModal(day)}
                    className={`flex flex-col items-center justify-center gap-1 py-4 text-xs font-medium transition-colors cursor-pointer border-t border-slate-100 ${
                      isToday
                        ? "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                        : "text-slate-400 hover:text-indigo-500 hover:bg-slate-50"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Click to add time</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Summary Panel (Desktop Only) ── */}
        <div className="hidden lg:flex w-72 xl:w-80 shrink-0 border-l border-slate-200 bg-white flex-col overflow-y-auto p-4 sm:p-5 gap-5">
          {/* Summary Section */}
          <div>
            <h3 className="font-black text-sm text-slate-900 mb-0.5">Summary</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-4">
              {formatWeekRange(weekStart, weekEnd)}
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Worked Hours</span>
                <span className="font-black text-xl text-indigo-600 font-mono">{totalHours.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="font-medium text-xs text-slate-500">Total Approved</span>
                <span className="font-bold text-sm text-emerald-600 font-mono">{totalApprovedHours.toFixed(1)} hrs</span>
              </div>

              {/* Mileage Logging */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-indigo-600" />
                    Mileage
                  </span>
                  {totalWeekMileage > 0 && (
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {totalWeekMileage.toFixed(1)} mi
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMileageDate(dayKey(today));
                    setMileageDistance("");
                    setMileageDescription("");
                    setIsMileageModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50/60 text-xs font-bold transition-all cursor-pointer shadow-2xs mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Mileage</span>
                </button>

                {mileageSuccessMsg && (
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
                    <span className="truncate">{mileageSuccessMsg}</span>
                  </div>
                )}

                {currentWeekMileageList.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    {currentWeekMileageList.map((m) => {
                      const isApproved = m.status?.toLowerCase() === "approved";
                      const isRejected = m.status?.toLowerCase() === "rejected";
                      const statusNormalized = isApproved ? "Approved" : isRejected ? "Rejected" : (m.status || "Pending");

                      return (
                        <div
                          key={m.id}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-700 truncate">
                              {m.description || "Travel miles"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {m.entryDate ? new Date(m.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isApproved
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isRejected
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {statusNormalized}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-slate-900 font-mono">
                              {parseFloat(m.distance).toFixed(1)} mi
                            </span>
                            {isApproved ? (
                              <span
                                className="p-1 text-slate-300 cursor-not-allowed"
                                title="Approved mileage cannot be deleted"
                              >
                                <Lock className="w-3 h-3" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteMileage(m.id, m.description || "Travel miles", m.distance)}
                                disabled={deletingMileageId === m.id}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete this mileage entry"
                              >
                                {deletingMileageId === m.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Submit for Approval */}
          <div className="mt-auto space-y-2">
            {submitError && (
              <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess ? (
              <div className="space-y-2">
                {existingTimesheet?.status === "rejected" ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-700">
                      <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>
                        {existingTimesheet.reviewerPosition?.trim()
                          ? `Rejected by ${existingTimesheet.reviewerPosition.trim()}`
                          : existingTimesheet.reviewerRole
                          ? `Rejected by ${existingTimesheet.reviewerRole.charAt(0).toUpperCase() + existingTimesheet.reviewerRole.slice(1)}`
                          : "Rejected by Management"}
                      </span>
                    </div>
                    {existingTimesheet.reviewNote && (
                      <div className="text-[11px] font-medium text-rose-700 bg-rose-100/70 border border-rose-200/80 rounded-xl px-2.5 py-1.5 leading-snug">
                        <span className="font-bold">Reason:</span> &ldquo;{existingTimesheet.reviewNote}&rdquo;
                      </div>
                    )}
                    <p className="text-[10px] text-rose-600 font-medium">
                      Returned for corrections. Click &ldquo;Edit / Re-submit&rdquo; below to adjust your hours and re-submit.
                    </p>
                  </div>
                ) : existingTimesheet?.status === "draft" ? (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                    <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                    <span>Saved as Draft ({totalHours} hrs)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>
                      {existingTimesheet?.status === "approved"
                        ? (
                            existingTimesheet.reviewerPosition?.trim()
                              ? `Approved by ${existingTimesheet.reviewerPosition.trim()}`
                              : existingTimesheet.reviewNote?.trim() && existingTimesheet.reviewNote.toLowerCase().startsWith("approved by")
                              ? existingTimesheet.reviewNote.trim()
                              : existingTimesheet.reviewerRole
                              ? `Approved by ${existingTimesheet.reviewerRole.charAt(0).toUpperCase() + existingTimesheet.reviewerRole.slice(1)}`
                              : "Approved by Super Administrator"
                          )
                        : `Submitted for Approval (${totalHours} hrs)!`}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className={`flex-1 text-center text-[11px] font-bold rounded-xl py-1.5 transition-colors cursor-pointer border ${
                      existingTimesheet?.status === "rejected"
                        ? "text-rose-700 hover:text-white bg-rose-100 hover:bg-rose-600 border-rose-200 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
                    }`}
                  >
                    Edit / Re-submit
                  </button>
                  {existingTimesheet?.id && existingTimesheet?.status === "rejected" && (
                    <button
                      onClick={handleDeleteTimesheet}
                      disabled={isDeletingTimesheet}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                      title="Delete rejected timesheet"
                    >
                      {isDeletingTimesheet ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={totalHours === 0 || isSubmittingTimesheet}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  totalHours > 0 && !isSubmittingTimesheet
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}
              >
                {isSubmittingTimesheet ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting to Management...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{totalHours > 0 ? "Submit for Approval" : "Add hours to submit"}</span>
                  </>
                )}
              </button>
            )}

            {totalHours === 0 && !submitSuccess && (
              <button
                onClick={quickFillStandardWeek}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/60 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Quick Fill Standard (40h)</span>
              </button>
            )}

            <div className="flex items-start gap-1.5 text-[10px] text-slate-400 leading-relaxed">
              <Info className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
              <span>
                {existingTimesheet?.status === "rejected"
                  ? "This timesheet was returned for revisions. Click \"Edit / Re-submit\" to adjust your hours and re-submit for approval."
                  : existingTimesheet?.status === "approved"
                  ? "Approved timesheets are finalized and locked for payroll calculation."
                  : "Submitted timesheets are automatically routed to management for approval and payroll calculation."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Fixed Bottom Footer (Always at screen footer on any device size) ── */}
      <div className="lg:hidden shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Week Total
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-indigo-600 font-mono leading-none">
                {totalHours.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-500">hrs</span>
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  existingTimesheet?.status === "approved" || totalApprovedHours > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : existingTimesheet?.status === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : existingTimesheet?.status === "submitted"
                    ? "bg-blue-100 text-blue-800"
                    : totalHours > 0
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {existingTimesheet?.status === "approved" || totalApprovedHours > 0
                  ? "Approved"
                  : existingTimesheet?.status === "rejected"
                  ? "Rejected"
                  : existingTimesheet?.status === "submitted"
                  ? "Submitted"
                  : totalHours > 0
                  ? "Ready"
                  : "Empty"}
              </span>
            </div>
          </div>
          {totalWeekMileage > 0 && (
            <div className="pl-3 border-l border-slate-200 flex items-center gap-1 text-[11px] font-bold text-slate-600">
              <Car className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{totalWeekMileage.toFixed(1)} mi</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileSubmitSlideOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
        >
          <span>{existingTimesheet?.status === "rejected" ? "Review & Re-submit" : "Submit"}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Mobile Slide-Up Submission Sheet with Mileage & Options ── */}
      {isMobileSubmitSlideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileSubmitSlideOpen(false)}
          />

          {/* Slide-Up Drawer */}
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/90 max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
            {/* Drawer Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Drawer Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {existingTimesheet?.status === "rejected" ? "Timesheet Review & Re-submit" : "Submit Timesheet"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {formatWeekRange(weekStart, weekEnd)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSubmitSlideOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Worked Hours</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-indigo-600 font-mono">{totalHours.toFixed(1)}</span>
                    <span className="text-xs font-semibold text-indigo-500">hrs</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Approved</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-emerald-600 font-mono">{totalApprovedHours.toFixed(1)}</span>
                    <span className="text-xs font-semibold text-emerald-500">hrs</span>
                  </div>
                </div>
              </div>

              {/* Mileage & Travel Section */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Mileage &amp; Travel</h4>
                      <p className="text-[10px] text-slate-400">Claim business travel miles for this period</p>
                    </div>
                  </div>
                  {totalWeekMileage > 0 && (
                    <span className="text-xs font-black text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {totalWeekMileage.toFixed(1)} mi
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMileageDate(dayKey(today));
                    setMileageDistance("");
                    setMileageDescription("");
                    setIsMileageModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Log Mileage for this Week</span>
                </button>

                {mileageSuccessMsg && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate">{mileageSuccessMsg}</span>
                  </div>
                )}

                {currentWeekMileageList.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                    {currentWeekMileageList.map((m) => {
                      const isApproved = m.status?.toLowerCase() === "approved";
                      const isRejected = m.status?.toLowerCase() === "rejected";
                      const statusNormalized = isApproved ? "Approved" : isRejected ? "Rejected" : (m.status || "Pending");

                      return (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs gap-2 shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 truncate">
                              {m.description || "Travel miles"}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {m.entryDate ? new Date(m.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                              </span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  isApproved
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isRejected
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {statusNormalized}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-slate-900 font-mono text-xs">
                              {parseFloat(m.distance).toFixed(1)} mi
                            </span>
                            {isApproved ? (
                              <span
                                className="p-1 text-slate-300 cursor-not-allowed"
                                title="Approved mileage cannot be deleted"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteMileage(m.id, m.description || "Travel miles", m.distance)}
                                disabled={deletingMileageId === m.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete this mileage entry"
                              >
                                {deletingMileageId === m.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-1">
                    No travel mileage logged for this week yet.
                  </p>
                )}
              </div>

              {/* Status & Review Notes */}
              {existingTimesheet?.status === "rejected" && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-700">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      {existingTimesheet.reviewerPosition?.trim()
                        ? `Rejected by ${existingTimesheet.reviewerPosition.trim()}`
                        : existingTimesheet.reviewerRole
                        ? `Rejected by ${existingTimesheet.reviewerRole.charAt(0).toUpperCase() + existingTimesheet.reviewerRole.slice(1)}`
                        : "Rejected by Management"}
                    </span>
                  </div>
                  {existingTimesheet.reviewNote && (
                    <div className="text-[11px] font-medium text-rose-700 bg-rose-100/70 border border-rose-200/80 rounded-xl px-2.5 py-1.5 leading-snug">
                      <span className="font-bold">Reason:</span> &ldquo;{existingTimesheet.reviewNote}&rdquo;
                    </div>
                  )}
                  <p className="text-[10px] text-rose-600 font-medium">
                    Returned for corrections. Adjust your hours in the days grid or click &ldquo;Edit / Re-submit&rdquo; below.
                  </p>
                </div>
              )}

              {existingTimesheet?.status === "approved" && (
                <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    {existingTimesheet.reviewerPosition?.trim()
                      ? `Approved by ${existingTimesheet.reviewerPosition.trim()}`
                      : existingTimesheet.reviewNote?.trim() && existingTimesheet.reviewNote.toLowerCase().startsWith("approved by")
                      ? existingTimesheet.reviewNote.trim()
                      : "Approved by Management"}
                  </span>
                </div>
              )}

              {submitError && (
                <div className="flex items-start gap-1.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Instructions Notice */}
              <div className="flex items-start gap-1.5 text-[10px] text-slate-400 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  {existingTimesheet?.status === "rejected"
                    ? "Adjust your hours and click 'Re-submit for Approval' to send the corrected timesheet."
                    : "Submitted timesheets are automatically sent to your manager for approval and payroll processing."}
                </span>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-2">
              {submitSuccess ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitSuccess(false);
                      setIsMobileSubmitSlideOpen(false);
                    }}
                    className={`flex-1 text-center text-xs font-bold rounded-xl py-2.5 transition-colors cursor-pointer border ${
                      existingTimesheet?.status === "rejected"
                        ? "text-rose-700 hover:text-white bg-rose-100 hover:bg-rose-600 border-rose-200"
                        : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200"
                    }`}
                  >
                    Edit / Re-submit
                  </button>
                  {existingTimesheet?.id && existingTimesheet?.status === "rejected" && (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleDeleteTimesheet();
                        setIsMobileSubmitSlideOpen(false);
                      }}
                      disabled={isDeletingTimesheet}
                      className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    >
                      {isDeletingTimesheet ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await handleSubmit();
                  }}
                  disabled={totalHours === 0 || isSubmittingTimesheet}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${
                    totalHours > 0 && !isSubmittingTimesheet
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  {isSubmittingTimesheet ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting to Management...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{totalHours > 0 ? "Submit for Approval" : "Add hours to submit"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Time Modal ── */}
      {addModalDay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setAddModalDay(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-slate-900">Log Time</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {addModalDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setAddModalDay(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hours *</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  value={modalHours}
                  onChange={(e) => setModalHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  placeholder="8"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setAddModalDay(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveEntry}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Mileage Modal ── */}
      {isMileageModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsMileageModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-5 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Log Mileage</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Record business travel miles</p>
                </div>
              </div>
              <button
                onClick={() => setIsMileageModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMileage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={mileageDate}
                  onChange={(e) => setMileageDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Distance (miles) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="e.g. 15.5"
                  value={mileageDistance}
                  onChange={(e) => setMileageDistance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purpose / Destination</label>
                <input
                  type="text"
                  placeholder="e.g. Client meeting, Site travel"
                  value={mileageDescription}
                  onChange={(e) => setMileageDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMileageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMileage}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingMileage ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Mileage</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
