"use client";

import { useState, useEffect, useRef } from "react";
import {
  getCandidatesSheetAction,
  saveCandidatesSheetAction as rawSaveCandidatesSheetAction,
  deleteCandidateAction,
  bulkDeleteCandidatesAction,
} from "@/app/actions/auth";
import { invalidateOverviewCache } from "@/lib/overviewCache";
import { showConfirm, showPrompt, showAlert } from "@/components/GlobalPromptDialog";

async function saveCandidatesSheetAction(columns: any[], records: any[]) {
  invalidateOverviewCache("candidates");
  return await rawSaveCandidatesSheetAction(columns, records);
}
import {
  Users,
  Search,
  Plus,
  Trash2,
  Eye,
  Edit2,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Download,
  Table,
  Columns,
  Sparkles,
  ArrowRight,
  Mail,
  Calendar,
  Hash,
  Type,
  Tag,
  RefreshCw,
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
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
} from "lucide-react";

export type ColumnType = "text" | "number" | "status" | "email" | "date";

export interface TableColumn {
  id: string;
  name: string;
  type: ColumnType;
}

export interface TableRecord {
  id: string;
  numericId?: number;
  createdAt: string;
  [key: string]: any;
}

const INITIAL_COLUMNS: TableColumn[] = [];

function deduceColumnType(name: string): ColumnType {
  const lower = name.toLowerCase();
  if (lower.includes("email") || lower.includes("mail")) return "email";
  if (lower.includes("status") || lower.includes("stage") || lower.includes("tier")) return "status";
  if (lower.includes("date") || lower.includes("time") || lower.includes("applied")) return "date";
  if (
    lower.includes("salary") ||
    lower.includes("compensation") ||
    lower.includes("pay") ||
    lower.includes("rate") ||
    lower.includes("price") ||
    lower.includes("cost") ||
    lower.includes("amount") ||
    lower.includes("count") ||
    lower.includes("number") ||
    lower.includes("$") ||
    lower.includes("€") ||
    lower.includes("₹") ||
    lower.includes("#")
  ) {
    return "number";
  }
  return "text";
}

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
const createBlankRows = (count: number = 60) =>
  Array.from({ length: count }, () => ({} as Record<string, string>));

export default function CandidatesManagementView() {
  // Main view mode: "table" by default, "excel" when "+ Add Candidate" is pressed
  const [viewMode, setViewMode] = useState<"table" | "excel">("table");

  // Table State
  const [columns, setColumns] = useState<TableColumn[]>(INITIAL_COLUMNS);
  const [records, setRecords] = useState<TableRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);


  // Search & Row Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [drawerRecord, setDrawerRecord] = useState<TableRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Excel Spreadsheet State (No Container, Full Screen, Edge-to-Edge) ──
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  // Default to 60 completely blank rows for edge-to-edge unlimited feel
  const [excelRows, setExcelRows] = useState<Record<string, string>[]>(createBlankRows(60));

  // Active Selected Cell (e.g. { row: 0, col: 0 } = A1)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });

  // Excel Formatting Commands State
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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isAddingRowsRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode]);

  // Fetch authoritative state from PostgreSQL database (candidates_sheets table)
  const refreshCandidates = async () => {
    try {
      const res = await getCandidatesSheetAction();
      if (res.success && Array.isArray(res.columns)) {
        setColumns(res.columns as TableColumn[]);
        setRecords(res.records || []);
      } else {
        setColumns([]);
        setRecords([]);
      }
    } catch (err) {
      console.error("Error syncing candidates from backend DB:", err);
      setColumns([]);
      setRecords([]);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    refreshCandidates();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Called when user clicks "+ Add Candidate" -> Opens Excel editor with existing records + blank rows below
  const handleOpenExcelMode = () => {
    const colNames = columns.map((c) => c.name);
    const effectiveCols = colNames.length > 0 ? colNames : ["First Name", "Last Name", "Email", "Phone", "Location", "Pipeline Stage"];
    setExcelColumns(effectiveCols);

    // Populate existing records so past database records are completely preserved!
    const populatedRows: Record<string, string>[] = (records || []).map((rec) => {
      const rowObj: Record<string, string> = {
        _recordId: rec.id,
        _createdAt: rec.createdAt || "",
      };
      columns.forEach((col) => {
        rowObj[col.name] = rec[col.id] !== undefined && rec[col.id] !== null ? String(rec[col.id]) : "";
      });
      return rowObj;
    });

    // Append 40 empty rows below existing records for adding new entries
    const blankRows = createBlankRows(40);
    const initialRows = [...populatedRows, ...blankRows];

    setExcelRows(initialRows);
    setHistory([initialRows]);
    setHistoryIndex(0);
    setActiveCell({ row: populatedRows.length, col: 0 });
    setViewMode("excel");
  };


  const handleDeleteColumn = async (colId: string) => {
    const target = columns.find((c) => c.id === colId);
    const confirmed = await showConfirm({
      title: "Delete Column",
      message: `Delete column "${target?.name || colId}"? This will remove data for this column from all records.`,
      variant: "danger",
      confirmText: "Delete Column",
    });
    if (!confirmed) return;
    const updatedCols = columns.filter((c) => c.id !== colId);
    setColumns(updatedCols);
    showToast("Column removed.");
    await saveCandidatesSheetAction(updatedCols, records);
  };

  const handleRenameColumn = async (colId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updatedCols = columns.map((c) =>
      c.id === colId ? { ...c, name: trimmed, type: deduceColumnType(trimmed) } : c
    );
    setColumns(updatedCols);
    showToast(`Column renamed to "${trimmed}".`);
    await saveCandidatesSheetAction(updatedCols, records);
  };

  const handleAddTableRow = () => {
    // Open full Excel/Spreadsheet mode so user can type in data directly,
    // instead of creating an empty blank row and sending it to the database.
    handleOpenExcelMode();
  };

  // Push to history for Undo/Redo
  const pushHistory = (newRows: Record<string, string>[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newRows);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setExcelRows(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setExcelRows(history[newIdx]);
    }
  };

  // ── Excel Grid Operations ──
  const handleAddExcelColumn = () => {
    let nextNum = excelColumns.length + 1;
    let newCol = `Column ${nextNum}`;
    while (excelColumns.includes(newCol)) {
      nextNum++;
      newCol = `Column ${nextNum}`;
    }
    const updatedCols = [...excelColumns, newCol];
    setExcelColumns(updatedCols);
    // Auto-scroll to right so newly added column is in view
    setTimeout(() => {
      if (gridContainerRef.current) {
        gridContainerRef.current.scrollLeft = gridContainerRef.current.scrollWidth;
      }
    }, 50);
  };

  const handleRenameExcelColumn = (oldName: string, newName: string, index: number) => {
    const updated = [...excelColumns];
    updated[index] = newName;
    setExcelColumns(updated);

    if (oldName !== newName && oldName.trim()) {
      setExcelRows((prevRows) => {
        const newRows = prevRows.map((row) => {
          const newRow = { ...row };
          if (newRow[oldName] !== undefined) {
            newRow[newName] = newRow[oldName];
            delete newRow[oldName];
          }
          return newRow;
        });
        pushHistory(newRows);
        return newRows;
      });
    }
  };

  const handleDeleteExcelColumn = (colName: string) => {
    if (excelColumns.length <= 1) {
      showAlert({
        title: "Column Required",
        message: "Spreadsheet requires at least one column.",
        variant: "warning",
      });
      return;
    }
    setExcelColumns(excelColumns.filter((c) => c !== colName));
    setExcelRows((prevRows) => {
      const newRows = prevRows.map((row) => {
        const newRow = { ...row };
        delete newRow[colName];
        return newRow;
      });
      pushHistory(newRows);
      return newRows;
    });
  };

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

  // Infinite Scroll Handler: Auto-appends 50 more rows when scrolling near bottom
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

  // Sort Command
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

  // Clear to blank (60 blank rows)
  const handleClearBlank = () => {
    const blank = createBlankRows(60);
    setExcelRows(blank);
    pushHistory(blank);
    showToast("Grid reset to blank.");
  };

  // ── Upload CSV ──
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
            res.push(cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
            cur = "";
          } else {
            cur += ch;
          }
        }
        res.push(cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
        return res;
      };

      const headers = parseCSVLine(lines[0]).filter((h) => h.trim().length > 0);
      if (headers.length === 0) {
        showAlert({
          title: "CSV Header Error",
          message: "Could not detect column headers in CSV.",
          variant: "warning",
        });
        return;
      }

      // Dynamically build and create table columns from uploaded CSV headers
      const uploadedCols: TableColumn[] = headers.map((h, idx) => {
        const existingCol = columns.find(
          (c) => c.name.toLowerCase().trim() === h.toLowerCase().trim()
        );
        return {
          id: existingCol ? existingCol.id : `col_${idx}_${h.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          name: h,
          type: deduceColumnType(h),
        };
      });

      // Combine with existing columns
      const finalCols: TableColumn[] = [...columns];
      uploadedCols.forEach((uc) => {
        if (!finalCols.some((fc) => fc.name.toLowerCase().trim() === uc.name.toLowerCase().trim())) {
          finalCols.push(uc);
        }
      });

      // Parse and map all records for every column
      const parsedRecords: TableRecord[] = lines
        .slice(1)
        .map((line, idx) => {
          const values = parseCSVLine(line);
          const recObj: TableRecord = {
            id: `rec_${Date.now()}_${idx}`,
            createdAt: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          };
          finalCols.forEach((col) => {
            const hIdx = headers.findIndex(
              (h) => h.toLowerCase().trim() === col.name.toLowerCase().trim()
            );
            recObj[col.id] = hIdx !== -1 && values[hIdx] !== undefined ? values[hIdx].trim() : "";
          });
          return recObj;
        })
        .filter((rec) =>
          finalCols.some((col) => rec[col.id] && String(rec[col.id]).trim().length > 0)
        );

      // Append new parsed records to existing records so past database records remain!
      const existingIds = new Set(records.map((r) => r.id));
      const newUniqueRecords = parsedRecords.filter((r) => !existingIds.has(r.id));
      const combinedRecords = [...records, ...newUniqueRecords];

      // Merge columns if CSV introduces new columns
      const existingColNames = new Set(columns.map((c) => c.name.toLowerCase().trim()));
      const mergedCols = [...columns];
      finalCols.forEach((fc) => {
        if (!existingColNames.has(fc.name.toLowerCase().trim())) {
          mergedCols.push(fc);
        }
      });

      setColumns(mergedCols);
      setRecords(combinedRecords);
      setViewMode("table");
      showToast(`Added ${newUniqueRecords.length} new records! Total: ${combinedRecords.length} records.`);
      await saveCandidatesSheetAction(mergedCols, combinedRecords);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Download Format Template (for Excel data entry) ──
  const handleDownloadFormat = () => {
    const colsToExport =
      viewMode === "excel" ? excelColumns : columns.map((c) => c.name);
    if (colsToExport.length === 0) {
      showAlert({
        title: "Template Notice",
        message: "No columns defined for template. Please add columns first.",
        variant: "warning",
      });
      return;
    }

    const header = colsToExport
      .map((c) => `"${c.replace(/"/g, '""')}"`)
      .join(",");

    // Provide 5 empty rows so Excel recognizes the tabular grid layout
    const blankRows = Array.from({ length: 5 }, () =>
      colsToExport.map(() => '""').join(",")
    ).join("\n");

    const csvContent = `${header}\n${blankRows}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidates_template_format.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      "Format template downloaded! Open in Excel, list your candidate records, and upload via 'Upload CSV'."
    );
  };

  // ── Download CSV ──
  const handleDownloadCSV = () => {
    const colsToExport = viewMode === "excel" ? excelColumns : columns.map((c) => c.name);
    if (colsToExport.length === 0) {
      showAlert({
        title: "Export Notice",
        message: "No columns to export.",
        variant: "info",
      });
      return;
    }

    const rowsToExport =
      viewMode === "excel"
        ? excelRows.filter((r) => colsToExport.some((c) => r[c] && r[c].trim().length > 0))
        : records.map((r) => {
            const obj: Record<string, string> = {};
            columns.forEach((col) => {
              obj[col.name] = r[col.id] !== undefined ? String(r[col.id]) : "";
            });
            return obj;
          });

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
    link.download = `candidates_spreadsheet_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded spreadsheet CSV file.");
  };

  // ── Commit Excel Data to Live Table (Database Persistence) ──
  const handleCommitExcelToPage = async () => {
    const validColNames = excelColumns
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (validColNames.length === 0) {
      showAlert({
        title: "Column Required",
        message: "Please define at least one column.",
        variant: "warning",
      });
      return;
    }

    const nonEmpties = excelRows.filter((r) =>
      validColNames.some((colName) => r[colName] && r[colName].trim().length > 0)
    );

    const newCols: TableColumn[] = validColNames.map((name, i) => {
      const existingCol = columns.find(
        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      return {
        id: existingCol ? existingCol.id : `col_${i}_${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name,
        type: deduceColumnType(name),
      };
    });

    if (nonEmpties.length === 0) {
      setColumns(newCols);
      await saveCandidatesSheetAction(newCols, records);
      showToast(`Saved table structure with ${newCols.length} columns.`);
      setViewMode("table");
      return;
    }

    const mappedRecords: TableRecord[] = nonEmpties.map((r, idx) => {
      const recId = r._recordId || `rec_${Date.now()}_${idx}`;
      const recCreatedAt = r._createdAt || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const rec: TableRecord = {
        id: recId,
        createdAt: recCreatedAt,
      };
      newCols.forEach((col) => {
        rec[col.id] = r[col.name] !== undefined ? r[col.name] : (r[col.id] !== undefined ? r[col.id] : "");
      });
      return rec;
    });

    setColumns(newCols);
    setRecords(mappedRecords);
    showToast(`Saved ${newCols.length} columns & ${mappedRecords.length} candidate records!`);
    await saveCandidatesSheetAction(newCols, mappedRecords);
    setViewMode("table");
  };

  // ── Live Table Operations ──
  const handleDeleteRecord = async (id: string) => {
    const confirmed = await showConfirm({
      title: "Delete Candidate Record",
      message: "Are you sure you want to delete this candidate record? This action cannot be undone.",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!confirmed) return;
    const target = records.find((r) => r.id === id);
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    if (drawerRecord?.id === id) setDrawerRecord(null);
    setSelectedRecordIds((prev) => prev.filter((x) => x !== id));
    showToast("Candidate record deleted.");
    if (target?.numericId) {
      await deleteCandidateAction(target.numericId);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    const confirmed = await showConfirm({
      title: "Delete Selected Candidates",
      message: `Are you sure you want to delete ${selectedRecordIds.length} selected candidate record${selectedRecordIds.length > 1 ? "s" : ""}? This action cannot be undone.`,
      variant: "danger",
      confirmText: `Delete ${selectedRecordIds.length} Candidates`,
    });
    if (!confirmed) return;
    const targets = records.filter((r) => selectedRecordIds.includes(r.id));
    const numericIds = targets.map((r) => r.numericId).filter(Boolean) as number[];
    const updated = records.filter((r) => !selectedRecordIds.includes(r.id));
    setRecords(updated);
    if (drawerRecord && selectedRecordIds.includes(drawerRecord.id)) {
      setDrawerRecord(null);
    }
    showToast(`Deleted ${selectedRecordIds.length} candidates.`);
    setSelectedRecordIds([]);
    if (numericIds.length > 0) {
      await bulkDeleteCandidatesAction(numericIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredRecords = records.filter((rec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return columns.some((col) => {
      const val = rec[col.id];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(q);
    });
  });

  const allSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedRecordIds.includes(r.id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map((r) => r.id));
    }
  };

  const getColIcon = (type: ColumnType) => {
    switch (type) {
      case "number":
        return <Hash className="w-3.5 h-3.5 text-blue-500" />;
      case "status":
        return <Tag className="w-3.5 h-3.5 text-emerald-500" />;
      case "email":
        return <Mail className="w-3.5 h-3.5 text-purple-500" />;
      case "date":
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Active cell value for formula bar
  const activeCellValue =
    activeCell && excelColumns[activeCell.col]
      ? excelRows[activeCell.row]?.[excelColumns[activeCell.col]] || ""
      : "";

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Hidden File Input for CSV Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadCSV}
        accept=".csv,text/csv,application/vnd.ms-excel"
        className="hidden"
      />

      {/* Toast Alert */}
      {toastMsg && (
        <div className="absolute top-4 right-6 z-50 p-3 rounded-2xl text-xs flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-semibold">{toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* ── VIEW 1: TABLE VIEW (CANDIDATE TALENT POOL) ──        */}
      {/* ======================================================== */}
      {viewMode === "table" && (
        <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Top Navbar */}
          <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs z-20">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-black text-lg text-slate-900 tracking-tight">
                    Candidate Talent Pool
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    {records.length} {records.length === 1 ? "Candidate" : "Candidates"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Manage applicants, track hiring stages, and coordinate recruitment pipelines
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate, role, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 bg-slate-50/70"
                />
              </div>


              <button
                type="button"
                onClick={handleAddTableRow}
                title="Add new candidate record row"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
                <span>Add Row</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload CSV File"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Upload CSV</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadFormat}
                title="Download blank format template to fill in Excel"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Format</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCSV}
                title="Download candidate data as CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download CSV</span>
              </button>

              {/* "+ Add Candidate" -> Opens Full Edge-to-Edge Excel Mode */}
              <button
                type="button"
                onClick={handleOpenExcelMode}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Candidate</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          <div
            className={`border-b px-6 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors duration-150 shrink-0 ${
              selectedRecordIds.length > 0
                ? "bg-indigo-50/90 border-indigo-100"
                : "bg-slate-50/70 border-slate-200/80"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  selectedRecordIds.length > 0
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-600 font-mono"
                }`}
              >
                {selectedRecordIds.length}
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  selectedRecordIds.length > 0 ? "text-indigo-950" : "text-slate-600"
                }`}
              >
                {selectedRecordIds.length === 0
                  ? "No candidate selected"
                  : `${selectedRecordIds.length} ${
                      selectedRecordIds.length === 1 ? "candidate" : "candidates"
                    } selected`}
              </span>
              <span className="hidden md:inline text-xs text-slate-400">
                {selectedRecordIds.length === 0
                  ? "— Select checkboxes below to manage or delete in bulk"
                  : "— Ready for batch deletion"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedRecordIds.length === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Select All ({filteredRecords.length})
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold opacity-60 cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedRecordIds([])}
                    className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedRecordIds.length})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Full-width Candidates Table */}
          <div ref={tableContainerRef} className="flex-1 w-full overflow-auto bg-slate-50/30">
            <table className="w-full text-left text-xs sm:text-sm min-w-[950px] border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold sticky top-0 z-10 shadow-2xs backdrop-blur-xs">
                <tr>
                  <th className="py-3.5 px-5 w-12 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all candidates"
                      checked={allSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                  </th>
                  <th className="py-3.5 px-3 w-12 text-center">#</th>
                  {columns.map((col) => (
                    <th key={col.id} className="py-3.5 px-6 whitespace-nowrap group">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getColIcon(col.type)}
                          <span className="font-bold text-slate-800 tracking-tight">{col.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Rename Column"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newN = await showPrompt({
                                title: "Rename Column",
                                message: `Enter new header title for "${col.name}":`,
                                defaultValue: col.name,
                                confirmText: "Rename",
                              });
                              if (newN && newN.trim()) handleRenameColumn(col.id, newN.trim());
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Delete Column"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteColumn(col.id);
                            }}
                            className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}

                  <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {columns.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center p-0 border-0">
                      <div
                        className="sticky left-0 flex flex-col items-center gap-3 max-w-md mx-auto py-20 px-4"
                        style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                          <Columns className="w-6 h-6" />
                        </div>
                        <h3 className="font-black text-base text-slate-900">
                          No Columns Defined Yet
                        </h3>
                        <p className="text-xs text-slate-500 text-center leading-relaxed">
                          Upload a CSV spreadsheet to automatically create the table schema and load all records.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Upload CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenExcelMode}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Spreadsheet Mode</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + 3}
                      className="text-slate-400 text-xs sm:text-sm p-0 border-0"
                    >
                      <div
                        className="sticky left-0 flex flex-col items-center justify-center gap-2 text-center py-20 px-4"
                        style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
                      >
                        <p className="font-semibold text-slate-700">
                          {!isLoaded
                            ? "Loading candidates from database..."
                            : records.length === 0
                            ? `Table structure ready (${columns.length} columns defined).`
                            : "No records match your search query."}
                        </p>
                        {isLoaded && records.length === 0 && (
                          <p className="text-xs text-slate-400 max-w-sm text-center">
                            All {columns.length} columns are ready. Click &quot;+ Add Row&quot; or upload a CSV file to add records.
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={handleOpenExcelMode}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Row</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Upload CSV</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, index) => {
                    const isSelected = selectedRecordIds.includes(rec.id);
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setDrawerRecord(rec)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td
                          className="py-3.5 px-5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select row ${index + 1}`}
                            checked={isSelected}
                            onChange={() => handleToggleSelect(rec.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400 font-semibold">
                          {index + 1}
                        </td>

                        {columns.map((col) => {
                          const rawVal =
                            rec[col.id] !== undefined && rec[col.id] !== null && String(rec[col.id]).trim() !== ""
                              ? rec[col.id]
                              : (rec[col.name] !== undefined && rec[col.name] !== null && String(rec[col.name]).trim() !== ""
                                  ? rec[col.name]
                                  : "");
                          const val = String(rawVal).trim();
                          const isEmpty = val.length === 0 || val === "—";

                          return (
                            <td key={col.id} className="py-3.5 px-6 whitespace-nowrap">
                              {isEmpty ? (
                                <span className="text-slate-300 font-normal">—</span>
                              ) : col.type === "status" ? (
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                    val.toLowerCase() === "hired"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : val.toLowerCase() === "offer"
                                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                                      : val.toLowerCase() === "interview"
                                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                      : val.toLowerCase() === "screening"
                                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                                      : val.toLowerCase() === "rejected"
                                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {val}
                                </span>
                              ) : col.type === "email" ? (
                                <a
                                  href={`mailto:${val}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-mono text-xs text-indigo-600 hover:underline"
                                >
                                  {val}
                                </a>
                              ) : col.type === "number" ? (
                                <span className="font-mono font-bold text-indigo-600">
                                  {val}
                                </span>
                              ) : (
                                <span className="text-slate-700 font-medium">{val}</span>
                              )}
                            </td>
                          );
                        })}

                        <td
                          className="py-3.5 px-6 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="View details"
                              onClick={() => setDrawerRecord(rec)}
                              className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Delete record"
                              onClick={() => handleDeleteRecord(rec.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* ======================================================== */}
      {/* ── VIEW 2: AUTHENTIC MICROSOFT EXCEL SPREADSHEET ──       */}
      {/* ── NO CONTAINER, EDGE-TO-EDGE, SLIDES SMOOTHLY ──        */}
      {/* ======================================================== */}
      {viewMode === "excel" && (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden select-none">
          {/* ── 1. Top Green Excel App Bar ── */}
          <div className="bg-[#107c41] text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Excel Spreadsheet</span>
                <span className="text-xs text-white/70">— Candidates_Data.xlsx</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  Blank Mode
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
                onClick={handleCommitExcelToPage}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white text-[#107c41] hover:bg-slate-100 text-xs font-black shadow-sm cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload & Create Table</span>
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

            {/* Structure Commands: Insert Row / Insert Column / Delete Row */}
            <button
              onClick={handleAddExcelRow}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[#107c41]" />
              <span>Insert Row</span>
            </button>
            <button
              onClick={() => handleAddMultipleRows(50)}
              title="Add 50 rows (unlimited grid)"
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[#107c41]" />
              <span>+50 Rows</span>
            </button>
            <button
              onClick={handleAddExcelColumn}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-indigo-600" />
              <span>Insert Column</span>
            </button>
            <button
              onClick={handleDeleteSelectedRow}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete Row</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Sort Commands */}
            <button
              onClick={() => handleSort("asc")}
              title="Sort Column A to Z"
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
              <span>Sort A-Z</span>
            </button>
            <button
              onClick={() => handleSort("desc")}
              title="Sort Column Z to A"
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-slate-700 cursor-pointer"
            >
              <ArrowUpZA className="w-3.5 h-3.5 text-blue-600" />
              <span>Sort Z-A</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Clear Blank */}
            <button
              onClick={handleClearBlank}
              className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded font-semibold text-slate-600 cursor-pointer"
              title="Reset grid to 60 blank rows"
            >
              <RefreshCw className="w-3 h-3 text-indigo-600" />
              <span>Clear Blank</span>
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            {/* Download Format in Ribbon */}
            <button
              onClick={handleDownloadFormat}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-bold text-emerald-800 cursor-pointer transition-colors shadow-2xs"
              title="Download CSV format template with current columns for Excel data entry"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download Format</span>
            </button>
          </div>

          {/* ── 3. Formula Bar (fx) & Active Cell Box ── */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white border-b border-slate-300 text-xs shrink-0 select-none">
            {/* Active Cell Coordinates (e.g. A1, B3, C7) */}
            <div className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-300 text-center font-mono font-bold text-slate-800 text-[11px]">
              {getExcelColumnLetter(activeCell.col)}
              {activeCell.row + 1}
            </div>

            {/* fx Symbol */}
            <div className="px-1 text-slate-400 font-serif italic font-bold text-xs select-none">
              fx
            </div>

            <div className="h-4 w-px bg-slate-300" />

            {/* Formula Input */}
            <input
              type="text"
              value={activeCellValue}
              onChange={(e) => {
                const colName = excelColumns[activeCell.col];
                if (colName) {
                  handleCellChange(activeCell.row, colName, e.target.value);
                }
              }}
              placeholder="Cell contents or formula..."
              className="flex-1 px-2 py-0.5 bg-transparent border-0 focus:outline-none text-slate-900 font-mono text-xs"
            />
          </div>

          {/* ── 4. Edge-to-Edge Spreadsheet Grid (Slidable to Any Column) ── */}
          <div
            ref={gridContainerRef}
            onScroll={handleGridScroll}
            className="flex-1 w-full overflow-auto bg-white relative overscroll-none"
            style={{ overscrollBehavior: "none", overscrollBehaviorX: "none" }}
          >
            <table className="border-collapse text-xs select-none min-w-full">
              {/* Table Header */}
              <thead className="sticky top-0 z-30 shadow-xs">
                {/* 1st Header Row: Excel Column Letters A, B, C, D, E... */}
                <tr className="bg-[#e1dfdd] text-slate-600 border-b border-slate-300">
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

                {/* 2nd Header Row: Column Names (Editable) */}
                <tr className="bg-[#f3f2f1] text-slate-800 border-b-2 border-slate-400">
                  <th className="sticky left-0 z-40 bg-[#f3f2f1] w-12 min-w-[48px] py-1.5 text-center font-mono font-bold text-slate-500 border-r border-slate-300">
                    Col
                  </th>

                  {excelColumns.map((colName, colIdx) => (
                    <th
                      key={`col_name_${colIdx}`}
                      className="w-48 min-w-[180px] p-1 border-r border-slate-300 bg-[#f3f2f1] group relative"
                    >
                      <div className="flex items-center justify-between gap-1 px-1">
                        <input
                          type="text"
                          value={colName}
                          onChange={(e) =>
                            handleRenameExcelColumn(colName, e.target.value, colIdx)
                          }
                          placeholder={`Column ${colIdx + 1}`}
                          className="w-full px-1.5 py-1 font-bold text-slate-900 bg-transparent rounded hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors text-xs"
                        />
                        <button
                          type="button"
                          title={`Delete column ${colName}`}
                          onClick={() => handleDeleteExcelColumn(colName)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
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
                      className="sticky left-0 z-20 w-12 min-w-[48px] py-1 px-1 text-center font-mono text-[11px] font-bold text-slate-500 bg-[#f3f2f1] border-r border-slate-300 select-none group-hover:bg-[#e1dfdd]"
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

                    {/* Blank cell under "+" column */}
                    <td className="w-14 min-w-[56px] border-r border-slate-200 bg-slate-50/50" />
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
                <span>Sheet1 (Candidates)</span>
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
                Ready | {excelRows.length} rows (Unlimited) × {excelColumns.length} columns | Auto-expands on scroll &rarr;
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
                onClick={handleCommitExcelToPage}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-[#107c41] hover:bg-[#0c6b37] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload & Create Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-Over Candidate Details Drawer ── */}
      {drawerRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerRecord(null)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {(drawerRecord.col_name || "CD").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {drawerRecord.col_name || "Candidate Details"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {drawerRecord.col_position || "Candidate Record"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerRecord(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Candidate Info Cards */}
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {columns.map((col) => (
                    <div
                      key={col.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {col.name}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5 break-words">
                        {drawerRecord[col.id] || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteRecord(drawerRecord.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Candidate</span>
              </button>
              <button
                type="button"
                onClick={() => setDrawerRecord(null)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
