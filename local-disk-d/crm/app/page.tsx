"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import DashboardClient from '@/components/DashboardClient';
import PipelineView from '@/components/PipelineView';
import TasksView from '@/components/TasksView';
import AccountsView from '@/components/AccountsView';
import InteractionsView from '@/components/InteractionsView';
import CampaignsView from '@/components/CampaignsView';
import LoginScreen from '@/components/LoginScreen';
import AddDataView from '@/components/AddDataView';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem('crm_session');
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (e) {
        localStorage.removeItem('crm_session');
      }
    }
    setLoadingSession(false);
  }, []);

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 lg:ml-64 flex flex-col h-full relative w-full overflow-hidden">
        <Navbar toggleSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto relative no-scrollbar p-4 lg:p-0">
          {activeTab === 'dashboard' && <DashboardClient />}
          {activeTab === 'pipeline' && <PipelineView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'accounts' && <AccountsView />}
          {activeTab === 'interactions' && <InteractionsView />}
          {activeTab === 'campaigns' && <CampaignsView />}
          {activeTab === 'add-data' && <AddDataView />}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}



