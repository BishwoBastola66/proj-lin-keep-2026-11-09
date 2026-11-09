"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  CornerDownRight,
  Send,
  X,
  Mail,
  Copy,
  Check,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  getEmailInteractionsAction,
  sendEmailInteractionReplyAction,
  searchDirectoryContactsAction,
  getEmailCredentialsAction,
  type MatchedEntityInfo,
} from "@/app/actions/auth";

export interface EmailInteractionItem {
  id: number;
  accountId: number | null;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  entityType: string | null;
  entityId: string | null;
  subject: string;
  body: string;
  status: string; // 'sent' | 'reply_sent' | 'replied'
  direction: string; // 'outbound' | 'reply' | 'inbound'
  createdAt: string | Date;
  updatedAt: string | Date;
  matchedEntity?: MatchedEntityInfo;
}

export default function EmailInteractionsFeed() {
  const [interactions, setInteractions] = useState<EmailInteractionItem[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(true);
  const [selectedInteractionId, setSelectedInteractionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "srimatrix" | "candidate" | "reply_sent">("all");
  const [senderEmail, setSenderEmail] = useState("admin@srimatric.com");

  // Reply Field State
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // New Compose Modal State
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeRecipientEmail, setComposeRecipientEmail] = useState("");
  const [composeRecipientName, setComposeRecipientName] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [directorySuggestions, setDirectorySuggestions] = useState<any[]>([]);
  const [isSendingCompose, setIsSendingCompose] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load configured sender email
  useEffect(() => {
    async function loadSender() {
      try {
        const res = await getEmailCredentialsAction();
        if (res.success && res.credentials?.email) {
          setSenderEmail(res.credentials.email);
        }
      } catch (err) {
        console.error("Failed to load sender credentials:", err);
      }
    }
    loadSender();
  }, []);

  // Load interactions from PostgreSQL
  const fetchInteractions = async () => {
    setIsLoadingInteractions(true);
    try {
      const res = await getEmailInteractionsAction();
      if (res.success && res.interactions) {
        const list = res.interactions as any[];
        setInteractions(list);
        if (!selectedInteractionId && list.length > 0) {
          setSelectedInteractionId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load interactions:", err);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  const selectedInteraction =
    interactions.find((item) => item.id === selectedInteractionId) || interactions[0] || null;

  // Sync reply subject when selected interaction changes
  useEffect(() => {
    if (selectedInteraction) {
      const baseSub = selectedInteraction.subject.startsWith("Re: ")
        ? selectedInteraction.subject
        : `Re: ${selectedInteraction.subject}`;
      setReplySubject(baseSub);
      setReplyBody("");
    }
  }, [selectedInteractionId]);

  // Send Reply Action
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedInteraction || isSendingReply) return;
    if (!replyBody.trim()) {
      showToast("Please enter a reply message before sending.", "error");
      return;
    }

    setIsSendingReply(true);
    try {
      const res = await sendEmailInteractionReplyAction({
        recipientEmail: selectedInteraction.recipientEmail,
        recipientName: selectedInteraction.recipientName,
        subject: replySubject.trim() || `Re: ${selectedInteraction.subject}`,
        body: replyBody.trim(),
        parentInteractionId: selectedInteraction.id,
      });

      if (res.success) {
        showToast(res.message || "Reply sent and stored in database!", "success");
        setReplyBody("");
        await fetchInteractions();
      } else {
        showToast(res.message || "Failed to send reply", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error dispatching reply", "error");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Search directory contacts for compose
  const handleDirectorySearch = async (val: string) => {
    setComposeRecipientEmail(val);
    if (val.length >= 2) {
      try {
        const res = await searchDirectoryContactsAction(val);
        if (res.success) {
          setDirectorySuggestions(res.contacts || []);
        }
      } catch (err) {
        console.error("Directory search failed:", err);
      }
    } else {
      setDirectorySuggestions([]);
    }
  };

  const handleSelectContact = (contact: any) => {
    setComposeRecipientEmail(contact.email);
    setComposeRecipientName(contact.name);
    setDirectorySuggestions([]);
  };

  // Send new composed email
  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendingCompose) return;
    if (!composeRecipientEmail.includes("@")) {
      showToast("Please enter a valid recipient email", "error");
      return;
    }
    if (!composeSubject.trim()) {
      showToast("Please enter a subject", "error");
      return;
    }
    if (!composeBody.trim()) {
      showToast("Please enter email message content", "error");
      return;
    }

    setIsSendingCompose(true);
    try {
      const res = await sendEmailInteractionReplyAction({
        recipientEmail: composeRecipientEmail.trim(),
        recipientName: composeRecipientName.trim() || undefined,
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });

      if (res.success) {
        showToast(res.message || "Email dispatched and recorded in database!", "success");
        setShowComposeModal(false);
        setComposeRecipientEmail("");
        setComposeRecipientName("");
        setComposeSubject("");
        setComposeBody("");
        await fetchInteractions();
        if ((res as any).interaction?.id) {
          setSelectedInteractionId((res as any).interaction.id);
        }
      } else {
        showToast(res.message || "Failed to send message", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error dispatching email", "error");
    } finally {
      setIsSendingCompose(false);
    }
  };

  // Filtered interactions
  const filteredInteractions = interactions.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.recipientName.toLowerCase().includes(q) ||
      item.recipientEmail.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q) ||
      (item.matchedEntity?.name && item.matchedEntity.name.toLowerCase().includes(q)) ||
      (item.matchedEntity?.facilityName && item.matchedEntity.facilityName.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterType === "srimatrix") {
      return item.matchedEntity?.type === "srimatrix" || item.entityType === "srimatrix";
    }
    if (filterType === "candidate") {
      return item.matchedEntity?.type === "candidate" || item.entityType === "candidate";
    }
    if (filterType === "reply_sent") {
      return item.status === "reply_sent" || item.direction === "reply";
    }

    return true;
  });

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white animate-in fade-in slide-in-from-bottom-2 ${
            toastMsg.type === "success" ? "bg-slate-900" : "bg-rose-600"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Email Interactions & Correspondence
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {filteredInteractions.length} Messages
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Correspondence matched with PostgreSQL Candidates & SriMatrix Directory facilities
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowComposeModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compose Email</span>
          </button>

          <button
            type="button"
            onClick={fetchInteractions}
            title="Refresh interactions"
            className="p-2 rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInteractions ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate name, facility name, email, or subject..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              filterType === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType("srimatrix")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === "srimatrix"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>SriMatrix Directory</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("candidate")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              filterType === "candidate"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <User className="w-3 h-3" />
            <span>Candidates</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("reply_sent")}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              filterType === "reply_sent"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Replies Sent
          </button>
        </div>
      </div>

      {/* Master-Detail Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ─── LEFT: INTERACTIONS LIST (5 cols on lg) ─── */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col max-h-[620px]">
          <div className="p-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs font-bold text-slate-600">
            <span>Recent Correspondences</span>
            <span className="text-[11px] font-mono text-slate-400">
              {filteredInteractions.length} records
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {isLoadingInteractions ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                <span>Loading database interactions...</span>
              </div>
            ) : filteredInteractions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Mail className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">No matching interactions found</p>
                <p className="text-[11px] text-slate-400">
                  Try adjusting your search query or send a new message.
                </p>
              </div>
            ) : (
              filteredInteractions.map((item) => {
                const isSelected = selectedInteraction?.id === item.id;
                const isCandidate =
                  item.matchedEntity?.type === "candidate" || item.entityType === "candidate";
                const isSrimatrix =
                  item.matchedEntity?.type === "srimatrix" || item.entityType === "srimatrix";
                const isReplySent = item.status === "reply_sent" || item.direction === "reply";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedInteractionId(item.id)}
                    className={`p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-indigo-50/80 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Header: Name + DB Badge + Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {item.recipientName}
                        </span>
                        {isSrimatrix ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-700 shrink-0 flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" />
                            <span>Facility</span>
                          </span>
                        ) : isCandidate ? (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                            <User className="w-2.5 h-2.5" />
                            <span>Candidate</span>
                          </span>
                        ) : null}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {/* Facility name if matched */}
                    {item.matchedEntity?.facilityName && (
                      <div className="text-[11px] text-slate-500 truncate font-semibold">
                        {item.matchedEntity.facilityName}
                      </div>
                    )}

                    {/* Subject */}
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {item.subject}
                    </div>

                    {/* Snippet */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 truncate">
                        To: <span className="font-mono">{item.recipientEmail}</span>
                      </span>

                      {/* Status */}
                      {isReplySent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Reply Sent</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          Sent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT: DETAIL VIEW & INTERACTION REPLY FIELD (7 cols on lg) ─── */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          {selectedInteraction ? (
            <>
              {/* Selected Contact / Thread Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {selectedInteraction.recipientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-slate-900">
                        {selectedInteraction.recipientName}
                      </h3>

                      {selectedInteraction.matchedEntity?.type === "srimatrix" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>SriMatrix Directory Contact</span>
                        </span>
                      )}

                      {selectedInteraction.matchedEntity?.type === "candidate" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Registered Candidate</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono text-slate-700 font-semibold">
                        {selectedInteraction.recipientEmail}
                      </span>
                      {selectedInteraction.matchedEntity?.facilityName && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-medium">
                            {selectedInteraction.matchedEntity.facilityName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {selectedInteraction.status === "reply_sent" ? (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reply Sent</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Sent
                    </span>
                  )}
                </div>
              </div>

              {/* Message Thread Body */}
              <div className="p-4 sm:p-6 space-y-4 max-h-[360px] overflow-y-auto bg-slate-50/30">
                {/* Sent Message Bubble */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-800">
                        {selectedInteraction.senderName || "SriMatrix Admin"}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        &lt;{selectedInteraction.senderEmail || senderEmail}&gt;
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(selectedInteraction.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">
                      Subject: {selectedInteraction.subject}
                    </h4>
                    <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                      {selectedInteraction.body}
                    </div>
                  </div>
                </div>

                {/* If Reply Sent is active, show the reply confirmation pill */}
                {selectedInteraction.status === "reply_sent" && (
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Reply Sent & Stored in PostgreSQL</span>
                      </span>
                      <span className="text-[11px] font-mono text-emerald-700">
                        {formatDate(selectedInteraction.updatedAt || selectedInteraction.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Outbound reply delivered to{" "}
                      <span className="font-mono font-bold">{selectedInteraction.recipientEmail}</span>. Recorded
                      with sender foreign key in <span className="font-mono font-bold">email_interactions</span>.
                    </p>
                  </div>
                )}
              </div>

              {/* ─── INTERACTION FIELD: LIVE REPLY COMPOSER ─── */}
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CornerDownRight className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Reply to {selectedInteraction.recipientName}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Sending as: <span className="font-bold text-slate-700">{senderEmail}</span>
                  </span>
                </div>

                {/* Quick suggestion templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Quick Template:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyBody(
                        `Hello ${selectedInteraction.recipientName},\n\nThank you for following up. We have verified your schedule preferences and updated our deployment calendar.\n\nPlease let us know if you require any additional documents.\n\nBest regards,\nSriMatrix Health Operations`
                      )
                    }
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Confirm Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyBody(
                        `Dear ${selectedInteraction.recipientName},\n\nWe have finalized the credentialing paperwork and licensure verification. All documents are now archived in our secure compliance system.\n\nWarm regards,\nSriMatrix Team`
                      )
                    }
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Credentialing Approved
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyBody(
                        `Hi ${selectedInteraction.recipientName},\n\nFollowing up regarding your clinical staffing requirements. Our placement coordinators are ready to dispatch verified nurses for your facility shifts.\n\nSincerely,\nSriMatrix Health`
                      )
                    }
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    Staffing Follow-up
                  </button>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      placeholder="Reply Subject..."
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/90 focus:bg-white focus:border-indigo-600 focus:outline-none font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <textarea
                      rows={4}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={`Type your reply to ${selectedInteraction.recipientName}... Automatically dispatches via SMTP and saves to PostgreSQL email_interactions with sender foreign key.`}
                      className="w-full p-3 rounded-xl text-xs bg-slate-50 border border-slate-200/90 focus:bg-white focus:border-indigo-600 focus:outline-none text-slate-800 leading-relaxed placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-slate-400 hidden sm:block">
                      Auto-matches database recipient and stores what was sent & by whom.
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingReply || !replyBody.trim()}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ml-auto"
                    >
                      {isSendingReply ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending & Saving...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an interaction from the list to view thread details and reply.
            </div>
          )}
        </div>
      </div>

      {/* ─── COMPOSE NEW MESSAGE MODAL ─── */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Compose New Interaction</h3>
                  <p className="text-[11px] text-slate-500">
                    Auto-matches candidate & SriMatrix directory emails from DB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComposeModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendCompose} className="p-5 space-y-4">
              {/* Recipient Search Input */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Recipient Email / Directory Search
                </label>
                <input
                  type="text"
                  value={composeRecipientEmail}
                  onChange={(e) => handleDirectorySearch(e.target.value)}
                  placeholder="Type name or email to search database..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none font-medium"
                />

                {/* Suggestions Dropdown */}
                {directorySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {directorySuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectContact(s)}
                        className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[10px] text-slate-500">{s.subtitle}</div>
                        </div>
                        <span className="font-mono text-[11px] text-indigo-600 font-semibold">{s.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recipient Name */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  value={composeRecipientName}
                  onChange={(e) => setComposeRecipientName(e.target.value)}
                  placeholder="Optional, e.g. Dr. John Smith"
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Subject line..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none font-semibold"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Write your email message... Automatically dispatches via live SMTP and logs in database."
                  className="w-full p-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingCompose || !composeRecipientEmail || !composeSubject || !composeBody}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingCompose ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send & Record in DB</span>
                    </>
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
