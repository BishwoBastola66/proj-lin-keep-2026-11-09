"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  User,
  Bed,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Upload,
  Download,
  Table,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  ArrowDownAZ,
  ArrowUpZA,
  CheckCircle2,
} from "lucide-react";
import {
  getSrimatrixDirectoryAction,
  deleteSrimatrixRecordAction,
  bulkSaveSrimatrixAction,
} from "@/app/actions/auth";
import { showConfirm, showAlert } from "@/components/GlobalPromptDialog";

// Convert column index 0, 1, 2... to Excel letters A, B, C... AA, AB...
function getExcelColumnLetter(colIndex: number): string {
  let letter = "";
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Generate blank rows
const createBlankRows = (count: number = 40) =>
  Array.from({ length: count }, () => ({} as Record<string, string>));

const DEFAULT_EXCEL_COLS = [
  "Facility Name",
  "Entity Type",
  "Administrator",
  "Phone",
  "Email",
  "Beds Capacity",
  "Address",
  "City",
  "State",
  "County",
  "Zip Code",
  "Priority Region",
];

export default function SrimatrixDirectoryView() {
  // Main view mode: "table" by default, "excel" when Spreadsheet Mode or Excel is activated
  const [viewMode, setViewMode] = useState<"table" | "excel">("table");

  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "Facility" | "Candidate">("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingNewRecordsMode, setIsAddingNewRecordsMode] = useState(false);

  // ── Excel Spreadsheet State ──
  const [excelColumns, setExcelColumns] = useState<string[]>(DEFAULT_EXCEL_COLS);
  const [excelRows, setExcelRows] = useState<Record<string, string>[]>(createBlankRows(40));
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [isCommitting, setIsCommitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [formatState, setFormatState] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: "left" | "center" | "right";
  }>({
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  });

  // Undo / Redo History
  const [history, setHistory] = useState<Record<string, string>[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isAddingRowsRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const pushHistory = (newRows: Record<string, string>[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newRows);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setExcelRows(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setExcelRows(next);
    }
  };

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await getSrimatrixDirectoryAction(750);
      setFacilities(data);
    } catch (e) {
      console.error("Failed to load srimatrix facilities:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ── Open Full Excel Mode with Existing Records Pre-populated ──
  const handleOpenFullExcelMode = () => {
    const populatedRows: Record<string, string>[] = (facilities || []).map((f) => ({
      _recordId: String(f.id),
      "Facility Name": f.facilityName || `${f.firstName} ${f.lastName}` || "",
      "Entity Type": f.type || "Facility",
      "Administrator": f.administrator || "",
      "Phone": f.phone || "",
      "Email": f.email || "",
      "Beds Capacity": f.beds !== null && f.beds !== undefined ? String(f.beds) : "",
      "Address": f.address || "",
      "City": f.city || "",
      "State": f.state || "",
      "County": f.county || "",
      "Zip Code": f.zipCode || "",
      "Priority Region": f.isPriorityRegion ? "Yes" : "No",
    }));

    const blankRows = createBlankRows(40);
    const initialRows = [...populatedRows, ...blankRows];
    setExcelColumns(DEFAULT_EXCEL_COLS);
    setExcelRows(initialRows);
    setHistory([initialRows]);
    setHistoryIndex(0);
    setActiveCell({ row: populatedRows.length, col: 0 });
    setIsAddingNewRecordsMode(false);
    setViewMode("excel");
  };

  // ── Open Blank Excel Mode Directly for Adding New Records ──
  const handleOpenBlankExcelMode = () => {
    const blankRows = createBlankRows(50);
    setExcelColumns(DEFAULT_EXCEL_COLS);
    setExcelRows(blankRows);
    setHistory([blankRows]);
    setHistoryIndex(0);
    setActiveCell({ row: 0, col: 0 });
    setIsAddingNewRecordsMode(true);
    setViewMode("excel");
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this record from the directory?")) return;
    setIsDeleting(true);
    try {
      const res = await deleteSrimatrixRecordAction(id);
      if (res.success) {
        setFacilities((prev) => prev.filter((f) => f.id !== id));
        setSelectedItem(null);
        showToast("Record removed.");
      } else {
        alert(res.message || "Failed to delete record");
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Excel Actions ──
  const handleAddExcelRow = () => {
    const newRows = [...excelRows, {}];
    setExcelRows(newRows);
    pushHistory(newRows);
  };

  const handleAddMultipleRows = (count: number = 50) => {
    const newRows = [...excelRows, ...createBlankRows(count)];
    setExcelRows(newRows);
    pushHistory(newRows);
    showToast(`Added ${count} more rows to spreadsheet.`);
  };

  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 300 && !isAddingRowsRef.current) {
      isAddingRowsRef.current = true;
      setExcelRows((prev) => [...prev, ...createBlankRows(50)]);
      setTimeout(() => {
        isAddingRowsRef.current = false;
      }, 150);
    }
  };

  const handleDeleteExcelRow = (index: number) => {
    const newRows = excelRows.filter((_, i) => i !== index);
    setExcelRows(newRows);
    pushHistory(newRows);
  };

  const handleDeleteSelectedRow = () => {
    if (activeCell) {
      handleDeleteExcelRow(activeCell.row);
    }
  };

  const handleCellChange = (rowIndex: number, colName: string, value: string) => {
    setExcelRows((prevRows) => {
      const updated = [...prevRows];
      updated[rowIndex] = { ...updated[rowIndex], [colName]: value };
      return updated;
    });
  };

  const handleSort = (direction: "asc" | "desc") => {
    if (!excelColumns[activeCell.col]) return;
    const colName = excelColumns[activeCell.col];
    const sorted = [...excelRows].sort((a, b) => {
      const valA = (a[colName] || "").toLowerCase();
      const valB = (b[colName] || "").toLowerCase();
      return direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    setExcelRows(sorted);
    pushHistory(sorted);
    showToast(`Sorted column ${colName} ${direction.toUpperCase()}`);
  };

  const handleClearBlank = () => {
    const blank = createBlankRows(50);
    setExcelRows(blank);
    pushHistory(blank);
    showToast("Grid reset to blank.");
  };

  const handleUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const parseCSVLine = (line: string): string[] => {
        const res: string[] = [];
        let cur = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"' && (i === 0 || line[i - 1] !== "\\")) {
            inQuotes = !inQuotes;
          } else if (ch === "," && !inQuotes) {
            res.push(cur.trim());
            cur = "";
          } else {
            cur += ch;
          }
        }
        res.push(cur.trim());
        return res;
      };

      const headers = parseCSVLine(lines[0]);
      const parsedRows: Record<string, string>[] = lines.slice(1).map((line) => {
        const vals = parseCSVLine(line);
        const row: Record<string, string> = {};
        DEFAULT_EXCEL_COLS.forEach((col) => {
          const idx = headers.findIndex(
            (h) => h.toLowerCase().trim() === col.toLowerCase().trim()
          );
          row[col] = idx !== -1 && vals[idx] !== undefined ? vals[idx] : "";
        });
        return row;
      });

      const updated = [...parsedRows, ...createBlankRows(20)];
      setExcelRows(updated);
      pushHistory(updated);
      showToast(`Loaded ${parsedRows.length} rows from CSV.`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadFormat = () => {
    const header = excelColumns.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
    const blankRows = Array.from({ length: 5 }, () =>
      excelColumns.map(() => '""').join(",")
    );
    const csvContent = [header, ...blankRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `srimatrix_directory_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded directory template.");
  };

  const handleDownloadCSV = () => {
    const colsToExport = excelColumns;
    const rowsToExport = excelRows.filter((r) =>
      colsToExport.some((c) => r[c] && r[c].trim().length > 0)
    );

    const header = colsToExport.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
    const rowLines = rowsToExport.map((row) =>
      colsToExport
        .map((c) => `"${(row[c] || "").toString().replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [header, ...rowLines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `srimatrix_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded directory CSV file.");
  };

  // ── Commit Excel Data to PostgreSQL Database ──
  const handleCommitExcelToPage = async () => {
    setIsCommitting(true);
    try {
      const nonEmpties = excelRows.filter((r) =>
        excelColumns.some((col) => r[col] && r[col].trim().length > 0)
      );

      if (nonEmpties.length === 0) {
        showToast("No records to save.");
        setViewMode("table");
        return;
      }

      const res = await bulkSaveSrimatrixAction(nonEmpties);
      if (res.success) {
        showToast(
          isAddingNewRecordsMode
            ? `Successfully combined ${res.addedCount || nonEmpties.length} new records into directory!`
            : res.message || "Directory successfully updated!"
        );
        await loadData();
        setViewMode("table");
      } else {
        showAlert({
          title: "Save Failed",
          message: res.message || "Could not save directory.",
          variant: "danger",
        });
      }
    } catch (err: any) {
      console.error("Save directory spreadsheet error:", err);
      showAlert({
        title: "Error",
        message: err?.message || "Failed to save directory.",
        variant: "danger",
      });
    } finally {
      setIsCommitting(false);
    }
  };

  const statesList = useMemo(() => {
    const set = new Set<string>();
    facilities.forEach((f) => {
      if (f.state) set.add(f.state);
    });
    return Array.from(set).sort();
  }, [facilities]);

  const filteredList = useMemo(() => {
    return facilities.filter((item) => {
      if (selectedType !== "all" && item.type !== selectedType) return false;
      if (selectedState !== "all" && item.state !== selectedState) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (item.facilityName || `${item.firstName} ${item.lastName}`).toLowerCase();
      const admin = (item.administrator || "").toLowerCase();
      const city = (item.city || "").toLowerCase();
      const county = (item.county || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();

      return (
        name.includes(q) ||
        admin.includes(q) ||
        city.includes(q) ||
        county.includes(q) ||
        phone.includes(q)
      );
    });
  }, [facilities, selectedType, selectedState, searchQuery]);

  const stats = useMemo(() => {
    const total = facilities.length;
    const facCount = facilities.filter((f) => f.type === "Facility").length;
    const totalBeds = facilities.reduce((acc, f) => acc + (f.beds || 0), 0);
    const priorityCount = facilities.filter((f) => f.isPriorityRegion).length;
    return { total, facCount, totalBeds, priorityCount };
  }, [facilities]);

  // Current Active Cell value for Formula Bar
  const activeColName = excelColumns[activeCell.col] || "";
  const activeCellValue =
    excelRows[activeCell.row] && activeColName
      ? excelRows[activeCell.row][activeColName] || ""
      : "";

  return (
    <div className="h-full flex flex-col bg-slate-50/70 overflow-hidden relative">
      {/* Hidden file input for CSV uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadCSV}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Floating Toast notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── 1. FULL MICROSOFT EXCEL SPREADSHEET MODE ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {viewMode === "excel" ? (
        <div className="h-full flex flex-col bg-white overflow-hidden select-none font-sans">
          {/* ── 1. Top Green Excel App Header ── */}
          <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Excel Spreadsheet</span>
                <span className="text-xs text-white/70">
                  — {isAddingNewRecordsMode ? "New_Directory_Records.xlsx (Blank Mode)" : "Srimatrix_Healthcare_Directory.xlsx (All Records)"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono font-medium">
                  {isAddingNewRecordsMode ? "Add & Combine Mode" : "Online Mode"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                title="Upload filled CSV spreadsheet"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadFormat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer transition-colors border border-white/20 shadow-xs"
                title="Download blank template formatted for Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Download Format</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
                title="Export filled spreadsheet data to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Back to Table
              </button>
              <button
                type="button"
                disabled={isCommitting}
                onClick={handleCommitExcelToPage}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white text-[#107c41] hover:bg-slate-100 text-xs font-black shadow-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#107c41]" />
                    <span>{isAddingNewRecordsMode ? "Save & Combine to Directory" : "Upload & Save to Directory"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── 2. Excel Ribbon Commands Toolbar ── */}
          <div className="px-3 py-1.5 bg-[#f3f2f1] border-b border-slate-300 flex flex-wrap items-center gap-1 text-xs shrink-0 select-none">
            {/* Undo / Redo */}
            <button
              onClick={handleUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              title="Redo (Ctrl+Y)"
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Font / Formatting Commands */}
            <button
              onClick={() => setFormatState((s) => ({ ...s, bold: !s.bold }))}
              title="Bold"
              className={`p-1.5 rounded cursor-pointer ${
                formatState.bold ? "bg-slate-300 text-slate-900 font-black" : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFormatState((s) => ({ ...s, italic: !s.italic }))}
              title="Italic"
              className={`p-1.5 rounded cursor-pointer ${
                formatState.italic ? "bg-slate-300 text-slate-900" : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFormatState((s) => ({ ...s, underline: !s.underline }))}
              title="Underline"
              className={`p-1.5 rounded cursor-pointer ${
                formatState.underline ? "bg-slate-300 text-slate-900" : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Alignment Commands */}
            <button
              onClick={() => setFormatState((s) => ({ ...s, align: "left" }))}
              title="Align Left"
              className={`p-1.5 rounded cursor-pointer ${
                formatState.align === "left" ? "bg-slate-300 text-slate-900" : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFormatState((s) => ({ ...s, align: "center" }))}
              title="Align Center"
              className={`p-1.5 rounded cursor-pointer ${
                formatState.align === "center" ? "bg-slate-300 text-slate-900" : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFormatState((s) => ({ ...s, align: "right" }))}
              title="Align Right"
              className={`p-1.5 rounded cursor-pointer ${
                formatState.align === "right" ? "bg-slate-300 text-slate-900" : "hover:bg-slate-200 text-slate-700"
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Add Row Commands */}
            <button
              type="button"
              onClick={handleAddExcelRow}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
              title="Add a new blank row at bottom"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>Row</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMultipleRows(50)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold cursor-pointer transition-colors"
              title="Add 50 blank rows"
            >
              <span>+50 Rows</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedRow}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-100 text-rose-700 font-semibold cursor-pointer transition-colors"
              title="Delete currently active row"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Row</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Sort Commands */}
            <button
              type="button"
              onClick={() => handleSort("asc")}
              className="flex items-center gap-1 p-1.5 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              title="Sort active column A to Z"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleSort("desc")}
              className="flex items-center gap-1 p-1.5 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
              title="Sort active column Z to A"
            >
              <ArrowUpZA className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              type="button"
              onClick={handleClearBlank}
              className="px-2 py-1 rounded hover:bg-slate-200 text-slate-600 font-medium cursor-pointer"
              title="Reset spreadsheet to blank"
            >
              Reset to Blank
            </button>
          </div>

          {/* ── 3. Formula Bar & Name Box ── */}
          <div className="px-3 py-1 bg-[#f3f2f1] border-b border-slate-300 flex items-center gap-2 text-xs shrink-0 select-none">
            {/* Active Cell Coordinates e.g. A1, B4 */}
            <div className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-center text-slate-800 text-xs shadow-2xs">
              {getExcelColumnLetter(activeCell.col)}
              {activeCell.row + 1}
            </div>

            <span className="font-serif italic font-bold text-slate-500 text-sm px-1">
              fx
            </span>

            {/* Formula Input Box */}
            <input
              type="text"
              value={activeCellValue}
              onChange={(e) => {
                if (activeColName) {
                  handleCellChange(activeCell.row, activeColName, e.target.value);
                }
              }}
              placeholder="Formula or cell content..."
              className="flex-1 px-2.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs shadow-2xs"
            />
          </div>

          {/* ── 4. Edge-to-Edge Excel Spreadsheet Grid Canvas ── */}
          <div
            ref={gridContainerRef}
            onScroll={handleGridScroll}
            className="flex-1 overflow-auto bg-slate-100 relative min-h-0"
          >
            <table className="border-collapse table-fixed w-max bg-white text-xs select-text">
              <thead>
                {/* 1st Header Row: Column Letters A, B, C... */}
                <tr className="bg-[#e1dfdd] text-slate-600 border-b border-slate-300 sticky top-0 z-30 shadow-2xs">
                  <th className="sticky left-0 z-40 bg-[#e1dfdd] w-12 min-w-[48px] py-1 text-center font-mono font-bold text-[11px] border-r border-slate-300">
                    #
                  </th>
                  {excelColumns.map((colName, colIdx) => (
                    <th
                      key={`letter_${colIdx}`}
                      className="w-48 min-w-[180px] py-1 px-2 text-center font-mono font-bold text-[11px] text-slate-600 border-r border-slate-300 bg-[#e1dfdd]"
                    >
                      {getExcelColumnLetter(colIdx)}
                    </th>
                  ))}
                </tr>

                {/* 2nd Header Row: Column Names */}
                <tr className="bg-[#f3f2f1] text-slate-800 border-b-2 border-slate-400 sticky top-[25px] z-30 shadow-2xs">
                  <th className="sticky left-0 z-40 bg-[#f3f2f1] w-12 min-w-[48px] py-1.5 text-center font-mono font-bold text-slate-500 border-r border-slate-300">
                    Col
                  </th>

                  {excelColumns.map((colName, colIdx) => (
                    <th
                      key={`col_name_${colIdx}`}
                      className="w-48 min-w-[180px] p-1 border-r border-slate-300 bg-[#f3f2f1] group relative"
                    >
                      <div className="px-2 py-1 font-bold text-slate-900 text-xs truncate text-left">
                        {colName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Excel Grid Rows */}
              <tbody>
                {excelRows.map((row, rowIdx) => (
                  <tr
                    key={`excel_row_${rowIdx}`}
                    className="border-b border-slate-300 hover:bg-emerald-50/20 group h-8"
                  >
                    {/* Frozen Sticky Left Column: Row Index Number */}
                    <td
                      onClick={() => setActiveCell({ row: rowIdx, col: activeCell.col })}
                      className="sticky left-0 z-20 w-12 min-w-[48px] py-1 px-1 text-center font-mono text-[11px] font-bold text-slate-500 bg-[#f3f2f1] border-r border-slate-300 select-none group-hover:bg-[#e1dfdd] cursor-pointer"
                    >
                      <span>{rowIdx + 1}</span>
                    </td>

                    {/* Dynamic Cells */}
                    {excelColumns.map((colName, colIdx) => {
                      const isCellActive =
                        activeCell.row === rowIdx && activeCell.col === colIdx;

                      return (
                        <td
                          key={`cell_${rowIdx}_${colIdx}`}
                          onClick={() => setActiveCell({ row: rowIdx, col: colIdx })}
                          className={`w-48 min-w-[180px] p-0 border-r border-slate-200 relative bg-white transition-all ${
                            isCellActive
                              ? "outline outline-2 outline-[#107c41] z-10 bg-emerald-50/15"
                              : ""
                          }`}
                        >
                          <input
                            type="text"
                            value={row[colName] || ""}
                            onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
                            onChange={(e) =>
                              handleCellChange(rowIdx, colName, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (rowIdx >= excelRows.length - 2) {
                                  setExcelRows((prev) => [...prev, ...createBlankRows(20)]);
                                }
                                setActiveCell({ row: rowIdx + 1, col: colIdx });
                              } else if (e.key === "ArrowDown") {
                                if (rowIdx >= excelRows.length - 2) {
                                  setExcelRows((prev) => [...prev, ...createBlankRows(20)]);
                                }
                                if (rowIdx < excelRows.length - 1) {
                                  setActiveCell({ row: rowIdx + 1, col: colIdx });
                                }
                              } else if (e.key === "ArrowUp" && rowIdx > 0) {
                                setActiveCell({ row: rowIdx - 1, col: colIdx });
                              } else if (e.key === "ArrowRight" && colIdx < excelColumns.length - 1) {
                                setActiveCell({ row: rowIdx, col: colIdx + 1 });
                              } else if (e.key === "ArrowLeft" && colIdx > 0) {
                                setActiveCell({ row: rowIdx, col: colIdx - 1 });
                              }
                            }}
                            className={`w-full h-full px-2 py-1 text-xs text-slate-900 bg-transparent focus:outline-none ${
                              formatState.bold ? "font-bold" : "font-normal"
                            } ${formatState.italic ? "italic" : ""} ${
                              formatState.underline ? "underline" : ""
                            } text-${formatState.align}`}
                          />

                          {/* Excel Active Cell Green Handle Dot */}
                          {isCellActive && (
                            <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[#107c41] pointer-events-none" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 5. Bottom Excel Sheet Status Bar ── */}
          <div className="px-4 py-2 bg-[#f3f2f1] border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none text-xs">
            {/* Sheet Tabs & Row Insert */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-white border border-slate-300 border-b-0 rounded-t font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#107c41]" />
                <span>Sheet1 (Srimatrix Directory)</span>
              </div>
              <button
                type="button"
                onClick={handleAddExcelRow}
                title="Insert 1 row"
                className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleAddMultipleRows(50)}
                title="Add 50 rows (unlimited grid)"
                className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-mono text-[10px] font-bold cursor-pointer transition-colors"
              >
                +50 Rows
              </button>
              <div className="h-4 w-px bg-slate-300 mx-1" />
              <span className="text-[11px] font-mono text-slate-500">
                Ready | {excelRows.length} rows × {excelColumns.length} columns | Auto-expands on scroll &rarr;
              </span>
            </div>

            {/* Commit / Save Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCommitting}
                onClick={handleCommitExcelToPage}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#107c41] hover:bg-[#0c6b37] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload &amp; Save to Directory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────── */
        /* ── 2. STANDARD TABLE VIEW ── */
        /* ─────────────────────────────────────────────────────────── */
        <>
          {/* Top Header */}
          <div className="bg-white border-b border-slate-200/90 px-4 sm:px-8 py-4 sm:py-5 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Srimatrix
                    </h1>
                    <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                      {facilities.length} Active Records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Master directory of healthcare facilities and administrators
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={handleOpenFullExcelMode}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Open full Excel spreadsheet view with all directory records"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Spreadsheet Mode</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenBlankExcelMode}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Directly open a blank Excel sheet to add records and combine them"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Record</span>
                </button>
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 max-w-xl">
              <div className="bg-slate-50/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Records</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50/90 rounded-2xl p-2.5 sm:p-3 border border-slate-100">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">Healthcare Facilities</span>
                <p className="text-lg sm:text-xl font-black text-indigo-600 mt-0.5">{stats.facCount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search facility name, administrator, county, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/90 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={selectedType}
                onChange={(e: any) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/90 text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="Facility">Facility</option>
                <option value="Candidate">Candidate</option>
              </select>

              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200/90 text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="all">All States ({statesList.length})</option>
                {statesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container - Edge-to-Edge out of container */}
          <div className="flex-1 overflow-auto bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 sm:py-3.5 px-3 sm:px-4 pl-3.5 sm:pl-6 text-left">Facility / Entity</th>
                    <th className="py-3 sm:py-3.5 px-2 sm:px-4 text-center sm:text-left whitespace-nowrap">Type</th>
                    <th className="py-3 sm:py-3.5 px-4 hidden md:table-cell">Location</th>
                    <th className="py-3 sm:py-3.5 px-4 hidden lg:table-cell">Administrator</th>
                    <th className="py-3 sm:py-3.5 px-4 hidden xl:table-cell">Contact</th>
                    <th className="py-3 sm:py-3.5 px-4 hidden lg:table-cell">Beds</th>
                    <th className="py-3 sm:py-3.5 px-4 hidden sm:table-cell">Stage</th>
                    <th className="py-3 sm:py-3.5 px-3 sm:px-4 pr-3.5 sm:pr-6 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        <img
                          src="/srimatrix-health-logo.png"
                          alt="Loading..."
                          className="h-12 w-auto mx-auto mb-2 animate-pulse object-contain select-none"
                        />
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        No matching healthcare records found.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const name = item.facilityName || `${item.firstName} ${item.lastName}`;
                      const initial = (name || "H").charAt(0).toUpperCase();

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 pl-3.5 sm:pl-6">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-black flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors text-xs sm:text-sm">
                                {initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 truncate text-xs sm:text-sm">{name}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-normal truncate mt-0.5">
                                  {(item.city || item.state) && (
                                    <span className="truncate text-slate-500 font-medium md:hidden">
                                      {item.city ? `${item.city}, ` : ""}{item.state || ""}
                                    </span>
                                  )}
                                  {(item.city || item.state) && item.ownershipType && (
                                    <span className="text-slate-300 md:hidden">•</span>
                                  )}
                                  {item.ownershipType && (
                                    <span className="truncate uppercase">{item.ownershipType}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 sm:py-3.5 px-2 sm:px-4 text-center sm:text-left whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block ${
                                item.type === "Facility"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-purple-50 text-purple-700 border border-purple-200/60"
                              }`}
                            >
                              {item.type || "Facility"}
                            </span>
                          </td>

                          <td className="py-3 sm:py-3.5 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {item.city ? `${item.city}, ` : ""}
                                {item.state || ""}
                                {item.county ? ` (${item.county})` : ""}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 sm:py-3.5 px-4 text-slate-800 hidden lg:table-cell">
                            <div className="truncate max-w-[180px]">
                              {item.administrator || "—"}
                            </div>
                          </td>

                          <td className="py-3 sm:py-3.5 px-4 hidden xl:table-cell">
                            <div className="space-y-0.5">
                              {item.phone && (
                                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.phone}</span>
                                </div>
                              )}
                              {item.email && (
                                <div className="flex items-center gap-1 text-[11px] text-indigo-600 truncate max-w-[180px]">
                                  <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="truncate">{item.email}</span>
                                </div>
                              )}
                              {!item.phone && !item.email && <span className="text-slate-400">—</span>}
                            </div>
                          </td>

                          <td className="py-3 sm:py-3.5 px-4 font-bold text-slate-900 font-mono hidden lg:table-cell">
                            {item.beds !== null && item.beds !== undefined ? item.beds : "—"}
                          </td>

                          <td className="py-3 sm:py-3.5 px-4 hidden sm:table-cell">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              {item.pipelineStage || "Lead"}
                            </span>
                          </td>

                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 pr-3.5 sm:pr-6 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="px-2.5 py-1 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-xs transition-colors cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── Details Modal / Drawer ── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {selectedItem.facilityName || `${selectedItem.firstName} ${selectedItem.lastName}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedItem.type || "Facility"} &bull; {selectedItem.city || ""}, {selectedItem.state || ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Administrator</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedItem.administrator || "N/A"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedItem.phone || "N/A"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
                  <p className="font-mono font-bold text-indigo-600 mt-0.5 truncate">{selectedItem.email || "N/A"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Beds Capacity</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedItem.beds || "N/A"}</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedItem.address || "N/A"}
                  {selectedItem.city ? `, ${selectedItem.city}` : ""}
                  {selectedItem.state ? `, ${selectedItem.state}` : ""}
                  {selectedItem.zipCode ? ` ${selectedItem.zipCode}` : ""}
                </p>
                {selectedItem.county && (
                  <p className="text-[11px] text-slate-500 mt-0.5">County: {selectedItem.county}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">License Status</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedItem.licenseStatus || "N/A"}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Ownership Type</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedItem.ownershipType || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteRecord(selectedItem.id)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete Record"}</span>
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
