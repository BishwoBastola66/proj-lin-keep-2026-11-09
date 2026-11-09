"use client";

import { useState, useEffect } from 'react';
import { Building2, AlertTriangle, Clock, RefreshCw, ChevronRight, Mail, Phone, MapPin, Users } from 'lucide-react';
import clsx from 'clsx';
import FacilityDetailModal from './FacilityDetailModal';

type Facility = {
  id: string;
  first_name: string;
  last_name: string;
  pipeline_stage: string;
  city: string;
  county: string;
  is_priority_region: boolean;
};

type Task = {
  id: string;
  facility_id: string;
  first_name: string;
  last_name: string;
  assigned_user_name: string;
  task_description: string;
  due_date: string;
  is_completed: boolean;
};

import { supabase } from '../lib/supabase';

const STAGES = ['Lead', 'Contacted', 'In Progress', 'License Renewed', 'Unresponsive'];

export default function DashboardClient() {
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: facilities } = await supabase
        .from('srimatric')
        .select('id, first_name, last_name, pipeline_stage, city, county, is_priority_region');
      
      const { count: totalFacilities } = await supabase.from('srimatric').select('*', { count: 'exact', head: true });
      const { count: highPriority } = await supabase.from('srimatric').select('*', { count: 'exact', head: true }).eq('is_priority_region', true);

      const { data: tasksData } = await supabase
        .from('crm_tasks')
        .select(`*, srimatric (first_name, last_name), crm_users (name)`)
        .order('due_date', { ascending: true });

      const formattedTasks = tasksData?.map((task: any) => ({
        ...task,
        first_name: task.srimatric?.first_name || 'Unknown',
        last_name: task.srimatric?.last_name || '',
        assigned_user_name: task.crm_users?.name || 'Unassigned'
      })) || [];

      setData({
        counters: { 
          totalFacilities: totalFacilities || 0, 
          highPriority: highPriority || 0
        },
        facilities: facilities || []
      });
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStage = async (id: string, stage: string) => {
    try {
      await supabase.from('srimatric').update({ pipeline_stage: stage }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const toggleTask = async (id: string, is_completed: boolean) => {
    try {
      await supabase.from('crm_tasks').update({ is_completed: !is_completed }).eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse w-full">
        {/* Counters Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border p-6 shadow-sm flex items-center gap-4 bg-white border-slate-200">
              <div className="p-4 rounded-xl w-16 h-16 bg-slate-200"></div>
              <div className="space-y-2 w-full">
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Kanban Board Skeleton */}
          <div className="lg:col-span-3 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 w-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-100 rounded-xl p-4 flex flex-col gap-3 h-[400px]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-5 bg-slate-200 rounded w-20"></div>
                    <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[1, 2].map(j => (
                      <div key={j} className="bg-white border-slate-200 border rounded-lg p-4 h-28"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Queue Skeleton */}
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded w-32"></div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 h-[680px] shadow-sm">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-3 rounded-lg border border-slate-200 bg-slate-50 h-20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <StatCard 
          title="Total Candidates & Clients" 
          value={data?.counters?.totalFacilities || 0} 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          title="High Priority" 
          value={data?.counters?.highPriority || 0} 
          icon={AlertTriangle} 
          color="indigo" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Kanban Board (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Pipeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 w-full">
            {STAGES.map(stage => (
              <div key={stage} className="bg-slate-100 rounded-xl p-4 flex flex-col gap-3 h-[400px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-700">{stage}</h3>
                  <span className="bg-slate-200 text-xs px-2 py-1 rounded-full text-slate-600 font-medium">
                    {data?.facilities?.filter((f: Facility) => f.pipeline_stage === stage).length || 0}
                  </span>
                </div>
                
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
                  {data?.facilities?.filter((f: Facility) => f.pipeline_stage === stage).map((facility: Facility) => (
                    <div 
                      key={facility.id} 
                      onClick={() => setSelectedFacilityId(facility.id)}
                      className={clsx(
                        "bg-white border rounded-lg p-4 cursor-pointer transition-shadow hover:shadow-md",
                        facility.is_priority_region ? "border-indigo-200" : "border-slate-200"
                      )}
                    >
                      <h4 className="font-bold text-slate-800 text-sm mb-2">{facility.first_name} {facility.last_name}</h4>
                      <div className="flex items-center text-xs text-slate-500 gap-1 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span>{facility.city}, {facility.county}</span>
                      </div>
                      
                      <div className="flex items-center justify-end mt-auto">
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <select 
                            className="bg-slate-50 text-xs text-slate-600 border border-slate-200 rounded p-1 outline-none focus:border-blue-400 cursor-pointer"
                            value={stage}
                            onChange={(e) => updateStage(facility.id, e.target.value)}
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
            ))}
          </div>
        </div>

        {/* Task Queue (1 col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Action Tasks
          </h2>
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 h-[680px] overflow-y-auto shadow-sm">
            {tasks.map(task => (
              <div key={task.id} className={clsx(
                "p-3 rounded-lg border transition-colors flex items-start gap-3",
                task.is_completed ? "bg-slate-50 border-slate-200 opacity-70" : "bg-blue-50/50 border-blue-100"
              )}>
                <button 
                  onClick={() => toggleTask(task.id, task.is_completed)}
                  className={clsx(
                    "mt-1 w-5 h-5 rounded flex items-center justify-center border transition-colors",
                    task.is_completed ? "bg-slate-300 border-slate-300 text-slate-800" : "border-slate-300 bg-white hover:border-blue-400"
                  )}
                >
                  {task.is_completed && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={clsx("text-sm font-medium", task.is_completed ? "line-through text-slate-500" : "text-slate-800")}>
                    {task.task_description}
                  </p>
                  <div className="mt-2 text-xs text-slate-500 flex justify-between items-center">
                    <span className="text-blue-600 truncate max-w-[120px] font-medium">{task.first_name} {task.last_name}</span>
                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-slate-500 py-10 text-sm">No pending tasks</div>
            )}
          </div>
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

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorMap: any = {
    'blue': 'bg-white border-slate-200 text-slate-800',
    'indigo': 'bg-white border-slate-200 text-slate-800',
    'red': 'bg-white border-slate-200 text-slate-800',
  };
  
  const iconColorMap: any = {
    'blue': 'text-blue-600 bg-blue-50',
    'indigo': 'text-indigo-500 bg-indigo-50',
    'red': 'text-red-500 bg-red-50',
  };
  
  return (
    <div className={clsx("rounded-xl md:rounded-2xl border p-3 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4", colorMap[color])}>
      <div className={clsx("p-2 md:p-4 rounded-lg md:rounded-xl", iconColorMap[color])}>
        <Icon className="w-5 h-5 md:w-8 md:h-8" />
      </div>
      <div className="w-full">
        <p className="text-slate-500 font-medium text-[10px] sm:text-xs md:text-sm mb-0.5 md:mb-1 truncate leading-tight">{title}</p>
        <p className="text-lg sm:text-xl md:text-3xl font-bold text-slate-800 leading-none">{value}</p>
      </div>
    </div>
  );
}

