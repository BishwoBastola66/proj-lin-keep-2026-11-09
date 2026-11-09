"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAccountsForCampaignAction,
  getCandidatesAction,
  sendCampaignEmailAction,
  getEmailCredentialsAction,
} from "@/app/actions/auth";
import { generateEmailWithGrokAction } from "@/app/actions/grok";
import { showAlert, showPrompt } from "@/components/GlobalPromptDialog";
import {
  Mail,
  Send,
  SendHorizontal,
  Search,
  Plus,
  Paperclip,
  CheckCircle2,
  Tag,
  X,
  Building2,
  UserCheck,
  Check,
  Sparkles,
  Users,
  ChevronRight,
  Filter,
  RefreshCw,
  Rocket,
  CheckCheck,
  KeyRound,
  MessageSquare,
} from "lucide-react";

export type RecipientCategory = "all" | "accounts" | "candidates";

export interface CampaignRecipient {
  id: string;
  name: string;
  email: string;
  category: "accounts" | "candidates";
  roleOrCompany: string;
  avatarBg: string;
  avatarText: string;
}

interface MailManagementViewProps {
  accounts?: Array<{
    id: number | string;
    name: string;
    email: string;
    role?: string;
    position?: string | null;
  }>;
  onNavigateToCredentials?: () => void;
}

export default function MailManagementView({
  accounts,
  onNavigateToCredentials,
}: MailManagementViewProps = {}) {
  // ── Mail Navigation View State (Interactions vs Campaigns) ──
  const [activeMailView, setActiveMailView] = useState<"interactions" | "campaigns">("interactions");

  // ── Email Campaigns State ──
  const [selectedCategory, setSelectedCategory] = useState<RecipientCategory>("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

  // ── Live Connected SMTP Status State ──
  const [smtpStatus, setSmtpStatus] = useState<{
    loading: boolean;
    configured: boolean;
    email: string;
  }>({
    loading: true,
    configured: false,
    email: "",
  });

  useEffect(() => {
    let isMounted = true;
    async function loadSmtp() {
      try {
        const res = await getEmailCredentialsAction();
        if (isMounted && res.success && res.credentials) {
          const email = res.credentials.email?.trim() || "";
          const hasKey = Boolean(res.credentials.key && res.credentials.key.trim().length > 0);
          setSmtpStatus({
            loading: false,
            configured: hasKey && Boolean(email),
            email: email,
          });
        } else if (isMounted) {
          setSmtpStatus({
            loading: false,
            configured: false,
            email: "",
          });
        }
      } catch {
        if (isMounted) {
          setSmtpStatus({
            loading: false,
            configured: false,
            email: "",
          });
        }
      }
    }
    loadSmtp();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load live recipients from:
  // 1. Srimatrix from Account DB (PostgreSQL)
  // 2. Clients from clients DB table
  // 3. Candidates from candidates DB table
  useEffect(() => {
    let isMounted = true;

    async function loadAllRecipients() {
      setIsLoadingRecipients(true);
      // 1. Accounts from Account DB
      let accountRecipients: CampaignRecipient[] = [];
      try {
        let dbAccounts: Array<{
          id: number | string;
          name: string;
          email: string;
          role?: string;
          position?: string | null;
        }> = accounts || [];
        if (!dbAccounts || dbAccounts.length === 0) {
          dbAccounts = await getAccountsForCampaignAction();
        }
        if (dbAccounts && dbAccounts.length > 0) {
          accountRecipients = dbAccounts.map((acc: any) => ({
            id: `acc-${acc.id}`,
            name: acc.name,
            email: acc.email,
            category: "accounts" as const,
            roleOrCompany: acc.position || (acc.role === "admin" ? "System Administrator" : "Account Member"),
            avatarBg: "bg-indigo-600",
            avatarText: (acc.name || "AC").slice(0, 2).toUpperCase(),
          }));
        }
      } catch (e) {
        console.error("Error loading account DB recipients:", e);
      }
      // 2. Candidates from live candidates table
      let candidateRecipients: CampaignRecipient[] = [];
      try {
        const dbCandidates = await getCandidatesAction();
        if (Array.isArray(dbCandidates) && dbCandidates.length > 0) {
          candidateRecipients = dbCandidates
            .filter((c: any) => c.firstName || c.name || c.email)
            .map((c: any) => {
              const name = c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : c.name || "Candidate";
              const email = c.email || `candidate_${c.id}@talent.io`;
              const roleOrCompany = c.licenseStatus || c.pipelineStage || "Candidate Applicant";
              return {
                id: `cand-${c.id}`,
                name,
                email,
                category: "candidates" as const,
                roleOrCompany,
                avatarBg: "bg-purple-600",
                avatarText: (name || "CD").slice(0, 2).toUpperCase(),
              };
            });
        }
      } catch (e) {
        console.error("Error loading candidates for campaign:", e);
      }

      if (isMounted) {
        setRecipients([...accountRecipients, ...candidateRecipients]);
        setIsLoadingRecipients(false);
      }
    }

    loadAllRecipients();

    return () => {
      isMounted = false;
    };
  }, [accounts]);

  // Counts for pills
  const accountsCount = recipients.filter((r) => r.category === "accounts").length;
  const candidatesCount = recipients.filter((r) => r.category === "candidates").length;

  // Campaign Form State
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isLaunchedModalOpen, setIsLaunchedModalOpen] = useState(false);
  const [launchedCount, setLaunchedCount] = useState(0);
  const [sentProgressCount, setSentProgressCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState<{
    success: boolean;
    message: string;
    sent: number;
    failed: number;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter recipients
  const filteredRecipients = recipients.filter((rec) => {
    const categoryMatches =
      selectedCategory === "all" || rec.category === selectedCategory;
    const searchMatches =
      rec.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      rec.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      rec.roleOrCompany.toLowerCase().includes(recipientSearch.toLowerCase());
    return categoryMatches && searchMatches;
  });

  const allEligibleSelected =
    filteredRecipients.length > 0 &&
    filteredRecipients.every((r) => selectedRecipientIds.includes(r.id));

  // Toggle select all in current filtered view
  const handleToggleSelectAllRecipients = () => {
    if (allEligibleSelected) {
      const eligibleIds = new Set(filteredRecipients.map((r) => r.id));
      setSelectedRecipientIds((prev) => prev.filter((id) => !eligibleIds.has(id)));
    } else {
      const current = new Set(selectedRecipientIds);
      filteredRecipients.forEach((r) => current.add(r.id));
      setSelectedRecipientIds(Array.from(current));
    }
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Insert template variable into message body
  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessageBody((prev) => prev + ` {{${variable}}}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = messageBody;
    const inserted = `{{${variable}}}`;
    const newText = text.substring(0, start) + inserted + text.substring(end);
    setMessageBody(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + inserted.length, start + inserted.length);
    }, 10);
  };

  // "Follow Up" button action
  const handleApplyFollowUp = () => {
    setSubject("Follow-Up: Project Status & Scheduled Requirements");
    setMessageBody(
      `Hi {{first_name}},\n\nFollowing up on our recent communication regarding operational milestones and staffing alignment.\n\nPlease review the attached schedule and let us know if any adjustments or contractor staffing are needed for the upcoming period.\n\nLooking forward to your confirmation.`
    );
  };

  // "AI Generate" button action powered by xAI Grok (grok-2-mini)
  const handleGenerateAI = async () => {
    // Open interactive prompt to let user specify a topic or keep it automatic
    const promptTopic = await showPrompt({
      title: "SriMatrix Email Generator (Groq AI)",
      message:
        "What should this campaign email be about? (Leave blank to generate an automatic draft for " +
        (selectedCategory === "candidates"
          ? "Candidates — e.g. Travel Nursing contracts, PRN per diem shifts, credentialing"
          : selectedCategory === "accounts"
          ? "Accounts / Clinicians — e.g. timesheet approvals, shift adherence"
          : "All Healthcare Contacts") +
        "):",
      placeholder:
        selectedCategory === "candidates"
          ? "e.g. Urgent ICU/ER/Med-Surg RN travel openings, Per Diem shifts, License renewal..."
          : selectedCategory === "accounts"
          ? "e.g. Weekly timesheet approval deadline, Shift verification, Policy update..."
          : "e.g. Clinical staffing availability, Healthcare facility nurse placement...",
      confirmText: "Generate Email",
    });

    if (promptTopic === null) return; // User canceled

    setIsGeneratingAI(true);
    try {
      const res = await generateEmailWithGrokAction({
        topic: promptTopic.trim() || undefined,
        category: selectedCategory,
      });

      if (res.success && res.subject && res.body) {
        const cleanSub = res.subject
          .replace(/^[{"\s]+/, "")
          .replace(/[}"\s]+$/, "")
          .replace(/^subject:\s*/i, "")
          .trim();
        const cleanBody = res.body
          .replace(/^[{"\s]+/, "")
          .replace(/[}"\s]+$/, "")
          .replace(/^body:\s*/i, "")
          .trim();
        setSubject(cleanSub);
        setMessageBody(cleanBody);
      } else if (!res.success) {
        showAlert({
          title: "Email Generation Notice",
          message: res.message || "Failed to generate email draft. Please try again.",
          variant: "warning",
        });
      }
    } catch (err: any) {
      console.error("AI generation error:", err);
      showAlert({
        title: "Generation Error",
        message: err?.message || "An error occurred while generating the email draft.",
        variant: "warning",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // "Launch to N Recipients"
  const handleLaunchCampaign = async () => {
    if (selectedRecipientIds.length === 0) return;
    if (!subject.trim()) {
      showAlert({
        title: "Subject Required",
        message: "Please provide a subject line for your campaign.",
        variant: "warning",
      });
      return;
    }
    const recipientsToSend = recipients
      .filter((r) => selectedRecipientIds.includes(r.id))
      .map((r) => ({
        email: r.email,
        name: r.name,
        roleOrCompany: r.roleOrCompany,
      }));

    setLaunchedCount(recipientsToSend.length);
    setSentProgressCount(0);
    setIsLaunchedModalOpen(true);
    setIsSending(true);
    setSendResultMsg(null);

    let cumulativeSent = 0;
    let cumulativeFailed = 0;
    let lastError = "";

    try {
      for (let i = 0; i < recipientsToSend.length; i++) {
        const item = recipientsToSend[i];
        try {
          const res = await sendCampaignEmailAction({
            recipients: [item],
            subject,
            body: messageBody,
          });
          if (res.sent > 0) {
            cumulativeSent += res.sent;
          } else {
            cumulativeFailed++;
            if (res.message) lastError = res.message;
          }
        } catch (itemErr: any) {
          cumulativeFailed++;
          lastError = itemErr?.message || "Send error";
        }
        setSentProgressCount(i + 1);
      }

      setSendResultMsg({
        success: cumulativeSent > 0,
        message:
          cumulativeSent > 0
            ? `Successfully sent ${cumulativeSent} of ${recipientsToSend.length} emails.`
            : lastError || "Failed to dispatch campaign.",
        sent: cumulativeSent,
        failed: cumulativeFailed,
      });
    } catch (err: any) {
      setSendResultMsg({
        success: false,
        message: err?.message || "Failed to dispatch campaign.",
        sent: cumulativeSent,
        failed: recipientsToSend.length - cumulativeSent,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/60 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Email Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted multi-recipient messaging and campaign dispatch for candidates, clients, and team
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {onNavigateToCredentials && (
            <button
              type="button"
              onClick={onNavigateToCredentials}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 hover:bg-slate-50 rounded-xl border border-indigo-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Configure Google App Password / Email Key"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Email Key</span>
            </button>
          )}
          {smtpStatus.loading ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 text-slate-500 rounded-xl border border-slate-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <span>Checking SMTP...</span>
            </div>
          ) : smtpStatus.configured && smtpStatus.email ? (
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 text-xs font-semibold shadow-2xs"
              title={`Active & Working SMTP: ${smtpStatus.email}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SMTP: {smtpStatus.email}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNavigateToCredentials}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl border border-amber-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Click to configure your working SMTP email key"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>SMTP: Not Configured — Please Set Up</span>
            </button>
          )}
        </div>
      </div>

      {/* ── EMAIL CAMPAIGNS CONTAINER ── */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col lg:flex-row flex-1 min-h-[640px]">
          {/* ── LEFT PANEL: Select Recipients ── */}
          <div className="w-full lg:w-96 xl:w-[420px] border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 bg-white">
            {/* Header: Select Recipients (N) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Select Recipients ({selectedRecipientIds.length})</span>
              </div>
            </div>

            {/* Category Filter Pills: [All] [Accounts] [Candidates] */}
            <div className="px-4 pt-3.5">
              <div className="grid grid-cols-3 p-1 bg-slate-100/90 rounded-xl text-xs font-bold text-center gap-1">
                {(
                  [
                    { id: "all", label: "All", count: recipients.length },
                    { id: "accounts", label: "Accounts", count: accountsCount },
                    { id: "candidates", label: "Candidates", count: candidatesCount },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-1.5 px-1.5 rounded-lg text-xs transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                      selectedCategory === cat.id
                        ? "bg-white text-indigo-600 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        selectedCategory === cat.id
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "bg-slate-200/80 text-slate-500"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input: Search recipients... */}
            <div className="p-4 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipients..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 bg-slate-50/60"
                />
              </div>
            </div>

            {/* Select All Checkbox & Results Count */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 text-xs text-slate-500 select-none">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={handleToggleSelectAllRecipients}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                />
                <span>Select All</span>
              </label>
              <span className="font-mono text-[11px] text-slate-400">
                {filteredRecipients.length} results
              </span>
            </div>

            {/* Recipients Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1 max-h-[520px]">
              {isLoadingRecipients ? (
                <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                  <img
                    src="/srimatrix-health-logo.png"
                    alt="Loading contacts..."
                    className="h-10 w-auto animate-pulse object-contain select-none"
                  />
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-500">No recipients match your criteria.</p>
                  <p className="text-[11px] mt-1">Try switching categories or clearing search.</p>
                </div>
              ) : (
                filteredRecipients.map((rec) => {
                  const isChecked = selectedRecipientIds.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleToggleRecipient(rec.id)}
                      className={`p-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer select-none ${
                        isChecked ? "bg-indigo-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRecipient(rec.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 shrink-0"
                      />
                      <div
                        className={`w-8 h-8 rounded-full ${rec.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                      >
                        {rec.avatarText}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {rec.name}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                              rec.category === "accounts"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {rec.category === "accounts"
                              ? "Account"
                              : "Candidate"}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 truncate">
                          {rec.email}
                        </p>
                        {rec.roleOrCompany && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {rec.roleOrCompany}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Campaign Editor ── */}
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 bg-white min-h-[600px]">
            <div className="space-y-6">
              {/* Header: Campaign Editor with Follow Up & AI Generate Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 tracking-tight">
                      Campaign Editor
                    </h2>
                    <p className="text-xs text-slate-500">
                      Draft your message for the selected recipients.
                    </p>
                  </div>
                </div>

                {/* Top Action Buttons: [Follow Up] [AI Generate] */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyFollowUp}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Follow Up</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    title="Generate email draft with Groq AI (Fast)"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-50 text-purple-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${isGeneratingAI ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAI ? "Generating..." : "AI Generate"}</span>
                  </button>
                </div>
              </div>

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 License Renewal Requirements"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 bg-slate-50/40"
                />
              </div>

              {/* Message Body Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Message Body</label>
                  {/* Clickable Variable Tags */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Variables:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("first_name")}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      {`{{first_name}}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("last_name")}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      {`{{last_name}}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("company")}
                      className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] cursor-pointer"
                    >
                      {`{{company}}`}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  placeholder="Write your campaign message..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full h-80 sm:h-96 px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 bg-white leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* ── Footer: Launch to N Recipients Button ── */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 mt-6">
              <div className="text-xs text-slate-500">
                {selectedRecipientIds.length === 0 ? (
                  <span>Select at least 1 recipient on the left to launch.</span>
                ) : (
                  <span>
                    Targeting <strong>{selectedRecipientIds.length}</strong> selected recipients
                  </span>
                )}
              </div>

              {/* Blue Launch Button */}
              <button
                type="button"
                onClick={handleLaunchCampaign}
                disabled={selectedRecipientIds.length === 0 || isSending}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
                  selectedRecipientIds.length === 0 || isSending
                    ? "bg-indigo-400 opacity-60 cursor-not-allowed text-white shadow-none"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 hover:shadow-lg"
                }`}
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
                <span>
                  {isSending
                    ? `Sending (${selectedRecipientIds.length})...`
                    : `Launch Campaign (${selectedRecipientIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>

      {/* ── Success / Progress Campaign Launch Modal ── */}
      {isLaunchedModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              if (!isSending) setIsLaunchedModalOpen(false);
            }}
          />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 z-10 text-center animate-in zoom-in-95 duration-200">
            {/* Direct SriMatrix Health Logo (No container box) */}
            <div className="flex items-center justify-center">
              <img
                src="/srimatrix-health-logo.png"
                alt="SriMatrix Health"
                className={`h-12 w-auto object-contain transition-all ${
                  isSending ? "animate-pulse" : ""
                }`}
              />
            </div>

            {/* Status text */}
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                {isSending
                  ? "Dispatching Emails..."
                  : sendResultMsg?.success
                  ? "Campaign Dispatched!"
                  : "Dispatch Issue"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSending
                  ? `Delivering ${sentProgressCount} of ${launchedCount || 1}...`
                  : sendResultMsg?.message || `Successfully sent ${sentProgressCount} of ${launchedCount || 1} emails.`}
              </p>
            </div>

            {/* Direct Loading / Progress Bar (No container card) */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${
                      launchedCount > 0
                        ? Math.min(
                            100,
                            Math.round((sentProgressCount / launchedCount) * 100)
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-0.5">
                <span>{sentProgressCount} / {launchedCount || 1} sent</span>
                <span className="text-indigo-600 font-mono">
                  {launchedCount > 0
                    ? Math.round((sentProgressCount / launchedCount) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            {!isSending && (
              <button
                type="button"
                onClick={() => {
                  setIsLaunchedModalOpen(false);
                  if (sendResultMsg?.success) {
                    setSelectedRecipientIds([]);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20 mt-2"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
