"use client";

import { useState, useEffect } from 'react';
import { RefreshCw, Mail, Phone, Activity, Inbox, Send, Reply, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { supabase } from '../lib/supabase';

export default function InteractionsView() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);
  const [filter, setFilter] = useState<'All' | 'Sent' | 'Received' | 'Replied'>('All');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const loadInteractions = async () => {
      try {
        const { data, error } = await supabase
          .from('facility_interactions')
          .select(`
            *,
            srimatric (first_name, last_name, email)
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const formattedData = data?.map((interaction: any) => ({
          ...interaction,
          facility_name: (interaction.srimatric?.first_name || 'Unknown') + ' ' + (interaction.srimatric?.last_name || ''),
          facility_email: interaction.srimatric?.email || null,
          user_email: null,
        })) || [];
        
        setInteractions(formattedData);
      } catch (err) {
        console.error("Supabase Error:", JSON.stringify(err, null, 2));
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    const fetchUser = () => {
      const sessionStr = localStorage.getItem('crm_session');
      if (sessionStr) {
        try {
          const user = JSON.parse(sessionStr);
          setCurrentUserEmail(user.email || null);
          const name = user.name || user.full_name || user.email?.split('@')[0] || 'Admin';
          setCurrentUserName(name);
        } catch (e) {
          console.error("Error parsing user session:", e);
        }
      }
    };
    fetchUser();

    // Load cached interactions immediately, then auto-sync in background
    loadInteractions().then(() => {
      handleSync();
    });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/email/sync', { method: 'POST' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sync failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      // Always reload after sync to show latest state
      await loadInteractions();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const filteredInteractions = interactions.filter(i => {
    if (filter === 'All') return true;
    if (filter === 'Sent') return i.interaction_type?.includes('Sent');
    if (filter === 'Received') return i.interaction_type?.includes('Received');
    if (filter === 'Replied') return i.interaction_type?.includes('Replied');
    return true;
  });

  const getTypeIcon = (type: string) => {
    if (type?.includes('Sent')) return <Send className="w-4 h-4 text-blue-500" />;
    if (type?.includes('Received')) return <Inbox className="w-4 h-4 text-emerald-500" />;
    if (type?.includes('Replied')) return <Reply className="w-4 h-4 text-amber-500" />;
    if (type?.includes('Call')) return <Phone className="w-4 h-4 text-indigo-500" />;
    return <Activity className="w-4 h-4 text-slate-500" />;
  };

  const getTypeBadgeColor = (type: string) => {
    if (type?.includes('Sent')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (type?.includes('Received')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (type?.includes('Replied')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-20">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Interactions Log</h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            {['All', 'Sent', 'Received', 'Replied'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Inbox
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-medium text-sm text-slate-500">Type</th>
              <th className="p-4 font-medium text-sm text-slate-500">Facility</th>
              <th className="p-4 font-medium text-sm text-slate-500">Subject</th>
              <th className="p-4 font-medium text-sm text-slate-500">Outcome</th>
              <th className="p-4 font-medium text-sm text-slate-500">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredInteractions.map((i) => (
              <tr 
                key={i.id} 
                className="border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer"
                onClick={() => setSelectedInteraction(i)}
              >
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeBadgeColor(i.interaction_type)}`}>
                    {getTypeIcon(i.interaction_type)}
                    {i.interaction_type}
                  </span>
                </td>
                <td className="p-4 text-sm font-medium text-blue-600">{i.facility_name}</td>
                <td className="p-4 text-sm text-slate-700 max-w-xs truncate">
                  {i.subject || <span className="text-slate-400 italic">No Subject</span>}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                      {i.outcome || '—'}
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      {i.interaction_type?.includes('Received') 
                        ? `from ${i.facility_name}`
                        : `by ${currentUserName || 'Me'}`
                      }
                    </span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {formatDistanceToNow(new Date(i.created_at), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredInteractions.length === 0 && (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No interactions found</p>
            <p className="text-slate-400 text-sm mt-1">Try syncing your inbox or changing the filter.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInteraction && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setSelectedInteraction(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${getTypeBadgeColor(selectedInteraction.interaction_type)}`}>
                  {getTypeIcon(selectedInteraction.interaction_type)}
                  {selectedInteraction.interaction_type}
                </span>
                <h2 className="text-lg font-bold text-slate-800 truncate">
                  {selectedInteraction.subject || 'No Subject'}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedInteraction(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Sender/Receiver info */}
            <div className="bg-white px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {selectedInteraction.facility_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    {selectedInteraction.interaction_type?.includes('Received') ? (
                      <>
                        <div className="font-semibold text-slate-900 text-sm">
                          {selectedInteraction.facility_name}
                          {selectedInteraction.facility_email && (
                            <span className="text-slate-400 font-normal ml-1">&lt;{selectedInteraction.facility_email}&gt;</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">to Me</div>
                      </>
                    ) : (
                      <>
                        <div className="font-semibold text-slate-900 text-sm">
                          {selectedInteraction.user_email || 'Me'}
                        </div>
                        <div className="text-xs text-slate-500">
                          to {selectedInteraction.facility_name}
                          {selectedInteraction.facility_email && (
                            <span className="text-slate-400 ml-1">&lt;{selectedInteraction.facility_email}&gt;</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-400 font-medium text-right">
                  {formatDistanceToNow(new Date(selectedInteraction.created_at), { addSuffix: true })}
                  <div className="mt-0.5">
                    {new Date(selectedInteraction.created_at).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-0 overflow-y-auto bg-slate-50 flex-1 no-scrollbar">
              <div className="px-4 py-8 sm:px-8 flex justify-center">
                {selectedInteraction.interaction_type?.includes('Email') ? (
                  <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden font-sans">
                    
                    {/* Natural Email Content */}
                    <div className="px-8 py-8 text-slate-800 text-[15px] leading-relaxed">
                      {selectedInteraction.body ? (
                        <div 
                          className="prose prose-sm max-w-none prose-slate"
                          dangerouslySetInnerHTML={{ __html: selectedInteraction.body }} 
                        />
                      ) : (
                        <span className="text-slate-400 italic">No content</span>
                      )}

                      {/* Natural Executive Signature & Logo (In Last) */}
                      <div className="mt-8 pt-5 border-t border-slate-200">
                        <p className="mb-1 text-sm text-slate-500">Best regards,</p>
                        <p className="text-base text-slate-900 font-bold">
                          {selectedInteraction.interaction_type?.includes('Received') ? selectedInteraction.facility_name : (currentUserName || 'Tribhuvan Pandey')}
                        </p>
                        <p className="text-xs text-teal-600 font-semibold mt-0.5">Director, Marketing and Communication</p>
                        <p className="text-xs text-slate-500">
                          (505) 730-6430 &bull; <a href="https://srimatrixhealth.com" target="_blank" rel="noreferrer" className="text-sky-600 hover:underline">srimatrixhealth.com</a>
                        </p>
                        <div className="mt-3">
                          <img src="/logo-transparent.png" alt="Srimatrix Health" className="w-32 h-auto object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 text-slate-800 text-base leading-relaxed font-sans min-h-[120px]">
                    {selectedInteraction.body ? (
                      <div 
                        className="prose prose-sm max-w-none prose-slate"
                        dangerouslySetInnerHTML={{ __html: selectedInteraction.body }} 
                      />
                    ) : (
                      <span className="text-slate-400 italic">No content</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
