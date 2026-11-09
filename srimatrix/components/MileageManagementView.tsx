"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Car,
  Plus,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  X,
  FileText,
  TrendingUp,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  getMileageEntriesAction,
  createMileageEntryAction,
  deleteMileageEntryAction,
  updateMileageEntryStatusAction,
} from "@/app/actions/auth";

export default function MileageManagementView() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  // Form State
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [distance, setDistance] = useState("");
  const [description, setDescription] = useState("");

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await getMileageEntriesAction();
      setEntries(data);
    } catch (e) {
      console.error("Failed to load mileage:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleDelete(id: number, desc: string, dist: string) {
    if (!window.confirm(`Delete mileage record of ${parseFloat(dist).toFixed(1)} miles (${desc})?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteMileageEntryAction(id);
      if (res.success) {
        setEntries((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete mileage entry.");
    } finally {
      setDeletingId(null);
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingStatusId(id);
    try {
      const res = await updateMileageEntryStatusAction(id, newStatus);
      if (res.success) {
        setEntries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      } else {
        alert(res.message);
      }
    } catch {
      alert("Failed to update mileage status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (statusFilter !== "all" && e.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (e.accountName || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [entries, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const totalMiles = entries.reduce((acc, e) => acc + parseFloat(e.distance || "0"), 0);
    const approvedMiles = entries
      .filter((e) => e.status?.toLowerCase() === "approved")
      .reduce((acc, e) => acc + parseFloat(e.distance || "0"), 0);
    const pendingMiles = entries
      .filter((e) => e.status?.toLowerCase() !== "approved")
      .reduce((acc, e) => acc + parseFloat(e.distance || "0"), 0);
    return { totalMiles, approvedMiles, pendingMiles };
  }, [entries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!distance || isNaN(Number(distance)) || Number(distance) <= 0) {
      alert("Please provide a valid distance in miles.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createMileageEntryAction({
        entryDate,
        distance,
        description,
      });

      if (res.success) {
        setIsLogModalOpen(false);
        setDistance("");
        setDescription("");
        await loadData();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to log mileage.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/70 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/90 px-3.5 sm:px-8 py-3.5 sm:py-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Car className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  Mileage Tracking
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  {entries.length} Logged
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                On-call travel miles, timesheet associations &amp; approvals
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="flex-1 sm:flex-initial px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Mileage</span>
            </button>
          </div>
        </div>

        {/* Stats Row - 3 in a single clean row on all devices */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 text-center sm:text-left">
            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Total Miles
            </span>
            <p className="text-sm sm:text-xl font-black text-slate-900 mt-0.5 font-mono">
              {stats.totalMiles.toFixed(1)} <span className="text-[10px] font-sans font-normal text-slate-500">mi</span>
            </p>
          </div>
          <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 text-center sm:text-left">
            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Approved
            </span>
            <p className="text-sm sm:text-xl font-black text-emerald-600 mt-0.5 font-mono">
              {stats.approvedMiles.toFixed(1)} <span className="text-[10px] font-sans font-normal text-slate-500">mi</span>
            </p>
          </div>
          <div className="bg-slate-50/90 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 text-center sm:text-left">
            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Pending
            </span>
            <p className="text-sm sm:text-xl font-black text-amber-600 mt-0.5 font-mono">
              {stats.pendingMiles.toFixed(1)} <span className="text-[10px] font-sans font-normal text-slate-500">mi</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-b border-slate-200/80 px-3.5 sm:px-8 py-2.5 sm:py-3.5 flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search trips or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-emerald-600 shrink-0 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Draft">Draft</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Content Area - Responsive Mobile Cards + Desktop Table */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-8">
        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
            <img
              src="/srimatrix-health-logo.png"
              alt="Loading..."
              className="h-10 sm:h-12 w-auto animate-pulse object-contain select-none"
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredEntries.length === 0 && (
          <div className="py-12 px-4 text-center bg-white rounded-3xl border border-slate-200/90 flex flex-col items-center justify-center shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Car className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-900">No mileage logs found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {searchQuery || statusFilter !== "all"
                ? "No trip records match your active search filter."
                : "Record your on-call travel miles to submit them for approval."}
            </p>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Log Mileage</span>
            </button>
          </div>
        )}

        {/* Mobile Cards (Phones & Small Screens) */}
        {!isLoading && filteredEntries.length > 0 && (
          <div className="space-y-2.5 md:hidden">
            {filteredEntries.map((e) => (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {e.accountName || "Team Member"}
                    </p>
                    {e.accountEmail && (
                      <p className="text-[10px] text-slate-400 font-mono truncate">{e.accountEmail}</p>
                    )}
                  </div>
                  <span className="font-mono font-black text-sm text-slate-900 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-lg shrink-0">
                    {parseFloat(e.distance).toFixed(1)} {e.unit || "mi"}
                  </span>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                  {e.description || "Travel for client on-call duty"}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span className="font-mono">
                    {e.entryDate ? new Date(e.entryDate).toLocaleDateString() : "—"}
                  </span>

                  <div className="flex items-center gap-2">
                    <select
                      value={e.status || "Draft"}
                      disabled={updatingStatusId === e.id}
                      onChange={(ev) => handleUpdateStatus(e.id, ev.target.value)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none ${
                        e.status?.toLowerCase() === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : e.status?.toLowerCase() === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : e.status?.toLowerCase() === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Draft">Draft</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDelete(e.id, e.description || "Travel miles", e.distance)}
                      disabled={deletingId === e.id}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete mileage record"
                    >
                      {deletingId === e.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table (Medium & Large Screens) */}
        {!isLoading && filteredEntries.length > 0 && (
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Trip Description</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredEntries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {e.accountName || "Team Member"}
                        {e.accountEmail && (
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            {e.accountEmail}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {e.entryDate ? new Date(e.entryDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-extrabold text-slate-900 text-sm">
                          {parseFloat(e.distance).toFixed(1)}
                        </span>{" "}
                        <span className="text-slate-500 text-[11px]">{e.unit || "miles"}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate">
                        {e.description || "Travel for client on-call duty"}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={e.status || "Draft"}
                          disabled={updatingStatusId === e.id}
                          onChange={(ev) => handleUpdateStatus(e.id, ev.target.value)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors ${
                            e.status?.toLowerCase() === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : e.status?.toLowerCase() === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : e.status?.toLowerCase() === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="Draft">Draft</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id, e.description || "Travel miles", e.distance)}
                          disabled={deletingId === e.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete mileage record"
                        >
                          {deletingId === e.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Log Mileage Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Car className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Log Travel Mileage</h3>
                  <p className="text-xs text-slate-500">Record distance for on-call travel</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Travel</label>
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Distance (Miles)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 42.5"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono text-sm bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trip Description / Destination</label>
                <textarea
                  rows={3}
                  placeholder="e.g. On-call emergency travel to regional medical center"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Submit Mileage</span>
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
