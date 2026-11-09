"use client";

import { useState, useEffect, useMemo } from "react";
import { showConfirm, showAlert } from "@/components/GlobalPromptDialog";
import {
  GitBranch,
  Calendar,
  Bell,
  BellOff,
  Search,
  Plus,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  Mail,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Filter,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Users,
  CheckSquare,
  Square,
  Tag,
  User,
} from "lucide-react";
import {
  getPipelineFollowupsAction,
  savePipelineFollowupAction as rawSavePipelineFollowupAction,
  deletePipelineFollowupAction as rawDeletePipelineFollowupAction,
  togglePipelineFollowupStatusAction as rawTogglePipelineFollowupStatusAction,
  getCandidatesAction,
  getAccountsForCampaignAction,
} from "@/app/actions/auth";
import { invalidateOverviewCache } from "@/lib/overviewCache";

async function savePipelineFollowupAction(payload: any) {
  invalidateOverviewCache("followups");
  return await rawSavePipelineFollowupAction(payload);
}

async function deletePipelineFollowupAction(id: string) {
  invalidateOverviewCache("followups");
  return await rawDeletePipelineFollowupAction(id);
}

async function togglePipelineFollowupStatusAction(id: string, status: "pending" | "completed") {
  invalidateOverviewCache("followups");
  return await rawTogglePipelineFollowupStatusAction(id, status);
}

export interface PipelineFollowupItem {
  id: string;
  entityType: "candidate" | "account" | "client" | "other";
  entityId: string;
  entityName: string;
  contactEmail?: string | null;
  title: string;
  stage: string;
  followUpDate: string; // YYYY-MM-DD
  shouldNotify: boolean;
  priority: "urgent" | "high" | "medium" | "normal";
  notes?: string | null;
  status: "pending" | "completed";
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SelectableEntity {
  id: string; // unique identifier key
  rawId: string; // original entity ID in database
  numericId?: number;
  name: string;
  email?: string;
  type: "candidate" | "account" | "client";
  subtitle: string;
}

interface PipelineManagementViewProps {
  onNavigateToMail?: (recipientEmail?: string, subject?: string) => void;
}

const DEFAULT_STAGES = [
  "Needs Follow-up",
  "In Discussion",
  "Interview Scheduled",
  "Offer Review",
  "Contract Signing",
  "Completed",
];

const formatDateOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function PipelineManagementView({
  onNavigateToMail,
}: PipelineManagementViewProps = {}) {
  const [items, setItems] = useState<PipelineFollowupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<
    "all" | "candidate" | "account" | "completed"
  >("all");

  // All loaded selectable entities (Candidates, Accounts/Team)
  const [allSelectableEntities, setAllSelectableEntities] = useState<SelectableEntity[]>([]);

  // View Mode: 'pipeline' (table view) or 'schedule' (inline scheduler)
  const [viewMode, setViewMode] = useState<"pipeline" | "schedule">("pipeline");
  const [isSaving, setIsSaving] = useState(false);
  const [isTimingPromptOpen, setIsTimingPromptOpen] = useState(false);
  const [modalTabFilter, setModalTabFilter] = useState<"all" | "candidate" | "account">("all");
  const [modalSearch, setModalSearch] = useState("");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [isCustomEntityMode, setIsCustomEntityMode] = useState(false);

  // Custom entity inputs (if admin needs an unlisted entity)
  const [customEntityName, setCustomEntityName] = useState("");
  const [customEntityId, setCustomEntityId] = useState("");
  const [customEntityType, setCustomEntityType] = useState<"candidate" | "account" | "other">("candidate");
  const [customEntityEmail, setCustomEntityEmail] = useState("");

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formStage, setFormStage] = useState("Needs Follow-up");
  const [formFollowUpDate, setFormFollowUpDate] = useState(() => formatDateOffset(1));
  const [formShouldNotify, setFormShouldNotify] = useState(true);
  const [formPriority, setFormPriority] = useState<
    "urgent" | "high" | "medium" | "normal"
  >("high");
  const [formNotes, setFormNotes] = useState("");

  // Load Pipeline follow-up items from PostgreSQL Backend
  const loadPipelineData = async () => {
    try {
      setIsLoading(true);
      const data = await getPipelineFollowupsAction();
      if (Array.isArray(data)) {
        setItems(data as PipelineFollowupItem[]);
      }
    } catch (err) {
      console.error("Failed to load pipeline followups:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load all clients, candidates, and team accounts for selection
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getPipelineFollowupsAction();
        if (isMounted && Array.isArray(data)) {
          setItems(data as PipelineFollowupItem[]);
        }
      } catch (err) {
        console.error("Failed to load pipeline followups:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();

    async function loadEntities() {
      const combined: SelectableEntity[] = [];

      // 1. Candidates directly from PostgreSQL (candidates table)
      try {
        const candList = await getCandidatesAction();
        if (Array.isArray(candList)) {
          candList.forEach((c) => {
            const candName = `${c.firstName} ${c.lastName || ""}`.trim() || c.firstName;
            combined.push({
              id: `cand-${c.id}`,
              rawId: String(c.id),
              numericId: c.id,
              name: candName,
              email: c.email || "",
              type: "candidate",
              subtitle: c.pipelineStage
                ? `Stage: ${c.pipelineStage}`
                : "Candidate Applicant",
            });
          });
        }
      } catch (e) {
        console.error("Error loading candidates:", e);
      }

      // 3. Accounts / Internal Team from PostgreSQL (accounts table)
      try {
        const dbAccounts = await getAccountsForCampaignAction();
        if (Array.isArray(dbAccounts)) {
          dbAccounts.forEach((acc: any) => {
            combined.push({
              id: `acc-${acc.id}`,
              rawId: String(acc.id),
              numericId: Number(acc.id),
              name: acc.name || "Team Member",
              email: acc.email || "",
              type: "account",
              subtitle: acc.position || (acc.role === "admin" ? "System Admin" : "Srimatrix Team"),
            });
          });
        }
      } catch (e) {
        console.error("Error loading accounts:", e);
      }

      if (isMounted) {
        setAllSelectableEntities(combined);
      }
    }

    loadEntities();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered entities for modal list
  const filteredModalEntities = useMemo(() => {
    return allSelectableEntities.filter((entity) => {
      if (modalTabFilter !== "all" && entity.type !== modalTabFilter) {
        return false;
      }
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase();
        return (
          entity.name.toLowerCase().includes(q) ||
          (entity.email && entity.email.toLowerCase().includes(q)) ||
          entity.subtitle.toLowerCase().includes(q) ||
          entity.rawId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allSelectableEntities, modalTabFilter, modalSearch]);

  // Entity selection toggle
  const handleToggleEntity = (id: string) => {
    setSelectedEntityIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select all currently filtered entities in modal
  const handleSelectAllFiltered = () => {
    const visibleIds = filteredModalEntities.map((e) => e.id);
    const allAlreadySelected = visibleIds.length > 0 && visibleIds.every((id) => selectedEntityIds.includes(id));
    if (allAlreadySelected) {
      setSelectedEntityIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedEntityIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedEntityIds([]);
  };

  // Helper to calculate days from today: 0 = Today, 1 = Tomorrow, < 0 = Overdue
  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Sort: Active pending items sorted by nearest follow-up date (Overdue & Due Today at the very top)
  const sortedPendingItems = useMemo(() => {
    return items
      .filter((item) => item.status !== "completed")
      .sort((a, b) => {
        const diffA = getDaysDiff(a.followUpDate);
        const diffB = getDaysDiff(b.followUpDate);
        return diffA - diffB;
      });
  }, [items]);



  // Filtered Items for Main View
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedEntityFilter === "completed") {
          return item.status === "completed";
        }
        if (selectedEntityFilter !== "all" && item.entityType !== selectedEntityFilter) {
          return false;
        }
        if (item.status === "completed") {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.entityName.toLowerCase().includes(q) ||
            item.entityId.toLowerCase().includes(q) ||
            (item.contactEmail && item.contactEmail.toLowerCase().includes(q)) ||
            (item.notes && item.notes.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        const diffA = getDaysDiff(a.followUpDate);
        const diffB = getDaysDiff(b.followUpDate);
        return diffA - diffB;
      });
  }, [items, selectedEntityFilter, searchQuery]);

  // Actions
  const handleToggleComplete = async (item: PipelineFollowupItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
    );
    await togglePipelineFollowupStatusAction(item.id, newStatus);
  };

  const handleDeleteItem = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Remove Follow-Up",
      message: "Are you sure you want to remove this follow-up from the pipeline?",
      variant: "danger",
      confirmText: "Remove",
    });
    if (!confirmed) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await deletePipelineFollowupAction(id);
  };

  // Submit new follow-up (supports Single or Multiple selected entities, or Custom unlisted entity)
  const handleSaveFollowup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isCustomEntityMode) {
      if (!customEntityName.trim() || !formFollowUpDate) {
        showAlert({
          title: "Missing Information",
          message: "Please enter the entity name and follow-up date.",
          variant: "warning",
        });
        return;
      }
    } else {
      if (selectedEntityIds.length === 0) {
        showAlert({
          title: "Selection Required",
          message: "Please select at least one client, candidate, or team member.",
          variant: "warning",
        });
        return;
      }
      if (!formFollowUpDate) {
        showAlert({
          title: "Date Required",
          message: "Please select a follow-up date.",
          variant: "warning",
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const newItemsToAppend: PipelineFollowupItem[] = [];

      if (isCustomEntityMode) {
        const title = formTitle.trim() || `Follow-up with ${customEntityName.trim()}`;
        const payload = {
          id: `pl-${Date.now()}`,
          entityType: customEntityType,
          entityId: customEntityId.trim() || `${customEntityType}-${Date.now()}`,
          entityName: customEntityName.trim(),
          contactEmail: customEntityEmail.trim() || undefined,
          title,
          stage: formStage,
          followUpDate: formFollowUpDate,
          shouldNotify: formShouldNotify,
          priority: formPriority,
          notes: formNotes.trim() || undefined,
          status: "pending" as const,
        };

        const res = await savePipelineFollowupAction(payload);
        if (res.success) {
          newItemsToAppend.push({ ...payload, id: res.id || payload.id });
        }
      } else {
        const entitiesToSave = allSelectableEntities.filter((ent) =>
          selectedEntityIds.includes(ent.id)
        );

        for (let i = 0; i < entitiesToSave.length; i++) {
          const ent = entitiesToSave[i];
          const uniqueId = `pl-${Date.now()}-${i}`;
          const title = formTitle.trim() || `Follow-up with ${ent.name}`;

          const payload = {
            id: uniqueId,
            candidateId: ent.type === "candidate" ? (ent.numericId || parseInt(ent.rawId, 10) || null) : null,
            accountId: ent.type === "account" ? (ent.numericId || parseInt(ent.rawId, 10) || null) : null,
            entityType: ent.type,
            entityId: ent.rawId,
            entityName: ent.name,
            contactEmail: ent.email || undefined,
            title,
            stage: formStage,
            followUpDate: formFollowUpDate,
            shouldNotify: formShouldNotify,
            priority: formPriority,
            notes: formNotes.trim() || undefined,
            status: "pending" as const,
          };

          const res = await savePipelineFollowupAction(payload);
          if (res.success) {
            newItemsToAppend.push({ ...payload, id: res.id || uniqueId });
          }
        }
      }

      if (newItemsToAppend.length > 0) {
        setItems((prev) => [...newItemsToAppend, ...prev]);
        setIsTimingPromptOpen(false);
        setViewMode("pipeline");
        // Reset form & selections
        setSelectedEntityIds([]);
        setFormTitle("");
        setFormNotes("");
        setIsCustomEntityMode(false);
        setCustomEntityName("");
        setCustomEntityId("");
        setCustomEntityEmail("");
      } else {
        showAlert({
          title: "Save Failed",
          message: "Failed to save follow-up.",
          variant: "danger",
        });
      }
    } catch (err) {
      console.error("Error creating follow-up:", err);
      showAlert({
        title: "Save Failed",
        message: "Failed to save follow-up.",
        variant: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // If in scheduling mode, render full-width entity directory, with Timing & Purpose as a prompt box modal
  if (viewMode === "schedule") {
    return (
      <div className="w-full h-full flex flex-col bg-white overflow-hidden">
        {/* ── Top Navbar (Edge-to-edge) ── */}
        <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsTimingPromptOpen(false);
                setViewMode("pipeline");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Pipeline</span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  Schedule Follow-up
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {isCustomEntityMode ? "Custom Unlisted" : `${selectedEntityIds.length} Selected`}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Select clients, candidates, or team members to proceed to follow-up timing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setIsTimingPromptOpen(false);
                setViewMode("pipeline");
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                (!isCustomEntityMode && selectedEntityIds.length === 0) ||
                (isCustomEntityMode && !customEntityName.trim())
              }
              onClick={() => setIsTimingPromptOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isCustomEntityMode
                  ? "Set Follow-up Timing →"
                  : selectedEntityIds.length > 0
                  ? `Set Follow-up Timing (${selectedEntityIds.length}) →`
                  : "Select Entities to Continue"}
              </span>
            </button>
          </div>
        </div>

        {/* ── Toolbar: Step Header + Tabs + Custom Unlisted Toggle (Edge-to-edge) ── */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-6 sm:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
              Select Clients, Candidates or Team
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                selectedEntityIds.length > 0
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200/80 text-slate-600"
              }`}
            >
              {selectedEntityIds.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {!isCustomEntityMode && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-bold overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setModalTabFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    modalTabFilter === "all"
                      ? "bg-white text-indigo-600 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({allSelectableEntities.length})
                </button>

                <button
                  type="button"
                  onClick={() => setModalTabFilter("candidate")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    modalTabFilter === "candidate"
                      ? "bg-white text-purple-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Candidates ({allSelectableEntities.filter((e) => e.type === "candidate").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTabFilter("account")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    modalTabFilter === "account"
                      ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Team ({allSelectableEntities.filter((e) => e.type === "account").length})</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsCustomEntityMode(!isCustomEntityMode)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isCustomEntityMode ? "Browse Directory" : "+ Custom Unlisted"}
            </button>
          </div>
        </div>

        {/* ── Search & Filter Sub-Bar (Edge-to-edge) ── */}
        {!isCustomEntityMode && (
          <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-2.5 flex items-center gap-3 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients, candidates, team members by name or email..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-white placeholder:text-slate-400"
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            >
              Select All Filtered
            </button>
            {selectedEntityIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
              >
                Clear ({selectedEntityIds.length})
              </button>
            )}
          </div>
        )}

        {/* ── Main Entity Directory List (Edge-to-Edge, Full Width, Zero Side Gaps) ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-4 bg-white space-y-2">
          {isCustomEntityMode ? (
            /* Manual Custom Entity Form */
            <div className="p-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 space-y-4 max-w-2xl">
              <div className="text-xs font-bold text-indigo-900">
                Custom Unlisted Entity
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entity Type</label>
                  <select
                    value={customEntityType}
                    onChange={(e) => setCustomEntityType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="client">Client</option>
                    <option value="candidate">Candidate</option>
                    <option value="account">Team Member</option>
                    <option value="other">Other / Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Entity ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. client-99"
                    value={customEntityId}
                    onChange={(e) => setCustomEntityId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">Entity Name *</label>
                <input
                  type="text"
                  required={isCustomEntityMode}
                  placeholder="e.g. Acme Corp or Jane Doe"
                  value={customEntityName}
                  onChange={(e) => setCustomEntityName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>
              <div className="text-xs">
                <label className="block font-bold text-slate-700 mb-1">Contact Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. contact@example.com"
                  value={customEntityEmail}
                  onChange={(e) => setCustomEntityEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>
          ) : filteredModalEntities.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mb-2 stroke-1" />
              <span>No matching entities found</span>
            </div>
          ) : (
            filteredModalEntities.map((entity) => {
              const isSelected = selectedEntityIds.includes(entity.id);
              return (
                <div
                  key={entity.id}
                  onClick={() => handleToggleEntity(entity.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-pointer select-none border ${
                    isSelected
                      ? "bg-indigo-50/80 border-indigo-200 shadow-2xs"
                      : "hover:bg-slate-50 bg-white border-slate-200"
                  }`}
                >
                  {/* Checkbox box */}
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Icon */}
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      entity.type === "client"
                        ? "bg-emerald-100 text-emerald-700"
                        : entity.type === "account"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {entity.type === "client" ? (
                      <Building2 className="w-4 h-4" />
                    ) : entity.type === "account" ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                  </span>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {entity.name}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                          entity.type === "client"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : entity.type === "account"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                            : "bg-purple-50 text-purple-700 border border-purple-200/60"
                        }`}
                      >
                        {entity.type === "account" ? "TEAM" : entity.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                      <span>{entity.subtitle}</span>
                      {entity.email && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {entity.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Follow-up Timing Prompt Box (2-Sided Modal Dialog) ── */}
        {isTimingPromptOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSaving) {
                setIsTimingPromptOpen(false);
              }
            }}
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
              {/* Modal Top Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Follow-up Timing & Purpose
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review target recipients and configure schedule timing
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSaving && setIsTimingPromptOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal 2-Sided Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                {/* ── LEFT SIDE: Target Recipients Details & Unmark (5 cols) ── */}
                <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-5 flex flex-col space-y-3 min-h-0">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                        Target Recipients ({isCustomEntityMode ? 1 : selectedEntityIds.length})
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Click × or checkbox to unmark
                      </span>
                    </div>
                    {!isCustomEntityMode && selectedEntityIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                      >
                        Unmark All
                      </button>
                    )}
                  </div>

                  {/* Recipients List */}
                  <div className="flex-1 overflow-y-auto max-h-[380px] md:max-h-[460px] space-y-2 pr-1">
                    {isCustomEntityMode ? (
                      <div className="p-3.5 rounded-2xl bg-white border border-indigo-200 shadow-2xs space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {customEntityName || "Custom Unlisted Entity"}
                            </div>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                              {customEntityType}
                            </span>
                          </div>
                        </div>
                        {customEntityEmail && (
                          <div className="text-[11px] font-mono text-slate-500 truncate">
                            {customEntityEmail}
                          </div>
                        )}
                        {customEntityId && (
                          <div className="text-[10px] text-slate-400">
                            ID: {customEntityId}
                          </div>
                        )}
                      </div>
                    ) : selectedEntityIds.length === 0 ? (
                      <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500 mb-2 stroke-1" />
                        <span className="font-bold text-slate-700">All entities unmarked</span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          Please keep at least 1 entity marked to schedule
                        </span>
                      </div>
                    ) : (
                      allSelectableEntities
                        .filter((e) => selectedEntityIds.includes(e.id))
                        .map((entity) => (
                          <div
                            key={entity.id}
                            className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all select-none group"
                          >
                            {/* Checkbox / Unmark */}
                            <button
                              type="button"
                              onClick={() => handleToggleEntity(entity.id)}
                              title="Click to unmark"
                              className="mt-0.5 w-5 h-5 rounded-lg bg-indigo-600 border border-indigo-600 text-white flex items-center justify-center shrink-0 hover:bg-rose-600 hover:border-rose-600 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3] group-hover:hidden" />
                              <X className="w-3.5 h-3.5 stroke-[3] hidden group-hover:block" />
                            </button>

                            {/* Icon */}
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                                entity.type === "client"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : entity.type === "account"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {entity.type === "client" ? (
                                <Building2 className="w-3.5 h-3.5" />
                              ) : entity.type === "account" ? (
                                <Users className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </span>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {entity.name}
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                    entity.type === "client"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                      : entity.type === "account"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                      : "bg-purple-50 text-purple-700 border border-purple-200/60"
                                  }`}
                                >
                                  {entity.type === "account" ? "TEAM" : entity.type}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                {entity.subtitle}
                              </div>
                              {entity.email && (
                                <div className="font-mono text-[10px] text-slate-400 truncate mt-0.5">
                                  {entity.email}
                                </div>
                              )}
                            </div>

                            {/* Quick remove × button */}
                            <button
                              type="button"
                              onClick={() => handleToggleEntity(entity.id)}
                              title="Unmark"
                              className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* ── RIGHT SIDE: Follow-up Timing & Purpose (7 cols) ── */}
                <div className="md:col-span-7 bg-white p-5 sm:p-6 flex flex-col space-y-4 overflow-y-auto max-h-[460px]">
                  {/* When to Follow Up */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>When to Follow Up *</span>
                      <span className="text-[10px] font-bold text-indigo-600">Quick Shortcuts</span>
                    </label>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: "Today", days: 0 },
                        { label: "Tomorrow", days: 1 },
                        { label: "+3 Days", days: 3 },
                        { label: "+1 Week", days: 7 },
                      ].map((p) => {
                        const targetDate = formatDateOffset(p.days);
                        const isActive = formFollowUpDate === targetDate;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setFormFollowUpDate(targetDate)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isActive
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="date"
                      required
                      value={formFollowUpDate}
                      onChange={(e) => setFormFollowUpDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-indigo-600 bg-white cursor-pointer"
                    />
                  </div>

                  {/* Follow-up Purpose / Reason */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Follow-up Purpose / Reason</span>
                      <span className="text-[10px] text-slate-400">Quick Presets</span>
                    </label>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Catch-up Call",
                        "SOW Review",
                        "Interview Round",
                        "Offer Check-in",
                        "Timesheet Catchup",
                      ].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setFormTitle(reason)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            formTitle === reason
                              ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. SOW renewal review, interview feedback"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-white"
                    />
                  </div>

                  {/* Stage & Priority */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pipeline Stage</label>
                      <select
                        value={formStage}
                        onChange={(e) => setFormStage(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-white font-medium"
                      >
                        {DEFAULT_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Priority</label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 bg-white font-medium"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  {/* Notify on Due Date */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          formShouldNotify ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {formShouldNotify ? (
                          <Bell className="w-3.5 h-3.5" />
                        ) : (
                          <BellOff className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block leading-tight">
                          Notify on Due Date
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formShouldNotify
                            ? "Alerts trigger on news ticker & dashboard"
                            : "Silent record without reminder alert"}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formShouldNotify}
                        onChange={(e) => setFormShouldNotify(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-600">
                  {selectedEntityIds.length === 0 && !customEntityName.trim() ? (
                    <span className="text-rose-600 font-bold">Please keep at least 1 entity marked</span>
                  ) : (
                    <span>
                      Scheduling for <strong>{isCustomEntityMode ? (customEntityName || "Custom Entity") : selectedEntityIds.length}</strong> {isCustomEntityMode || selectedEntityIds.length === 1 ? "entity" : "entities"} on <strong>{formFollowUpDate}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsTimingPromptOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={
                      isSaving ||
                      (!isCustomEntityMode && selectedEntityIds.length === 0) ||
                      (isCustomEntityMode && !customEntityName.trim()) ||
                      !formFollowUpDate
                    }
                    onClick={() => handleSaveFollowup()}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>
                          {isCustomEntityMode
                            ? "Schedule Follow-up"
                            : selectedEntityIds.length > 1
                            ? `Schedule Follow-up (${selectedEntityIds.length})`
                            : "Schedule Follow-up"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* ── Top Navbar (Edge-to-edge) ── */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Follow-up & Placements Pipeline
              </h1>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                {sortedPendingItems.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
              Track client contracts, candidate interview milestones, scheduled follow-up dates & alert notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPipelineData}
            title="Refresh Pipeline"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsTimingPromptOpen(false);
              setViewMode("schedule");
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar (Edge-to-edge) ── */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-4 sm:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-bold self-start md:self-auto overflow-x-auto max-w-full scrollbar-none [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setSelectedEntityFilter("all")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-[11px] sm:text-xs shrink-0 ${
              selectedEntityFilter === "all"
                ? "bg-white text-indigo-600 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="sm:hidden">All ({sortedPendingItems.length})</span>
            <span className="hidden sm:inline">All Active ({sortedPendingItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedEntityFilter("candidate")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs shrink-0 ${
              selectedEntityFilter === "candidate"
                ? "bg-white text-purple-700 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>
              Candidates (
              {sortedPendingItems.filter((i) => i.entityType === "candidate").length}
              )
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntityFilter("account")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs shrink-0 ${
              selectedEntityFilter === "account"
                ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Team (
              {sortedPendingItems.filter((i) => i.entityType === "account").length}
              )
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedEntityFilter("completed")}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs shrink-0 ${
              selectedEntityFilter === "completed"
                ? "bg-white text-slate-800 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <span className="sm:hidden">Done</span>
              <span className="hidden sm:inline">Completed</span> (
              {items.filter((i) => i.status === "completed").length})
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, name, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* ── Table Container (Edge to edge, flex-1, scrollable, sticky header) ── */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-2xs">
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 w-9 sm:w-12 text-center">Status</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4">Entity & ID</th>
              <th className="py-2.5 sm:py-3 px-6 hidden md:table-cell">Follow-up Objective / Title</th>
              <th className="py-2.5 sm:py-3 px-4 hidden lg:table-cell">Stage</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 whitespace-nowrap">Scheduled Date</th>
              <th className="py-2.5 sm:py-3 px-4 text-center hidden xl:table-cell">Notification</th>
              <th className="py-2.5 sm:py-3 px-4 text-center hidden sm:table-cell">Priority</th>
              <th className="py-2.5 sm:py-3 px-2 sm:px-4 pr-3 sm:pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 px-4 text-center text-slate-400">
                  <p className="font-semibold text-slate-600 text-sm">No pipeline items found.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click &ldquo;Schedule Follow-up&rdquo; above to track a client or candidate.
                  </p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const diffDays = getDaysDiff(item.followUpDate);
                const isOverdue = diffDays < 0;
                const isToday = diffDays === 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.status === "completed" ? "opacity-60 bg-slate-50/40" : ""
                    }`}
                  >
                    {/* Checkbox Complete */}
                    <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleComplete(item)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                          item.status === "completed"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 hover:border-indigo-600 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </td>

                    {/* Entity & ID */}
                    <td className="py-2.5 sm:py-3 px-2 sm:px-4">
                      <div className="flex items-start sm:items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                            item.entityType === "client"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.entityType === "account"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {item.entityType === "client" ? (
                            <Building2 className="w-3.5 h-3.5" />
                          ) : item.entityType === "account" ? (
                            <Users className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm">
                            {item.entityName}
                          </span>
                          {/* Mobile-only title & stage */}
                          <span className="font-semibold text-slate-700 block text-xs mt-0.5 md:hidden truncate max-w-[170px]">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400">
                              ID: {item.entityId}
                            </span>
                            <span className="inline-block px-1.5 py-0.2 rounded font-bold text-[9px] bg-slate-100 text-slate-600 border border-slate-200 lg:hidden">
                              {item.stage}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Follow-up Objective / Title */}
                    <td className="py-2.5 sm:py-3 px-6 hidden md:table-cell">
                      <span
                        className={`font-semibold text-slate-900 block ${
                          item.status === "completed" ? "line-through text-slate-400" : ""
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.notes && (
                        <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.notes}
                        </span>
                      )}
                    </td>

                    {/* Stage */}
                    <td className="py-2.5 sm:py-3 px-4 hidden lg:table-cell">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {item.stage}
                      </span>
                    </td>

                    {/* Scheduled Date */}
                    <td className="py-2.5 sm:py-3 px-2 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold font-mono text-xs ${
                            isOverdue
                              ? "text-rose-600 font-black"
                              : isToday
                              ? "text-amber-600 font-black"
                              : "text-slate-800"
                          }`}
                        >
                          {item.followUpDate}
                        </span>
                        {item.status !== "completed" && (
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                              isOverdue
                                ? "bg-rose-100 text-rose-700"
                                : isToday
                                ? "bg-amber-100 text-amber-700 animate-pulse"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isOverdue
                              ? "Overdue"
                              : isToday
                              ? "Today"
                              : diffDays === 1
                              ? "Tomorrow"
                              : `${diffDays}d`}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Notification Alert Toggle Status */}
                    <td className="py-2.5 sm:py-3 px-4 text-center hidden xl:table-cell">
                      {item.shouldNotify ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Bell className="w-3 h-3 text-emerald-600" />
                          <span>Notify On</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                          <BellOff className="w-3 h-3 text-slate-400" />
                          <span>Silent</span>
                        </span>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 sm:py-3 px-4 text-center hidden sm:table-cell">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          item.priority === "urgent"
                            ? "bg-rose-100 text-rose-700"
                            : item.priority === "high"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 sm:py-3 px-2 sm:px-4 pr-3 sm:pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Delete follow-up"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Status Bar Footer (Edge-to-edge) ── */}
      <div className="bg-[#f8f9fa] border-t border-slate-200 px-4 sm:px-8 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 shrink-0 font-medium select-none gap-1 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs flex-wrap">
          <span>Total: <strong>{items.length}</strong></span>
          <span>&bull;</span>
          <span>Active: <strong>{sortedPendingItems.length}</strong></span>
          <span>&bull;</span>
          <span>Completed: <strong>{items.filter((i) => i.status === "completed").length}</strong></span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-400">
          Nearest follow-up dates sorted at top
        </div>
      </div>
    </div>
  );
}
