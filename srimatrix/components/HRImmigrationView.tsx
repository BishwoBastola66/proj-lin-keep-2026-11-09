"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Globe,
  Plus,
  Search,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  FileText,
  User,
  Loader2,
  Building2,
  ShieldCheck,
} from "lucide-react";
import {
  getImmigrationCasesAction,
  createImmigrationCaseAction,
  deleteImmigrationCaseAction,
} from "@/app/actions/auth";

export interface DBImmigrationCase {
  id: number;
  employeeName: string;
  visaType: string;
  caseNumber: string | null;
  uscisStage: string | null;
  filingDate: string | null;
  approvalDate: string | null;
  expirationDate: string;
  priorityDate: string | null;
  lcaNumber: string | null;
  prevailingWage: string | null;
  workLocation: string | null;
  jobTitle: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function HRImmigrationView() {
  const [records, setRecords] = useState<DBImmigrationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formVisaType, setFormVisaType] = useState("H-1B Specialty");
  const [formReceipt, setFormReceipt] = useState("");
  const [formStage, setFormStage] = useState("Petition Filed");
  const [formExpiration, setFormExpiration] = useState("");
  const [formLca, setFormLca] = useState("");
  const [formWage, setFormWage] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStatus, setFormStatus] = useState<string>("Active");
  const [formNotes, setFormNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getImmigrationCasesAction();
      if (res.success && res.data) {
        setRecords(res.data as DBImmigrationCase[]);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.error("Failed to load immigration cases:", err);
      setErrorMsg("Failed to connect to database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesSearch =
        rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.visaType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.caseNumber && rec.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec.jobTitle && rec.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rec.workLocation && rec.workLocation.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "All" || rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: records.length,
      active: records.filter((r) => r.status === "Active").length,
      expiringSoon: records.filter((r) => r.status === "Expiring Soon").length,
      underReview: records.filter((r) => r.status === "Under Review").length,
    };
  }, [records]);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formExpiration) return;

    startTransition(async () => {
      const res = await createImmigrationCaseAction({
        employeeName: formName.trim(),
        jobTitle: formJobTitle.trim() || undefined,
        visaType: formVisaType,
        caseNumber: formReceipt.trim() || undefined,
        uscisStage: formStage.trim() || undefined,
        expirationDate: formExpiration,
        lcaNumber: formLca.trim() || undefined,
        prevailingWage: formWage.trim() || undefined,
        workLocation: formLocation.trim() || undefined,
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setRecords((prev) => [res.data as DBImmigrationCase, ...prev]);
        setShowAddModal(false);
        setFormName("");
        setFormJobTitle("");
        setFormReceipt("");
        setFormExpiration("");
        setFormLca("");
        setFormWage("");
        setFormLocation("");
        setFormNotes("");
        setFormStatus("Active");
      } else {
        alert(res.message || "Failed to save record to database.");
      }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete immigration record for ${name} from database?`)) {
      startTransition(async () => {
        const res = await deleteImmigrationCaseAction(id);
        if (res.success) {
          setRecords((prev) => prev.filter((r) => r.id !== id));
        } else {
          alert(res.message || "Failed to delete record.");
        }
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-2xs shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Immigration
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, visa, receipt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-64 focus:outline-hidden focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed shrink-0 select-none shadow-2xs"
            title="Immigration record creation is currently under construction"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Record</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-bold">
              Under Construction
            </span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="px-4 sm:px-8 py-2.5 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Records
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
              {counts.total}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Active Visas
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.5 block">
              {counts.active}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Expiring Soon
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-700 font-mono mt-0.5 block">
              {counts.expiringSoon}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-sky-50/80 border border-sky-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
              Under Review
            </span>
            <span className="text-xs sm:text-sm font-black text-sky-700 font-mono mt-0.5 block">
              {counts.underReview}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 sm:px-8 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {["All", "Active", "Expiring Soon", "Under Review", "Expired"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === st
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="flex-1 w-full overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
            <span className="text-xs font-medium">Loading records directly from database...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 sm:px-6">Employee &amp; Clinical Title</th>
                <th className="py-2.5 px-2 sm:px-6">Visa / Stage</th>
                <th className="py-2.5 px-2 sm:px-6">Receipt / Petition #</th>
                <th className="py-2.5 px-2 sm:px-6">Work Facility</th>
                <th className="py-2.5 px-2 sm:px-6">Expiration Date</th>
                <th className="py-2.5 px-2 sm:px-6">Status</th>
                <th className="py-2.5 px-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-xs px-4">
                    No immigration records found in database. Immigration record creation is currently under construction.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 sm:px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                          {rec.employeeName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{rec.employeeName}</div>
                          {rec.jobTitle && (
                            <div className="text-[10px] text-slate-500 font-medium truncate">
                              {rec.jobTitle}
                            </div>
                          )}
                          {rec.notes && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                              {rec.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-6">
                      <div className="font-semibold text-slate-700">{rec.visaType}</div>
                      {rec.uscisStage && (
                        <div className="text-[10px] text-cyan-600 font-medium">
                          {rec.uscisStage}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono text-slate-600 text-xs">
                      {rec.caseNumber || "—"}
                    </td>
                    <td className="py-3 px-2 sm:px-6 text-slate-600">
                      {rec.workLocation ? (
                        <div className="flex items-center gap-1 text-[11px] truncate max-w-[160px]">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{rec.workLocation}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono text-slate-900 font-bold">
                      {rec.expirationDate}
                    </td>
                    <td className="py-3 px-2 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          rec.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : rec.status === "Expiring Soon"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : rec.status === "Under Review"
                            ? "bg-sky-100 text-sky-800 border border-sky-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(rec.id, rec.employeeName)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete record from database"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-600" />
                <span>Add Immigration Case to Database</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRecord} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clinical / Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Registered Nurse (ICU)"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Visa / Status Category *
                  </label>
                  <select
                    value={formVisaType}
                    onChange={(e) => setFormVisaType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="H-1B Specialty">H-1B Specialty</option>
                    <option value="OPT STEM Extension">OPT STEM Extension</option>
                    <option value="CPT Curricular">CPT Curricular</option>
                    <option value="TN NAFTA Professional">TN NAFTA Professional</option>
                    <option value="Green Card (EB-2/EB-3 Schedule A)">Green Card (EB-2/EB-3 Schedule A)</option>
                    <option value="J-1 Clinical Waiver (Conrad 30)">J-1 Clinical Waiver (Conrad 30)</option>
                    <option value="O-1 Extraordinary Ability">O-1 Extraordinary Ability</option>
                    <option value="E-3 Australian Specialty">E-3 Australian Specialty</option>
                    <option value="Other / Work Authorized">Other / Work Authorized</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    USCIS Receipt / Case #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EAC-24-901-51203"
                    value={formReceipt}
                    onChange={(e) => setFormReceipt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    USCIS Petition Stage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Petition Filed / Approved"
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpiration}
                    onChange={(e) => setFormExpiration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Work Facility / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Memorial Regional Hospital"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    DOL LCA / Case #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ETA-9035-2024-RN01"
                    value={formLca}
                    onChange={(e) => setFormLca(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prevailing Wage
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $48.50/hr"
                    value={formWage}
                    onChange={(e) => setFormWage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes / Case Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Certified LCA and Form I-797 notice stored in HR vault"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
