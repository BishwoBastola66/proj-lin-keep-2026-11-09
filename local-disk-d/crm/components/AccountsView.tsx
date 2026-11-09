"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import FacilityDetailModal from './FacilityDetailModal';

import { supabase } from '../lib/supabase';

export default function AccountsView() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase
          .from('srimatric')
          .select('id, facility_name, first_name, last_name, administrator, pipeline_stage, city, county, state, beds, ownership_type, phone, email')
          .order('facility_name', { ascending: true });
        
        if (error) throw error;
        setFacilities(data || []);
        setFiltered(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(facilities);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        facilities.filter(f => 
          (f.facility_name && f.facility_name.toLowerCase().includes(q)) ||
          (f.administrator && f.administrator.toLowerCase().includes(q)) ||
          (f.city && f.city.toLowerCase().includes(q)) ||
          (f.county && f.county.toLowerCase().includes(q)) ||
          (f.email && f.email.toLowerCase().includes(q))
        )
      );
    }
  }, [search, facilities]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Healthcare Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">
            {filtered.length} of {facilities.length} healthcare facilities listed
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search facilities, cities, admins..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
              <tr>
                <th className="p-4 font-semibold text-xs tracking-wider uppercase text-slate-500">Facility / Organization</th>
                <th className="p-4 font-semibold text-xs tracking-wider uppercase text-slate-500">Administrator</th>
                <th className="p-4 font-semibold text-xs tracking-wider uppercase text-slate-500">Location</th>
                <th className="p-4 font-semibold text-xs tracking-wider uppercase text-slate-500">Beds</th>
                <th className="p-4 font-semibold text-xs tracking-wider uppercase text-slate-500">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f) => (
                <tr 
                  key={f.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedFacilityId(f.id)}
                >
                  <td className="p-4 text-sm font-medium text-slate-900">
                    <div className="font-semibold text-slate-900">{f.facility_name || `${f.first_name} ${f.last_name}`}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{f.email || 'No email on file'}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    <div className="font-medium text-slate-800">{f.administrator || `${f.first_name} ${f.last_name}`}</div>
                    <div className="text-xs text-slate-400">{f.phone || ''}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <div>{f.city}, {f.county}</div>
                    <div className="text-xs text-slate-400">{f.state || 'PA'}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {f.beds ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                        {f.beds} Beds
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                      {f.pipeline_stage || 'Lead'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                    No facilities found matching &quot;{search}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedFacilityId && (
        <FacilityDetailModal 
          facilityId={selectedFacilityId} 
          onClose={() => setSelectedFacilityId(null)} 
        />
      )}
    </div>
  );
}
