"use client";

import { useState, useEffect, useTransition } from "react";
import {
  ShieldCheck,
  Key,
  KeyRound,
  Users,
  UserCheck,
  Building2,
  GitBranch,
  FileText,
  Car,
  CheckCheck,
  Mail,
  Activity,
  Calendar,
  BarChart3,
  TrendingUp,
  Sparkles,
  Search,
  Save,
  Crown,
  Loader2,
  Layers,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Briefcase,
  Receipt,
  FolderOpen,
  Globe,
  History,
  Database,
  type LucideIcon,
} from "lucide-react";
import {
  getAllAccountsWithPermissionsAction,
  updateAccountPermissionsAction,
} from "@/app/actions/auth";
import { getUserAvatar } from "@/lib/avatarHelper";
import { showAlert } from "@/components/GlobalPromptDialog";

export type PermissionsRecord = {
  tabOverview: boolean;
  tabSrimatrix: boolean;
  tabCandidates: boolean;
  tabPipeline: boolean;
  tabJob: boolean;
  tabMileage: boolean;
  tabMileageManage: boolean;
  tabReviewing: boolean;
  tabAccounts: boolean;
  tabMail: boolean;
  tabCredentials: boolean;
  tabSessions: boolean;
  tabLogs: boolean;
  tabTimesheets: boolean;
  widgetKpiMetrics: boolean;
  widgetEntityCards: boolean;
  widgetAnalyticsChart: boolean;
  widgetFollowupTicker: boolean;
  widgetEmailFeed: boolean;
  isSuperAdmin: boolean;
  canManagePermissions: boolean;
  [key: string]: boolean;
};

// Tab Permission Definitions
export interface TabDef {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroupDef {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  isCollapsible: boolean;
  tabs: TabDef[];
}

export const NAV_GROUPS: NavGroupDef[] = [
  {
    id: "main",
    label: "Top-Level Navigation",
    icon: LayoutDashboard,
    description: "Primary standalone sidebar navigation screens.",
    isCollapsible: false,
    tabs: [
      {
        key: "tabOverview",
        label: "Overview",
        icon: LayoutDashboard,
        description: "Main dashboard with KPI stats, workforce analytics, and activity.",
      },
      {
        key: "tabSrimatrix",
        label: "SriMatrix",
        icon: Building2,
        description: "Healthcare facility directory, beds census, administrators, and contacts.",
      },
      {
        key: "tabPipeline",
        label: "Client",
        icon: Database,
        description: "Client organization CRM, follow-up schedule tracker, and stage progression.",
      },
      {
        key: "tabCandidates",
        label: "Candidates",
        icon: UserCheck,
        description: "Talent recruitment database, credentials, skills, and hiring stages.",
      },
      {
        key: "tabAccounts",
        label: "Invoicing",
        icon: Receipt,
        description: "Client invoicing, billing cycles, payment receipts, and financial ledger.",
      },
      {
        key: "canManagePermissions",
        label: "Permissions",
        icon: ShieldCheck,
        description: "Manage system permissions, access controls, and role privileges.",
      },
    ],
  },
  {
    id: "employee",
    label: "Employee",
    icon: Users,
    description: "Employee self-service, timesheet logging, mileage, and staff directory.",
    isCollapsible: true,
    tabs: [
      {
        key: "tabTimesheets",
        label: "Timesheet",
        icon: Calendar,
        description: "Employee personal timesheet logging and weekly work hour entry.",
      },
      {
        key: "tabTimesheets",
        label: "Timesheet History",
        icon: History,
        description: "Archive of submitted weekly timesheets, approval statuses, and notes.",
      },
      {
        key: "tabReviewing",
        label: "Timesheet Manage",
        icon: CheckCheck,
        description: "Admin timesheet review center to inspect, approve, or reject employee timesheets.",
      },
      {
        key: "tabMileage",
        label: "Mileage",
        icon: Car,
        description: "Employee vehicle travel logging, personal mileage reimbursement, and distance tracking.",
      },
      {
        key: "tabMileageManage",
        label: "Mileage Manage",
        icon: Car,
        description: "Admin mileage management, team travel log review, and distance approvals.",
      },
      {
        key: "tabAccounts",
        label: "Accounts",
        icon: Users,
        description: "Staff directory, user credentials, role assignments, and profile management.",
      },
    ],
  },
  {
    id: "hr",
    label: "Human Resource",
    icon: Briefcase,
    description: "Recruitment onboarding, employment contracts, compliance, and immigration.",
    isCollapsible: true,
    tabs: [
      {
        key: "tabJob",
        label: "Offer letter",
        icon: FileText,
        description: "Job offer letter generator, compensation packages, and candidate contracts.",
      },
      {
        key: "tabJob",
        label: "Onboarding",
        icon: UserCheck,
        description: "New employee onboarding workflows, orientation checklists, and compliance.",
      },
      {
        key: "tabJob",
        label: "Documents",
        icon: FolderOpen,
        description: "Staff credential documents, license verifications, and compliance files.",
      },
      {
        key: "tabJob",
        label: "Immigration",
        icon: Globe,
        description: "Visa statuses, work authorizations, USCIS filing tracking, and expiration alerts.",
      },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    icon: ShieldCheck,
    description: "System administration, outbound email, authentication, and security audit logs.",
    isCollapsible: true,
    tabs: [
      {
        key: "tabMail",
        label: "Mail",
        icon: Mail,
        description: "Email composer, outreach campaign batches, and email interaction feeds.",
      },
      {
        key: "tabCredentials",
        label: "Email Key",
        icon: KeyRound,
        description: "SMTP host configuration, personal email app key, and signature customizer.",
      },
      {
        key: "tabSessions",
        label: "Sessions",
        icon: Key,
        description: "Active user logins, device IPs, browser agents, and token revocation.",
      },
      {
        key: "tabLogs",
        label: "Audit Logs",
        icon: Activity,
        description: "System-wide activity audit trail, authentication events, and security logs.",
      },
    ],
  },
];

const ALL_TABS: TabDef[] = NAV_GROUPS.flatMap((g) => g.tabs);

// Widget Permission Definitions
interface WidgetDef {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

const ALL_WIDGETS: WidgetDef[] = [
  {
    key: "widgetKpiMetrics",
    label: "Metric KPI Stat Cards",
    icon: BarChart3,
    description: "Top 4 metric cards: Total Accounts, Active Sessions, Approvals, Workforce Hours.",
  },
  {
    key: "widgetEntityCards",
    label: "3-Box Directory Cards",
    icon: Users,
    description: "Interactive directory cards for Employees, Facilities, and Candidates.",
  },
  {
    key: "widgetAnalyticsChart",
    label: "Workforce Analytics Chart",
    icon: TrendingUp,
    description: "Visual charts depicting weekly and monthly workforce hours distribution.",
  },
  {
    key: "widgetFollowupTicker",
    label: "Follow-up News Ticker",
    icon: Sparkles,
    description: "Live scrolling notification marquee displaying urgent follow-ups across top bar.",
  },
  {
    key: "widgetEmailFeed",
    label: "Email Interactions Feed",
    icon: Mail,
    description: "Stream of recent candidate outreach, client correspondence, and email status updates.",
  },
];

interface AccountPermItem {
  id: number;
  name: string;
  email: string;
  role: string;
  position?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  isSuperAdmin: boolean;
  isCustomized: boolean;
  permissions: PermissionsRecord;
}

export default function PermissionsManagementView({
  initialAccountId,
  onRefreshParent,
}: {
  initialAccountId?: number | null;
  onRefreshParent?: () => void;
} = {}) {
  const [accounts, setAccounts] = useState<AccountPermItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Active state for the currently selected user's permissions
  const [permsState, setPermsState] = useState<PermissionsRecord | null>(null);
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  const [canManageState, setCanManageState] = useState(false);

  // Load all accounts with permissions
  const loadAccounts = async (preserveSelectedId?: number) => {
    try {
      const res = await getAllAccountsWithPermissionsAction();
      if (res.success && res.accounts) {
        const accs = res.accounts as unknown as AccountPermItem[];
        setAccounts(accs);
        const selId = preserveSelectedId || selectedAccountId || (accs[0]?.id ?? null);
        if (selId) {
          const matched = accs.find((a) => a.id === selId);
          if (matched) {
            setSelectedAccountId(matched.id);
            setPermsState({ ...matched.permissions });
            setIsSuperAdminState(matched.isSuperAdmin);
            setCanManageState(Boolean(matched.permissions.canManagePermissions));
          }
        }
      }
    } catch (e) {
      console.error("Failed to load permissions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await getAllAccountsWithPermissionsAction();
        if (!isMounted) return;
        if (res.success && res.accounts) {
          const accs = res.accounts as unknown as AccountPermItem[];
          setAccounts(accs);
          const target = (initialAccountId ? accs.find((a) => a.id === initialAccountId) : null) || accs[0];
          if (target) {
            setSelectedAccountId(target.id);
            setPermsState({ ...target.permissions });
            setIsSuperAdminState(target.isSuperAdmin);
            setCanManageState(Boolean(target.permissions.canManagePermissions));
          }
        }
      } catch (e) {
        console.error("Failed to load permissions:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [initialAccountId]);

  // If initialAccountId changes dynamically, sync selected account
  useEffect(() => {
    if (initialAccountId && accounts.length > 0) {
      const target = accounts.find((a) => a.id === initialAccountId);
      if (target) {
        selectAccount(target);
      }
    }
  }, [initialAccountId, accounts]);

  // When switching selected account
  const selectAccount = (acc: AccountPermItem) => {
    setSelectedAccountId(acc.id);
    setPermsState({ ...acc.permissions });
    setIsSuperAdminState(acc.isSuperAdmin);
    setCanManageState(Boolean(acc.permissions.canManagePermissions));
    setSaveSuccessMsg(null);
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Toggle a single boolean permission
  const togglePermission = (key: string) => {
    if (!permsState) return;
    const newVal = !permsState[key];
    if (key === "canManagePermissions") {
      setCanManageState(newVal);
    }
    setPermsState((prev) => (prev ? { ...prev, [key]: newVal } : null));
    setSaveSuccessMsg(null);
  };

  // Group collapse & expand state for permission sections
  const [expandedPermGroups, setExpandedPermGroups] = useState<Record<string, boolean>>({
    main: true,
    employee: true,
    hr: true,
    admin: true,
  });

  const togglePermGroup = (groupId: string) => {
    setExpandedPermGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleGroupAll = (group: NavGroupDef, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!permsState || isSuperAdminState) return;
    const allActive = group.tabs.every((t) => Boolean(permsState[t.key]));
    const targetState = !allActive;
    const updated = { ...permsState };
    group.tabs.forEach((t) => {
      updated[t.key] = targetState;
    });
    setPermsState(updated);
    setSaveSuccessMsg(null);
  };

  // Quick Preset Handlers
  const handleGrantAll = () => {
    if (!permsState) return;
    const updated: PermissionsRecord = { ...permsState };
    ALL_TABS.forEach((t) => (updated[t.key] = true));
    ALL_WIDGETS.forEach((w) => (updated[w.key] = true));
    updated.canManagePermissions = true;
    setPermsState(updated);
    setCanManageState(true);
    setSaveSuccessMsg(null);
  };

  const handleRevokeAll = () => {
    if (!permsState) return;
    const updated: PermissionsRecord = { ...permsState };
    ALL_TABS.forEach((t) => (updated[t.key] = false));
    ALL_WIDGETS.forEach((w) => (updated[w.key] = false));
    // Keep minimal personal access so user isn't fully locked out
    updated.tabOverview = false;
    updated.tabTimesheets = true;
    updated.tabMileage = true;
    updated.tabMileageManage = false;
    updated.widgetKpiMetrics = false;
    updated.widgetEntityCards = false;
    updated.canManagePermissions = false;
    setPermsState(updated);
    setCanManageState(false);
    setSaveSuccessMsg(null);
  };

  const handleResetToDefault = () => {
    if (!selectedAccount) return;
    const isSuper = selectedAccount.role.toLowerCase() === "superadmin" || selectedAccount.position?.toLowerCase().includes("super administrator");
    const isAdmin = isSuper || selectedAccount.role.toLowerCase() === "admin";

    const updated: PermissionsRecord = {
      isSuperAdmin: Boolean(isSuper),
      canManagePermissions: Boolean(isSuper || isAdmin),
      tabOverview: isAdmin,
      tabSrimatrix: isAdmin,
      tabCandidates: isAdmin,
      tabPipeline: isAdmin,
      tabJob: isAdmin,
      tabMileage: true,
      tabMileageManage: isAdmin,
      tabReviewing: isAdmin,
      tabAccounts: isAdmin,
      tabMail: isAdmin,
      tabCredentials: isAdmin,
      tabSessions: isAdmin,
      tabLogs: isAdmin,
      tabTimesheets: true,
      widgetKpiMetrics: isAdmin,
      widgetEntityCards: isAdmin,
      widgetAnalyticsChart: isAdmin,
      widgetFollowupTicker: true,
      widgetEmailFeed: isAdmin,
    };
    setPermsState(updated);
    setIsSuperAdminState(Boolean(isSuper));
    setCanManageState(Boolean(isSuper || isAdmin));
    setSaveSuccessMsg(null);
  };

  // Save changes to database
  const handleSave = () => {
    if (!selectedAccountId || !permsState) return;

    startTransition(async () => {
      const payload = {
        ...permsState,
        isSuperAdmin: isSuperAdminState,
        canManagePermissions: isSuperAdminState || Boolean(permsState.canManagePermissions) || canManageState,
      };

      const res = await updateAccountPermissionsAction(selectedAccountId, payload);
      if (res.success) {
        setSaveSuccessMsg("Saved");
        loadAccounts(selectedAccountId);
        if (onRefreshParent) onRefreshParent();
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } else {
        showAlert(res.message || "Failed to save permissions.");
      }
    });
  };

  // Filter accounts for the left sidebar / picker
  const filteredAccounts = accounts.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.position && a.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate statistics
  const allowedTabsCount = permsState
    ? ALL_TABS.filter((t) => permsState[t.key]).length
    : 0;
  const allowedWidgetsCount = permsState
    ? ALL_WIDGETS.filter((w) => permsState[w.key]).length
    : 0;

  if (loading && accounts.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-12 bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading Permissions...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-slate-50/70 overflow-hidden">

      {/* ── TOP HEADER BAR: Just "Permissions" as requested ── */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Permissions
          </h1>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {accounts.length} Accounts
        </span>
      </div>

      {/* ── MAIN WORKSPACE (2-COLUMN: Account Directory & Permission Settings) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT COLUMN: Account Directory Selector */}
        <div className="w-72 sm:w-80 border-r border-slate-200/90 bg-white flex flex-col shrink-0 overflow-hidden">

          {/* Account Search */}
          <div className="p-3 border-b border-slate-200/80 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-white rounded-xl text-xs border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium shadow-2xs"
              />
            </div>
          </div>

          {/* Account List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-0.5">
            {filteredAccounts.map((acc) => {
              const isSelected = acc.id === selectedAccountId;
              return (
                <button
                  key={acc.id}
                  onClick={() => selectAccount(acc)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2.5 ${isSelected
                      ? "bg-indigo-50/90 border border-indigo-200/90 shadow-2xs"
                      : "hover:bg-slate-50 border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={getUserAvatar(acc.avatarUrl, acc.gender)}
                        alt={acc.name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      {acc.isSuperAdmin && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white">
                          <Crown className="w-2 h-2" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isSelected ? "text-indigo-950" : "text-slate-900"}`}>
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {acc.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${acc.isSuperAdmin
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : acc.role.toLowerCase() === "admin"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                        >
                          {acc.isSuperAdmin ? "Superadmin" : acc.role}
                        </span>
                        {acc.isCustomized && (
                          <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-indigo-600 translate-x-0.5" : "text-slate-300"
                      }`}
                  />
                </button>
              );
            })}

            {filteredAccounts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching accounts.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Fitted Permission Settings (No Bulky Cards) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">

          {selectedAccount && permsState ? (
            <>
              {/* Selected User Header & Action Controls Bar */}
              <div className="bg-white border-b border-slate-200/90 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                {/* Account Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={getUserAvatar(selectedAccount.avatarUrl, selectedAccount.gender)}
                      alt={selectedAccount.name}
                      className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shadow-2xs"
                    />
                    {isSuperAdminState && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white">
                        <Crown className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {selectedAccount.name}
                      </h2>
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${isSuperAdminState
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : selectedAccount.role.toLowerCase() === "admin"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                      >
                        {isSuperAdminState ? "Superadmin" : selectedAccount.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {selectedAccount.email} • {selectedAccount.position || "Employee"}
                    </p>
                  </div>
                </div>

                {/* Quick Presets & Save Button */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Superadmin Inline Switch */}
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-200/90 bg-amber-50/70 hover:bg-amber-100/70 transition-colors cursor-pointer select-none text-xs text-amber-900 font-semibold">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Superadmin</span>
                    <input
                      type="checkbox"
                      checked={isSuperAdminState}
                      onChange={(e) => {
                        setIsSuperAdminState(e.target.checked);
                        if (e.target.checked) handleGrantAll();
                        setSaveSuccessMsg(null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-600 relative ml-1"></div>
                  </label>

                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                  {/* Preset Buttons */}
                  <button
                    type="button"
                    onClick={handleGrantAll}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Grant All
                  </button>
                  <button
                    type="button"
                    onClick={handleRevokeAll}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Revoke All
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>

                  <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                  {/* Save Action */}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>

                  {saveSuccessMsg && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {saveSuccessMsg}
                    </span>
                  )}
                </div>
              </div>

              {/* ── 2-COLUMN FITTED MATRIX: Tabs on Left, Widgets on Right ── */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* COLUMN 1: NAVIGATION TABS - Grouped with Employee, HR, Administration and their Sub-items */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col overflow-hidden h-fit">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-900">
                        Sidebar Navigation Tabs &amp; Groups
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                      {allowedTabsCount} / {ALL_TABS.length} enabled
                    </span>
                  </div>

                  <div className="p-3 space-y-3.5 bg-slate-50/40">
                    {NAV_GROUPS.map((group) => {
                      const GroupIcon = group.icon;
                      const isExpanded = expandedPermGroups[group.id] !== false;
                      const activeCount = group.tabs.filter((t) => isSuperAdminState || Boolean(permsState?.[t.key])).length;
                      const allGroupActive = activeCount === group.tabs.length;

                      return (
                        <div key={group.id} className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
                          {/* Group Header (Main Tab / Category) */}
                          <div
                            onClick={() => group.isCollapsible && togglePermGroup(group.id)}
                            className={`px-3.5 py-2.5 flex items-center justify-between gap-2.5 select-none transition-colors ${group.isCollapsible ? "cursor-pointer hover:bg-slate-50" : "bg-slate-50/80"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                <GroupIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-slate-900 truncate">
                                    {group.label}
                                  </h4>
                                  {group.isCollapsible && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0 uppercase tracking-wider">
                                      Main Tab
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                                  {group.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Group Active Count Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${allGroupActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : activeCount > 0
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-slate-100 text-slate-500 border border-slate-200"
                                  }`}
                              >
                                {activeCount}/{group.tabs.length}
                              </span>

                              {/* Master Group Toggle Button */}
                              {group.isCollapsible && (
                                <button
                                  type="button"
                                  onClick={(e) => toggleGroupAll(group, e)}
                                  disabled={isSuperAdminState}
                                  title={allGroupActive ? "Turn off all sub-items in group" : "Turn on all sub-items in group"}
                                  className="px-2 py-0.5 text-[10px] font-bold rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {allGroupActive ? "Disable Group" : "Enable Group"}
                                </button>
                              )}

                              {/* Expand / Collapse Chevron */}
                              {group.isCollapsible && (
                                <div className="text-slate-400 p-0.5">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sub-items ("Subfiles" branching out of that main tab) */}
                          {isExpanded && (
                            <div className={`divide-y divide-slate-100 ${group.isCollapsible ? "border-t border-slate-100 bg-slate-50/40" : ""}`}>
                              {group.tabs.map((tab, idx) => {
                                const TabIcon = tab.icon;
                                const isAllowed = isSuperAdminState ? true : Boolean(permsState?.[tab.key]);

                                return (
                                  <div
                                    key={`${tab.key}-${idx}`}
                                    onClick={() => {
                                      if (!isSuperAdminState) togglePermission(tab.key);
                                    }}
                                    className={`px-3.5 py-2 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${group.isCollapsible ? "pl-6 sm:pl-8 border-l-3 border-indigo-300 hover:bg-white" : "hover:bg-slate-50"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isAllowed
                                            ? "bg-white text-indigo-600 border border-indigo-200 shadow-2xs"
                                            : "bg-slate-100 text-slate-400 border border-slate-200"
                                          }`}
                                      >
                                        <TabIcon className="w-3.5 h-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-xs font-semibold truncate ${isAllowed ? "text-slate-900" : "text-slate-500"}`}>
                                            {tab.label}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 truncate max-w-xs sm:max-w-sm">
                                          {tab.description}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Smooth iOS-style Toggle Switch */}
                                    <div className="shrink-0">
                                      <div
                                        className={`w-8 h-4.5 rounded-full transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all shadow-2xs ${isAllowed
                                            ? "bg-indigo-600 after:translate-x-3.5"
                                            : "bg-slate-300"
                                          }`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 2: DASHBOARD WIDGETS & ROLE SUMMARY */}
                <div className="space-y-5 flex flex-col h-fit">

                  {/* Overview Widgets (5 Items - Compact Rows, No Cards) */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-slate-900">
                          Overview Dashboard Widgets
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                        {allowedWidgetsCount} / {ALL_WIDGETS.length} visible
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {ALL_WIDGETS.map((widget) => {
                        const Icon = widget.icon;
                        const isEnabled = isSuperAdminState ? true : Boolean(permsState?.[widget.key]);

                        return (
                          <div
                            key={widget.key}
                            onClick={() => {
                              if (!isSuperAdminState) togglePermission(widget.key);
                            }}
                            className={`px-4 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${isEnabled ? "hover:bg-slate-50/80" : "bg-slate-50/40 hover:bg-slate-100/50 opacity-75"
                              }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isEnabled
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                  }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className={`text-xs font-semibold truncate block ${isEnabled ? "text-slate-900" : "text-slate-500"}`}>
                                  {widget.label}
                                </span>
                                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {widget.description}
                                </p>
                              </div>
                            </div>

                            {/* Smooth iOS-style Toggle Switch */}
                            <div className="shrink-0">
                              <div
                                className={`w-8 h-4.5 rounded-full transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all shadow-2xs ${isEnabled
                                    ? "bg-emerald-600 after:translate-x-3.5"
                                    : "bg-slate-300"
                                  }`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Access Status & Role Summary Callout */}
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">
                      Privileges &amp; Policy Summary
                    </h4>

                    {isSuperAdminState ? (
                      <div className="rounded-xl bg-amber-50/90 border border-amber-200/90 p-3 flex items-start gap-2.5">
                        <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-amber-900 leading-relaxed">
                          <strong>Super Administrator Access Active:</strong> This account has unrestricted global bypass permissions. All 13 tabs and all 5 overview widgets are accessible automatically.
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-[11px] text-slate-600 space-y-1">
                        <p>
                          <strong>Role:</strong> <span className="capitalize font-semibold text-slate-800">{selectedAccount.role}</span>
                        </p>
                        <p>
                          <strong>Active Configuration:</strong> {allowedTabsCount} of 13 tabs and {allowedWidgetsCount} of 5 widgets allowed.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">Select an Account</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Choose an account on the left to configure their permissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
