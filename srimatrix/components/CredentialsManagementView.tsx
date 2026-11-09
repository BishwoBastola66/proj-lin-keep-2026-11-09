"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Mail,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Pencil,
  X,
  Server,
  CheckCheck,
  PenLine,
  FileSignature,
} from "lucide-react";
import {
  getEmailCredentialsAction,
  saveEmailCredentialsAction,
  verifySMTPConnectionAction,
} from "@/app/actions/auth";

const DEFAULT_SIGNATURE = `Best regards,
tribpanday
Operations & Healthcare Management
SriMatrix Healthcare Systems
admin@srimatric.com | +1 (800) 555-0199
https://srimatrix.io`;

export default function CredentialsManagementView() {
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Mode: false = Saved Display View, true = Edit/Setup Form
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedCreds, setHasSavedCreds] = useState(false);

  // Persisted state
  const [savedEmail, setSavedEmail] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [savedLogoOn, setSavedLogoOn] = useState(false);
  const [savedSignature, setSavedSignature] = useState(DEFAULT_SIGNATURE);

  // Form input state (while editing)
  const [email, setEmail] = useState("");
  const [emailKey, setEmailKey] = useState("");
  const [logoOn, setLogoOn] = useState(false);
  const [signature, setSignature] = useState(DEFAULT_SIGNATURE);

  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  }>({
    tested: false,
    success: false,
    message: "",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Asynchronously fetch saved credentials on mount without blocking the UI
  useEffect(() => {
    let isMounted = true;
    async function loadCreds() {
      setIsFetching(true);
      try {
        const res = await getEmailCredentialsAction();
        if (isMounted && res.success && res.credentials) {
          const loadedEmail = res.credentials.email || "";
          const loadedKey = res.credentials.key || res.credentials.smtpPass || "";
          const loadedLogo = Boolean(res.credentials.logoOn ?? res.credentials.includeLogoHeader);
          const loadedSig = res.credentials.signature?.trim() ? res.credentials.signature : DEFAULT_SIGNATURE;

          if (loadedKey) {
            setHasSavedCreds(true);
            setIsEditing(false); // Show configured card view
          } else {
            setHasSavedCreds(false);
            setIsEditing(true); // Open directly into setup form if not configured
          }

          setSavedEmail(loadedEmail);
          setSavedKey(loadedKey);
          setSavedLogoOn(loadedLogo);
          setSavedSignature(loadedSig);

          setEmail(loadedEmail);
          setEmailKey(loadedKey);
          setLogoOn(loadedLogo);
          setSignature(loadedSig);
        }
      } catch (err) {
        console.error("Failed to load email credentials:", err);
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    }
    loadCreds();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartEdit = () => {
    setEmail(savedEmail);
    setEmailKey(savedKey);
    setLogoOn(savedLogoOn);
    setSignature(savedSignature || DEFAULT_SIGNATURE);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEmail(savedEmail);
    setEmailKey(savedKey);
    setLogoOn(savedLogoOn);
    setSignature(savedSignature);
    setIsEditing(false);
  };

  const handleCopyKey = () => {
    const val = isEditing ? emailKey : savedKey;
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyEmail = () => {
    const val = isEditing ? email : savedEmail;
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSaveSignature = async () => {
    if (isSavingSignature) return;
    setIsSavingSignature(true);
    try {
      const res = await saveEmailCredentialsAction({
        email: (isEditing ? email : savedEmail).trim(),
        key: (isEditing ? emailKey : savedKey).replace(/\s+/g, ""),
        smtpPass: (isEditing ? emailKey : savedKey).replace(/\s+/g, ""),
        logoOn: isEditing ? logoOn : savedLogoOn,
        signature: signature.trim(),
      });
      if (res.success) {
        setSavedSignature(signature.trim());
        showToast("Email signature stored in database successfully!", "success");
      } else {
        showToast(res.message || "Failed to save email signature", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error saving email signature", "error");
    } finally {
      setIsSavingSignature(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    const cleanEmail = email.trim();
    const cleanKey = emailKey.replace(/\s+/g, "");

    if (!cleanKey) {
      showToast("Please enter a 16-character Google App Password", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveEmailCredentialsAction({
        email: cleanEmail,
        key: cleanKey,
        smtpPass: cleanKey,
        logoOn: logoOn,
        includeLogoHeader: logoOn,
        signature: signature.trim(),
      });
      if (res.success) {
        setSavedEmail(cleanEmail);
        setSavedKey(cleanKey);
        setSavedLogoOn(logoOn);
        setSavedSignature(signature.trim());
        setHasSavedCreds(true);
        setIsEditing(false); // Seamlessly transition into Saved View!
        showToast("Email credentials and signature saved to database successfully!", "success");
      } else {
        showToast(res.message || "Failed to save email credentials", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error saving email credentials", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (isVerifying) return;
    const cleanKey = (isEditing ? emailKey : savedKey).replace(/\s+/g, "");
    const cleanEmail = (isEditing ? email : savedEmail).trim();
    const activeLogo = isEditing ? logoOn : savedLogoOn;

    if (!cleanKey) {
      showToast("Please enter a Google App Password before verifying", "error");
      return;
    }

    setIsVerifying(true);
    setConnectionStatus({ tested: false, success: false, message: "" });
    try {
      const res = await verifySMTPConnectionAction({
        email: cleanEmail,
        key: cleanKey,
        smtpPass: cleanKey,
        logoOn: activeLogo,
      });
      setConnectionStatus({
        tested: true,
        success: res.success,
        message: res.message,
      });
      if (res.success) {
        showToast("SMTP Connection Verified!", "success");
      } else {
        showToast(res.message || "Verification failed", "error");
      }
    } catch (err: any) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: err?.message || "Failed to establish SMTP connection",
      });
      showToast("Verification failed", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isFetching) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/60 font-sans">
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

  return (
    <div className="h-full flex flex-col bg-slate-50/60 overflow-hidden relative font-sans">
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

      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/90 px-6 sm:px-8 py-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Email Credentials & Key
                </h1>
                {hasSavedCreds ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Configured & Active</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Setup Required</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your Google App Password and sender settings for outbound emails and campaigns
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              disabled={isVerifying || isFetching || (!isEditing && !hasSavedCreds)}
              onClick={handleVerify}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isVerifying ? "animate-spin" : ""}`} />
              <span>{isVerifying ? "Verifying..." : "Verify Connection"}</span>
            </button>

            {hasSavedCreds && !isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Credentials</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 w-full">
        {/* Verification Status Banner */}
        {connectionStatus.tested && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
              connectionStatus.success
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-rose-50/80 border-rose-200 text-rose-900"
            }`}
          >
            {connectionStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {connectionStatus.success ? "SMTP Connection Verified" : "SMTP Verification Failed"}
              </p>
              <p className="mt-0.5 opacity-90 font-mono text-[11px]">{connectionStatus.message}</p>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SAVED / ACTIVE STATE VIEW
            (Clean, elevated summary card displayed once credentials are saved)
           ───────────────────────────────────────────────────────────── */}
        {hasSavedCreds && !isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* Active Configured Credentials Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Active SMTP Relay Credentials
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>

              {/* Credential Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Sender Email Card */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sender Email</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      title="Copy Email"
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-mono font-bold text-slate-900 truncate">
                    {savedEmail || "None configured"}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCheck className="w-3 h-3" />
                    <span>Outbound Sender Identity</span>
                  </span>
                </div>

                {/* 2. Google App Password Card */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Google App Password</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide token" : "Show token"}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        title="Copy Token"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                    {showPassword ? savedKey : "•••• •••• •••• ••••"}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <span>16-Character Auth Token</span>
                  </span>
                </div>
              </div>

              {/* Logo Banner & Server Status Row */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      savedLogoOn ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      SriMatrix Email Logo Banner
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {savedLogoOn ? "Header Logo banner attached in outgoing emails" : "Clean mode (no image attachments)"}
                    </span>
                  </div>
                </div>
                <span
                  className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold ${
                    savedLogoOn ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {savedLogoOn ? "Logo Enabled" : "Logo Disabled"}
                </span>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerify}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isVerifying ? "animate-spin" : ""}`} />
                  <span>Test Connection Live</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer"
                >
                  Change App Password or Sender Email &rarr;
                </button>
              </div>
            </div>

            {/* Side Status & Security Specs Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Server className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Relay Specifications
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    SMTP Host Server
                  </span>
                  <span className="font-mono font-bold text-slate-800">smtp.gmail.com:465</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Transport Security
                  </span>
                  <span className="font-bold text-emerald-700">SSL / TLS Encrypted</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Database Sync
                  </span>
                  <span className="font-bold text-slate-700">Persisted per account</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Google App Passwords Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* 3. Outbound Email Signature Card (Left side edit, Right side preview with text logo) */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <PenLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Outbound Email Signature
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Personalized signature appended to all outbound emails, campaign messages, and notifications
                    </p>
                  </div>
                </div>
              </div>

              {/* 2-Column Split: Left to Edit, Right to Show What It Looks Like with Text Logo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column: Edit Signature */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileSignature className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit Signature Lines</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSignature(`Best regards,\ntribpanday\nSriMatrix Healthcare Systems\nadmin@srimatric.com | +1 (800) 555-0199\nhttps://srimatrix.io`)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        tribpanday Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignature(`Best regards,\nAdministrator | SriMatrix Health Operations\nadmin@srimatric.com | +1 (800) 555-0199\nSriMatrix Healthcare Systems • Philadelphia, PA\nhttps://srimatrix.io`)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        Standard Preset
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={6}
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder={`Best regards,\ntribpanday\nOperations & Healthcare Management\nSriMatrix Healthcare Systems\nadmin@srimatrix.com | +1 (800) 555-0199\nhttps://srimatrix.io`}
                      className="w-full px-3.5 py-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-sans text-slate-800 font-medium leading-relaxed resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400">
                      Include your name (e.g. <strong>tribpanday</strong>), title, phone, and organization
                    </p>
                    <button
                      type="button"
                      disabled={isSavingSignature}
                      onClick={handleSaveSignature}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isSavingSignature ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to DB...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Signature</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: What it looks like show with Text Logo on right side */}
                <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="pb-3 border-b border-slate-200/80">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                        Signature Preview
                      </span>
                    </div>

                    {/* Realistic Email Box */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 sm:p-5 text-xs text-slate-700 space-y-3 font-sans mt-3">
                      <p className="text-slate-400 italic text-[11px] select-none">
                        &ldquo;...Thank you for contacting SriMatrix. Please review the attached schedule and let us know if you require any adjustments.&rdquo;
                      </p>

                      {/* Signature Block */}
                      <div className="border-t border-slate-200 pt-3">
                        <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-xs">
                          {signature.trim() ? (
                            signature
                          ) : (
                            <span className="text-slate-400 italic">No signature text entered.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Appended at the end of every outgoing email
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {signature.length} chars
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              EDIT / SETUP FORM VIEW
              (Full form displayed when editing or when first setting up)
             ───────────────────────────────────────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* Form Card */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-indigo-200 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {hasSavedCreds ? "Edit Email Credentials" : "Setup Email Credentials"}
                  </h2>
                </div>
                {hasSavedCreds && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Sender Email Input */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Sender Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sender@srimatrixhealth.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-mono text-slate-900 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The Google Workspace or Gmail address associated with your App Password
                  </p>
                </div>

                {/* Google App Password Input */}
                <div>
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Google App Password (16-Character Token)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">16 chars without spaces</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={emailKey}
                      onChange={(e) => setEmailKey(e.target.value.replace(/\s+/g, ""))}
                      placeholder="e.g. abcd efgh ijkl mnop"
                      className="w-full pl-3.5 pr-20 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-mono text-slate-900 font-bold tracking-wider"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {emailKey && (
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          title="Copy Key"
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Banner Logo Toggle */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        logoOn ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">SriMatrix Email Logo Banner</span>
                      <span className="text-[11px] text-slate-500 block">
                        {logoOn ? "Logo banner attached in outgoing emails" : "Clean mode (no image attachments)"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={logoOn}
                    onClick={() => setLogoOn(!logoOn)}
                    className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      logoOn ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        logoOn ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Outbound Email Signature Section (Left to Edit, Right to Preview with Text Logo) */}
                <div className="pt-3 border-t border-slate-100 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Outbound Email Signature</span>
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Appended to the bottom of all sent emails, onboarding credentials, and messages
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSignature(`Best regards,\ntribpanday\nSriMatrix Healthcare Systems\nadmin@srimatric.com | +1 (800) 555-0199\nhttps://srimatrix.io`)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        tribpanday Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignature(`Best regards,\nAdministrator | SriMatrix Health Operations\nadmin@srimatric.com | +1 (800) 555-0199\nSriMatrix Healthcare Systems • Philadelphia, PA\nhttps://srimatrix.io`)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        Standard Preset
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Subgrid: Left Edit, Right Preview with Text Logo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Left: Input Textarea */}
                    <div className="space-y-1.5">
                      <textarea
                        rows={6}
                        value={signature}
                        onChange={(e) => setSignature(e.target.value)}
                        placeholder={`Best regards,\ntribpanday\nOperations & Healthcare Management\nSriMatrix Healthcare Systems\nadmin@srimatrix.com | +1 (800) 555-0199\nhttps://srimatrix.io`}
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all font-sans text-slate-800 font-medium leading-relaxed resize-y"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Edit sign-off name (e.g. <strong>tribpanday</strong>), title, and contact details
                      </span>
                    </div>

                    {/* Right: Live Preview with Text Logo on right */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span>
                          Signature Preview
                        </span>
                        <span className="font-mono text-slate-400">{signature.length}c</span>
                      </div>

                      <div className="border-t border-slate-200 pt-2 text-xs">
                        <div className="whitespace-pre-wrap font-sans text-slate-800 leading-snug text-[11px]">
                          {signature.trim() ? signature : <span className="text-slate-400 italic">No signature text entered.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  {hasSavedCreds && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Setup Guide Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Setup Guide
                </h2>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Google accounts require a dedicated 16-character <strong>App Password</strong> rather than your standard account password for SMTP email dispatch:
              </p>

              <ol className="space-y-3 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span>
                    Enable <strong>2-Step Verification</strong> in your Google Account Security settings.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span>
                    Search for <strong>App Passwords</strong> and generate a token for app name <em>&quot;SriMatrix&quot;</em>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span>
                    Paste the 16-character code into the field on the left and click <strong>Save Changes</strong>.
                  </span>
                </li>
              </ol>

              <div className="pt-2">
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <span>Open Google App Passwords</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
