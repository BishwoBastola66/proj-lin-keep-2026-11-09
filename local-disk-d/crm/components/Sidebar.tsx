import { Activity, LayoutDashboard, CheckSquare, Mail, Settings, Users, Box, LogOut, Plus } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'pipeline', icon: Box, label: 'Pipeline' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'accounts', icon: Users, label: 'Accounts' },
  { id: 'interactions', icon: Activity, label: 'Interactions' },
  { id: 'campaigns', icon: Mail, label: 'Campaigns' },
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  onAddData
}: { 
  activeTab: string; 
  setActiveTab: (t: string) => void;
  isOpen?: boolean;
  setIsOpen?: (b: boolean) => void;
}) {
  return (
    <aside className={clsx(
      "w-64 border-r border-slate-200 bg-white h-screen flex flex-col fixed left-0 top-0 shadow-sm z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
        <img src="/image.png" alt="Srimatrix Health" className="h-10 w-auto object-contain" />
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={clsx(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group text-sm font-medium",
              activeTab === item.id 
                ? "bg-blue-50 text-blue-700" 
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <item.icon className={clsx("w-5 h-5", activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <button onClick={() => setActiveTab('add-data')} className="w-full flex items-center gap-3 px-4 py-2.5 mb-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm font-semibold">
          <Plus className="w-5 h-5 text-indigo-600" />
          <span>Add New Data</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors text-sm font-medium">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Settings</span>
        </button>
        <button onClick={() => { localStorage.removeItem('crm_session'); window.location.reload(); }} className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors text-sm font-medium">
          <LogOut className="w-5 h-5 text-red-400" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}


