"use client";

import { useState, useEffect } from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

export default function Navbar({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const [user, setUser] = useState<{ email?: string; role?: string } | null>(null);

  useEffect(() => {
    const storedSession = localStorage.getItem('crm_session');
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Format email to a name (e.g. admin@srimatric.com -> Admin)
  const formatName = (email: string) => {
    const prefix = email.split('@')[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  };

  const displayName = user?.email ? formatName(user.email) : 'Loading...';
  const displayRole = user?.role || '...';

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 lg:gap-4 flex-1">
        
        {/* Mobile Hamburger Menu */}
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-sm lg:w-96 group">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search accounts, contacts, or interactions..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 lg:gap-4">
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="hidden lg:block w-px h-6 bg-slate-200"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-blue-300 transition-colors">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{displayName}</span>
            <span className="text-xs text-slate-500">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

