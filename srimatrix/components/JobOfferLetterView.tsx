"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Printer,
  Plus,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Edit3,
  LayoutGrid,
  Square,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Download,
  X,
  Database,
  HardDrive,
  Clock,
  Sparkles,
} from "lucide-react";

import {
  getJobOfferLettersAction,
  saveJobOfferLetterAction,
  deleteJobOfferLetterAction,
} from "@/app/actions/auth";
import { generateApplicationWithAIAction } from "@/app/actions/grok";
import { showPrompt } from "@/components/GlobalPromptDialog";

export interface OfferLetterData {
  id?: number;
  localId?: string;
  letterNumber?: number;
  applicationLabel?: string;
  fileUrl?: string;
  docUrl?: string;
  isSavedToDb?: boolean;
  isDirty?: boolean;
  pages?: string[];
  candidateName?: string;
  candidateEmail?: string | null;
  positionTitle?: string;
  employmentType?: string;
  hours?: string;
  workLocation?: string;
  supervisor?: string;
  letterDate?: string;
  startDate?: string;
  acceptanceDeadline?: string;
  duties?: string[];
  includeOptClause?: boolean;
  includeAcceptance?: boolean;
  includeWatermark?: boolean;
  signatoryName?: string;
  signatoryTitle?: string;
  signatoryEmail?: string;
  status?: string;
  customSections?: Record<string, any>;
  page1Html?: string | null;
  page2Html?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

// ─── 1. JOB LETTER TEMPLATE (OFFICIAL SRIMATRIX INTERNSHIP & OFFER AGREEMENT) ───
const DEFAULT_PAGE1_HTML = `
<div style="text-align: center; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px;">
  <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 56px; margin: 0 auto 6px auto; display: block; object-fit: contain;" />
  <h1 style="font-size: 21px; font-weight: bold; margin: 0; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.01em;">Srimatrix Health</h1>
  <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Email: info@srimatrixhealth.com | Website: www.srimatrixhealth.com</p>
</div>

<p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Date:</strong> 08/25/2026</p>
<p style="margin: 0 0 16px 0; font-size: 14px;"><strong>Sub:</strong> Offer of Internship with Srimatrix Health LLC</p>

<p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Dear Kristina KC,</strong></p>
<p style="margin: 0 0 16px 0; font-size: 14px; text-align: justify; line-height: 1.6;">
  We are pleased to offer you the position of <strong>Healthcare Content Writing and Communications Intern</strong> with Srimatrix Health. We believe your skills and academic background will be a valuable addition to our organization.
</p>

<h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Position Details</h3>
<ul style="margin: 0 0 16px 0; padding-left: 24px; line-height: 1.65; font-size: 13.5px;">
  <li><strong>Position Title:</strong> Healthcare Content Writing and Communications Intern</li>
  <li><strong>Employment Type:</strong> Part-Time Internship</li>
  <li><strong>Hours:</strong> 10 hours per week</li>
  <li><strong>Work Location:</strong> Remote</li>
  <li><strong>Supervisor:</strong> Suneel Sah, Director</li>
  <li><strong>Start Date:</strong> 08/31/2026</li>
</ul>

<h3 style="font-size: 15px; font-weight: bold; margin: 0 0 6px 0; color: #0f172a;">Duties and Responsibilities</h3>
<p style="margin: 0 0 8px 0; font-size: 13.5px; line-height: 1.55;">
  In this role, you will support the organization's healthcare content and communications activities. Your responsibilities may include:
</p>
<ul style="margin: 0 0 16px 0; padding-left: 24px; line-height: 1.65; font-size: 13.5px;">
  <li>Researching healthcare, medical, and public-health topics using credible sources.</li>
  <li>Writing, editing, and proofreading healthcare-related articles, educational materials, newsletters, website content, and other communications.</li>
  <li>Supporting digital content and communications initiatives.</li>
  <li>Reviewing content for accuracy, clarity, readability, grammar, and consistency.</li>
  <li>Assisting with content calendars, communications projects, and related administrative tasks.</li>
  <li>Collaborating with team members on healthcare communication and content-development projects.</li>
  <li>Performing other duties related to healthcare content writing and communications as assigned.</li>
</ul>

<p style="margin: 0 0 8px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
  The position is intended to provide practical experience in <strong>healthcare content writing, communications, research, and professional communication</strong>, and the duties are related to your academic and professional field of study.
</p>
`;

const DEFAULT_PAGE2_HTML = `
<div style="text-align: center; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; margin-bottom: 18px;">
  <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 48px; margin: 0 auto 4px auto; display: block; object-fit: contain;" />
  <h2 style="font-size: 17px; font-weight: bold; margin: 0; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Srimatrix Health LLC</h2>
  <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Healthcare Communications & Education Division</p>
</div>

<h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Employment Terms</h3>
<p style="margin: 0 0 12px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
  You are expected to perform your duties professionally and in accordance with the policies and procedures of Srimatrix Health. This offer is contingent upon your maintaining appropriate authorization to work in the United States and satisfying any applicable employment requirements.
</p>
<p style="margin: 0 0 12px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
  For an employee working under F-1 Optional Practical Training (OPT), employment is subject to the requirements and limitations applicable to the student's OPT authorization. The employee is responsible for maintaining valid immigration and employment authorization throughout the period of employment.
</p>
<p style="margin: 0 0 12px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
  Srimatrix Health will provide appropriate supervision, assignments, and professional guidance related to the position.
</p>
<p style="margin: 0 0 12px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
  Please indicate your acceptance by signing and returning this letter by <strong>08/28/2026</strong>.
</p>
<p style="margin: 0 0 20px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
  We are excited about the opportunity to have you join our team and look forward to your contributions to our healthcare content and communications initiatives.
</p>

<!-- Sign-off & Clean Blank Signature Space -->
<div style="margin: 0 0 26px 0; line-height: 1.5; font-size: 13.5px;">
  <p style="margin: 0 0 6px 0;">Sincerely,</p>
  <!-- Blank space for signature as requested -->
  <div style="height: 52px;"></div>
  <p style="margin: 0; font-weight: bold; color: #0f172a;">Suneel Sah</p>
  <p style="margin: 0; color: #334155;">Director</p>
  <p style="margin: 0; color: #334155;">Srimatrix Health LLC</p>
  <p style="margin: 0; color: #475569; font-size: 12px;">Email: ssah@srimatrixhealth.com</p>
</div>

<!-- Candidate Acceptance Section -->
<div style="border-top: 1px solid #cbd5e1; padding-top: 14px; margin-top: 14px;">
  <h3 style="font-size: 15px; font-weight: bold; margin: 0 0 8px 0; color: #0f172a;">Candidate Acceptance</h3>
  <p style="margin: 0 0 16px 0; font-size: 13.5px; text-align: justify; line-height: 1.6;">
    I, <strong>Kristina KC</strong>, accept the position of <strong>Healthcare Content Writing and Communications Intern</strong> with Srimatrix Health under the terms described in this letter.
  </p>
  
  <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 14px; font-size: 13.5px;">
    <p style="margin: 0;"><strong>Signature:</strong> ____________________________________________________</p>
    <p style="margin: 0;"><strong>Printed Name:</strong> ____________________________________________________</p>
    <p style="margin: 0;"><strong>Date:</strong> ____________________________________________________</p>
  </div>
</div>
`;

// ─── 2. CUSTOM LETTER TEMPLATE (BLANK WITH LOGO ONLY FOR USER TO WRITE IN) ───
const CUSTOM_PAGE1_HTML = `
<div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
  <img src="/srimatrix-health-logo.png" alt="SriMatrix Health" style="height: 60px; margin: 0 auto; display: block; object-fit: contain;" />
</div>
<p style="font-size: 14px; line-height: 1.6;"><br /></p>
`;

const BLANK_PAGE_HTML = `<p style="font-size: 14px; line-height: 1.6;"><br /></p>`;


const FONT_OPTIONS = [
  { label: "Times New Roman (Official)", value: "'Times New Roman', serif", id: "times" },
  { label: "Arial", value: "Arial, sans-serif", id: "arial" },
  { label: "Georgia", value: "Georgia, serif", id: "georgia" },
  { label: "Calibri", value: "Calibri, sans-serif", id: "calibri" },
  { label: "Garamond", value: "Garamond, serif", id: "garamond" },
];

const FONT_SIZES = [
  { label: "Small (10pt)", value: "2" },
  { label: "Normal (12pt)", value: "3" },
  { label: "Medium (14pt)", value: "4" },
  { label: "Large (18pt)", value: "5" },
  { label: "Heading (24pt)", value: "6" },
];

const STORAGE_DRAFTS_KEY = "srimatrix_application_drafts_v1";
const STORAGE_ACTIVE_ID_KEY = "srimatrix_application_active_id";

function getLocalDrafts(): OfferLetterData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read local drafts:", e);
    return [];
  }
}

function saveLocalDrafts(drafts: OfferLetterData[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_DRAFTS_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.error("Failed to save local drafts:", e);
  }
}

export default function JobOfferLetterView() {
  const [letters, setLetters] = useState<OfferLetterData[]>([]);
  const [selectedLetterId, setSelectedLetterId] = useState<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active letter being viewed / edited
  const [currentLetter, setCurrentLetter] = useState<OfferLetterData>({
    letterNumber: 1,
    applicationLabel: "Application 1",
    status: "Draft",
    includeWatermark: true,
    isSavedToDb: false,
    isDirty: false,
  });

  // Unlimited pages content array
  const [docPages, setDocPages] = useState<string[]>([DEFAULT_PAGE1_HTML, DEFAULT_PAGE2_HTML]);
  const [searchLetterQuery, setSearchLetterQuery] = useState("");
  const [sidebarLayout, setSidebarLayout] = useState<"single" | "grid">("single");

  // New Document Modal state (Job Letter vs Custom Blank Letter)
  const [showNewModal, setShowNewModal] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // In-app Delete Confirmation Modal state (Replaces ugly browser native confirm popup)
  const [deleteTargetId, setDeleteTargetId] = useState<number | string | null>(null);

  // ContentEditable Page Refs for unlimited pages
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const savedRangeRef = useRef<Range | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Formatting active states (Word Ribbon ON/OFF indicators)
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    bulletList: false,
    orderedList: false,
    fontFamily: "'Times New Roman', serif",
    fontSize: "3",
  });

  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Query browser formatting state for selection and update ON/OFF indicators
  const updateActiveStyles = () => {
    try {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      const range = sel.getRangeAt(0);

      // Only track if selection is within any page
      const isInside = pageRefs.current.some(
        (ref) => ref && ref.contains(range.commonAncestorContainer)
      );

      if (isInside) {
        savedRangeRef.current = range.cloneRange();

        const isBold = document.queryCommandState("bold");
        const isItalic = document.queryCommandState("italic");
        const isUnderline = document.queryCommandState("underline");
        const isStrike = document.queryCommandState("strikeThrough");
        const isLeft = document.queryCommandState("justifyLeft");
        const isCenter = document.queryCommandState("justifyCenter");
        const isRight = document.queryCommandState("justifyRight");
        const isJustify = document.queryCommandState("justifyFull");
        const isBullet = document.queryCommandState("insertUnorderedList");
        const isOrdered = document.queryCommandState("insertOrderedList");

        const currentFont = document.queryCommandValue("fontName") || "";
        const currentSize = document.queryCommandValue("fontSize") || "";

        setActiveStyles((prev) => ({
          ...prev,
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
          strike: isStrike,
          alignLeft: isLeft || (!isCenter && !isRight && !isJustify),
          alignCenter: isCenter,
          alignRight: isRight,
          alignJustify: isJustify,
          bulletList: isBullet,
          orderedList: isOrdered,
          fontFamily: currentFont || prev.fontFamily,
          fontSize: currentSize || prev.fontSize,
        }));
      }
    } catch {
      // In case queryCommandState throws in transient browser states
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveStyles();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Helper to extract current HTML from all active page refs
  const getCurrentPagesHtml = (): string[] => {
    return docPages.map((_, idx) => {
      const el = pageRefs.current[idx];
      return el ? el.innerHTML : docPages[idx] || "";
    });
  };

  // Debounced auto-save to browser local storage so work is never lost while editing
  const debouncedSaveDraft = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const currentPages = getCurrentPagesHtml();

      setCurrentLetter((prev) => {
        const updated = {
          ...prev,
          pages: currentPages,
          page1Html: currentPages[0] || "",
          page2Html: currentPages[1] || "",
          isDirty: true,
          updatedAt: new Date().toISOString(),
        };

        setLetters((all) => {
          const newAll = all.map((l) =>
            (updated.id && l.id === updated.id) ||
            (updated.localId && l.localId === updated.localId)
              ? updated
              : l
          );
          saveLocalDrafts(newAll);
          return newAll;
        });

        return updated;
      });
    }, 400);
  };

  // Execute Word Ribbon formatting commands safely without losing selection
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    try {
      const sel = window.getSelection();

      const hasActiveSelection =
        sel &&
        sel.rangeCount > 0 &&
        pageRefs.current.some(
          (ref) => ref && ref.contains(sel.getRangeAt(0).commonAncestorContainer)
        );

      if (!hasActiveSelection) {
        if (savedRangeRef.current) {
          sel?.removeAllRanges();
          sel?.addRange(savedRangeRef.current);
        } else if (pageRefs.current[0]) {
          pageRefs.current[0].focus();
        }
      }


      document.execCommand(command, false, value);

      // Re-save range after format execution
      const newSel = window.getSelection();
      if (newSel && newSel.rangeCount > 0) {
        savedRangeRef.current = newSel.getRangeAt(0).cloneRange();
      }

      updateActiveStyles();
      debouncedSaveDraft();
      setTimeout(updateActiveStyles, 25);
    } catch (e) {
      console.error("Format error:", e);
    }
  };

  const getActiveFontLabel = () => {
    const raw = (activeStyles.fontFamily || "").toLowerCase().replace(/['"]/g, "");
    if (raw.includes("arial")) return "Arial";
    if (raw.includes("georgia")) return "Georgia";
    if (raw.includes("calibri")) return "Calibri";
    if (raw.includes("garamond")) return "Garamond";
    if (raw.includes("times")) return "Times New Roman";
    return "Times New Roman (Official)";
  };

  const getActiveSizeLabel = () => {
    const s = String(activeStyles.fontSize);
    const found = FONT_SIZES.find((item) => item.value === s);
    return found ? found.label : "Normal (12pt)";
  };

  const getButtonClass = (isActive: boolean) =>
    `p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer select-none ${
      isActive
        ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40 font-bold scale-[1.02]"
        : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 active:bg-slate-300"
    }`;

  // Load all applications: Postgres Database Rows + Local Storage Drafts
  const loadLetters = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch saved database rows
      let dbLetters: OfferLetterData[] = [];
      const res = await getJobOfferLettersAction();
      if (res.success && res.letters) {
        dbLetters = res.letters.map((l) => ({
          ...l,
          isSavedToDb: true,
          isDirty: false,
        }));
      }

      // 2. Fetch local storage drafts
      const localDrafts = getLocalDrafts();

      // 3. Merge: Database rows (preserving recent local edits if dirty) + local drafts
      const merged: OfferLetterData[] = [];

      for (const dbl of dbLetters) {
        const localMatch = localDrafts.find((ld) => ld.id === dbl.id);
        if (localMatch && localMatch.isDirty) {
          merged.push({
            ...dbl,
            applicationLabel: localMatch.applicationLabel || dbl.applicationLabel,
            page1Html: localMatch.page1Html || dbl.page1Html,
            page2Html: localMatch.page2Html || dbl.page2Html,
            includeWatermark: localMatch.includeWatermark ?? dbl.includeWatermark,
            isSavedToDb: true,
            isDirty: true,
          });
        } else {
          merged.push(dbl);
        }
      }

      // Append purely local drafts that haven't been saved to DB yet
      for (const ld of localDrafts) {
        const alreadyIn = merged.some((m) => (ld.id && m.id === ld.id) || (ld.localId && m.localId === ld.localId));
        if (!alreadyIn) {
          merged.push({
            ...ld,
            isSavedToDb: false,
            isDirty: true,
          });
        }
      }

      // Fallback if neither DB nor storage has anything
      if (merged.length === 0) {
        const defaultDoc: OfferLetterData = {
          localId: `draft_${Date.now()}`,
          letterNumber: 1,
          applicationLabel: "Application 1",
          isSavedToDb: false,
          isDirty: true,
          status: "Draft",
          includeWatermark: true,
          pages: [DEFAULT_PAGE1_HTML, DEFAULT_PAGE2_HTML],
          page1Html: DEFAULT_PAGE1_HTML,
          page2Html: DEFAULT_PAGE2_HTML,
        };
        merged.push(defaultDoc);
      }

      setLetters(merged);

      // Determine active document
      const savedActiveId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_ACTIVE_ID_KEY) : null;
      let active = merged[0];
      if (savedActiveId) {
        const found = merged.find(
          (m) => String(m.id) === savedActiveId || m.localId === savedActiveId
        );
        if (found) active = found;
      }

      setSelectedLetterId(active.id || active.localId || null);
      setCurrentLetter(active);

      const pagesToSet =
        Array.isArray(active.pages) && active.pages.length > 0
          ? active.pages
          : [active.page1Html || DEFAULT_PAGE1_HTML, active.page2Html || DEFAULT_PAGE2_HTML].filter(
              (p): p is string => typeof p === "string" && p.length > 0
            );
      const finalPages = pagesToSet.length > 0 ? pagesToSet : [DEFAULT_PAGE1_HTML];
      setDocPages(finalPages);

      setTimeout(() => {
        finalPages.forEach((html, idx) => {
          if (pageRefs.current[idx]) {
            pageRefs.current[idx]!.innerHTML = html;
          }
        });
      }, 30);
    } catch (err: any) {
      console.error("Error loading applications:", err);
      showToast("Failed to load applications.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLetters();
  }, []);

  // When selected application changes, populate all pages
  const handleSelectLetter = (letter: OfferLetterData) => {
    const ident = letter.id || letter.localId || null;
    setSelectedLetterId(ident);
    setCurrentLetter(letter);

    if (typeof window !== "undefined" && ident) {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, String(ident));
    }

    const pagesToSet =
      Array.isArray(letter.pages) && letter.pages.length > 0
        ? letter.pages
        : [letter.page1Html || DEFAULT_PAGE1_HTML, letter.page2Html || DEFAULT_PAGE2_HTML].filter(
            (p): p is string => typeof p === "string" && p.length > 0
          );
    const finalPages = pagesToSet.length > 0 ? pagesToSet : [DEFAULT_PAGE1_HTML];
    setDocPages(finalPages);

    setTimeout(() => {
      finalPages.forEach((html, idx) => {
        if (pageRefs.current[idx]) {
          pageRefs.current[idx]!.innerHTML = html;
        }
      });
    }, 30);

    showToast(`Loaded ${letter.applicationLabel || `Application ${letter.letterNumber}`}`);
  };

  // Save whole application into file storage and database
  const handleSaveLetter = async () => {
    setIsSaving(true);
    try {
      const currentPages = getCurrentPagesHtml();
      const p1Html = currentPages[0] || DEFAULT_PAGE1_HTML;
      const p2Html = currentPages[1] || "";

      const payload = {
        id: currentLetter.isSavedToDb && typeof currentLetter.id === "number" ? currentLetter.id : undefined,
        letterNumber: currentLetter.letterNumber,
        applicationLabel: currentLetter.applicationLabel || `Application ${currentLetter.letterNumber || 1}`,
        status: "Saved",
        includeWatermark: currentLetter.includeWatermark ?? true,
        pages: currentPages,
        page1Html: p1Html,
        page2Html: p2Html,
      };

      const res = await saveJobOfferLetterAction(payload);
      if (res.success && res.letter) {
        const savedLetter: OfferLetterData = {
          ...currentLetter,
          id: res.letter.id,
          letterNumber: res.letter.letterNumber || currentLetter.letterNumber,
          applicationLabel: res.letter.applicationLabel || currentLetter.applicationLabel,
          fileUrl: res.letter.fileUrl,
          docUrl: res.letter.docUrl,
          pages: currentPages,
          page1Html: p1Html,
          page2Html: p2Html,
          isSavedToDb: true,
          isDirty: false,
          status: "Saved",
          updatedAt: res.letter.updatedAt || new Date().toISOString(),
        };

        showToast(`Application saved to file storage & database successfully!`, "success");
        setSelectedLetterId(res.letter.id);
        setCurrentLetter(savedLetter);

        // Update list and sync localStorage
        setLetters((prev) => {
          const updated = prev.map((l) =>
            (currentLetter.id && l.id === currentLetter.id) ||
            (currentLetter.localId && l.localId === currentLetter.localId)
              ? savedLetter
              : l
          );
          saveLocalDrafts(updated);
          return updated;
        });

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ACTIVE_ID_KEY, String(res.letter.id));
        }

        await loadLetters();
      } else {
        showToast(res.message || "Failed to save application to database.", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Error saving application", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Revert unsaved local changes and reload clean database row version
  const handleRevertToDb = async () => {
    if (!currentLetter.id) return;
    try {
      const res = await getJobOfferLettersAction();
      if (res.success && res.letters) {
        const dbVersion = res.letters.find((l) => l.id === currentLetter.id);
        if (dbVersion) {
          const pagesToSet =
            Array.isArray(dbVersion.pages) && dbVersion.pages.length > 0
              ? dbVersion.pages
              : [dbVersion.page1Html || DEFAULT_PAGE1_HTML, dbVersion.page2Html || DEFAULT_PAGE2_HTML].filter(
                  (p): p is string => typeof p === "string" && p.length > 0
                );
          const finalPages = pagesToSet.length > 0 ? pagesToSet : [DEFAULT_PAGE1_HTML];

          const reverted: OfferLetterData = {
            ...dbVersion,
            pages: finalPages,
            isSavedToDb: true,
            isDirty: false,
          };
          setCurrentLetter(reverted);
          setDocPages(finalPages);

          setLetters((prev) => {
            const updated = prev.map((l) => (l.id === currentLetter.id ? reverted : l));
            saveLocalDrafts(updated);
            return updated;
          });

          setTimeout(() => {
            finalPages.forEach((p, idx) => {
              if (pageRefs.current[idx]) {
                pageRefs.current[idx]!.innerHTML = p;
              }
            });
          }, 30);

          showToast("Reverted to saved database version.", "success");
        }
      }
    } catch {
      showToast("Failed to revert to database version.", "error");
    }
  };

  // ─── CREATE NEW: JOB LETTER vs CUSTOM LETTER (BLANK WITH LOGO) ───
  const handleCreateNew = (type: "job" | "custom") => {
    const nextNumber =
      letters.length > 0
        ? Math.max(...letters.map((l) => l.letterNumber || (typeof l.id === "number" ? l.id : 1))) + 1
        : 1;
    const label = type === "job" ? `Application ${nextNumber}` : `Custom Letter ${nextNumber}`;
    const initialPages =
      type === "job"
        ? [DEFAULT_PAGE1_HTML, DEFAULT_PAGE2_HTML]
        : [CUSTOM_PAGE1_HTML];
    const localId = `draft_${Date.now()}`;

    const newDraft: OfferLetterData = {
      localId,
      letterNumber: nextNumber,
      applicationLabel: label,
      status: "Draft",
      isSavedToDb: false,
      isDirty: true,
      includeWatermark: true,
      pages: initialPages,
      page1Html: initialPages[0],
      page2Html: initialPages[1] || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setLetters((prev) => {
      const updated = [newDraft, ...prev];
      saveLocalDrafts(updated);
      return updated;
    });

    setSelectedLetterId(localId);
    setCurrentLetter(newDraft);
    setDocPages(initialPages);

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, localId);
    }

    setTimeout(() => {
      initialPages.forEach((html, idx) => {
        if (pageRefs.current[idx]) {
          pageRefs.current[idx]!.innerHTML = html;
        }
      });
    }, 25);

    showToast(
      type === "job"
        ? `Created Application: ${label}`
        : `Created Custom Document: ${label} (blank with logo)`,
      "success"
    );
  };

  // ─── AI GENERATED DOCUMENT (Groq AI: qwen/qwen3.8-27b Fast Inference) ───
  const handleGenerateAILetter = async (target: "new" | "current" = "new") => {
    const docTypePrompt = await showPrompt({
      title: "AI Document Generator (Groq AI)",
      message:
        target === "current"
          ? `What would you like Groq AI to write for "${currentLetter.applicationLabel || "this document"}"?`
          : "What document should Groq AI create? (e.g. Job Offer Letter, Clinical NDA, Consultant Agreement, Experience Certificate, Policy Memo...)",
      placeholder:
        "e.g. 2-page Offer Letter for Clinical Nurse, or Hospital Data Access NDA, or Physician Experience Certificate...",
      confirmText: "Continue",
    });

    if (docTypePrompt === null) return; // User canceled
    const trimmedDocType = docTypePrompt.trim() || "Healthcare Professional Document";

    const candidatePrompt = await showPrompt({
      title: "Recipient / Candidate Name",
      message: "Enter the recipient or candidate's name (or leave blank for placeholder):",
      placeholder: "e.g. Sarah Connor, Dr. John Smith, or Valued Associate...",
      confirmText: "Generate with Groq",
    });

    if (candidatePrompt === null) return; // User canceled
    const recipientName = candidatePrompt.trim() || "Valued Associate";

    setIsGeneratingAI(true);
    setShowNewModal(false);
    showToast("Generating document with Groq AI (Fast)...", "success");

    try {
      const isOfferLetter = /offer\s*letter|job\s*offer|internship/i.test(trimmedDocType);

      const res = await generateApplicationWithAIAction({
        mode: isOfferLetter ? "job" : "custom",
        customPrompt: trimmedDocType,
        role: trimmedDocType.replace(/offer\s*letter|job\s*offer/gi, "").trim() || "Clinical Specialist",
        candidateName: recipientName,
      });

      if (!res.success || !res.pages || res.pages.length === 0) {
        showToast(res.message || "Failed to generate document.", "error");
        return;
      }

      const generatedPages = res.pages;
      const documentLabel = res.label || res.title || `${trimmedDocType.slice(0, 30)} - ${recipientName}`;

      if (target === "current" && currentLetter) {
        // Write generated pages directly into currently open document
        const updatedLetter: OfferLetterData = {
          ...currentLetter,
          applicationLabel:
            currentLetter.applicationLabel?.startsWith("Custom Letter")
              ? documentLabel
              : currentLetter.applicationLabel,
          pages: generatedPages,
          page1Html: generatedPages[0] || "",
          page2Html: generatedPages[1] || "",
          isDirty: true,
        };

        setCurrentLetter(updatedLetter);
        setDocPages(generatedPages);

        setLetters((prev) => {
          const updated = prev.map((l) =>
            (l.id && l.id === currentLetter.id) || (l.localId && l.localId === currentLetter.localId)
              ? { ...l, ...updatedLetter }
              : l
          );
          saveLocalDrafts(updated);
          return updated;
        });

        setTimeout(() => {
          generatedPages.forEach((html, idx) => {
            if (pageRefs.current[idx]) {
              pageRefs.current[idx]!.innerHTML = html;
            }
          });
        }, 35);

        debouncedSaveDraft();
        showToast(
          `Filled "${documentLabel}" with ${generatedPages.length} page${generatedPages.length > 1 ? "s" : ""} via ${res.modelUsed}`,
          "success"
        );
      } else {
        // Create brand new document with all generated pages
        const nextNumber =
          letters.length > 0
            ? Math.max(...letters.map((l) => l.letterNumber || (typeof l.id === "number" ? l.id : 1))) + 1
            : 1;
        const localId = `draft_${Date.now()}`;

        const newDraft: OfferLetterData = {
          localId,
          letterNumber: nextNumber,
          applicationLabel: documentLabel,
          status: "Draft",
          isSavedToDb: false,
          isDirty: true,
          includeWatermark: true,
          pages: generatedPages,
          page1Html: generatedPages[0] || "",
          page2Html: generatedPages[1] || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setLetters((prev) => {
          const updated = [newDraft, ...prev];
          saveLocalDrafts(updated);
          return updated;
        });

        setSelectedLetterId(localId);
        setCurrentLetter(newDraft);
        setDocPages(generatedPages);

        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_ACTIVE_ID_KEY, localId);
        }

        setTimeout(() => {
          generatedPages.forEach((html, idx) => {
            if (pageRefs.current[idx]) {
              pageRefs.current[idx]!.innerHTML = html;
            }
          });
        }, 35);

        showToast(
          `Created "${documentLabel}" (${generatedPages.length} page${generatedPages.length > 1 ? "s" : ""}) via ${res.modelUsed}`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("AI Generation failed:", err);
      showToast(err?.message || "AI Generation failed.", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Add a new blank A4 page (unlimited pages)
  const handleAddPage = () => {
    const currentPages = getCurrentPagesHtml();
    const newPages = [...currentPages, BLANK_PAGE_HTML];
    setDocPages(newPages);
    setCurrentLetter((prev) => ({
      ...prev,
      pages: newPages,
      isDirty: true,
    }));
    setTimeout(() => {
      newPages.forEach((html, i) => {
        if (pageRefs.current[i]) {
          pageRefs.current[i]!.innerHTML = html;
        }
      });
    }, 20);
    debouncedSaveDraft();
    showToast(`Added Page ${newPages.length} (A4)`, "success");
  };

  // Remove a specific page
  const handleRemovePage = (indexToRemove: number) => {
    if (docPages.length <= 1) {
      showToast("A document must have at least one page.", "error");
      return;
    }
    const currentPages = getCurrentPagesHtml();
    const newPages = currentPages.filter((_, idx) => idx !== indexToRemove);
    setDocPages(newPages);
    setTimeout(() => {
      newPages.forEach((html, i) => {
        if (pageRefs.current[i]) {
          pageRefs.current[i]!.innerHTML = html;
        }
      });
    }, 20);
    setCurrentLetter((prev) => ({
      ...prev,
      pages: newPages,
      isDirty: true,
    }));
    debouncedSaveDraft();
    showToast(`Removed Page ${indexToRemove + 1}`, "success");
  };

  // Execute deletion when confirmed in the in-app prompt modal
  const handleConfirmDelete = async () => {
    if (deleteTargetId === null) return;

    try {
      // If it's a numeric ID and was saved to DB, delete from PostgreSQL
      if (typeof deleteTargetId === "number" && deleteTargetId > 0) {
        const res = await deleteJobOfferLetterAction(deleteTargetId);
        if (!res.success) {
          showToast(res.message || "Failed to delete from database.", "error");
          return;
        }
      }

      // Remove from list & local storage
      const remaining = letters.filter(
        (l) => l.id !== deleteTargetId && l.localId !== String(deleteTargetId)
      );
      setLetters(remaining);
      saveLocalDrafts(remaining);

      showToast("Application deleted successfully.", "success");
      setDeleteTargetId(null);

      if (remaining.length > 0) {
        handleSelectLetter(remaining[0]);
      } else {
        handleCreateNew("job");
      }
    } catch {
      showToast("Error deleting application.", "error");
    }
  };


  // Quick Application rename with automatic local storage sync
  const handleUpdateLetterLabel = (id: number | undefined, newLabel: string) => {
    setCurrentLetter((prev) => ({ ...prev, applicationLabel: newLabel, isDirty: true }));
    setLetters((prev) =>
      prev.map((l) =>
        (id && l.id === id) || (currentLetter.localId && l.localId === currentLetter.localId)
          ? { ...l, applicationLabel: newLabel, isDirty: true }
          : l
      )
    );
    debouncedSaveDraft();
  };

  // Print / Save as PDF
  const handlePrint = () => {
    window.print();
  };

  // Export as genuine Microsoft Word Document (.doc)
  const handleExportWord = () => {
    // If the document is already saved on server disk storage and has no unsaved changes, download the exact storage file
    if (currentLetter.docUrl && !currentLetter.isDirty) {
      const link = document.createElement("a");
      link.href = currentLetter.docUrl;
      link.download = `${(currentLetter.applicationLabel || `Application_${currentLetter.id}`).replace(/[^a-zA-Z0-9_-]/g, "_")}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Downloaded synchronized Word document from file storage!", "success");
      return;
    }

    const currentPages = getCurrentPagesHtml();
    const wordPagesHtml = currentPages
      .map((p) => `<div class="word-page">${p}</div>`)
      .join('\n<br clear="all" style="page-break-before:always; mso-break-type:section-break" />\n');

    const wordHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${currentLetter.applicationLabel || "Application"}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 595.3pt 841.9pt; /* A4 */
            margin: 40pt 45pt 40pt 45pt;
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            color: #0f172a;
            line-height: 1.5;
          }
          p { margin: 0 0 10pt 0; }
          ul { margin: 0 0 12pt 0; padding-left: 20pt; }
          li { margin-bottom: 4pt; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${wordPagesHtml}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordHTML], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(currentLetter.applicationLabel || "Application").replace(/[^a-zA-Z0-9_-]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded as Microsoft Word document (.doc)!", "success");
  };

  // Relative navigation
  const handleNavigateRelative = (dir: "prev" | "next") => {
    if (letters.length === 0) return;
    const currentIdx = letters.findIndex(
      (l) => (l.id && l.id === currentLetter.id) || (l.localId && l.localId === currentLetter.localId)
    );
    let nextIdx = dir === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (nextIdx < 0) nextIdx = letters.length - 1;
    if (nextIdx >= letters.length) nextIdx = 0;
    handleSelectLetter(letters[nextIdx]);
  };

  // Filtered applications for sidebar
  const filteredLetters = letters.filter(
    (l) =>
      (l.applicationLabel || "").toLowerCase().includes(searchLetterQuery.toLowerCase()) ||
      String(l.letterNumber || l.id).includes(searchLetterQuery)
  );

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-slate-100/70 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white print:block">
      {/* Print stylesheet to remove browser headers/footers and format pages cleanly */}
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
            size: auto;
          }
          header, aside, nav, .print\\:hidden {
            display: none !important;
          }
          .job-offer-print-sheet {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 800px !important;
            min-height: 100vh !important;
            padding: 16mm 20mm !important;
            box-sizing: border-box !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .job-offer-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold text-white animate-in fade-in slide-in-from-bottom-2 print:hidden ${
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

      {/* ─── CREATE NEW APPLICATION MODAL: JOB LETTER vs CUSTOM LETTER ─── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Create New Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a template format to create your document
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Option 1: Job Letter */}
              <button
                type="button"
                onClick={() => {
                  setShowNewModal(false);
                  handleCreateNew("job");
                }}
                className="flex flex-col items-start p-4 rounded-2xl border-2 border-indigo-100 hover:border-indigo-600 bg-white hover:bg-indigo-50/40 transition-all text-left group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700">Application</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Official SriMatrix Application format with pre-filled terms, clinical details, and signature blocks.
                </div>
                <div className="mt-3.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Official (2 Pages)
                </div>
              </button>

              {/* Option 2: Custom Document */}
              <button
                type="button"
                onClick={() => {
                  setShowNewModal(false);
                  handleCreateNew("custom");
                }}
                className="flex flex-col items-start p-4 rounded-2xl border-2 border-emerald-100 hover:border-emerald-600 bg-white hover:bg-emerald-50/40 transition-all text-left group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">Custom Document</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Completely blank document with official SriMatrix logo at top. Write your own content freely.
                </div>
                <div className="mt-3.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Blank Sheet
                </div>
              </button>

              {/* Option 3: AI Generated Document (Custom or Offer Letter) */}
              <button
                type="button"
                onClick={() => {
                  handleGenerateAILetter("new");
                }}
                className="flex flex-col items-start p-4 rounded-2xl border-2 border-purple-100 hover:border-purple-600 bg-white hover:bg-purple-50/40 transition-all text-left group cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-purple-700">AI Generated</div>
                <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Generate custom letters, contracts, NDAs, or offer letters with dynamic multi-page creation via Groq AI.
                </div>
                <div className="mt-3.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  Groq AI Multi-Page
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
              <span>Unlimited A4 pages can be added anytime</span>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IN-APP DELETE CONFIRMATION MODAL PROMPT (NO BROWSER POPUP) ─── */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 print:hidden">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Delete Application</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this saved application? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LEFT / MAIN AREA: MS WORD STYLE DOCUMENT VIEWPORT ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 print:h-auto print:overflow-visible print:border-none print:w-full print:block">
        
        {/* Top Header Bar: Clean Inputfield ONLY for name (Application 1...) */}
        <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          {/* Left: Navigation and Clean Inputfield ONLY */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleNavigateRelative("prev")}
                title="Previous Application"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                #{currentLetter.letterNumber || currentLetter.id || 1}
              </div>
              <button
                type="button"
                onClick={() => handleNavigateRelative("next")}
                title="Next Application"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Clean Inputfield ONLY for Application Name */}
            <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="text"
                value={currentLetter.applicationLabel || `Application ${currentLetter.letterNumber || 1}`}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateLetterLabel(currentLetter.id, val);
                }}
                placeholder={`Application ${currentLetter.letterNumber || 1}`}
                className="text-sm font-bold text-slate-900 bg-transparent focus:outline-none w-44 sm:w-64 cursor-text"
                title="Application Name"
              />
            </div>

            {/* Storage Status Badge: Saved in DB vs Local Storage & File Storage URL */}
            {currentLetter.isSavedToDb && !currentLetter.isDirty ? (
              <div className="hidden sm:inline-flex items-center gap-2">
                <span
                  title="Document metadata and storage URL recorded in database."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/90 shadow-2xs select-none"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Saved in DB</span>
                </span>
                {(currentLetter.docUrl || currentLetter.fileUrl) && (
                  <a
                    href={currentLetter.docUrl || `/storage/applications/app_${currentLetter.id}.doc`}
                    download={`${(currentLetter.applicationLabel || `Application_${currentLetter.id}`).replace(/[^a-zA-Z0-9_-]/g, "_")}.doc`}
                    title={`Stored at ${currentLetter.fileUrl || `/storage/applications/app_${currentLetter.id}.json`}. Click to download Word document.`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-600">
                      {currentLetter.docUrl?.split("/").pop() || `app_${currentLetter.id}.doc`}
                    </span>
                    <span className="text-[9px] text-indigo-600 font-black bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                      WORD
                    </span>
                  </a>
                )}
              </div>
            ) : (
              <span
                title="Unsaved changes stored in browser local storage. Click 'Save Document' to save to file storage and database."
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/90 shadow-2xs select-none"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Draft in Local Storage</span>
              </span>
            )}
          </div>

          {/* Right Controls: Page view switcher, Reset, Save, Print & Word Export */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* New Document Button (opens modal with 3 options: Job Letter, Custom Blank Letter, or AI Generated) */}
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              title="Create New Application (+)"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>

            {/* AI Generate Button (Groq AI) */}
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={() => handleGenerateAILetter("new")}
              title="Generate New Document with Groq AI (Fast)"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${isGeneratingAI ? "animate-spin" : ""}`} />
              <span>{isGeneratingAI ? "Generating..." : "AI Generate"}</span>
            </button>

            {/* Save Application to Database Row Button */}
            <button
              type="button"
              disabled={isSaving || (currentLetter.isSavedToDb && !currentLetter.isDirty)}
              onClick={handleSaveLetter}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentLetter.isSavedToDb && !currentLetter.isDirty
                  ? "bg-emerald-600 text-white shadow-xs opacity-95 cursor-default"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : currentLetter.isSavedToDb && !currentLetter.isDirty ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{currentLetter.isSavedToDb && !currentLetter.isDirty ? "Saved" : "Save Document"}</span>
            </button>

            {/* Revert to DB Button: shown when an existing database document has unsaved local edits */}
            {currentLetter.isSavedToDb && currentLetter.isDirty && (
              <button
                type="button"
                onClick={handleRevertToDb}
                title="Discard unsaved local changes and reload the saved database row"
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Revert to DB</span>
              </button>
            )}

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="Print or Save as PDF"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF</span>
            </button>

            {/* Download Word Document (.doc) */}
            <button
              type="button"
              onClick={handleExportWord}
              title="Export and download as Microsoft Word document (.doc)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Word (.doc)</span>
            </button>
          </div>
        </div>

        {/* ─── MICROSOFT WORD STYLE FORMATTING TOOLBAR RIBBON ─── */}
        <div className="bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-1.5 flex flex-wrap items-center gap-1 text-slate-700 shrink-0 print:hidden select-none">
          {/* History: Undo / Redo */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("undo");
              }}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded hover:bg-slate-200/80 active:bg-slate-300 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("redo");
              }}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded hover:bg-slate-200/80 active:bg-slate-300 transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Family Selector Dropdown (Non-blurring custom menu) */}
          <div className="relative px-1 border-r border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowFontDropdown((prev) => !prev);
                setShowSizeDropdown(false);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer select-none transition-all"
              title="Font Family"
            >
              <span className="truncate max-w-[130px]">{getActiveFontLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showFontDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowFontDropdown(false)}
                />
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute left-1 top-full mt-1.5 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-40 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Font Family
                  </div>
                  {FONT_OPTIONS.map((font) => {
                    const isSelected = getActiveFontLabel().toLowerCase().includes(font.id);
                    return (
                      <button
                        type="button"
                        key={font.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          executeCommand("fontName", font.value);
                          setActiveStyles((prev) => ({ ...prev, fontFamily: font.value }));
                          setShowFontDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/80 text-indigo-700 font-bold" : "text-slate-700"
                        }`}
                        style={{ fontFamily: font.value }}
                      >
                        <span>{font.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Font Size Selector Dropdown (Non-blurring custom menu) */}
          <div className="relative px-1 border-r border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowSizeDropdown((prev) => !prev);
                setShowFontDropdown(false);
              }}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs cursor-pointer select-none transition-all"
              title="Font Size"
            >
              <span className="truncate max-w-[100px]">{getActiveSizeLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {showSizeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowSizeDropdown(false)}
                />
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute left-1 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-40 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Font Size
                  </div>
                  {FONT_SIZES.map((size) => {
                    const isSelected =
                      String(activeStyles.fontSize) === size.value ||
                      (size.value === "3" && (!activeStyles.fontSize || activeStyles.fontSize === "3"));
                    return (
                      <button
                        type="button"
                        key={size.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          executeCommand("fontSize", size.value);
                          setActiveStyles((prev) => ({ ...prev, fontSize: size.value }));
                          setShowSizeDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/80 text-indigo-700 font-bold" : "text-slate-700"
                        }`}
                      >
                        <span>{size.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Text Styling: Bold, Italic, Underline, Strike with Visible ON/OFF Toggles */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("bold");
              }}
              title={`Bold (Ctrl+B) ${activeStyles.bold ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.bold)}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("italic");
              }}
              title={`Italic (Ctrl+I) ${activeStyles.italic ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.italic)}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("underline");
              }}
              title={`Underline (Ctrl+U) ${activeStyles.underline ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.underline)}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("strikeThrough");
              }}
              title={`Strikethrough ${activeStyles.strike ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.strike)}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment: Left, Center, Right, Justify with Visible Active State */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("justifyLeft");
              }}
              title={`Align Left ${activeStyles.alignLeft ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.alignLeft)}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("justifyCenter");
              }}
              title={`Align Center ${activeStyles.alignCenter ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.alignCenter)}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("justifyRight");
              }}
              title={`Align Right ${activeStyles.alignRight ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.alignRight)}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("justifyFull");
              }}
              title={`Justify ${activeStyles.alignJustify ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.alignJustify)}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists: Bullets & Numbering with Visible Active State */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("insertUnorderedList");
              }}
              title={`Bullet List ${activeStyles.bulletList ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.bulletList)}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                executeCommand("insertOrderedList");
              }}
              title={`Numbered List ${activeStyles.orderedList ? "- Currently ON" : "- Currently OFF"}`}
              className={getButtonClass(activeStyles.orderedList)}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Watermark Toggle */}
          <div className="flex items-center gap-1.5 pl-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 select-none">
              <input
                type="checkbox"
                checked={currentLetter.includeWatermark ?? true}
                onChange={(e) => {
                  setCurrentLetter((prev) => ({ ...prev, includeWatermark: e.target.checked, isDirty: true }));
                  debouncedSaveDraft();
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Watermark</span>
            </label>
          </div>

          {/* AI Write / Fill Current Document Button (Directly in Editor Toolbar) */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingAI}
              onClick={() => handleGenerateAILetter("current")}
              title="Ask Groq AI to generate or fill content for this document"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/90 shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-purple-600 ${isGeneratingAI ? "animate-spin" : ""}`} />
              <span>{isGeneratingAI ? "AI Generating..." : "AI Write / Fill"}</span>
            </button>
          </div>
        </div>

        {/* ─── DESKTOP VIEWPORT: UNLIMITED PAGES CENTERED LIKE MS WORD ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center gap-8 bg-slate-200/70 print:p-0 print:m-0 print:bg-white print:overflow-visible print:block w-full">
          {docPages.map((pageHtml, index) => (
            <div
              key={`page_${index}`}
              className="job-offer-print-sheet relative w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-xl rounded-sm p-10 sm:p-14 sm:px-16 border border-slate-300/60 flex flex-col justify-between print:shadow-none print:border-none print:m-0 print:p-12 print:max-w-none print:min-h-0 job-offer-page-break print:break-after-page"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* Watermark in Center Background: LOGO ONLY, NOT ROTATED */}
              {currentLetter.includeWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06] z-0 overflow-hidden">
                  <div className="text-center transform scale-125">
                    <img
                      src="/srimatrix-health-logo.png"
                      alt="Watermark"
                      className="w-80 sm:w-96 mx-auto grayscale"
                    />
                  </div>
                </div>
              )}

              {/* Word ContentEditable Body */}
              <div
                ref={(el) => {
                  pageRefs.current[index] = el;
                  if (el && !el.innerHTML && pageHtml) {
                    el.innerHTML = pageHtml;
                  }
                }}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onKeyUp={updateActiveStyles}
                onMouseUp={updateActiveStyles}
                onFocus={updateActiveStyles}
                onInput={() => {
                  updateActiveStyles();
                  debouncedSaveDraft();
                }}
                className="relative z-10 space-y-4 text-[14px] leading-relaxed outline-none flex-1 pb-8 cursor-text"
              />

              {/* Page Bottom: Page Size & Page Number + Delete Page option if > 1 page */}
              <div className="relative z-10 pt-4 mt-auto border-t border-slate-200 text-xs text-slate-500 font-sans flex items-center justify-between select-none shrink-0 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Srimatrix Health</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                    A4 (210 × 297 mm)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Page {index + 1} of {docPages.length}
                  </span>
                  {docPages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePage(index)}
                      title="Delete this page"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer print:hidden"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Centered + Icon to Add Unlimited Pages */}
          <div className="w-full max-w-[800px] flex flex-col items-center justify-center pt-2 pb-14 print:hidden">
            <button
              type="button"
              onClick={handleAddPage}
              title="Add New A4 Page"
              className="group flex flex-col items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-110 active:scale-95 transition-all">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                <span>Add Page</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-400 font-medium">A4 (210 × 297 mm)</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ─── RIGHT SIDEBAR: SAVED APPLICATIONS GALLERY ─── */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 h-full print:hidden">
        
        {/* Header with Title and + Dropdown Menu (Job Letter vs Custom Letter) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 tracking-tight">Saved Applications</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {letters.length}
            </span>
          </div>

          {/* + Button: opens modal with Job Letter vs Custom Blank Letter */}
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            title="Create New Document (+)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Minimal Search & Single vs 2-Column Toggle */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchLetterQuery}
              onChange={(e) => setSearchLetterQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg">
            <button
              type="button"
              onClick={() => setSidebarLayout("single")}
              title="Single Card per Row"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                sidebarLayout === "single" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarLayout("grid")}
              title="Grid View (2 Cards per Row)"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                sidebarLayout === "grid" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Gallery Cards Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50/30">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <img
                src="/srimatrix-health-logo.png"
                alt="Loading..."
                className="h-12 w-auto animate-pulse object-contain select-none"
              />
            </div>
          ) : filteredLetters.length === 0 ? (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">No applications found</p>
            </div>
          ) : (
            <div
              className={
                sidebarLayout === "grid"
                  ? "grid grid-cols-2 gap-3"
                  : "flex flex-col gap-4 items-center"
              }
            >
              {filteredLetters.map((letter) => {
                const isSelected =
                  (letter.id && letter.id === currentLetter.id) ||
                  (letter.localId && letter.localId === currentLetter.localId);
                const label = letter.applicationLabel || `Application ${letter.letterNumber || letter.id || 1}`;

                return (
                  <div
                    key={letter.id ? `db_${letter.id}` : `local_${letter.localId}`}
                    onClick={() => handleSelectLetter(letter)}
                    className={`group relative transition-all cursor-pointer flex flex-col items-center ${
                      sidebarLayout === "grid" ? "w-full" : "w-full max-w-[240px]"
                    }`}
                  >
                    {/* Paper Document Card */}
                    <div
                      className={`relative w-full aspect-[1/1.33] bg-white rounded-md border shadow-xs transition-all flex flex-col justify-between p-2 overflow-hidden select-none hover:shadow-md ${
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-500/30 shadow-indigo-100"
                          : "border-slate-300/80 hover:border-slate-400"
                      }`}
                    >
                      {/* Letterhead Preview with DB vs Storage indicator */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                          <div className="flex items-center gap-1">
                            {letter.isSavedToDb ? (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <Database className="w-2.5 h-2.5 text-emerald-600" />
                                <span>DB</span>
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <HardDrive className="w-2.5 h-2.5 text-amber-600" />
                                <span>Storage</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-indigo-600 font-mono">
                            #{letter.letterNumber || letter.id || 1}
                          </span>
                        </div>
                        <div className="space-y-0.5 pt-0.5">
                          <div className="h-1.5 w-14 bg-slate-800/80 rounded-xs" />
                          <div className="h-1 w-full bg-slate-200 rounded-xs" />
                          <div className="h-1 w-4/5 bg-slate-200 rounded-xs" />
                          <div className="h-1 w-full bg-slate-200 rounded-xs" />
                          <div className="h-1 w-3/4 bg-slate-200 rounded-xs" />
                        </div>
                      </div>

                      {/* Footer Preview */}
                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
                        <span className="truncate max-w-[70px]">SriMatrix</span>
                        <span>1/{letter.pages?.length || (letter.page2Html ? 2 : 1)}</span>
                      </div>

                      {/* Delete button: triggers sleek in-app prompt modal */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(letter.id || letter.localId || null);
                        }}
                        title="Delete application"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 absolute top-1 right-1 transition-opacity cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Application Name Label Down Below Paper */}
                    <div className="mt-1.5 w-full flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors w-full justify-center">
                        <input
                          type="text"
                          value={label}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateLetterLabel(letter.id, val);
                          }}
                          className={`text-xs font-bold text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:outline-none px-1 rounded transition-all truncate max-w-[170px] ${
                            isSelected ? "text-indigo-700" : "text-slate-700"
                          }`}
                        />
                      </div>
                      {letter.isSavedToDb && letter.id && (
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <span className="text-[11px]">📁</span>
                          <span>app_{letter.id}.doc</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info: Breakdown of Database Rows vs Local Storage */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{letters.length} Total</span>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{letters.filter((l) => l.isSavedToDb).length} in DB</span>
            <span className="text-slate-300">|</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{letters.filter((l) => !l.isSavedToDb).length} in Storage</span>
          </span>
        </div>
      </div>
    </div>
  );
}
