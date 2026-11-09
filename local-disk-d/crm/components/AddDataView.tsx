"use client";

import { useState, useRef, useEffect } from 'react';
import { Save, FileSpreadsheet, Plus, Database, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

const COLUMNS = {
  Candidate: [
    { key: 'first_name', label: 'First Name', width: '120px' },
    { key: 'last_name', label: 'Last Name', width: '120px' },
    { key: 'email', label: 'Email', width: '180px' },
    { key: 'phone', label: 'Phone', width: '120px' },
    { key: 'education', label: 'Education', width: '150px' },
    { key: 'work_authorization', label: 'Work Auth', width: '120px' },
    { key: 'graduation_date', label: 'Grad Date', width: '120px' },
    { key: 'license_status', label: 'License', width: '120px' },
    { key: 'country', label: 'Country', width: '100px' },
    { key: 'state', label: 'State', width: '100px' },
    { key: 'city', label: 'City', width: '120px' },
    { key: 'zip_code', label: 'Zip Code', width: '100px' },
    { key: 'availability_date', label: 'Avail Date', width: '120px' },
  ],
  Client: [
    { key: 'first_name', label: 'First Name', width: '120px' },
    { key: 'last_name', label: 'Last Name', width: '120px' },
    { key: 'email', label: 'Email', width: '180px' },
    { key: 'phone', label: 'Phone', width: '120px' },
    { key: 'city', label: 'City', width: '120px' },
  ],
  Srimatic: [
    { key: 'facility_name', label: 'Facility Name', width: '160px' },
    { key: 'first_name', label: 'First Name', width: '120px' },
    { key: 'last_name', label: 'Last Name', width: '120px' },
    { key: 'email', label: 'Email', width: '180px' },
    { key: 'phone', label: 'Phone', width: '120px' },
    { key: 'address', label: 'Address', width: '180px' },
    { key: 'city', label: 'City', width: '120px' },
    { key: 'county', label: 'County', width: '120px' },
    { key: 'state', label: 'State', width: '100px' },
    { key: 'zip_code', label: 'Zip Code', width: '100px' },
    { key: 'administrator', label: 'Administrator', width: '150px' },
    { key: 'beds', label: 'Beds', width: '80px' },
    { key: 'ownership_type', label: 'Ownership Type', width: '150px' },
  ]
};

const createEmptyRow = (type: 'Candidate' | 'Client' | 'Srimatic') => {
  const base = { type };
  COLUMNS[type].forEach(col => {
    (base as any)[col.key] = '';
  });
  return base;
};

export default function AddDataView() {
  const [activeTab, setActiveTab] = useState<'Candidate' | 'Client' | 'Srimatic'>('Candidate');
  const [rows, setRows] = useState<any[]>(Array(20).fill(null).map(() => createEmptyRow('Candidate')));
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // When tab changes, we recreate the empty rows completely with the new schema
  useEffect(() => {
    setRows(Array(20).fill(null).map(() => createEmptyRow(activeTab)));
    setSelectedRows(new Set());
    setSelectedCols(new Set());
  }, [activeTab]);

  const updateCell = (rowIndex: number, columnKey: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [columnKey]: value };
    setRows(newRows);
  };

  const handlePaste = (e: React.ClipboardEvent, startRow: number, startColIndex: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const parsedRows = pasteData.split('\n').map(r => r.split('\t'));
    const newRows = [...rows];

    let r = startRow;
    for (const rowData of parsedRows) {
      if (rowData.length === 1 && rowData[0].trim() === '') continue; // skip empty lines
      if (r >= newRows.length) {
        newRows.push(createEmptyRow(activeTab));
      }
      
      let c = startColIndex;
      for (const cellData of rowData) {
        if (c < COLUMNS[activeTab].length) {
          const key = COLUMNS[activeTab][c].key;
          newRows[r] = { ...newRows[r], [key]: cellData.trim() };
        }
        c++;
      }
      r++;
    }
    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (document.activeElement?.tagName === 'INPUT') {
        return;
      }
      
      if (selectedRows.size > 0 || selectedCols.size > 0) {
        e.preventDefault();
        
        let newRows = rows.filter((_, i) => !selectedRows.has(i));
        
        if (newRows.length === 0) {
          newRows = Array(20).fill(null).map(() => createEmptyRow(activeTab));
        }
        
        if (selectedCols.size > 0) {
          newRows = newRows.map(r => {
            const newRow = { ...r };
            for (const col of selectedCols) {
              newRow[col] = '';
            }
            return newRow;
          });
        }
        
        setRows(newRows);
        setSelectedRows(new Set());
        setSelectedCols(new Set());
      }
    }
  };

  const toggleRow = (index: number, multi: boolean) => {
    const newSelected = multi ? new Set(selectedRows) : new Set<number>();
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    setSelectedCols(new Set());
    containerRef.current?.focus();
  };

  const toggleCol = (key: string, multi: boolean) => {
    const newSelected = multi ? new Set(selectedCols) : new Set<string>();
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedCols(newSelected);
    setSelectedRows(new Set());
    containerRef.current?.focus();
  };

  const handleSave = async () => {
    const validRows = rows.filter(r => r.first_name?.trim() || r.last_name?.trim() || r.email?.trim() || r.facility_name?.trim());
    if (validRows.length === 0) {
      showToast("No valid data to save.", 'info');
      return;
    }

    setSaving(true);
    try {
      const inserts = validRows.map(r => {
        // Only include fields that belong to the specific table
        if (activeTab === 'Candidate') {
          return {
            first_name: r.first_name, last_name: r.last_name, email: r.email, phone: r.phone,
            education: r.education, work_authorization: r.work_authorization, graduation_date: r.graduation_date || null,
            license_status: r.license_status, state: r.state, country: r.country, city: r.city, zip_code: r.zip_code,
            availability_date: r.availability_date || null, pipeline_stage: 'Lead'
          };
        } else if (activeTab === 'Client') {
          return {
            first_name: r.first_name, last_name: r.last_name, email: r.email, phone: r.phone, city: r.city, pipeline_stage: 'Lead'
          };
        } else {
          return {
            facility_name: r.facility_name, first_name: r.first_name, last_name: r.last_name, email: r.email, phone: r.phone,
            address: r.address, city: r.city, county: r.county, state: r.state, zip_code: r.zip_code, administrator: r.administrator,
            beds: r.beds ? parseInt(r.beds) : null, ownership_type: r.ownership_type, pipeline_stage: 'Lead'
          };
        }
      });
      
      const targetTable = activeTab === 'Candidate' ? 'candidates' : activeTab === 'Client' ? 'clients' : 'srimatric';
      const { error } = await supabase.from(targetTable).insert(inserts);
      if (error) throw error;
      
      showToast(`Successfully saved ${validRows.length} records!`, 'success');
      // Reset grid
      setRows(Array(20).fill(null).map(() => createEmptyRow(activeTab)));
    } catch (err: any) {
      console.error(err);
      showToast('Error saving data: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addMoreRows = () => {
    setRows([...rows, ...Array(10).fill(null).map(() => createEmptyRow(activeTab))]);
  };

  return (
    <div 
      className="h-full flex flex-col w-full bg-white outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={containerRef}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Add Data
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Click a row number or column header to select it, then press <kbd className="bg-slate-200 px-1.5 py-0.5 rounded shadow-sm border border-slate-300 font-mono text-[10px]">Delete</kbd> to remove data. Hold <kbd className="bg-slate-200 px-1.5 py-0.5 rounded shadow-sm border border-slate-300 font-mono text-[10px]">Ctrl</kbd> to select multiple.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All Records'}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {(['Candidate', 'Client', 'Srimatic'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2",
                  activeTab === tab 
                    ? "border-indigo-600 text-indigo-700 bg-indigo-50/50" 
                    : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto no-scrollbar bg-white relative">
          <table className="text-sm text-left border-collapse table-fixed select-none min-w-max w-full">
            <thead>
              <tr>
                <th 
                  className="w-12 border-b border-r border-slate-300 bg-slate-200 sticky top-0 z-20 text-center text-xs text-slate-500 font-medium py-2 shadow-sm cursor-pointer hover:bg-slate-300"
                  onClick={() => { setSelectedRows(new Set()); setSelectedCols(new Set()); }}
                >
                  #
                </th>
                {COLUMNS[activeTab].map(col => (
                  <th 
                    key={col.key} 
                    onClick={(e) => toggleCol(col.key, e.ctrlKey || e.metaKey || e.shiftKey)}
                    className={clsx(
                      "border-b border-r border-slate-300 sticky top-0 z-10 px-3 py-2 font-semibold text-slate-700 truncate shadow-sm cursor-pointer transition-colors",
                      selectedCols.has(col.key) ? "bg-indigo-100 border-indigo-300 text-indigo-800" : "bg-slate-100 hover:bg-slate-200"
                    )}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIndex) => (
                <tr key={rIndex} className="transition-colors">
                  <td 
                    onClick={(e) => toggleRow(rIndex, e.ctrlKey || e.metaKey || e.shiftKey)}
                    className={clsx(
                      "border-b border-r border-slate-300 text-center text-xs cursor-pointer py-1.5 font-medium transition-colors sticky left-0 z-10",
                      selectedRows.has(rIndex) ? "bg-indigo-100 text-indigo-700 border-indigo-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    {rIndex + 1}
                  </td>
                  {COLUMNS[activeTab].map((col, cIndex) => {
                    const isSelectedRow = selectedRows.has(rIndex);
                    const isSelectedCol = selectedCols.has(col.key);
                    const isSelected = isSelectedRow || isSelectedCol;
                    return (
                      <td 
                        key={col.key} 
                        className={clsx(
                          "border-b border-r border-slate-300 p-0 relative transition-colors",
                          isSelected ? "bg-indigo-50/50" : ""
                        )}
                      >
                        <input
                          type="text"
                          value={row[col.key] || ''}
                          onChange={(e) => updateCell(rIndex, col.key, e.target.value)}
                          onPaste={(e) => handlePaste(e, rIndex, cIndex)}
                          onFocus={() => {
                            setSelectedRows(new Set());
                            setSelectedCols(new Set());
                          }}
                          className={clsx(
                            "w-full h-full min-h-[32px] px-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-indigo-50 text-slate-800 placeholder-transparent transition-colors",
                            isSelected ? "bg-transparent" : "bg-transparent hover:bg-slate-50"
                          )}
                          placeholder={col.label}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 p-4">
            <button 
              onClick={addMoreRows}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add 10 more rows
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={clsx(
          "fixed bottom-6 right-6 p-4 rounded-xl shadow-xl text-white font-medium z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 transition-all",
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-slate-800'
        )}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
