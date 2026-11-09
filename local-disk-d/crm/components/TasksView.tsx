"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, Calendar, Building, CheckCircle2, Circle, AlertTriangle, Search } from 'lucide-react';
import clsx from 'clsx';

type Task = {
  id: string;
  entity_id: string;
  entity_type: string;
  first_name: string;
  last_name: string;
  assigned_user_name: string;
  task_description: string;
  start_date: string;
  end_date: string;
  due_date: string;
  notes: string;
  is_completed: boolean;
};

import { supabase } from '../lib/supabase';

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Facilities' | 'Clients' | 'Candidates'>('All');

  const fetchTasks = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select(`*, srimatric (first_name, last_name), crm_users (name)`)
        .order('due_date', { ascending: true });
        
      if (error) throw error;
      
      const tasksRaw = data || [];
      
      // Fetch missing names for clients and candidates
      const clientIds = tasksRaw.filter(t => t.entity_type === 'clients').map(t => t.entity_id);
      const candidateIds = tasksRaw.filter(t => t.entity_type === 'candidates').map(t => t.entity_id);
      
      let clientsMap: any = {};
      let candidatesMap: any = {};
      
      if (clientIds.length > 0) {
        const { data: clients } = await supabase.from('clients').select('id, first_name, last_name').in('id', clientIds);
        clients?.forEach(c => clientsMap[c.id] = c);
      }
      if (candidateIds.length > 0) {
        const { data: candidates } = await supabase.from('candidates').select('id, first_name, last_name').in('id', candidateIds);
        candidates?.forEach(c => candidatesMap[c.id] = c);
      }

      const formattedTasks = tasksRaw.map((task: any) => {
        let fn = 'Unknown';
        let ln = '';
        
        if (task.entity_type === 'clients' && clientsMap[task.entity_id]) {
          fn = clientsMap[task.entity_id].first_name;
          ln = clientsMap[task.entity_id].last_name;
        } else if (task.entity_type === 'candidates' && candidatesMap[task.entity_id]) {
          fn = candidatesMap[task.entity_id].first_name;
          ln = candidatesMap[task.entity_id].last_name;
        } else if (task.srimatric) {
          fn = task.srimatric.first_name;
          ln = task.srimatric.last_name;
        }
        
        return {
          ...task,
          first_name: fn,
          last_name: ln,
          assigned_user_name: task.crm_users?.name || 'Unassigned',
        };
      });
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = async (id: string, is_completed: boolean) => {
    // Optimistic update for instant UI feedback
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed: !is_completed } : t));
    
    try {
      await supabase.from('crm_tasks').update({ is_completed: !is_completed }).eq('id', id);
      fetchTasks(false); // Silent sync with DB without triggering loading skeleton
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, is_completed } : t));
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col animate-pulse">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-slate-200 rounded-lg w-64 border border-slate-200"></div>
            <div className="h-10 bg-slate-200 rounded-lg w-24 border border-slate-200"></div>
          </div>
        </div>
        <div className="flex gap-2 mb-6 border-b border-slate-200 pb-px">
          {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 bg-slate-200 rounded-t-lg"></div>)}
        </div>
        
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div>
            <div className="h-6 bg-slate-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'Facilities' && t.entity_type !== 'srimatric') return false;
    if (activeTab === 'Clients' && t.entity_type !== 'clients') return false;
    if (activeTab === 'Candidates' && t.entity_type !== 'candidates') return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (
        t.task_description?.toLowerCase().includes(q) ||
        t.first_name?.toLowerCase().includes(q) ||
        t.last_name?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      );
      if (!match) return false;
    }
    
    return true;
  });

  const activeTasks = filteredTasks.filter(t => !t.is_completed);
  const completedTasks = filteredTasks.filter(t => t.is_completed);

  return (
    <div className="p-8 max-w-6xl mx-auto w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Task Management</h1>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 whitespace-nowrap">
            {activeTasks.length} Active
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
      
      <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Pending Tasks */}
        <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200">
          <div className="p-6 pb-4 border-b border-slate-100 bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Pending Action Items
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar bg-slate-50/30">
            {activeTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id, task.is_completed)} />
            ))}
            {activeTasks.length === 0 && (
              <div className="text-center text-slate-500 py-10 bg-slate-50 rounded-lg border border-slate-100 border-dashed shadow-sm">
                {searchQuery ? 'No pending tasks match your search.' : 'You\'re all caught up!'}
              </div>
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          <div className="p-6 pb-4 border-b border-slate-100 bg-white">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Recently Completed
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task.id, task.is_completed)} />
            ))}
            {completedTasks.length === 0 && (
              <div className="text-center text-slate-500 py-10 bg-slate-50 rounded-lg border border-slate-100 border-dashed shadow-sm">
                {searchQuery ? 'No completed tasks match your search.' : 'No completed tasks yet.'}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function TaskCard({ task, onToggle }: { task: Task, onToggle: () => void }) {
  return (
    <div className={clsx(
      "p-4 rounded-xl border transition-all flex items-start gap-4",
      task.is_completed ? "bg-slate-50 border-slate-200" : "bg-white border-blue-100 shadow-sm hover:border-blue-300 hover:shadow-md"
    )}>
      <button 
        onClick={onToggle}
        className="mt-0.5 shrink-0 focus:outline-none"
      >
        {task.is_completed ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        ) : (
          <Circle className="w-6 h-6 text-slate-300 hover:text-blue-600 transition-colors" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={clsx(
          "text-[15px] font-medium leading-snug mb-2", 
          task.is_completed ? "text-slate-500 line-through" : "text-slate-800"
        )}>
          {task.task_description}
        </p>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium truncate max-w-[150px]">
              {task.first_name} {task.last_name} 
              <span className="text-[10px] text-slate-400 ml-1 uppercase">({task.entity_type || 'srimatric'})</span>
            </span>
          </div>
          
          {task.start_date && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md font-medium text-amber-700 bg-amber-50">
              <Calendar className="w-3.5 h-3.5" />
              <span>Alert: {new Date(task.start_date).toLocaleDateString()}</span>
            </div>
          )}

          <div className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded-md font-medium",
            task.is_completed ? "text-slate-500 bg-slate-100" : "text-blue-700 bg-blue-50"
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Due: {new Date(task.end_date || task.due_date).toLocaleDateString()}</span>
          </div>
        </div>
        
        {task.notes && (
          <div className="mt-3 text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
            {task.notes}
          </div>
        )}
      </div>
    </div>
  );
}
