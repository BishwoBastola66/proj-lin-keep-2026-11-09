"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Printer,
  X,
  Loader2,
  ExternalLink,
  ChevronDown,
  Building,
  CreditCard,
  Send,
} from "lucide-react";
import {
  getInvoicesAction,
  createInvoiceAction,
  updateInvoiceStatusAction,
  deleteInvoiceAction,
  type InvoiceLineItem,
} from "@/app/actions/auth";

export interface DBInvoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  tax: string;
  totalAmount: string;
  status: string;
  paidDate: string | null;
  paymentMethod: string | null;
  lineItems: InvoiceLineItem[];
  notes: string | null;
  terms: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function InvoicingManagementView() {
  const [invoices, setInvoices] = useState<DBInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<DBInvoice | null>(null);

  // Form State
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formClientName, setFormClientName] = useState("");
  const [formClientEmail, setFormClientEmail] = useState("");
  const [formClientAddress, setFormClientAddress] = useState("");
  const [formIssueDate, setFormIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [formStatus, setFormStatus] = useState("Draft");
  const [formNotes, setFormNotes] = useState("");
  const [formTerms, setFormTerms] = useState(
    "Net 30. Payment remittance to SriMatrix Health LLC."
  );

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: "line-1",
      description: "Clinical Healthcare Staffing Coverage",
      hoursOrQty: 40,
      rate: 75,
      amount: 3000,
      servicePeriod: "",
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getInvoicesAction();
      if (res.success && res.data) {
        setInvoices(res.data as DBInvoice[]);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute subtotal, tax, and total for the active form
  const computedSubtotal = useMemo(() => {
    return lineItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  }, [lineItems]);

  const computedTotal = computedSubtotal; // 0% default sales tax for clinical staffing

  // KPI calculations
  const kpis = useMemo(() => {
    const totalInvoiced = invoices
      .filter((inv) => inv.status !== "Cancelled")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

    const paidTotal = invoices
      .filter((inv) => inv.status === "Paid")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

    const pendingTotal = invoices
      .filter((inv) => inv.status === "Pending Payment" || inv.status === "Sent")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);

    const activeCount = invoices.length;

    return {
      totalInvoiced,
      paidTotal,
      pendingTotal,
      activeCount,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.clientEmail &&
          inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus =
        statusFilter === "All" || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Line item handlers
  const handleUpdateLineItem = (
    index: number,
    field: keyof InvoiceLineItem,
    value: any
  ) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const cur = { ...updated[index], [field]: value };
      if (field === "hoursOrQty" || field === "rate") {
        const qty = field === "hoursOrQty" ? Number(value) || 0 : cur.hoursOrQty;
        const rt = field === "rate" ? Number(value) || 0 : cur.rate;
        cur.amount = qty * rt;
      }
      updated[index] = cur;
      return updated;
    });
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: "line-" + Date.now(),
        description: "",
        hoursOrQty: 1,
        rate: 50,
        amount: 50,
        servicePeriod: "",
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Open Create Modal with auto-numbered invoice
  const openCreateModal = () => {
    const nextSeq = invoices.length + 1;
    const formattedNum = `INV-2026-${String(nextSeq).padStart(3, "0")}`;
    setFormInvoiceNumber(formattedNum);
    setFormClientName("");
    setFormClientEmail("");
    setFormClientAddress("");
    setFormIssueDate(new Date().toISOString().split("T")[0]);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormDueDate(d.toISOString().split("T")[0]);
    setFormStatus("Draft");
    setFormNotes("");
    setLineItems([
      {
        id: "line-1",
        description: "Clinical Healthcare Staffing Coverage",
        hoursOrQty: 40,
        rate: 75,
        amount: 3000,
        servicePeriod: "",
      },
    ]);
    setShowCreateModal(true);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formInvoiceNumber.trim() || !formClientName.trim()) return;

    startTransition(async () => {
      const res = await createInvoiceAction({
        invoiceNumber: formInvoiceNumber.trim(),
        clientName: formClientName.trim(),
        clientEmail: formClientEmail.trim() || undefined,
        clientAddress: formClientAddress.trim() || undefined,
        issueDate: formIssueDate,
        dueDate: formDueDate,
        subtotal: computedSubtotal,
        tax: 0,
        totalAmount: computedTotal,
        status: formStatus,
        lineItems,
        notes: formNotes.trim() || undefined,
        terms: formTerms.trim() || undefined,
      });

      if (res.success && res.data) {
        setInvoices((prev) => [res.data as DBInvoice, ...prev]);
        setShowCreateModal(false);
      } else {
        alert(res.message || "Failed to create invoice.");
      }
    });
  };

  const handleStatusChange = (
    id: number,
    newStatus: string,
    paymentMethod?: string
  ) => {
    startTransition(async () => {
      const res = await updateInvoiceStatusAction(
        id,
        newStatus,
        newStatus === "Paid" ? new Date().toISOString().split("T")[0] : null,
        paymentMethod
      );
      if (res.success && res.data) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? (res.data as DBInvoice) : inv))
        );
        if (selectedInvoice?.id === id) {
          setSelectedInvoice(res.data as DBInvoice);
        }
      } else {
        alert(res.message || "Failed to update status.");
      }
    });
  };

  const handleDeleteInvoice = (id: number, invoiceNum: string) => {
    if (window.confirm(`Delete invoice ${invoiceNum} from database?`)) {
      startTransition(async () => {
        const res = await deleteInvoiceAction(id);
        if (res.success) {
          setInvoices((prev) => prev.filter((i) => i.id !== id));
          if (selectedInvoice?.id === id) setSelectedInvoice(null);
        } else {
          alert(res.message || "Failed to delete invoice.");
        }
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      {/* Top Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
                Invoicing &amp; Billing
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-64 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="button"
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed shrink-0 select-none shadow-2xs"
            title="Invoice generation is currently under construction"
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Generate Invoice</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-bold">
              Under Construction
            </span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Bar */}
      <div className="px-4 sm:px-8 py-2.5 bg-slate-50/70 border-b border-slate-200/80 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Invoiced
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
              ${kpis.totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Paid to Date
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono mt-0.5 block">
              ${kpis.paidTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Pending Payment
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-700 font-mono mt-0.5 block">
              ${kpis.pendingTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Invoices
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono mt-0.5 block">
              {kpis.activeCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-4 sm:px-8 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {["All", "Draft", "Sent", "Pending Payment", "Paid", "Overdue"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              statusFilter === st
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-medium">Loading invoices directly from database...</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 sm:px-6">Invoice #</th>
                <th className="py-2.5 px-2 sm:px-6">Client Facility</th>
                <th className="py-2.5 px-2 sm:px-6">Issue Date</th>
                <th className="py-2.5 px-2 sm:px-6">Due Date</th>
                <th className="py-2.5 px-2 sm:px-6">Amount</th>
                <th className="py-2.5 px-2 sm:px-6">Status</th>
                <th className="py-2.5 px-3 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 text-xs px-4">
                    No invoices found in database. Invoice creation is currently under construction.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 sm:px-6">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{inv.invoiceNumber}</span>
                      </button>
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-bold text-slate-900">
                      <div>
                        <div>{inv.clientName}</div>
                        {inv.clientEmail && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">
                            {inv.clientEmail}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono text-slate-600 text-xs">
                      {inv.issueDate}
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono text-slate-900 text-xs font-semibold">
                      {inv.dueDate}
                    </td>
                    <td className="py-3 px-2 sm:px-6 font-mono font-bold text-slate-900">
                      ${parseFloat(inv.totalAmount || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-2 sm:px-6">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer focus:outline-hidden ${
                          inv.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : inv.status === "Pending Payment"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : inv.status === "Sent"
                            ? "bg-sky-100 text-sky-800 border-sky-300"
                            : inv.status === "Overdue"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Pending Payment">Pending Payment</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="View / Print Invoice Slip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete invoice from database"
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

      {/* Generate Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Generate Client Invoice in Database</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateInvoice}
              className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Invoice # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formInvoiceNumber}
                    onChange={(e) => setFormInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Pending Payment">Pending Payment</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client Healthcare Facility *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memorial Regional Hospital"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Billing Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ap@memorialregional.org"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Client Billing Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7500 Fannin St, Suite 400, Houston, TX 77054"
                  value={formClientAddress}
                  onChange={(e) => setFormClientAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formIssueDate}
                    onChange={(e) => setFormIssueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Itemized Clinical Shifts &amp; Services
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {lineItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Service / Shift Description"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateLineItem(idx, "description", e.target.value)
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="Hours"
                          value={item.hoursOrQty}
                          onChange={(e) =>
                            handleUpdateLineItem(idx, "hoursOrQty", e.target.value)
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-center focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-xs text-slate-400 font-mono">
                            $
                          </span>
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) =>
                              handleUpdateLineItem(idx, "rate", e.target.value)
                            }
                            className="w-full pl-5 pr-2 py-1 rounded-lg border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-xs text-slate-800">
                        ${(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          disabled={lineItems.length === 1}
                          className="text-slate-300 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 px-2 text-xs">
                    <span className="font-bold text-slate-500">Invoice Total Due:</span>
                    <span className="text-base font-black font-mono text-emerald-700">
                      ${computedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Remittance Terms &amp; Notes
                </label>
                <textarea
                  rows={2}
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Invoice to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Printable Slip / Detailed Preview Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Header Toolbar */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-800">
                  {selectedInvoice.invoiceNumber}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    selectedInvoice.status === "Paid"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : selectedInvoice.status === "Pending Payment"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div className="p-8 space-y-6 overflow-y-auto bg-white" id="invoice-printable-slip">
              {/* Top Branding & Metadata */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    SriMatrix Health Staffing
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Clinical Placement &amp; Healthcare Workforce Services
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Houston, TX • Contact: billing@srimatrix.com
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-slate-900 block">
                    INVOICE
                  </span>
                  <span className="text-xs font-mono text-slate-500 block">
                    #{selectedInvoice.invoiceNumber}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                    <div>
                      <strong className="text-slate-700">Issue Date:</strong> {selectedInvoice.issueDate}
                    </div>
                    <div>
                      <strong className="text-slate-700">Due Date:</strong> {selectedInvoice.dueDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Billed To (Healthcare Facility)
                </span>
                <div className="font-bold text-sm text-slate-900">
                  {selectedInvoice.clientName}
                </div>
                {selectedInvoice.clientAddress && (
                  <div className="text-xs text-slate-600 mt-0.5">
                    {selectedInvoice.clientAddress}
                  </div>
                )}
                {selectedInvoice.clientEmail && (
                  <div className="text-xs text-indigo-600 font-mono mt-0.5">
                    {selectedInvoice.clientEmail}
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-2 text-center">Hours / Qty</th>
                      <th className="py-2.5 px-2 text-right">Hourly Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 ? (
                      selectedInvoice.lineItems.map((item, i) => (
                        <tr key={item.id || i}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            <div>{item.description}</div>
                            {item.servicePeriod && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                Period: {item.servicePeriod}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                            {item.hoursOrQty}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                            ${Number(item.rate || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ${Number(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          Healthcare Services
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">
                      ${parseFloat(selectedInvoice.subtotal || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / Regulatory Fee:</span>
                    <span className="font-mono">
                      ${parseFloat(selectedInvoice.tax || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Due:</span>
                    <span className="font-mono text-emerald-700 font-black">
                      ${parseFloat(selectedInvoice.totalAmount || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remittance & Terms */}
              {selectedInvoice.terms && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                  <strong className="text-slate-700 block mb-0.5">Payment Terms:</strong>
                  {selectedInvoice.terms}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
