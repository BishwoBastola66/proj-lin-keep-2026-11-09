"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboardRoleDataAction,
  createAccountByAdminAction,
  revokeSessionAction,
  logoutAction,
  submitTimesheetAction,
  reviewTimesheetAction,
  deleteTimesheetAction,
  deleteAccountAction,
  bulkDeleteAccountsAction,
  bulkCreateAccountsAction,
  getUserDetailsAction,
  updateAccountAction,
  deleteMileageEntryAction,
} from "../actions/auth";
import {
  getCachedDashboardData,
  getCachedDashboardDataSync,
  preloadOverviewCache,
  invalidateOverviewCache,
} from "@/lib/overviewCache";
import WorkforceAnalyticsChart from "@/components/WorkforceAnalyticsChart";
import { showConfirm, showAlert } from "@/components/GlobalPromptDialog";
import CandidatesManagementView from "@/components/CandidatesManagementView";
import PipelineManagementView from "@/components/PipelineManagementView";
import MailManagementView from "@/components/MailManagementView";
import EmployeeTimeEntryView from "@/components/EmployeeTimeEntryView";
import SrimatrixDirectoryView from "@/components/SrimatrixDirectoryView";
import MileageManagementView from "@/components/MileageManagementView";
import FollowupNewsTicker from "@/components/FollowupNewsTicker";
import OverviewEntityCards from "@/components/OverviewEntityCards";
import CredentialsManagementView from "@/components/CredentialsManagementView";
import JobOfferLetterView from "@/components/JobOfferLetterView";
import ProfilePictureUploader from "@/components/ProfilePictureUploader";
import PermissionsManagementView from "@/components/PermissionsManagementView";
import InvoicingManagementView from "@/components/InvoicingManagementView";
import HROnboardingView from "@/components/HROnboardingView";
import HRDocumentsView from "@/components/HRDocumentsView";
import HRImmigrationView from "@/components/HRImmigrationView";
import { getUserAvatar } from "@/lib/avatarHelper";
import {
  Users,
  UserCheck,
  GitBranch,
  Shield,
  Activity,
  Key,
  KeyRound,
  LogOut,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Laptop,
  Mail,
  Phone,
  Briefcase,
  Search,
  Building2,
  User,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X,
  Plus,
  Calendar,
  CalendarDays,
  CheckCheck,
  FileText,
  History,
  Car,
  TrendingUp,
  BarChart3,
  Check,
  XCircle,
  Clock3,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Filter,
  Trash,
  Trash2,
  Loader2,
  ListPlus,
  Upload,
  Eye,
  Pencil,
  GitFork,
  Network,
  MessageSquare,
  Lock,
  Database,
  Receipt,
  FolderOpen,
  Globe,
  Settings,
} from "lucide-react";

export default function UnifiedDashboardPage({ defaultTab }: { defaultTab?: string } = {}) {
  const router = useRouter();
  const initialDashboard = getCachedDashboardDataSync();
  const [data, setData] = useState<any>(() => initialDashboard);
  const [loading, setLoading] = useState(() => !initialDashboard);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (defaultTab) return defaultTab;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) return tab === "application" ? "job" : tab === "settings" ? "overview" : tab;
    }
    if (initialDashboard?.role === "employee" && !initialDashboard?.permissions?.tabOverview) {
      return "timesheets";
    }
    return "overview";
  });
  const [selectedPermissionAccountId, setSelectedPermissionAccountId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"single" | "bulk">("single");
  const [bulkInputMethod, setBulkInputMethod] = useState<"grid" | "paste">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [expandedNavGroups, setExpandedNavGroups] = useState<Record<string, boolean>>({
    employee_group: true,
    hr_group: true,
    admin_group: false,
  });

  const toggleNavGroup = (groupId: string) => {
    setExpandedNavGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };
  const [isPending, startTransition] = useTransition();
  const [formMsg, setFormMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [addAvatarUrl, setAddAvatarUrl] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");

  // Accounts Directory Selection & Actions
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [accountActionMsg, setAccountActionMsg] = useState<{ success: boolean; message: string } | null>(null);

  // Bulk Create State
  const [bulkRows, setBulkRows] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    position: string;
    phone: string;
    password?: string;
  }>>([
    { id: "1", name: "", email: "", role: "employee", position: "Operations Specialist", phone: "", password: "srimatrix123" },
    { id: "2", name: "", email: "", role: "employee", position: "Software Engineer", phone: "", password: "srimatrix123" },
    { id: "3", name: "", email: "", role: "employee", position: "Product Designer", phone: "", password: "srimatrix123" },
  ]);
  const [bulkPasteText, setBulkPasteText] = useState<string>("");

  // User Slide-Over Drawer States (Profile, Logs & Full Time Tracking)
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState<any>(null);
  const [drawerData, setDrawerData] = useState<{
    account: any;
    timesheets: any[];
    logs: any[];
    sessions: any[];
  } | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"overview" | "timesheets" | "logs">("overview");

  // Drawer Edit & Delete States
  const [isDrawerEditing, setIsDrawerEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("employee");
  const [editPosition, setEditPosition] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGender, setEditGender] = useState("male");
  const [editPassword, setEditPassword] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editAvatarData, setEditAvatarData] = useState("");
  const [editMsg, setEditMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfirmingDrawerDelete, setIsConfirmingDrawerDelete] = useState(false);

  // Workday Time Tracking & Employee Selection States
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 10 = October
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [hoursMon, setHoursMon] = useState<number>(8);
  const [hoursTue, setHoursTue] = useState<number>(8);
  const [hoursWed, setHoursWed] = useState<number>(8);
  const [hoursThu, setHoursThu] = useState<number>(8);
  const [hoursFri, setHoursFri] = useState<number>(8);
  const [hoursSat, setHoursSat] = useState<number>(0);
  const [hoursSun, setHoursSun] = useState<number>(0);
  const [project, setProject] = useState<string>("");
  const [timesheetNotes, setTimesheetNotes] = useState<string>("");
  const [timesheetMsg, setTimesheetMsg] = useState<{ success: boolean; message: string } | null>(null);

  // Admin Reviewing Center States
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending" | "approved" | "draft" | "rejected">("all");
  const [reviewNoteInputs, setReviewNoteInputs] = useState<Record<number, string>>({});
  const [reviewActionMsg, setReviewActionMsg] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = async (showFullScreenLoading: boolean = false, forceRefresh: boolean = false) => {
    if (showFullScreenLoading && !data) {
      setLoading(true);
    }
    try {
      const res = await getCachedDashboardData(forceRefresh);
      if (!res || !res.authenticated) {
        router.push("/");
        return;
      }
      setData(res);
    } catch (err) {
      console.error("Dashboard error:", err);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboardData = async () => {
    invalidateOverviewCache("dashboard");
    await loadData(false, true);
  };

  useEffect(() => {
    loadData(true);
    // Warm up all overview caches (clients, candidates, followups, analytics) in parallel
    preloadOverviewCache();
  }, []);

  // Keyboard shortcut: Escape closes slide-over drawer or creation modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedUserForDrawer) setSelectedUserForDrawer(null);
        if (showAddModal) setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUserForDrawer, showAddModal]);

  // Synchronize employee hours inputs when selected Month or Week changes
  useEffect(() => {
    if (!data?.timesheets) return;
    const match = data.timesheets.find(
      (t: any) => t.month === selectedMonth && t.weekNumber === selectedWeek
    );
    if (match) {
      setHoursMon(match.mondayHours);
      setHoursTue(match.tuesdayHours);
      setHoursWed(match.wednesdayHours);
      setHoursThu(match.thursdayHours);
      setHoursFri(match.fridayHours);
      setHoursSat(match.saturdayHours);
      setHoursSun(match.sundayHours);
      setProject(match.project || "");
      setTimesheetNotes(match.notes || "");
    } else {
      // Default standard 40h work week
      setHoursMon(8);
      setHoursTue(8);
      setHoursWed(8);
      setHoursThu(8);
      setHoursFri(8);
      setHoursSat(0);
      setHoursSun(0);
      setProject("");
      setTimesheetNotes("");
    }
  }, [selectedMonth, selectedWeek, data?.timesheets]);

  const handleLogout = async () => {
    await logoutAction();
    router.push("/");
  };

  const handleRevoke = async (id: number) => {
    // Optimistic update in client
    setData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessions: (prev.sessions || []).filter((s: any) => s.id !== id),
        stats: {
          ...prev.stats,
          activeSessions: Math.max(0, (prev.stats?.activeSessions || 1) - 1),
        },
      };
    });
    await revokeSessionAction(id);
    refreshDashboardData();
  };

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createAccountByAdminAction(formData);
      setFormMsg(res);
      if (res.success) {
        form.reset();
        setAddAvatarUrl("");
        setAddName("");
        setAddEmail("");
        setShowAddModal(false);
        refreshDashboardData();
      }
    });
  };

  const handleToggleSelectAccount = (id: number, currentUserId?: number) => {
    if (id === currentUserId) return;
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (currentUserId?: number) => {
    const eligibleIds = filteredAccounts
      .filter((acc: any) => acc.id !== currentUserId)
      .map((acc: any) => acc.id);

    const isAllSelected =
      eligibleIds.length > 0 &&
      eligibleIds.every((id: number) => selectedAccountIds.includes(id));

    if (isAllSelected) {
      setSelectedAccountIds((prev) => prev.filter((id) => !eligibleIds.includes(id)));
    } else {
      setSelectedAccountIds((prev) => Array.from(new Set([...prev, ...eligibleIds])));
    }
  };

  const handleDeleteSingleAccount = async (id: number, name: string) => {
    const confirmed = await showConfirm({
      title: "Delete Account",
      message: `Are you sure you want to delete account "${name}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete Account",
    });
    if (!confirmed) {
      return;
    }
    setAccountActionMsg(null);

    // Optimistically remove from client state immediately
    setData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: (prev.accounts || []).filter((acc: any) => acc.id !== id),
        stats: {
          ...prev.stats,
          totalAccounts: Math.max(0, (prev.stats?.totalAccounts || 1) - 1),
        },
      };
    });
    setSelectedAccountIds((prev) => prev.filter((item) => item !== id));
    setAccountActionMsg({
      success: true,
      message: `Account "${name}" deleted.`,
    });

    startTransition(async () => {
      const res = await deleteAccountAction(id);
      setAccountActionMsg(res);
      refreshDashboardData();
    });
  };

  const handleBulkDelete = async () => {
    if (selectedAccountIds.length === 0) return;
    const confirmed = await showConfirm({
      title: "Bulk Delete Accounts",
      message: `Are you sure you want to delete ${selectedAccountIds.length} accounts in bulk? This will permanently remove their records.`,
      variant: "danger",
      confirmText: `Delete ${selectedAccountIds.length} Accounts`,
    });
    if (!confirmed) {
      return;
    }
    setAccountActionMsg(null);
    const idsToDelete = [...selectedAccountIds];
    const countToDelete = idsToDelete.length;

    // Optimistically remove from client state immediately
    setData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: (prev.accounts || []).filter((acc: any) => !idsToDelete.includes(acc.id)),
        stats: {
          ...prev.stats,
          totalAccounts: Math.max(0, (prev.stats?.totalAccounts || countToDelete) - countToDelete),
        },
      };
    });
    setSelectedAccountIds([]);
    setAccountActionMsg({
      success: true,
      message: `Deleted ${countToDelete} accounts.`,
    });

    startTransition(async () => {
      const res = await bulkDeleteAccountsAction(idsToDelete);
      setAccountActionMsg(res);
      refreshDashboardData();
    });
  };

  const addBulkRow = () => {
    setBulkRows((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        email: "",
        role: "employee",
        position: "",
        phone: "",
        password: "srimatrix123",
      },
    ]);
  };

  const removeBulkRow = (index: number) => {
    setBulkRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateBulkRow = (index: number, field: string, value: string) => {
    setBulkRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleBulkCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    let payload: Array<{
      name: string;
      email: string;
      role?: string;
      position?: string;
      phone?: string;
      password?: string;
    }> = [];

    if (bulkInputMethod === "grid") {
      payload = bulkRows
        .filter((r) => r.name.trim() !== "" && r.email.trim() !== "")
        .map((r) => ({
          name: r.name.trim(),
          email: r.email.trim(),
          role: r.role || "employee",
          position: r.position.trim() || undefined,
          phone: r.phone.trim() || undefined,
          password: r.password?.trim() || "srimatrix123",
        }));

      if (payload.length === 0) {
        setFormMsg({
          success: false,
          message: "Please enter at least one valid row with both Name and Email.",
        });
        return;
      }
    } else {
      const lines = bulkPasteText.split("\n").filter((l) => l.trim().length > 0);
      for (const line of lines) {
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        if (parts.length >= 2) {
          const [name, email, role, position, phone, password] = parts;
          if (name && email) {
            payload.push({
              name,
              email,
              role: role || "employee",
              position: position || undefined,
              phone: phone || undefined,
              password: password || "srimatrix123",
            });
          }
        }
      }

      if (payload.length === 0) {
        setFormMsg({
          success: false,
          message: "No valid rows parsed. Use format: Name, Email, Role, Position, Phone",
        });
        return;
      }
    }

    startTransition(async () => {
      const res = await bulkCreateAccountsAction(payload);
      setFormMsg(res);
      if (res.success) {
        setBulkRows([
          { id: "1", name: "", email: "", role: "employee", position: "", phone: "", password: "srimatrix123" },
          { id: "2", name: "", email: "", role: "employee", position: "", phone: "", password: "srimatrix123" },
        ]);
        setBulkPasteText("");
        setShowAddModal(false);
        refreshDashboardData();
      }
    });
  };

  const handleOpenUserDrawer = async (account: any) => {
    setSelectedUserForDrawer(account);
    setDrawerTab("overview");
    setIsDrawerEditing(false);
    setIsConfirmingDrawerDelete(false);
    setEditMsg(null);
    setEditName(account.name || "");
    setEditEmail(account.email || "");
    setEditRole(account.role || "employee");
    setEditPosition(account.position || "");
    setEditPhone(account.phone || "");
    setEditGender(account.gender || "male");
    setEditPassword("");
    setEditAvatarUrl(account.avatarUrl || "");
    setEditAvatarData("");

    // Instantly populate drawer with client data so it opens without lag
    setDrawerData({
      account,
      timesheets: (data?.timesheets || []).filter((t: any) => t.accountId === account.id),
      logs: (data?.logs || []).filter((l: any) => l.accountId === account.id),
      sessions: (data?.sessions || []).filter((s: any) => s.accountId === account.id),
    });

    try {
      const res = await getUserDetailsAction(account.id);
      if (res && res.success) {
        setDrawerData({
          account: res.account,
          timesheets: res.timesheets || [],
          logs: res.logs || [],
          sessions: res.sessions || [],
        });
      }
    } catch {
      // Keep initial client drawerData
    }
  };

  const handleStartEditFromDrawer = () => {
    const acc = drawerData?.account || selectedUserForDrawer;
    if (!acc) return;
    setEditName(acc.name || "");
    setEditEmail(acc.email || "");
    setEditRole(acc.role || "employee");
    setEditPosition(acc.position || "");
    setEditPhone(acc.phone || "");
    setEditGender(acc.gender || "male");
    setEditPassword("");
    setEditAvatarUrl(acc.avatarUrl || "");
    setEditAvatarData("");
    setEditMsg(null);
    setDrawerTab("overview");
    setIsDrawerEditing(true);
  };

  const handleSaveDrawerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForDrawer) return;
    setEditMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("accountId", selectedUserForDrawer.id.toString());
      formData.append("name", editName);
      formData.append("email", editEmail);
      formData.append("role", editRole);
      formData.append("position", editPosition);
      formData.append("phone", editPhone);
      formData.append("gender", editGender);
      formData.append("avatarUrl", editAvatarUrl);
      if (editAvatarData) {
        formData.append("avatarData", editAvatarData);
      }
      if (editPassword) {
        formData.append("password", editPassword);
      }

      // Optimistic update in client
      const optimisticUpdated = {
        ...selectedUserForDrawer,
        name: editName,
        email: editEmail,
        role: editRole,
        position: editPosition,
        phone: editPhone,
        gender: editGender,
        avatarUrl: editAvatarUrl,
      };
      setSelectedUserForDrawer(optimisticUpdated);
      setDrawerData((prev: any) =>
        prev ? { ...prev, account: optimisticUpdated } : null
      );
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          accounts: (prev.accounts || []).map((a: any) =>
            a.id === selectedUserForDrawer.id ? { ...a, ...optimisticUpdated } : a
          ),
        };
      });
      setIsDrawerEditing(false);

      const res = await updateAccountAction(formData);
      if (res.success && res.account) {
        setEditMsg({ success: true, message: res.message });
        refreshDashboardData();
      } else {
        setEditMsg({ success: false, message: res.message || "Failed to update account." });
        refreshDashboardData();
      }
    });
  };

  const handleDeleteFromDrawer = async () => {
    if (!selectedUserForDrawer) return;
    if (selectedUserForDrawer.id === user.accountId) {
      showAlert({
        title: "Action Prohibited",
        message: "You cannot delete your own active admin account.",
        variant: "warning",
      });
      return;
    }
    const accId = selectedUserForDrawer.id;
    const accName = selectedUserForDrawer.name;
    setSelectedUserForDrawer(null);
    setIsConfirmingDrawerDelete(false);

    // Optimistically remove from client state immediately
    setData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        accounts: (prev.accounts || []).filter((acc: any) => acc.id !== accId),
        stats: {
          ...prev.stats,
          totalAccounts: Math.max(0, (prev.stats?.totalAccounts || 1) - 1),
        },
      };
    });
    setAccountActionMsg({ success: true, message: `Account "${accName}" deleted.` });

    startTransition(async () => {
      const res = await deleteAccountAction(accId);
      if (res.success) {
        setAccountActionMsg({ success: true, message: res.message });
        refreshDashboardData();
      } else {
        showAlert({
          title: "Action Failed",
          message: res.message,
          variant: "danger",
        });
        refreshDashboardData();
      }
    });
  };

  const getWeekPeriodLabel = (month: number, week: number): string => {
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = monthNames[month] || "Oct";
    if (week === 1) return `${m} 01 - ${m} 07, 2026`;
    if (week === 2) return `${m} 08 - ${m} 14, 2026`;
    if (week === 3) return `${m} 15 - ${m} 21, 2026`;
    if (week === 4) return `${m} 22 - ${m} 28, 2026`;
    return `${m} 29 - End of Month, 2026`;
  };

  const totalWeeklyHours = hoursMon + hoursTue + hoursWed + hoursThu + hoursFri + hoursSat + hoursSun;

  const currentSelectedTimesheet = data?.timesheets?.find(
    (t: any) => t.month === selectedMonth && t.weekNumber === selectedWeek
  );

  const handleTimesheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimesheetMsg(null);
    const formData = new FormData();
    formData.append("year", "2026");
    formData.append("month", selectedMonth.toString());
    formData.append("weekNumber", selectedWeek.toString());
    formData.append("periodLabel", getWeekPeriodLabel(selectedMonth, selectedWeek));
    formData.append("project", "");
    formData.append("mondayHours", hoursMon.toString());
    formData.append("tuesdayHours", hoursTue.toString());
    formData.append("wednesdayHours", hoursWed.toString());
    formData.append("thursdayHours", hoursThu.toString());
    formData.append("fridayHours", hoursFri.toString());
    formData.append("saturdayHours", hoursSat.toString());
    formData.append("sundayHours", hoursSun.toString());
    formData.append("notes", timesheetNotes);

    startTransition(async () => {
      const res = await submitTimesheetAction(formData);
      setTimesheetMsg(res);
      if (res.success) {
        invalidateOverviewCache("analytics");
        refreshDashboardData();
      }
    });
  };

  const handleReviewTimesheet = (
    timesheetId: number,
    status: "approved" | "rejected" | "draft" | "submitted"
  ) => {
    setReviewActionMsg(null);
    const approverPosition = user?.position?.trim() || (user?.role === "admin" ? "Super Administrator" : "Reviewer");
    const defaultNote =
      status === "approved"
        ? `Approved by ${approverPosition}`
        : status === "rejected"
          ? "Returned for corrections"
          : status === "draft"
            ? `Moved to Draft by ${approverPosition}`
            : "Pending Review";
    const note = reviewNoteInputs[timesheetId] || defaultNote;
    const formData = new FormData();
    formData.append("timesheetId", timesheetId.toString());
    formData.append("status", status);
    formData.append("reviewNote", note);

    // Optimistically update the timesheet in client state immediately!
    setData((prev: any) => {
      if (!prev) return prev;
      const updatedTimesheets = (prev.timesheets || []).map((t: any) => {
        if (t.id === timesheetId) {
          return {
            ...t,
            status,
            reviewNote: note,
            reviewedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      return {
        ...prev,
        timesheets: updatedTimesheets,
        stats: {
          ...prev.stats,
          pendingReviews: updatedTimesheets.filter((t: any) => t.status === "submitted").length,
        },
      };
    });

    const displayStatus = status === "submitted" ? "Pending" : status.charAt(0).toUpperCase() + status.slice(1);
    setReviewActionMsg({
      success: true,
      message: `Timesheet #${timesheetId} marked as ${displayStatus}.`,
    });

    startTransition(async () => {
      const res = await reviewTimesheetAction(formData);
      setReviewActionMsg(res);
      invalidateOverviewCache("analytics");
      refreshDashboardData();
    });
  };

  const [deletingTimesheetId, setDeletingTimesheetId] = useState<number | null>(null);
  const [deletingMileageId, setDeletingMileageId] = useState<number | null>(null);

  const handleDeleteTimesheet = async (timesheetId: number, periodLabel: string) => {
    if (data?.role !== "admin") {
      const target = (data?.timesheets || []).find((t: any) => t.id === timesheetId);
      if (target && target.status !== "rejected") {
        alert("Only rejected timesheets can be deleted.");
        return;
      }
    }
    if (!window.confirm(`Are you sure you want to delete the timesheet for ${periodLabel}?`)) return;
    setDeletingTimesheetId(timesheetId);
    try {
      const res = await deleteTimesheetAction(timesheetId);
      if (res.success) {
        invalidateOverviewCache("analytics");
        await refreshDashboardData();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete timesheet.");
    } finally {
      setDeletingTimesheetId(null);
    }
  };

  const handleDeleteMileage = async (id: number, desc: string, dist: string) => {
    if (!window.confirm(`Delete mileage record of ${parseFloat(dist).toFixed(1)} miles (${desc})?`)) return;
    setDeletingMileageId(id);
    try {
      const res = await deleteMileageEntryAction(id);
      if (res.success) {
        await refreshDashboardData();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete mileage entry.");
    } finally {
      setDeletingMileageId(null);
    }
  };

  const role = data?.role;
  const user = data?.user;
  const isSuperAdmin = data?.isSuperAdmin;
  const permissions = data?.permissions;
  const isSuper = Boolean(
    isSuperAdmin ||
    role === "superadmin" ||
    user?.position?.toLowerCase().includes("super administrator") ||
    permissions?.isSuperAdmin
  );
  const isAdmin = isSuper || role === "admin";
  const canManagePerms = isSuper || permissions?.canManagePermissions || isAdmin;

  // Master Navigation Items with boolean permission mappings & dropdown grouping
  const masterNav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, permKey: "tabOverview" },
    { id: "srimatrix", label: "SriMatrix", icon: Building2, permKey: "tabSrimatrix" },
    { id: "pipeline", label: "Client", icon: Database, permKey: "tabPipeline" },
    { id: "candidates", label: "Candidates", icon: UserCheck, badge: data?.stats?.totalCandidates, permKey: "tabCandidates" },
    {
      id: "employee_group",
      label: "Employee",
      icon: Users,
      isGroup: true,
      children: [
        { id: "timesheets", label: "Timesheet", icon: Calendar, permKey: "tabTimesheets" },
        { id: "timesheetHistory", label: "Timesheet History", icon: History, badge: data?.timesheets?.length, permKey: "tabTimesheets" },
        { id: "reviewing", label: "Timesheet Manage", icon: CheckCheck, badge: data?.stats?.pendingReviews, permKey: "tabReviewing" },
        { id: "mileage", label: "Mileage", icon: Car, badge: data?.mileage?.length, permKey: "tabMileage" },
        { id: "mileageManage", label: "Mileage Manage", icon: Car, permKey: "tabMileageManage" },
        { id: "accounts", label: "Accounts", icon: Users, badge: data?.stats?.totalAccounts, permKey: "tabAccounts" },
      ],
    },
    { id: "invoicing", label: "Invoicing", icon: Receipt, permKey: "tabAccounts" },
    {
      id: "hr_group",
      label: "Human Resource",
      icon: Briefcase,
      isGroup: true,
      children: [
        { id: "job", label: "Offer letter", icon: FileText, permKey: "tabJob" },
        { id: "onboarding", label: "Onboarding", icon: UserCheck, permKey: "tabJob" },
        { id: "documents", label: "Documents", icon: FolderOpen, permKey: "tabJob" },
        { id: "immigration", label: "Immigration", icon: Globe, permKey: "tabJob" },
      ],
    },
    { id: "permissions", label: "Permissions", icon: ShieldCheck, permKey: "canManagePermissions" },
    {
      id: "admin_group",
      label: "Administration",
      icon: ShieldCheck,
      isGroup: true,
      adminOnly: true,
      children: [
        { id: "mail", label: "Mail", icon: Mail, badge: 2, permKey: "tabMail" },
        { id: "credentials", label: "Email Key", icon: KeyRound, permKey: "tabCredentials" },
        { id: "sessions", label: "Sessions", icon: Key, badge: data?.stats?.activeSessions, permKey: "tabSessions" },
        { id: "logs", label: "Audit Logs", icon: Activity, badge: data?.stats?.totalLogs, permKey: "tabLogs" },
      ],
    },
  ];

  // Employee Nav Items - Workday ESS Style for pure employee without custom DB permissions
  const employeeNav = [
    {
      id: "employee_group",
      label: "Employee",
      icon: Users,
      isGroup: true,
      children: [
        { id: "timesheets", label: "Timesheet", icon: Calendar, permKey: "tabTimesheets" },
        { id: "timesheetHistory", label: "Timesheet History", icon: History, badge: data?.timesheets?.length, permKey: "tabTimesheets" },
        { id: "mileage", label: "Mileage", icon: Car, badge: data?.mileage?.length, permKey: "tabMileage" },
      ],
    },
  ];

  // Superadmin has UNRESTRICTED global access to everything!
  // Otherwise, filter dynamically by database boolean permissions
  const currentNav = isSuper
    ? masterNav
    : permissions
      ? (masterNav
        .map((item) => {
          if (item.isGroup) {
            const filteredChildren = (item.children || []).filter((child: any) => {
              if (child.id === "permissions") return canManagePerms;
              if (child.id === "invoicing") return isAdmin || Boolean(permissions.tabAccounts);
              if (child.id === "onboarding" || child.id === "documents" || child.id === "immigration") {
                return isAdmin || Boolean(permissions.tabJob);
              }
              return Boolean((permissions as any)[child.permKey]);
            });
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
          }

          if (item.id === "permissions") {
            return canManagePerms ? item : null;
          }
          if (item.id === "invoicing") {
            return (isAdmin || Boolean(permissions.tabAccounts)) ? item : null;
          }

          const hasPerm = item.permKey ? Boolean((permissions as any)[item.permKey]) : true;
          if (!hasPerm) return null;

          if (
            item.id === "overview" &&
            !isAdmin &&
            !permissions.widgetKpiMetrics &&
            !permissions.widgetEntityCards &&
            !permissions.widgetAnalyticsChart
          ) {
            return { ...item, label: "Enter Time", icon: CalendarDays };
          }
          return item;
        })
        .filter(Boolean) as typeof masterNav)
      : isAdmin
        ? masterNav
        : employeeNav;

  const hasAccess = (tabId: string) => {
    if (tabId === "settings") return false;
    if (isSuper) return true;
    if (tabId === "devices" || tabId === "activity") return true;
    if (tabId === "invoicing") return isAdmin || Boolean(permissions?.tabAccounts);
    if (tabId === "onboarding" || tabId === "documents" || tabId === "immigration") {
      return isAdmin || Boolean(permissions?.tabJob);
    }
    if (tabId === "timesheetHistory" || tabId === "timesheets") {
      return isSuper || isAdmin || Boolean(permissions?.tabTimesheets);
    }
    if (tabId === "permissions") {
      return canManagePerms;
    }
    for (const item of currentNav) {
      if (item.id === tabId) return true;
      if (item.children) {
        if (item.children.some((c: any) => c.id === tabId)) return true;
      }
    }
    return false;
  };

  const firstAccessibleTabId = (() => {
    for (const item of currentNav) {
      if (!item.isGroup) {
        return item.id;
      }
      if (item.children && item.children.length > 0) {
        return item.children[0].id;
      }
    }
    return "timesheets";
  })();

  const hasWorkforceOverview = isSuper || isAdmin || Boolean(
    permissions?.widgetKpiMetrics ||
    permissions?.widgetEntityCards ||
    permissions?.widgetAnalyticsChart
  );

  useEffect(() => {
    if (data && currentNav.length > 0) {
      const isAllowed = hasAccess(activeTab);
      if (!isAllowed) {
        setActiveTab(firstAccessibleTabId);
      }
    }
  }, [data, currentNav, activeTab]);

  useEffect(() => {
    if (["timesheets", "timesheetHistory", "reviewing", "mileage", "mileageManage", "accounts"].includes(activeTab)) {
      setExpandedNavGroups((prev) => ({ ...prev, employee_group: true }));
    } else if (["job", "onboarding", "documents", "immigration"].includes(activeTab)) {
      setExpandedNavGroups((prev) => ({ ...prev, hr_group: true }));
    } else if (["permissions", "mail", "credentials", "sessions", "logs"].includes(activeTab)) {
      setExpandedNavGroups((prev) => ({ ...prev, admin_group: true }));
    }
  }, [activeTab]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center justify-center animate-pulse">
          <img
            src="/srimatrix-health-logo.png"
            alt="SriMatrix Logo"
            className="h-20 sm:h-24 md:h-28 w-auto max-w-[280px] sm:max-w-[340px] object-contain select-none drop-shadow-xs"
          />
        </div>
      </div>
    );
  }

  if (!data || !data.authenticated) {
    return null;
  }

  const filteredAccounts = (data?.accounts || []).filter((acc: any) =>
    acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (acc.position && acc.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden print:h-auto print:overflow-visible print:bg-white">

      {/* Top Navbar - Minimal, Modern & Clean */}
      <header className="w-full bg-white/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 h-16 relative z-30 border-b border-slate-200/70 select-none shrink-0 print:hidden flex items-center">
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Toggle Sidebar"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* SriMatrix Logo */}
            <img
              src="/srimatrix-health-logo.png"
              alt="SriMatrix Logo"
              className="h-8 sm:h-9 md:h-10 w-auto max-h-8 sm:max-h-10 object-contain select-none transition-opacity hover:opacity-90 shrink-0"
            />
          </div>

          {/* Minimal Profile Button with Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:pl-3 sm:pr-2 sm:py-1.5 rounded-full hover:bg-slate-100/80 border border-transparent hover:border-slate-200/70 transition-all cursor-pointer group focus:outline-none"
              aria-label="User Profile Menu"
              aria-expanded={profileDropdownOpen}
            >
              {/* User Name & Position */}
              <div className="hidden sm:flex flex-col text-right leading-tight max-w-[120px] md:max-w-[180px] lg:max-w-none">
                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {user.name || "User"}
                </span>
                <span className="text-[11px] font-medium text-slate-400 truncate">
                  {user.position || (user.role === "admin" ? "Super Administrator" : "Employee")}
                </span>
              </div>

              {/* Avatar with Status Dot */}
              <div className="relative shrink-0">
                <img
                  src={getUserAvatar(user.avatarUrl, user.gender)}
                  alt={user.name || "Avatar"}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-indigo-500/20 border border-white shrink-0 shadow-xs"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${profileDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Click-outside backdrop */}
            {profileDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
            )}

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl shadow-indigo-950/10 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info inside dropdown */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="relative shrink-0">
                    <img
                      src={getUserAvatar(user.avatarUrl, user.gender)}
                      alt={user.name || "Avatar"}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/25 shadow-xs"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        {user.role}
                      </span>
                      {user.gender && (
                        <span className="inline-block text-[9px] capitalize font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {user.gender}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="my-1.5 border-t border-slate-100" />



                {/* Sign Out Action Button */}
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Layout with Sidebar */}
      <div className="flex-1 flex w-full relative z-10 min-h-0 overflow-hidden print:h-auto print:overflow-visible print:block">

        {/* Backdrop for Mobile Sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 md:hidden print:hidden"
          />
        )}

        {/* Sidebar - Permanently docked on md+ screens with visible right border */}
        <aside
          className={`fixed md:static inset-y-0 left-0 h-full w-64 sm:w-68 bg-slate-50/70 backdrop-blur-md p-3.5 sm:p-4 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out border-r border-slate-200/80 shrink-0 overflow-y-auto overscroll-none print:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            }`}
        >
          <div className="space-y-3">

            {/* Mobile Sidebar Brand Header */}
            <div className="flex items-center justify-between md:hidden pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <img
                  src="/srimatrix-health-logo.png"
                  alt="SriMatrix Logo"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation Menu */}
            <div className="space-y-1">
              {currentNav.map((item: any) => {
                const Icon = item.icon;

                // Case A: Grouped Dropdown Navigation Item (Employee, HR, Administration)
                if (item.isGroup) {
                  const isExpanded = !!expandedNavGroups[item.id];
                  const hasActiveChild = (item.children || []).some((c: any) => c.id === activeTab);

                  return (
                    <div key={item.id} className="space-y-1 pt-0.5">
                      {/* Group Header Button (Dropdown Toggle) */}
                      <button
                        type="button"
                        onClick={() => toggleNavGroup(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer group select-none ${hasActiveChild
                            ? "bg-slate-200/70 text-slate-900 font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon
                            className={`w-5 h-5 shrink-0 transition-colors ${hasActiveChild
                                ? "text-indigo-600"
                                : "text-slate-400 group-hover:text-slate-600"
                              }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item.badge !== undefined && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-200 text-slate-600 font-semibold">
                              {item.badge}
                            </span>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-0 text-slate-600" : "-rotate-90"
                              }`}
                          />
                        </div>
                      </button>

                      {/* Group Children (Dropdown Sub-items) */}
                      {isExpanded && (
                        <div className="pl-3.5 pr-0.5 py-1 space-y-1 border-l-2 border-slate-200 ml-4.5 my-1">
                          {(item.children || []).map((child: any) => {
                            const ChildIcon = child.icon;
                            const isChildActive = activeTab === child.id;
                            return (
                              <button
                                key={child.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(child.id);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer group ${isChildActive
                                    ? "bg-white text-indigo-700 font-bold shadow-2xs border border-indigo-200/70"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {ChildIcon && (
                                    <ChildIcon
                                      className={`w-4 h-4 shrink-0 transition-colors ${isChildActive
                                          ? "text-indigo-600"
                                          : "text-slate-400 group-hover:text-slate-600"
                                        }`}
                                    />
                                  )}
                                  <span className="truncate">{child.label}</span>
                                </div>
                                {child.badge !== undefined && (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono transition-colors shrink-0 ml-1.5 ${isChildActive
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold"
                                        : "bg-slate-200/70 text-slate-600 font-medium"
                                      }`}
                                  >
                                    {child.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Case B: Single Top-level Navigation Item (Overview, SriMatrix, Client Database, Candidates, Invoicing)
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-all cursor-pointer group ${isActive
                        ? "bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/90"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${isActive
                            ? "text-indigo-600"
                            : "text-slate-400 group-hover:text-slate-600"
                          }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-mono transition-colors shrink-0 ml-2 ${isActive
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold"
                            : "bg-slate-200/70 text-slate-600 group-hover:bg-slate-200 font-medium"
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Area Container with Top Fitted News Ticker */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible print:block">
          {/* Top Edge-to-Edge Follow-up News Ticker Fitted in Top (White Color) */}
          {hasWorkforceOverview && activeTab === "overview" && (isSuper || permissions?.widgetFollowupTicker !== false) && (
            <div className="print:hidden">
              <FollowupNewsTicker onNavigateToPipeline={() => {
                if (hasAccess("pipeline")) setActiveTab("pipeline");
              }} />
            </div>
          )}

          {/* Main Content Area - Full width filling the screen */}
          <main className={`flex-1 min-h-0 min-w-0 ${(!hasWorkforceOverview && activeTab === "overview") || activeTab === "accounts" || activeTab === "permissions" || activeTab === "settings" || activeTab === "members" || activeTab === "srimatrix" || activeTab === "candidates" || activeTab === "pipeline" || activeTab === "job" || activeTab === "mileage" || activeTab === "mileageManage" || activeTab === "mail" || activeTab === "credentials" || activeTab === "timesheets" || activeTab === "timesheetHistory" || activeTab === "reviewing" || activeTab === "invoicing" || activeTab === "onboarding" || activeTab === "documents" || activeTab === "immigration" ? "h-full p-0 bg-white overflow-hidden" : "p-4 sm:p-6 lg:p-8 overflow-y-auto"} print:h-auto print:overflow-visible print:p-0 print:m-0`}>
            <div className={`w-full ${(!hasWorkforceOverview && activeTab === "overview") || activeTab === "accounts" || activeTab === "permissions" || activeTab === "settings" || activeTab === "members" || activeTab === "srimatrix" || activeTab === "candidates" || activeTab === "pipeline" || activeTab === "job" || activeTab === "mileage" || activeTab === "mileageManage" || activeTab === "mail" || activeTab === "credentials" || activeTab === "timesheets" || activeTab === "timesheetHistory" || activeTab === "reviewing" || activeTab === "invoicing" || activeTab === "onboarding" || activeTab === "documents" || activeTab === "immigration" ? "h-full flex flex-col" : "space-y-6 pb-12"} print:h-auto print:overflow-visible print:block`}>


              {/* Overview View - Executive & Workforce Analytics */}
              {activeTab === "overview" && hasAccess("overview") && hasWorkforceOverview && (
                <div className="space-y-6">
                  {/* Metric KPI Cards */}
                  {(isSuper || permissions?.widgetKpiMetrics !== false) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div
                        onClick={() => setActiveTab("accounts")}
                        className="bg-white/85 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Total Accounts
                          </span>
                          <div className="text-3xl font-black text-slate-900 mt-1">
                            {data.stats.totalAccounts}
                          </div>
                          <span className="text-xs text-indigo-600 font-semibold">View Directory &rarr;</span>
                        </div>
                        <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("sessions")}
                        className="bg-white/85 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Active Sessions
                          </span>
                          <div className="text-3xl font-black text-emerald-600 mt-1">
                            {data.stats.activeSessions}
                          </div>
                          <span className="text-xs text-emerald-600 font-semibold">Inspect Tokens &rarr;</span>
                        </div>
                        <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <Key className="w-6 h-6" />
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("reviewing")}
                        className="bg-white/85 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 transition-all"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Pending Approvals
                          </span>
                          <div className="text-3xl font-black text-amber-600 mt-1">
                            {data.stats.pendingReviews || 0}
                          </div>
                          <span className="text-xs text-amber-600 font-semibold">Review Timesheets &rarr;</span>
                        </div>
                        <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                          <CheckCheck className="w-6 h-6" />
                        </div>
                      </div>

                      <div
                        onClick={() => setActiveTab("logs")}
                        className="bg-white/85 backdrop-blur-md rounded-3xl p-6 border border-slate-200/90 shadow-xs flex items-center justify-between cursor-pointer hover:border-purple-300 transition-all"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Workforce Logged
                          </span>
                          <div className="text-3xl font-black text-purple-600 mt-1">
                            {data.stats.totalWorkforceHours || 0} hrs
                          </div>
                          <span className="text-xs text-purple-600 font-semibold">Security &amp; Audit &rarr;</span>
                        </div>
                        <div className="w-13 h-13 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                          <Clock className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Overview 3-Box Directory: Employees, Clients, and Candidates (Follow-ups prioritized at top) */}
                  {(isSuper || permissions?.widgetEntityCards !== false) && (
                    <OverviewEntityCards
                      accounts={data.accounts}
                      onNavigateTab={(tab) => setActiveTab(tab)}
                    />
                  )}

                  {/* Interactive Workforce Analytics Graph with Timeframe Selection (At the bottom of Overview) */}
                  {(isSuper || permissions?.widgetAnalyticsChart !== false) && (
                    <WorkforceAnalyticsChart />
                  )}
                </div>
              )}

              {/* Admin Timesheet Approvals / Reviewing Center - Edge-to-Edge, Zero Containers, Zero Gaps */}
              {activeTab === "reviewing" && hasAccess("reviewing") && (
                <div className="w-full h-full flex flex-col bg-white overflow-hidden">
                  {/* Sticky Top Header & Filter Bar */}
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                        <CheckCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                          Timesheet Review &amp; Approval Queue
                        </h3>
                        <p className="text-xs text-slate-500">
                          Workday manager authority &bull; Verify employee weekly hours, project logs, and approve for payroll
                        </p>
                      </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto flex-wrap gap-1">
                      {(
                        [
                          { key: "all", label: `All (${data.timesheets?.length || 0})` },
                          {
                            key: "pending",
                            label: `Pending (${data.timesheets?.filter((t: any) => t.status === "submitted").length || 0})`,
                          },
                          {
                            key: "approved",
                            label: `Approved (${data.timesheets?.filter((t: any) => t.status === "approved").length || 0})`,
                          },
                          {
                            key: "draft",
                            label: `Draft (${data.timesheets?.filter((t: any) => t.status === "draft").length || 0})`,
                          },
                          {
                            key: "rejected",
                            label: `Rejected (${data.timesheets?.filter((t: any) => t.status === "rejected").length || 0})`,
                          },
                        ] as const
                      ).map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setReviewFilter(f.key as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${reviewFilter === f.key
                              ? "bg-white text-indigo-600 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Action Message Banner */}
                  {reviewActionMsg && (
                    <div
                      className={`px-6 sm:px-8 py-2.5 text-xs font-semibold flex items-center gap-2.5 border-b shrink-0 ${reviewActionMsg.success
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                    >
                      {reviewActionMsg.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                      )}
                      {reviewActionMsg.message}
                    </div>
                  )}

                  {/* Edge-to-Edge Timesheets List - Zero Gap Containers */}
                  <div className="flex-1 w-full overflow-y-auto divide-y divide-slate-100 bg-white">
                    {(() => {
                      const allTs = data.timesheets || [];
                      const filtered = allTs
                        .filter((ts: any) => {
                          if (reviewFilter === "pending") return ts.status === "submitted";
                          if (reviewFilter === "approved") return ts.status === "approved";
                          if (reviewFilter === "draft") return ts.status === "draft";
                          if (reviewFilter === "rejected") return ts.status === "rejected";
                          return true;
                        })
                        .sort((a: any, b: any) => {
                          const dateA = new Date(a.createdAt || 0).getTime();
                          const dateB = new Date(b.createdAt || 0).getTime();
                          if (dateA !== dateB) return dateB - dateA;
                          return (b.id || 0) - (a.id || 0);
                        });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-24 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h4 className="font-bold text-slate-800">Queue is Clear</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              No timesheets currently match the &ldquo;{reviewFilter}&rdquo; status.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="divide-y divide-slate-100">
                          {filtered.map((ts: any) => (
                            <div
                              key={ts.id}
                              className="p-6 sm:p-8 space-y-4 hover:bg-slate-50/40 transition-colors w-full"
                            >
                              {/* Row Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                  {(() => {
                                    const acc = (data?.accounts || []).find((a: any) => a.id === ts.accountId);
                                    return (
                                      <img
                                        src={getUserAvatar(acc?.avatarUrl, acc?.gender)}
                                        alt={ts.accountName || "Avatar"}
                                        className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0 shadow-xs"
                                      />
                                    );
                                  })()}
                                  <div>
                                    <h4 className="font-bold text-base text-slate-900">{ts.accountName}</h4>
                                    <p className="text-xs text-slate-500 font-mono">
                                      {ts.accountEmail} &bull; {ts.accountPosition || "Staff Member"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                    {ts.periodLabel}
                                  </span>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${ts.status === "approved"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : ts.status === "rejected"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : ts.status === "draft"
                                            ? "bg-slate-100 text-slate-700 border-slate-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                      }`}
                                  >
                                    {ts.status === "submitted" ? "Pending Review" : ts.status}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteTimesheet(ts.id, ts.periodLabel)}
                                    disabled={deletingTimesheetId === ts.id}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete timesheet"
                                  >
                                    {deletingTimesheetId === ts.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Breakdown of days and hours */}
                              <div className="space-y-3">

                                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                                  {[
                                    { day: "Mon", hrs: ts.mondayHours },
                                    { day: "Tue", hrs: ts.tuesdayHours },
                                    { day: "Wed", hrs: ts.wednesdayHours },
                                    { day: "Thu", hrs: ts.thursdayHours },
                                    { day: "Fri", hrs: ts.fridayHours },
                                    { day: "Sat", hrs: ts.saturdayHours },
                                    { day: "Sun", hrs: ts.sundayHours },
                                  ].map((d, i) => (
                                    <div
                                      key={i}
                                      className={`p-2.5 rounded-2xl border ${d.hrs > 0
                                          ? "bg-indigo-50/50 border-indigo-100/80 text-slate-900"
                                          : "bg-slate-50/60 border-slate-200/50 text-slate-400"
                                        }`}
                                    >
                                      <div className="font-semibold text-[11px] text-slate-500">{d.day}</div>
                                      <div className="font-black text-sm mt-0.5">{d.hrs}h</div>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between pt-1 text-xs">
                                  <span className="text-slate-500 italic">
                                    {ts.notes ? `Employee Note: "${ts.notes}"` : "No notes attached."}
                                  </span>
                                  <span className="font-black text-slate-900 text-sm">
                                    Total Output: <span className="text-indigo-600">{ts.totalHours} hrs</span>
                                  </span>
                                </div>
                              </div>

                              {/* Manager Decision Section */}
                              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                {ts.reviewedAt && (
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>
                                      Reviewed on {new Date(ts.reviewedAt).toLocaleDateString()}
                                      {ts.reviewNote ? ` • Note: "${ts.reviewNote}"` : ""}
                                    </span>
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <input
                                    type="text"
                                    placeholder="Review feedback note (e.g. Approved. Solid sprint completion.)..."
                                    value={reviewNoteInputs[ts.id] ?? (ts.reviewNote || "")}
                                    onChange={(e) =>
                                      setReviewNoteInputs({
                                        ...reviewNoteInputs,
                                        [ts.id]: e.target.value,
                                      })
                                    }
                                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-600 focus:outline-none"
                                  />

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Approve Button */}
                                    <button
                                      onClick={() => handleReviewTimesheet(ts.id, "approved")}
                                      disabled={isPending || ts.status === "approved"}
                                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${ts.status === "approved"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20"
                                        }`}
                                      title="Approve timesheet"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>

                                    {/* Pending Button */}
                                    <button
                                      onClick={() => handleReviewTimesheet(ts.id, "submitted")}
                                      disabled={isPending || ts.status === "submitted"}
                                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${ts.status === "submitted"
                                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                                          : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                                        }`}
                                      title="Mark as Pending / Awaiting Review"
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>Pending</span>
                                    </button>

                                    {/* Draft Button */}
                                    <button
                                      onClick={() => handleReviewTimesheet(ts.id, "draft")}
                                      disabled={isPending || ts.status === "draft"}
                                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${ts.status === "draft"
                                          ? "bg-slate-200 text-slate-800 border border-slate-300"
                                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                        }`}
                                      title="Move to Draft"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Draft</span>
                                    </button>

                                    {/* Reject Button */}
                                    <button
                                      onClick={() => handleReviewTimesheet(ts.id, "rejected")}
                                      disabled={isPending || ts.status === "rejected"}
                                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${ts.status === "rejected"
                                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                                          : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                                        }`}
                                      title="Reject timesheet"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Accounts Directory Tab - User & Employee Directory */}
              {activeTab === "accounts" && hasAccess("accounts") && (
                <div className="w-full h-full flex flex-col bg-white overflow-y-auto">

                  {/* Top sub-navbar inside content area */}
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-black text-lg text-slate-900 tracking-tight">
                            User & Employee Directory
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            {filteredAccounts.length} {filteredAccounts.length === 1 ? "Account" : "Accounts"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Manage organization members, employee roles, and credentials
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Search box */}
                      <div className="relative w-full sm:w-60">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search name, email, role..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 bg-slate-50/70"
                        />
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* Add Employee Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setModalMode("single");
                              setFormMsg(null);
                              setShowAddModal(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Employee</span>
                          </button>

                          {/* Bulk Create Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setModalMode("bulk");
                              setFormMsg(null);
                              setShowAddModal(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer"
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                            <span>Bulk Create</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Feedback Message Banner */}
                  {accountActionMsg && (
                    <div
                      className={`mx-6 sm:mx-8 mt-4 p-3 rounded-2xl text-xs flex items-center justify-between gap-2 ${accountActionMsg.success
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {accountActionMsg.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        )}
                        <span className="font-semibold">{accountActionMsg.message}</span>
                      </div>
                      <button
                        onClick={() => setAccountActionMsg(null)}
                        className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Bulk Selection Actions Bar - Persistent toolbar */}
                  <div
                    className={`border-b px-6 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors duration-150 ${selectedAccountIds.length > 0
                        ? "bg-indigo-50/90 border-indigo-100"
                        : "bg-slate-50/70 border-slate-200/80"
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${selectedAccountIds.length > 0
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-600 font-mono"
                          }`}
                      >
                        {selectedAccountIds.length}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold ${selectedAccountIds.length > 0 ? "text-indigo-950" : "text-slate-600"
                          }`}
                      >
                        {selectedAccountIds.length === 0
                          ? "No accounts selected"
                          : `${selectedAccountIds.length} ${selectedAccountIds.length === 1 ? "account" : "accounts"
                          } selected`}
                      </span>
                      <span className="hidden md:inline text-xs text-slate-400">
                        {selectedAccountIds.length === 0
                          ? "— Select checkboxes below to manage or delete in bulk"
                          : "— Ready for batch deletion"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedAccountIds.length === 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectAll(user.accountId)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Select All (
                            {filteredAccounts.filter((a: any) => a.id !== user.accountId).length}
                            )
                          </button>
                          <button
                            type="button"
                            disabled
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold opacity-60 cursor-not-allowed"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span>Delete Selected</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setSelectedAccountIds([])}
                            className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            Deselect All
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span>Delete Selected ({selectedAccountIds.length})</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Down Details: Full-width open accounts table */}
                  <div className="flex-1 w-full overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm min-w-[850px]">
                      <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold sticky top-0">
                        <tr>
                          {isAdmin && (
                            <th className="py-3.5 px-6 w-12 text-center">
                              {(() => {
                                const eligible = filteredAccounts.filter((a: any) => a.id !== user.accountId);
                                const isAllSelected = eligible.length > 0 && eligible.every((a: any) => selectedAccountIds.includes(a.id));
                                return (
                                  <input
                                    type="checkbox"
                                    aria-label="Select all accounts"
                                    checked={isAllSelected}
                                    onChange={() => handleToggleSelectAll(user.accountId)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                                  />
                                );
                              })()}
                            </th>
                          )}
                          <th className="py-3.5 px-3 w-12 text-center">#</th>
                          <th className="py-3.5 px-6">Name</th>
                          <th className="py-3.5 px-6">Email</th>
                          <th className="py-3.5 px-6">Role</th>
                          <th className="py-3.5 px-6">Position</th>
                          <th className="py-3.5 px-6">Phone</th>
                          <th className="py-3.5 px-6">Created Date</th>
                          {isAdmin && <th className="py-3.5 px-6 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin ? 9 : 7} className="py-16 text-center text-slate-400 text-sm">
                              No accounts match your search query.
                            </td>
                          </tr>
                        ) : (
                          filteredAccounts.map((acc: any, index: number) => {
                            const isSelf = acc.id === user.accountId;
                            const isSelected = selectedAccountIds.includes(acc.id);
                            return (
                              <tr
                                key={acc.id}
                                onClick={() => handleOpenUserDrawer(acc)}
                                className={`transition-colors cursor-pointer ${isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/80"
                                  }`}
                              >
                                {isAdmin && (
                                  <td
                                    className="py-4 px-6 text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="checkbox"
                                      aria-label={`Select ${acc.name}`}
                                      disabled={isSelf}
                                      checked={isSelected}
                                      onChange={() => handleToggleSelectAccount(acc.id, user.accountId)}
                                      className={`w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 ${isSelf ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                                        }`}
                                    />
                                  </td>
                                )}
                                <td className="py-4 px-3 text-center font-mono text-xs text-slate-400 font-semibold">
                                  {index + 1}
                                </td>
                                <td className="py-4 px-6 font-bold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={getUserAvatar(acc.avatarUrl, acc.gender)}
                                      alt={acc.name || "Avatar"}
                                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0 shadow-2xs"
                                    />
                                    <span>{acc.name}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                        You
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-slate-600 font-mono text-xs">{acc.email}</td>
                                <td className="py-4 px-6">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${acc.role.toLowerCase() === "admin"
                                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      }`}
                                  >
                                    {acc.role}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-slate-700">{acc.position || "—"}</td>
                                <td className="py-4 px-6 text-slate-600 font-mono text-xs">{acc.phone || "—"}</td>
                                <td className="py-4 px-6 text-slate-500 text-xs">
                                  {new Date(acc.createdAt).toLocaleDateString()}
                                </td>
                                {isAdmin && (
                                  <td
                                    className="py-4 px-6 text-right"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Permissions Button */}
                                      {canManagePerms && (
                                        <button
                                          type="button"
                                          title={`Configure permissions for ${acc.name}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedPermissionAccountId(acc.id);
                                            setActiveTab("permissions");
                                          }}
                                          className="p-2 rounded-xl text-amber-600 bg-amber-50/80 hover:bg-amber-100 hover:text-amber-700 border border-amber-200/60 transition-all cursor-pointer shadow-2xs group flex items-center justify-center"
                                          aria-label={`Configure ${acc.name}'s permissions`}
                                        >
                                          <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </button>
                                      )}
                                      {/* Eye Icon Button for opening slide-over drawer */}
                                      <button
                                        type="button"
                                        title={`View user details, time tracked & logs for ${acc.name}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenUserDrawer(acc);
                                        }}
                                        className="p-2 rounded-xl text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200/60 transition-all cursor-pointer shadow-2xs group flex items-center justify-center"
                                        aria-label={`View ${acc.name}'s profile, time tracking, and activity logs`}
                                      >
                                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === "sessions" && hasAccess("sessions") && (
                <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-100">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">Active User Sessions</h3>
                    <p className="text-xs text-slate-500">Live PostgreSQL Table: sessions</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 uppercase text-[11px] font-bold">
                        <tr>
                          <th className="py-3.5 px-6">Account</th>
                          <th className="py-3.5 px-6">Role</th>
                          <th className="py-3.5 px-6">Token</th>
                          <th className="py-3.5 px-6">IP Address</th>
                          <th className="py-3.5 px-6">Expires</th>
                          <th className="py-3.5 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.sessions.map((sess: any) => (
                          <tr key={sess.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-900">
                              {sess.accountName}{" "}
                              <span className="block text-xs font-normal text-slate-500">{sess.accountEmail}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                                {sess.accountRole}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-slate-500">
                              {sess.token.substring(0, 8)}...{sess.token.substring(sess.token.length - 6)}
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-slate-600">{sess.ipAddress || "127.0.0.1"}</td>
                            <td className="py-4 px-6 text-slate-500 text-xs">
                              {new Date(sess.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleRevoke(sess.id)}
                                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Logs Tab */}
              {activeTab === "logs" && hasAccess("logs") && (
                <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-slate-100">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">Security Audit Trail</h3>
                    <p className="text-xs text-slate-500">Live PostgreSQL Table: logs</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {data.logs.map((log: any) => (
                      <div key={log.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase ${log.status === "success"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                                }`}
                            >
                              {log.action}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">IP: {log.ipAddress || "local"}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700">{log.details}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 font-mono">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Srimatrix Tab */}
              {activeTab === "srimatrix" && hasAccess("srimatrix") && (
                <SrimatrixDirectoryView />
              )}

              {/* Candidates Tab */}
              {activeTab === "candidates" && hasAccess("candidates") && (
                <CandidatesManagementView />
              )}

              {/* Pipeline Tab */}
              {activeTab === "pipeline" && hasAccess("pipeline") && (
                <PipelineManagementView />
              )}

              {/* Invoicing Tab */}
              {activeTab === "invoicing" && hasAccess("invoicing") && (
                <InvoicingManagementView />
              )}

              {/* Human Resource: Offer Letter Tab */}
              {activeTab === "job" && hasAccess("job") && (
                <JobOfferLetterView />
              )}

              {/* Human Resource: Onboarding Tab */}
              {activeTab === "onboarding" && hasAccess("onboarding") && (
                <HROnboardingView />
              )}

              {/* Human Resource: Documents Tab */}
              {activeTab === "documents" && hasAccess("documents") && (
                <HRDocumentsView />
              )}

              {/* Human Resource: Immigration Tab */}
              {activeTab === "immigration" && hasAccess("immigration") && (
                <HRImmigrationView />
              )}

              {/* Mileage Manage Tab (Admin) */}
              {activeTab === "mileageManage" && hasAccess("mileageManage") && (
                <MileageManagementView />
              )}

              {/* Mail Tab */}
              {activeTab === "mail" && hasAccess("mail") && (
                <MailManagementView
                  accounts={data?.accounts}
                  onNavigateToCredentials={() => setActiveTab("credentials")}
                />
              )}

              {/* Credentials Tab */}
              {activeTab === "credentials" && hasAccess("credentials") && (
                <CredentialsManagementView />
              )}

              {/* Permissions & Access Control Tab */}
              {activeTab === "permissions" && hasAccess("permissions") && (
                <PermissionsManagementView
                  initialAccountId={selectedPermissionAccountId}
                  onRefreshParent={refreshDashboardData}
                />
              )}

              {/* Settings & Profile Tab (Kept in nav, but disconnected from opening) */}

              {/* Timesheet Tab (Personal Time Entry - Enter Time) */}
              {(activeTab === "timesheets" || (!hasWorkforceOverview && activeTab === "overview" && hasAccess("overview"))) && hasAccess("timesheets") && (
                <EmployeeTimeEntryView
                  user={user}
                  timesheets={data.timesheets || []}
                  onSubmitted={refreshDashboardData}
                  onNavigateToHistory={() => setActiveTab("timesheetHistory")}
                />
              )}

              {/* Timesheet History Tab */}
              {activeTab === "timesheetHistory" && hasAccess("timesheetHistory") && (
                <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
                  {/* Header */}
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight truncate">
                          Timesheet History
                        </h2>
                        <p className="text-[11px] text-slate-400 truncate">
                          Archive of all weekly timesheet submissions, approval statuses, and notes
                        </p>
                      </div>
                    </div>
                    {/* Enter Time CTA button */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("timesheets")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Enter Time</span>
                    </button>
                  </div>

                  {/* Metrics Bar - Down of Header, Up of Logs */}
                  <div className="px-4 sm:px-8 py-2.5 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Records
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
                          {(data.timesheets || []).length}
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
                          {(data.timesheets || []).reduce((acc: number, ts: any) => acc + (parseFloat(ts.totalHours) || 0), 0).toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">hrs</span>
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Approved
                        </span>
                        <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.5 block">
                          {(data.timesheets || [])
                            .filter((ts: any) => ts.status?.toLowerCase() === "approved")
                            .reduce((acc: number, ts: any) => acc + (parseFloat(ts.totalHours) || 0), 0).toFixed(1)} <span className="text-[10px] text-emerald-600 font-normal">hrs</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Logs Table: Period (Date), Total Hours, Status, Actions ONLY */}
                  <div className="flex-1 w-full overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-6">Period</th>
                          <th className="py-2.5 px-2 sm:px-6">Total</th>
                          <th className="py-2.5 px-2 sm:px-6">Status</th>
                          <th className="py-2.5 px-3 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(data.timesheets || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-16 text-center text-slate-400 text-xs sm:text-sm px-4">
                              No timesheet records found.
                            </td>
                          </tr>
                        ) : (
                          [...(data.timesheets || [])]
                            .sort((a: any, b: any) => {
                              const dateA = new Date(a.createdAt || 0).getTime();
                              const dateB = new Date(b.createdAt || 0).getTime();
                              if (dateA !== dateB) return dateB - dateA;
                              return (b.id || 0) - (a.id || 0);
                            })
                            .map((ts: any) => (
                              <tr key={ts.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3 sm:px-6 font-bold text-slate-900 font-mono text-xs">
                                  <div>{ts.periodLabel}</div>
                                  {ts.reviewNote && (
                                    <div className="text-[10px] text-slate-400 font-sans italic font-normal truncate max-w-[130px] sm:max-w-xs mt-0.5">
                                      {ts.reviewNote}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-2 sm:px-6 font-black text-indigo-600 font-mono text-xs whitespace-nowrap">
                                  {ts.totalHours} hrs
                                </td>
                                <td className="py-3 px-2 sm:px-6">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${ts.status === "approved"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : ts.status === "rejected"
                                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                                          : ts.status === "draft"
                                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                                            : "bg-amber-100 text-amber-800 border border-amber-200"
                                      }`}
                                  >
                                    {ts.status === "submitted" ? "Pending" : ts.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3 sm:px-6 text-right whitespace-nowrap">
                                  {ts.status === "rejected" ? (
                                    <button
                                      onClick={() => handleDeleteTimesheet(ts.id, ts.periodLabel)}
                                      disabled={deletingTimesheetId === ts.id}
                                      className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete rejected timesheet"
                                    >
                                      {deletingTimesheetId === ts.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  ) : (
                                    <span
                                      className="inline-flex p-1.5 text-slate-300 cursor-not-allowed"
                                      title={ts.status === "approved" ? "Approved timesheets cannot be deleted" : "Only rejected timesheets can be deleted"}
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mileage History Tab (Personal) */}
              {activeTab === "mileage" && hasAccess("mileage") && (
                <div className="w-full h-full flex flex-col bg-white overflow-y-auto">
                  {/* Header */}
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3 flex items-center justify-between shrink-0 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight truncate">
                          Mileage History
                        </h2>
                        <p className="text-[11px] text-slate-400 truncate">
                          Archive of all submitted travel mileage entries and approval statuses
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Bar - Down of Header, Up of Logs */}
                  <div className="px-4 sm:px-8 py-2.5 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Records
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
                          {(data.mileage || []).length}
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
                          {(data.mileage || []).reduce((acc: number, m: any) => acc + (parseFloat(m.distance) || 0), 0).toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mi</span>
                        </span>
                      </div>

                      <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-center shadow-2xs">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Approved
                        </span>
                        <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.5 block">
                          {(data.mileage || [])
                            .filter((m: any) => m.status?.toLowerCase() === "approved")
                            .reduce((acc: number, m: any) => acc + (parseFloat(m.distance) || 0), 0).toFixed(1)} <span className="text-[10px] text-emerald-600 font-normal">mi</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Logs Table: Date, Distance, Status, Actions ONLY */}
                  <div className="flex-1 w-full overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-6">Date</th>
                          <th className="py-2.5 px-2 sm:px-6">Distance</th>
                          <th className="py-2.5 px-2 sm:px-6">Status</th>
                          <th className="py-2.5 px-3 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(data.mileage || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-16 text-center text-slate-400 text-xs sm:text-sm px-4">
                              No mileage records found. You can submit travel miles in the "Enter Time" tab.
                            </td>
                          </tr>
                        ) : (
                          [...(data.mileage || [])]
                            .sort((a: any, b: any) => {
                              const dateA = new Date(a.entryDate || a.createdAt || 0).getTime();
                              const dateB = new Date(b.entryDate || b.createdAt || 0).getTime();
                              if (dateA !== dateB) return dateB - dateA;
                              return (b.id || 0) - (a.id || 0);
                            })
                            .map((m: any) => {
                              const dist = parseFloat(m.distance) || 0;
                              const isApproved = m.status?.toLowerCase() === "approved";
                              const isRejected = m.status?.toLowerCase() === "rejected";
                              const statusNormalized = isApproved ? "Approved" : isRejected ? "Rejected" : (m.status || "Pending");

                              return (
                                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-3 sm:px-6 font-bold font-mono text-slate-900 text-xs">
                                    <div>
                                      {m.entryDate ? new Date(m.entryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                    </div>
                                    {m.description && (
                                      <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[120px] sm:max-w-xs mt-0.5">
                                        {m.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-2 sm:px-6 font-black text-indigo-600 font-mono text-xs whitespace-nowrap">
                                    {dist.toFixed(1)} mi
                                  </td>
                                  <td className="py-3 px-2 sm:px-6">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isApproved
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : isRejected
                                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                                            : "bg-amber-100 text-amber-800 border border-amber-200"
                                        }`}
                                    >
                                      {isApproved ? (
                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                      ) : isRejected ? (
                                        <XCircle className="w-2.5 h-2.5 text-rose-600" />
                                      ) : (
                                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                                      )}
                                      {statusNormalized}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 sm:px-6 text-right whitespace-nowrap">
                                    {isApproved ? (
                                      <span
                                        className="inline-flex p-1.5 text-slate-300 cursor-not-allowed"
                                        title="Approved mileage logs cannot be deleted"
                                      >
                                        <Lock className="w-3.5 h-3.5" />
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleDeleteMileage(m.id, m.description || "Travel miles", m.distance)}
                                        disabled={deletingMileageId === m.id}
                                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                        title="Delete mileage log"
                                      >
                                        {deletingMileageId === m.id ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                                        ) : (
                                          <Trash2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}


              {/* Connected Devices Tab */}
              {activeTab === "devices" && hasAccess("devices") && (
                <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-emerald-600" />
                    My Active Devices &amp; Sessions
                  </h3>

                  <div className="space-y-3">
                    {data.sessions?.map((sess: any) => (
                      <div
                        key={sess.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-slate-900">Current Login</span>
                            <span className="text-xs font-mono text-slate-500">IP: {sess.ipAddress || "127.0.0.1"}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            Valid until: {new Date(sess.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRevoke(sess.id)}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Sign Out Device
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Activity History Tab */}
              {activeTab === "activity" && hasAccess("activity") && (
                <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 space-y-4">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    My Activity Log
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {data.logs?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-3">No activity recorded yet.</p>
                    ) : (
                      data.logs?.map((l: any) => (
                        <div key={l.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-slate-800 font-medium">{l.details}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-xs shrink-0">
                            {new Date(l.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Fallback Access Restricted Notice */}
              {!hasAccess(activeTab) && (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 sm:p-12 text-center max-w-lg mx-auto my-12 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-black text-lg text-slate-900">Access Restricted</h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      You do not currently have permission to access the requested view. If you believe this is in error, please contact your system administrator.
                    </p>
                  </div>
                  {currentNav.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(currentNav[0].id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Return to {currentNav[0].label}
                    </button>
                  )}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* Modal: Add Account & Bulk Create (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <div
            className={`bg-white rounded-3xl w-full p-5 sm:p-7 lg:p-8 shadow-2xl border border-slate-200 flex flex-col my-auto transition-all duration-200 ${modalMode === "bulk" ? "max-w-5xl xl:max-w-6xl" : "max-w-xl"
              }`}
            style={{ maxHeight: "calc(100vh - 2rem)" }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  {modalMode === "single" ? <UserPlus className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {modalMode === "single" ? "Add New Team Member" : "Bulk Create Accounts"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === "single"
                      ? "Add an employee or administrator to the PostgreSQL database."
                      : "Rapidly provision multiple employee credentials and profiles."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setFormMsg(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl my-4 self-start text-xs font-bold border border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setModalMode("single");
                  setFormMsg(null);
                }}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${modalMode === "single"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Single Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode("bulk");
                  setFormMsg(null);
                }}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${modalMode === "bulk"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Bulk Create</span>
              </button>
            </div>

            {/* Status Message */}
            {formMsg && (
              <div
                className={`mb-4 p-3.5 rounded-2xl text-xs flex items-center gap-2 ${formMsg.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
              >
                {formMsg.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span className="font-semibold">{formMsg.message}</span>
              </div>
            )}

            {/* Mode 1: Single Account Form */}
            {modalMode === "single" && (
              <form onSubmit={handleAddAccount} className="space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      name="name"
                      required
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="e.g. alex@srimatrix.io"
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Initial Password *</label>
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      defaultValue="srimatrix123"
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Role</label>
                    <select
                      name="role"
                      className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none font-medium bg-white transition-all"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Gender</label>
                    <select
                      name="gender"
                      defaultValue="male"
                      className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none font-medium bg-white transition-all"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Job Position</label>
                    <input
                      name="position"
                      placeholder="e.g. Operations Specialist"
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <input
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-600 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <ProfilePictureUploader
                      value={addAvatarUrl}
                      onChange={(url) => setAddAvatarUrl(url)}
                      email={addEmail}
                      name={addName}
                      inputName="avatarUrl"
                      label="Profile Picture (WebP Compression & Storage)"
                    />
                  </div>
                </div>


                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormMsg(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Creating..." : "Save Account"}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Bulk Create Form */}
            {modalMode === "bulk" && (
              <form onSubmit={handleBulkCreateSubmit} className="flex-1 flex flex-col min-h-0 space-y-4">

                {/* Method selector and default credentials note */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkInputMethod("grid")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${bulkInputMethod === "grid"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      Interactive Grid ({bulkRows.length} members)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkInputMethod("paste")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${bulkInputMethod === "paste"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      CSV / Quick Paste
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Default password:</span>
                    <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg font-bold">
                      srimatrix123
                    </span>
                  </div>
                </div>

                {/* Sub-mode A: Interactive Grid */}
                {bulkInputMethod === "grid" && (
                  <div className="flex-1 flex flex-col min-h-0 space-y-3">

                    {/* Desktop View: Wide, un-congested table with plenty of horizontal space */}
                    <div className="hidden md:block flex-1 overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs max-h-[50vh]">
                      <table className="w-full text-left text-xs min-w-[900px]">
                        <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] sticky top-0 z-10 backdrop-blur-xs">
                          <tr>
                            <th className="py-3 px-3 w-10 text-center">#</th>
                            <th className="py-3 px-3 min-w-[170px]">Full Name *</th>
                            <th className="py-3 px-3 min-w-[210px]">Email Address *</th>
                            <th className="py-3 px-3 w-36">Role</th>
                            <th className="py-3 px-3 min-w-[170px]">Job Position</th>
                            <th className="py-3 px-3 min-w-[150px]">Phone Number</th>
                            <th className="py-3 px-2 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bulkRows.map((row, idx) => (
                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3 text-center text-slate-400 font-mono font-semibold">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="e.g. Alex Morgan"
                                  value={row.name}
                                  onChange={(e) => updateBulkRow(idx, "name", e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="email"
                                  placeholder="alex@srimatrix.io"
                                  value={row.email}
                                  onChange={(e) => updateBulkRow(idx, "email", e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={row.role}
                                  onChange={(e) => updateBulkRow(idx, "role", e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 bg-white"
                                >
                                  <option value="employee">Employee</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="e.g. Operations Specialist"
                                  value={row.position}
                                  onChange={(e) => updateBulkRow(idx, "position", e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="+1 (555) 000-0000"
                                  value={row.phone}
                                  onChange={(e) => updateBulkRow(idx, "phone", e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600 bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  disabled={bulkRows.length <= 1}
                                  onClick={() => removeBulkRow(idx)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 cursor-pointer transition-colors"
                                  title="Remove row"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile & Tablet View: Comfortable, un-cramped Card Stack */}
                    <div className="block md:hidden flex-1 overflow-y-auto space-y-3 max-h-[50vh] pr-1">
                      {bulkRows.map((row, idx) => (
                        <div key={row.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-xs text-slate-900">
                                {row.name.trim() || `Team Member #${idx + 1}`}
                              </span>
                            </div>
                            {bulkRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBulkRow(idx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Remove member"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Full Name *</label>
                              <input
                                type="text"
                                placeholder="e.g. Alex Morgan"
                                value={row.name}
                                onChange={(e) => updateBulkRow(idx, "name", e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Email Address *</label>
                              <input
                                type="email"
                                placeholder="alex@srimatrix.io"
                                value={row.email}
                                onChange={(e) => updateBulkRow(idx, "email", e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Role</label>
                              <select
                                value={row.role}
                                onChange={(e) => updateBulkRow(idx, "role", e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600 font-medium"
                              >
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-600">Job Position</label>
                              <input
                                type="text"
                                placeholder="e.g. Operations Specialist"
                                value={row.position}
                                onChange={(e) => updateBulkRow(idx, "position", e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-bold text-slate-600">Phone</label>
                              <input
                                type="text"
                                placeholder="+1 (555) 000-0000"
                                value={row.phone}
                                onChange={(e) => updateBulkRow(idx, "phone", e.target.value)}
                                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-indigo-600"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add row button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={addBulkRow}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Team Member</span>
                      </button>

                      <span className="text-[11px] text-slate-400">
                        {bulkRows.filter((r) => r.name.trim() && r.email.trim()).length} of {bulkRows.length} ready
                      </span>
                    </div>
                  </div>
                )}

                {/* Sub-mode B: CSV / Quick Paste */}
                {bulkInputMethod === "paste" && (
                  <div className="flex-1 flex flex-col space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                      <div>
                        Paste members with one per line using format:
                        <div className="mt-1">
                          <code className="text-indigo-700 font-mono text-[11px] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            Full Name, Email, Role, Position, Phone
                          </code>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBulkPasteText(
                            `Sarah Jenkins, sarah@srimatrix.io, employee, Operations Specialist, +1 (555) 234-5678\n` +
                            `Marcus Reed, marcus@srimatrix.io, employee, Senior Software Engineer, +1 (555) 891-2345\n` +
                            `Elena Gomez, elena@srimatrix.io, employee, Product Designer, +1 (555) 432-8765\n` +
                            `David Kim, david@srimatrix.io, admin, Engineering Lead, +1 (555) 765-4321`
                          );
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline self-start sm:self-auto cursor-pointer"
                      >
                        Load Sample CSV Data
                      </button>
                    </div>

                    <textarea
                      rows={8}
                      value={bulkPasteText}
                      onChange={(e) => setBulkPasteText(e.target.value)}
                      placeholder={`Alex Morgan, alex@srimatrix.io, employee, Lead Designer, +1 (555) 301-2290\nDavid Chen, david@srimatrix.io, employee, Backend Engineer, +1 (555) 492-1082\nEmma Watson, emma@srimatrix.io, admin, Operations Lead, +1 (555) 902-3341`}
                      className="w-full p-4 rounded-2xl border border-slate-300 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 bg-slate-50/50"
                    />
                  </div>
                )}

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    Automated welcome emails with temporary login credentials will be dispatched to all newly created employees from your configured sender email.
                  </span>
                </div>

                <div className="pt-3 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setFormMsg(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Creating Accounts in PostgreSQL..." : "Create Accounts in Bulk"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Slide-Over Drawer: User Details, Activity Logs & Full Time Tracking */}
      {selectedUserForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in-overlay"
            onClick={() => setSelectedUserForDrawer(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            <aside className="w-screen max-w-xl lg:max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right pointer-events-auto">

              {/* Drawer Top Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/70">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={getUserAvatar(selectedUserForDrawer.avatarUrl, selectedUserForDrawer.gender)}
                      alt={selectedUserForDrawer.name || "Avatar"}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md shadow-indigo-600/10 ring-1 ring-slate-200"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg text-slate-900 truncate">
                        {selectedUserForDrawer.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${selectedUserForDrawer.role.toLowerCase() === "admin"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                      >
                        {selectedUserForDrawer.role}
                      </span>
                      {selectedUserForDrawer.id === user.accountId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          Active Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                      {selectedUserForDrawer.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Permissions Button */}
                  {canManagePerms && (
                    <button
                      type="button"
                      title={`Configure ${selectedUserForDrawer.name}'s permissions`}
                      onClick={() => {
                        setSelectedPermissionAccountId(selectedUserForDrawer.id);
                        setSelectedUserForDrawer(null);
                        setActiveTab("permissions");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/80 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Permissions</span>
                    </button>
                  )}

                  {/* Edit Option Button */}
                  <button
                    type="button"
                    title={`Edit ${selectedUserForDrawer.name}'s details`}
                    onClick={handleStartEditFromDrawer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Option Button */}
                  {selectedUserForDrawer.id !== user.accountId ? (
                    <button
                      type="button"
                      title={`Delete ${selectedUserForDrawer.name}`}
                      onClick={() => {
                        setDrawerTab("overview");
                        setIsConfirmingDrawerDelete(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Trash className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic px-1 hidden sm:inline">Active Admin</span>
                  )}

                  {/* Close Drawer Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserForDrawer(null);
                      setIsDrawerEditing(false);
                      setIsConfirmingDrawerDelete(false);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-1"
                    title="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs inside Drawer */}
              <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 text-xs font-bold bg-white">
                <button
                  type="button"
                  onClick={() => setDrawerTab("overview")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${drawerTab === "overview"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <User className="w-4 h-4" />
                  <span>Profile &amp; Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab("timesheets")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${drawerTab === "timesheets"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Time Tracked ({drawerData?.timesheets?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawerTab("logs")}
                  className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${drawerTab === "logs"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Activity Logs ({drawerData?.logs?.length || 0})</span>
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {drawerLoading && !drawerData ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <img
                      src="/srimatrix-health-logo.png"
                      alt="Loading..."
                      className="h-12 w-auto animate-pulse object-contain select-none"
                    />
                  </div>
                ) : (
                  <>
                    {/* TAB 1: Profile & Overview */}
                    {drawerTab === "overview" && (
                      <div className="space-y-5">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Total Approved
                            </span>
                            <div className="text-xl font-black text-emerald-600">
                              {(drawerData?.timesheets || [])
                                .filter((t: any) => t.status?.toLowerCase() === "approved")
                                .reduce((acc: number, t: any) => acc + (Number(t.totalHours) || 0), 0)}h
                            </div>
                            <span className="text-[10px] text-slate-400">Total approved hours</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Submissions
                            </span>
                            <div className="text-xl font-black text-slate-900">
                              {drawerData?.timesheets?.length || 0}
                            </div>
                            <span className="text-[10px] text-slate-400">Weekly sheets</span>
                          </div>

                          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Security Logs
                            </span>
                            <div className="text-xl font-black text-slate-900">
                              {drawerData?.logs?.length || 0}
                            </div>
                            <span className="text-[10px] text-slate-400">Recorded events</span>
                          </div>
                        </div>

                        {/* Delete Confirmation Alert Banner inside Drawer */}
                        {isConfirmingDrawerDelete && (
                          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Trash className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-sm text-rose-900">
                                  Delete Account: {selectedUserForDrawer.name}?
                                </h5>
                                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                                  Are you sure you want to permanently delete this account ({selectedUserForDrawer.email})? All associated timesheets and login sessions will be removed from PostgreSQL.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200/60">
                              <button
                                type="button"
                                onClick={() => setIsConfirmingDrawerDelete(false)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={handleDeleteFromDrawer}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                              >
                                {isPending ? "Deleting..." : "Yes, Delete Account"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Edit Status Message */}
                        {editMsg && (
                          <div
                            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 ${editMsg.success
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {editMsg.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                              <span className="font-semibold">{editMsg.message}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditMsg(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* User Details Card: View Mode or Inline Edit Form */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                          {isDrawerEditing ? (
                            /* Inline Edit Form */
                            <form onSubmit={handleSaveDrawerEdit} className="space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit Employee Profile</span>
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setIsDrawerEditing(false)}
                                  className="text-xs text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                                  <input
                                    type="email"
                                    required
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white font-mono text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Job Position</label>
                                  <input
                                    type="text"
                                    value={editPosition}
                                    onChange={(e) => setEditPosition(e.target.value)}
                                    placeholder="e.g. Operations Specialist"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                                  <input
                                    type="text"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="+1 (555) 234-5678"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white font-mono text-slate-900"
                                  />
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">System Role</label>
                                  <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white text-slate-900 font-bold"
                                  >
                                    <option value="employee">Employee</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                                  <select
                                    value={editGender}
                                    onChange={(e) => setEditGender(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white text-slate-900 font-bold"
                                  >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block font-bold text-slate-700 mb-1">Reset Password (Optional)</label>
                                  <input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    placeholder="Leave blank to keep existing"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600 bg-white text-slate-900"
                                  />
                                </div>

                                <div>
                                  <ProfilePictureUploader
                                    value={editAvatarUrl}
                                    onChange={(url) => setEditAvatarUrl(url)}
                                    onDataChange={(data) => setEditAvatarData(data)}
                                    email={editEmail}
                                    name={editName}
                                    inputName="avatarUrl"
                                    label="Profile Picture (WebP Compression & Storage)"
                                  />
                                </div>
                              </div>

                              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setIsDrawerEditing(false)}
                                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={isPending}
                                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                                >
                                  {isPending ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </form>
                          ) : (
                            /* Read-Only Details View */
                            <>
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Employee Profile Details
                                </h4>
                                <button
                                  type="button"
                                  onClick={handleStartEditFromDrawer}
                                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-500 font-medium">Full Name</span>
                                  <p className="font-bold text-slate-900 mt-0.5">{selectedUserForDrawer.name}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Email Address</span>
                                  <p className="font-mono text-slate-800 mt-0.5">{selectedUserForDrawer.email}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Job Position</span>
                                  <p className="font-bold text-slate-900 mt-0.5">{selectedUserForDrawer.position || "Not Specified"}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Phone Number</span>
                                  <p className="font-mono text-slate-800 mt-0.5">{selectedUserForDrawer.phone || "Not Provided"}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">System Role</span>
                                  <p className="font-bold text-slate-900 uppercase mt-0.5">{selectedUserForDrawer.role}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Gender</span>
                                  <p className="font-bold text-slate-900 capitalize mt-0.5">{selectedUserForDrawer.gender || "Male"}</p>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium">Account ID</span>
                                  <p className="font-mono text-slate-600 mt-0.5">#{selectedUserForDrawer.id}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-slate-500 font-medium">Account Created</span>
                                  <p className="text-slate-700 mt-0.5">
                                    {new Date(selectedUserForDrawer.createdAt).toLocaleString(undefined, {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </p>
                                </div>
                              </div>

                              {/* Card Bottom Quick Actions */}
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={handleStartEditFromDrawer}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer border border-indigo-200/60"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit Profile Details</span>
                                </button>

                                {selectedUserForDrawer.id !== user.accountId ? (
                                  <button
                                    type="button"
                                    onClick={() => setIsConfirmingDrawerDelete(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                    <span>Delete Account</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Active Account (You)</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Active Sessions */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Active Login Sessions ({drawerData?.sessions?.length || 0})
                          </h4>
                          {drawerData?.sessions?.length === 0 ? (
                            <p className="text-xs text-slate-400">No active login sessions recorded.</p>
                          ) : (
                            <div className="space-y-2">
                              {drawerData?.sessions?.map((sess: any) => (
                                <div
                                  key={sess.id}
                                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span>Session #{sess.id}</span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-500">
                                      IP: {sess.ipAddress || "127.0.0.1"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Expires: {new Date(sess.expiresAt).toLocaleDateString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Time Tracked Full Details */}
                    {drawerTab === "timesheets" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Weekly Logged Work Hours
                          </h4>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                            {(drawerData?.timesheets || []).reduce((acc: number, t: any) => acc + (t.totalHours || 0), 0)} Total Hours
                          </span>
                        </div>

                        {drawerData?.timesheets?.length === 0 ? (
                          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 space-y-1">
                            <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-600">No timesheet records found</p>
                            <p>This user has not submitted any weekly hours yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {drawerData?.timesheets?.map((ts: any) => (
                              <div
                                key={ts.id}
                                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
                                  <div>
                                    <span className="font-bold text-xs text-slate-900 block font-mono">
                                      {ts.periodLabel}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                                      {ts.totalHours} hrs
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ts.status === "approved"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : ts.status === "rejected"
                                            ? "bg-rose-100 text-rose-800"
                                            : "bg-amber-100 text-amber-800"
                                        }`}
                                    >
                                      {ts.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Daily Hours 7-day Breakdown */}
                                <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] text-slate-400 uppercase">Mon</span>
                                    <span className="font-bold text-slate-800">{ts.mondayHours}h</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] text-slate-400 uppercase">Tue</span>
                                    <span className="font-bold text-slate-800">{ts.tuesdayHours}h</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] text-slate-400 uppercase">Wed</span>
                                    <span className="font-bold text-slate-800">{ts.wednesdayHours}h</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] text-slate-400 uppercase">Thu</span>
                                    <span className="font-bold text-slate-800">{ts.thursdayHours}h</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] text-slate-400 uppercase">Fri</span>
                                    <span className="font-bold text-slate-800">{ts.fridayHours}h</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-slate-50/60 border border-slate-200/60">
                                    <span className="block text-[10px] text-slate-400 uppercase">Sat</span>
                                    <span className="font-bold text-slate-400">{ts.saturdayHours}h</span>
                                  </div>
                                  <div className="p-2 rounded-xl bg-slate-50/60 border border-slate-200/60">
                                    <span className="block text-[10px] text-slate-400 uppercase">Sun</span>
                                    <span className="font-bold text-slate-400">{ts.sundayHours}h</span>
                                  </div>
                                </div>

                                {ts.notes && (
                                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 italic">
                                    &ldquo;{ts.notes}&rdquo;
                                  </p>
                                )}

                                {ts.reviewNote && (
                                  <div className="text-[11px] text-indigo-700 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                                    <span>Review note: &ldquo;{ts.reviewNote}&rdquo;</span>
                                    {ts.reviewedAt && (
                                      <span className="text-[10px] text-indigo-500 font-mono">
                                        {new Date(ts.reviewedAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: Activity & Security Logs */}
                    {drawerTab === "logs" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            User Audit Logs ({drawerData?.logs?.length || 0})
                          </h4>
                          <span className="text-xs text-slate-400">PostgreSQL Security Records</span>
                        </div>

                        {drawerData?.logs?.length === 0 ? (
                          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 space-y-1">
                            <Activity className="w-6 h-6 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-600">No activity logs recorded</p>
                            <p>No security events found for this account.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {drawerData?.logs?.map((logItem: any) => (
                              <div
                                key={logItem.id}
                                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${logItem.status === "success"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : logItem.status === "warning"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-700"
                                      }`}
                                  >
                                    {logItem.action}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(logItem.createdAt).toLocaleString(undefined, {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })}
                                  </span>
                                </div>

                                <p className="text-slate-800 font-medium leading-relaxed">
                                  {logItem.details}
                                </p>

                                {logItem.ipAddress && (
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    IP: {logItem.ipAddress}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
