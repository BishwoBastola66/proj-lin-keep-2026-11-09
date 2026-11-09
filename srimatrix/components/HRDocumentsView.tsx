"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  FolderOpen,
  Plus,
  Search,
  Upload,
  Trash2,
  FileText,
  FileCheck2,
  FileSpreadsheet,
  Download,
  X,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  getHRDocumentsAction,
  createHRDocumentAction,
  deleteHRDocumentAction,
} from "@/app/actions/auth";

export interface DBHRDocument {
  id: number;
  title: string;
  category: string;
  fileName: string;
  fileSize: string;
  fileUrl: string | null;
  uploadedBy: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function HRDocumentsView() {
  const [documents, setDocuments] = useState<DBHRDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<string>("Agreements");
  const [formFileName, setFormFileName] = useState("");
  const [formStatus, setFormStatus] = useState<string>("Verified");
  const [formNotes, setFormNotes] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getHRDocumentsAction();
      if (res.success && res.data) {
        setDocuments(res.data as DBHRDocument[]);
      } else {
        setDocuments([]);
      }
    } catch (err: any) {
      console.error("Failed to load HR documents:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === "All" || doc.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [documents, searchQuery, categoryFilter]);

  const counts = useMemo(() => {
    return {
      total: documents.length,
      agreements: documents.filter((d) => d.category === "Agreements").length,
      taxForms: documents.filter((d) => d.category === "Tax Forms").length,
      certifications: documents.filter((d) => d.category === "Certifications").length,
    };
  }, [documents]);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    startTransition(async () => {
      const res = await createHRDocumentAction({
        title: formTitle.trim(),
        category: formCategory,
        fileName: formFileName.trim() || `${formTitle.trim().toLowerCase().replace(/\s+/g, "_")}.pdf`,
        fileSize: "1.1 MB",
        uploadedBy: "HR Administration",
        status: formStatus,
        notes: formNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setDocuments((prev) => [res.data as DBHRDocument, ...prev]);
        setShowUploadModal(false);
        setFormTitle("");
        setFormFileName("");
        setFormCategory("Agreements");
        setFormStatus("Verified");
        setFormNotes("");
      } else {
        alert(res.message || "Failed to save document.");
      }
    });
  };

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`Delete document "${title}" from database?`)) {
      startTransition(async () => {
        const res = await deleteHRDocumentAction(id);
        if (res.success) {
          setDocuments((prev) => prev.filter((d) => d.id !== id));
        } else {
          alert(res.message || "Failed to delete document.");
        }
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
              Documents
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents, files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-64 focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed shrink-0 select-none shadow-2xs"
            title="Document upload is currently under construction"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Document</span>
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
              Total Documents
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
              {counts.total}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
              Agreements
            </span>
            <span className="text-xs sm:text-sm font-black text-indigo-700 font-mono mt-0.5 block">
              {counts.agreements}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Tax Forms
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.5 block">
              {counts.taxForms}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Certifications
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-700 font-mono mt-0.5 block">
              {counts.certifications}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 sm:px-8 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {["All", "Agreements", "Tax Forms", "Certifications", "Policies"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              categoryFilter === cat
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="flex-1 w-full overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Loading documents from database...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 sm:px-6">Document Name</th>
                <th className="py-2.5 px-2 sm:px-6">Category</th>
                <th className="py-2.5 px-2 sm:px-6">Created Date</th>
                <th className="py-2.5 px-2 sm:px-6">File Size</th>
                <th className="py-2.5 px-2 sm:px-6">Status</th>
                <th className="py-2.5 px-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 text-xs px-4">
                    No documents found in database. Document upload is currently under construction.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 sm:px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal truncate">
                            {doc.fileName}
                          </div>
                          {doc.notes && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                              {doc.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-6">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono text-slate-600 text-xs">
                      {new Date(doc.createdAt).toISOString().split("T")[0]}
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono text-slate-500 text-xs">
                      {doc.fileSize}
                    </td>
                    <td className="py-3 px-2 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                          doc.status === "Verified"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : doc.status === "Active"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => alert(`Accessing "${doc.fileName}"...`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.title)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete document from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                <span>Save Document to Database</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Clinical Services Agreement 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Agreements">Agreements</option>
                    <option value="Tax Forms">Tax Forms</option>
                    <option value="Certifications">Certifications</option>
                    <option value="Policies">Policies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Active">Active</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  File Attachment
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">Choose a file or enter name</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, XLSX up to 25MB</p>
                  <input
                    type="file"
                    className="hidden"
                    id="doc-upload-input"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormFileName(e.target.files[0].name);
                        if (!formTitle) setFormTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }}
                  />
                  <label
                    htmlFor="doc-upload-input"
                    className="mt-2 inline-block px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                  >
                    Browse Files
                  </label>
                  {formFileName && (
                    <p className="text-[11px] font-mono text-indigo-600 font-bold mt-2">
                      Selected: {formFileName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annual renewal required"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
