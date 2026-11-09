"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, MapPin, Search } from 'lucide-react';
import clsx from 'clsx';
import FacilityDetailModal from './FacilityDetailModal';

type PipelineEntity = {
  id: string;
  dbId: string;
  type: string;
  first_name: string;
  last_name: string;
  pipeline_stage: string;
  city: string;
  county: string;
  is_priority_region?: boolean;
};

import { supabase } from '../lib/supabase';

const STAGES = ['Lead', 'Contacted', 'In Progress', 'Follow Up Scheduled', 'License Renewed', 'Unresponsive'];

export default function PipelineView() {
  const [entities, setEntities] = useState<PipelineEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Facilities' | 'Clients' | 'Candidates'>('All');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, cliRes, canRes] = await Promise.all([
        supabase.from('srimatric').select('id, first_name, last_name, pipeline_stage, city, county, is_priority_region'),
        supabase.from('clients').select('id, first_name, last_name, pipeline_stage, city'),
        supabase.from('candidates').select('id, first_name, last_name, pipeline_stage, city')
      ]);
      
      const combined: PipelineEntity[] = [
        ...(facRes.data || []).map((d: any) => ({ ...d, dbId: d.id, id: `fac-${d.id}`, type: 'srimatric' })),
        ...(cliRes.data || []).map((d: any) => ({ ...d, dbId: d.id, id: `cli-${d.id}`, type: 'clients', county: '' })),
        ...(canRes.data || []).map((d: any) => ({ ...d, dbId: d.id, id: `can-${d.id}`, type: 'candidates', county: '' }))
      ];
      
      setEntities(combined);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStage = async (entity: PipelineEntity, stage: string) => {
    try {
      await supabase.from(entity.type).update({ pipeline_stage: stage }).eq('id', entity.dbId);
      // Optimistic update
      setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, pipeline_stage: stage } : e));
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const filteredEntities = entities.filter(e => {
    if (activeTab === 'Facilities' && e.type !== 'srimatric') return false;
    if (activeTab === 'Clients' && e.type !== 'clients') return false;
    if (activeTab === 'Candidates' && e.type !== 'candidates') return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (
        e.first_name?.toLowerCase().includes(q) ||
        e.last_name?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="p-8 h-full flex flex-col max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Pipeline Board</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 whitespace-nowrap">
            {filteredEntities.length} Total
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px overflow-x-auto no-scrollbar shrink-0">
        {['All', 'Facilities', 'Clients', 'Candidates'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="flex gap-6 pb-4 w-full flex-1 overflow-x-auto no-scrollbar snap-x">
        {STAGES.map(stage => {
          const stageEntities = filteredEntities.filter(e => e.pipeline_stage === stage);
          return (
          <div key={stage} className="bg-slate-100/80 rounded-xl p-4 flex flex-col gap-3 min-w-[320px] w-[320px] h-full border border-slate-200 shadow-sm shrink-0 snap-start">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <h3 className="font-semibold text-slate-800">{stage}</h3>
              <span className="bg-slate-200 text-xs px-2.5 py-1 rounded-full text-slate-700 font-medium">
                {stageEntities.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
              {stageEntities.map((entity) => (
                <div 
                  key={entity.id} 
                  onClick={() => {
                    if (entity.type === 'srimatric') setSelectedFacilityId(entity.dbId);
                  }}
                  className={clsx(
                    "bg-white border rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
                    entity.type === 'srimatric' ? "cursor-pointer" : "",
                    entity.is_priority_region ? "border-indigo-300 shadow-sm" : "border-slate-200"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">{entity.first_name} {entity.last_name}</h4>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                      {entity.type === 'srimatric' ? 'Fac' : entity.type === 'clients' ? 'Cli' : 'Can'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-xs text-slate-500 gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{entity.city}{entity.county ? `, ${entity.county}` : ''}</span>
                  </div>
                  
                  <div className="flex items-center justify-end mt-auto pt-2 border-t border-slate-50">
                    
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <select 
                        className="bg-slate-50 text-xs text-slate-600 border border-slate-200 rounded-md p-1 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium max-w-[140px]"
                        value={stage}
                        onChange={(e) => updateStage(entity, e.target.value)}
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )})}
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
