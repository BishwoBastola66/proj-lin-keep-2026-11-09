"use client";

import { useState, useEffect } from 'react';
import { Mail, Send, Activity, CheckCircle, Wand2, Sparkles, Search, Users, MoreHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';
import FacilityDetailModal from './FacilityDetailModal';

export default function CampaignsView() {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'All' | 'Srimatric' | 'Clients' | 'Candidates'>('All');
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [editingEntityType, setEditingEntityType] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // AI Agent States
  const [agentLoading, setAgentLoading] = useState(false);
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');
  const [aiErrorText, setAiErrorText] = useState('');

  // Follow Up States
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpStartDate, setFollowUpStartDate] = useState('');
  const [followUpEndDate, setFollowUpEndDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpPipelineStage, setFollowUpPipelineStage] = useState('Contacted');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number; target: string; successCount: number; failCount: number } | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load all recipient types
        const [facRes, clientsRes, candidatesRes] = await Promise.all([
          supabase.from('srimatric').select('id, first_name, last_name, facility_name, city, email, administrator, phone').order('first_name'),
          supabase.from('clients').select('id, first_name, last_name, city, email, phone').order('first_name'),
          supabase.from('candidates').select('id, first_name, last_name, city, email, phone').order('first_name')
        ]);

        if (facRes.error) console.error('Error fetching facilities:', facRes.error);
        if (clientsRes.error) console.error('Error fetching clients:', clientsRes.error);
        if (candidatesRes.error) console.error('Error fetching candidates:', candidatesRes.error);

        const allRecipients = [
          ...(facRes.data || []).map((f: any) => ({
            id: `srimatric-${f.id}`,
            dbId: f.id,
            type: 'srimatric',
            name: f.facility_name || (f.first_name === 'Unknown' ? 'Unnamed Facility' : `${f.first_name || ''} ${f.last_name || ''}`.trim()),
            first_name: f.first_name,
            last_name: f.last_name,
            email: f.email,
            phone: f.phone,
            city: f.city,
            administrator: f.administrator
          })),
          ...(clientsRes.data || []).map((c: any) => ({
            id: `clients-${c.id}`,
            dbId: c.id,
            type: 'clients',
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown Client',
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email,
            phone: c.phone,
            city: c.city
          })),
          ...(candidatesRes.data || []).map((c: any) => ({
            id: `candidates-${c.id}`,
            dbId: c.id,
            type: 'candidates',
            name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown Candidate',
            first_name: c.first_name,
            last_name: c.last_name,
            email: c.email,
            phone: c.phone,
            city: c.city
          }))
        ];
        
        setRecipients(allRecipients);

        // Load current user profile
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: userData } = await supabase.from('crm_users').select('*').eq('auth_user_id', authData.user.id).single();
          setCurrentUser(userData || null);
        } else {
          // Fallback if not strictly using Supabase auth (e.g. dev environment mock user)
          const { data: firstUser } = await supabase.from('crm_users').select('*').limit(1).single();
          setCurrentUser(firstUser || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecipients(false);
      }
    }
    loadData();
  }, []);

  const filteredRecipients = recipients.filter(r => {
    if (activeTab !== 'All' && r.type !== activeTab.toLowerCase()) return false;
    return (r.name).toLowerCase().includes(searchQuery.toLowerCase()) || 
           (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const handleSelectAll = () => {
    if (selectedRecipients.size === filteredRecipients.length && filteredRecipients.length > 0) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(filteredRecipients.map(r => r.id)));
    }
  };

  const toggleRecipient = (id: string) => {
    const newSet = new Set(selectedRecipients);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedRecipients(newSet);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecipients.size === 0) return;
    setFollowUpLoading(true);
    
    try {
      const selected = recipients.filter(r => selectedRecipients.has(r.id));
      
      // Helper to set time to night (23:59:59) if only date is provided
      const getNightTimeISO = (dateStr: string) => {
        if (!dateStr) return null;
        // dateStr is 'YYYY-MM-DD'
        const d = new Date(dateStr + 'T23:59:59'); 
        return d.toISOString();
      };

      const tasksToInsert = selected.map(r => ({
        entity_id: r.dbId,
        entity_type: r.type,
        facility_id: r.type === 'srimatric' ? r.dbId : null,
        assigned_to: currentUser?.id,
        task_description: followUpNotes ? `Follow Up: ${followUpNotes}` : 'Scheduled Follow Up',
        start_date: getNightTimeISO(followUpStartDate),
        end_date: getNightTimeISO(followUpEndDate),
        due_date: getNightTimeISO(followUpEndDate), // legacy compat
        notes: followUpNotes,
        is_completed: false
      }));

      // Only insert tasks if at least one date or note is provided
      if (followUpStartDate || followUpEndDate || followUpNotes) {
        const { error: taskError } = await supabase.from('crm_tasks').insert(tasksToInsert);
        if (taskError) throw taskError;
      }

      const srimatricIds = selected.filter(r => r.type === 'srimatric').map(r => r.dbId);
      const clientIds = selected.filter(r => r.type === 'clients').map(r => r.dbId);
      const candidateIds = selected.filter(r => r.type === 'candidates').map(r => r.dbId);

      if (followUpPipelineStage !== 'No Change') {
        if (srimatricIds.length > 0) {
          await supabase.from('srimatric').update({ pipeline_stage: followUpPipelineStage }).in('id', srimatricIds);
        }
        if (clientIds.length > 0) {
          await supabase.from('clients').update({ pipeline_stage: followUpPipelineStage }).in('id', clientIds);
        }
        if (candidateIds.length > 0) {
          await supabase.from('candidates').update({ pipeline_stage: followUpPipelineStage }).in('id', candidateIds);
        }
      }

      setFollowUpOpen(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setFollowUpStartDate('');
      setFollowUpEndDate('');
      setFollowUpNotes('');
    } catch (err) {
      console.error(err);
      alert('Failed to schedule follow ups.');
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecipients.size === 0) return alert('Please select at least one recipient.');
    
    setSending(true);
    try {
      // Send actual emails and log interactions via backend API in a paced queue to prevent 454 rate limits
      const recipientsToSend = recipients.filter(r => selectedRecipients.has(r.id) && r.email);
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < recipientsToSend.length; i++) {
        const r = recipientsToSend[i];
        setSendProgress({
          current: i + 1,
          total: recipientsToSend.length,
          target: r.name || r.administrator || r.email,
          successCount,
          failCount
        });

        // Replace dynamic template variables
        const pSubject = subject
          .replace(/{{administrator}}/gi, r.administrator || 'Administrator')
          .replace(/{{first_name}}/gi, r.first_name || 'candidate')
          .replace(/{{last_name}}/gi, r.last_name || '')
          .replace(/{{phone}}/gi, r.phone || 'your phone number')
          .replace(/{{sender_name}}/gi, currentUser?.name || 'Tribhuvan Pandey')
          .replace(/{{sender_phone}}/gi, currentUser?.phone || '(505) 730-6430')
          .replace(/{{sender_position}}/gi, currentUser?.position || 'Director, Marketing and Communication');
          
        const pBody = body
          .replace(/{{administrator}}/gi, r.administrator || 'Administrator')
          .replace(/{{first_name}}/gi, r.first_name || 'candidate')
          .replace(/{{last_name}}/gi, r.last_name || '')
          .replace(/{{phone}}/gi, r.phone || 'your phone number')
          .replace(/{{sender_name}}/gi, currentUser?.name || 'Tribhuvan Pandey')
          .replace(/{{sender_phone}}/gi, currentUser?.phone || '(505) 730-6430')
          .replace(/{{sender_position}}/gi, currentUser?.position || 'Director, Marketing and Communication');

        try {
          const res = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entity_id: r.dbId,
              entity_type: r.type,
              to_email: r.email,
              subject: pSubject,
              body: pBody,
              sender_name: currentUser?.name || 'Tribhuvan Pandey',
              sender_position: currentUser?.position || 'Director, Marketing and Communication',
              sender_phone: currentUser?.phone || '(505) 730-6430'
            })
          });

          if (res.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed sending to ${r.email}: status ${res.status}`);
          }
        } catch (err) {
          failCount++;
          console.error("Error sending to", r.email, err);
        }

        // Pacing delay (700ms) between emails to prevent Google SMTP 454 rate-limit lockouts
        if (i < recipientsToSend.length - 1) {
          await new Promise(res => setTimeout(res, 700));
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setBody('');
        setSelectedRecipients(new Set());
        setSendProgress(null);
      }, 4000);
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to launch campaign. Please check the console.');
    } finally {
      setSending(false);
      setSendProgress(null);
    }
  };

  const generateWithAgent = () => {
    setAiErrorText('');
    setAiPromptText('');
    setAiPromptOpen(true);
  };

  const submitAiPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptText.trim()) return;

    setAgentLoading(true);
    setAiErrorText('');
    
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPromptText })
      });

      if (!res.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await res.json();
      
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
      
      setAiPromptOpen(false); // Close on success
      setAiPromptText('');
    } catch (error) {
      console.error("AI Generation failed:", error);
      setAiErrorText("Failed to generate content with AI. Please try again.");
    } finally {
      setAgentLoading(false);
    }
  };

  const [mobileRecipientsOpen, setMobileRecipientsOpen] = useState(false);

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 lg:mb-6 shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Email Campaigns</h1>
      </div>
      
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        
        {/* Desktop Sidebar: Recipient List */}
        <div className="hidden lg:flex w-1/3 flex-col overflow-hidden border-r border-slate-200 bg-slate-50/30">
          <div className="pt-4 px-4 pb-2 border-b border-slate-200 bg-white">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-indigo-500" />
              Select Recipients ({selectedRecipients.size})
            </h2>
            
            <div className="flex gap-1 mb-3 bg-slate-100 p-1 rounded-lg">
              {(['All', 'Srimatric', 'Clients', 'Candidates'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "flex-1 px-2 py-1.5 text-xs font-semibold rounded-md transition-all",
                    activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Search recipients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input 
                type="checkbox" 
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={filteredRecipients.length > 0 && selectedRecipients.size === filteredRecipients.length}
                onChange={handleSelectAll}
              />
              Select All
            </label>
            <span className="text-xs text-slate-500">{filteredRecipients.length} results</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loadingRecipients ? (
              <div className="flex justify-center p-8"><Activity className="w-6 h-6 text-indigo-500 animate-spin" /></div>
            ) : filteredRecipients.map(r => (
              <div 
                key={r.id} 
                className={clsx(
                  "flex items-center justify-between p-4 border-b border-slate-100 transition-colors",
                  selectedRecipients.has(r.id) ? "bg-indigo-50/50" : "bg-white hover:bg-slate-50"
                )}
              >
                <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                  <input 
                    type="checkbox"
                    className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedRecipients.has(r.id)}
                    onChange={() => toggleRecipient(r.id)}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx("text-sm font-semibold truncate", selectedRecipients.has(r.id) ? "text-indigo-900" : "text-slate-800")}>{r.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{r.type}</span>
                    </div>
                    <span className="text-xs text-slate-500 truncate">{r.city || 'Unknown City'}</span>
                  </div>
                </label>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingFacilityId(r.dbId);
                    setEditingEntityType(r.type);
                  }}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-2 shrink-0"
                  title="See and Edit"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area: Email Composer */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base lg:text-lg font-bold text-slate-800">Campaign Editor</h2>
                <p className="text-xs text-slate-500 hidden sm:block">Draft your message for the selected facilities.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setFollowUpOpen(true)}
                disabled={selectedRecipients.size === 0}
                className="px-3 py-1.5 lg:px-4 lg:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 text-xs lg:text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Follow Up
              </button>
              <button 
                type="button"
                onClick={generateWithAgent}
                disabled={agentLoading}
                className="px-3 py-1.5 lg:px-4 lg:py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 text-xs lg:text-sm"
              >
                {agentLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {agentLoading ? 'Learning...' : 'AI Generate'}
              </button>
            </div>
          </div>

          {/* Mobile Recipient Selector Header */}
          <div className="lg:hidden p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">To:</span>
              <span className="text-sm font-semibold text-slate-800">{selectedRecipients.size} Recipients</span>
            </div>
            <button 
              onClick={() => setMobileRecipientsOpen(true)}
              className="text-sm text-indigo-600 font-medium px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              Select
            </button>
          </div>

          <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
            {success ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500" /> 
                <p className="font-bold text-xl lg:text-2xl text-slate-800">Campaign Launched!</p>
                <p className="text-slate-500 text-sm lg:text-base">Sent to {selectedRecipients.size} recipients.</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex-1 flex flex-col space-y-4 lg:space-y-6 min-h-0">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. Q3 License Renewal Requirements" 
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 transition-colors"
                      required
                    />
                    {subject && subject.includes('URGENT') && (
                      <Sparkles className="w-4 h-4 text-indigo-500 absolute right-3 top-3" />
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-700">Message Body</label>
                    <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:inline">Variables: {'{{first_name}}'}, {'{{last_name}}'}...</span>
                  </div>
                  <textarea 
                    placeholder="Write your campaign message..." 
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="flex-1 w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 resize-none no-scrollbar transition-colors"
                    required
                  />
                </div>
                
                {/* Real-time campaign dispatch progress bar */}
                {sendProgress && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 my-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1.5 text-blue-600">
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        Paced Sending: {sendProgress.current} of {sendProgress.total}
                      </span>
                      <span className="text-slate-500">
                        {Math.round((sendProgress.current / sendProgress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-1.5">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Now dispatching to: <span className="font-medium text-slate-700">{sendProgress.target}</span>
                      {sendProgress.failCount > 0 && (
                        <span className="text-amber-600 ml-2">({sendProgress.failCount} throttled/skipped)</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-end">
                  <button 
                    type="submit" 
                    disabled={sending || !subject || !body || selectedRecipients.size === 0}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? `Sending (${sendProgress ? `${sendProgress.current}/${sendProgress.total}` : 'Initializing...'})` : `Launch to ${selectedRecipients.size} Recipients`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Mobile Recipient Selection Modal */}
        {mobileRecipientsOpen && (
          <div className="absolute inset-0 z-40 bg-white flex flex-col lg:hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Select ({selectedRecipients.size})
              </h2>
              <button 
                onClick={() => setMobileRecipientsOpen(false)}
                className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Search recipients..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={filteredRecipients.length > 0 && selectedRecipients.size === filteredRecipients.length}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
              <span className="text-xs text-slate-500">{filteredRecipients.length} results</span>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
              {loadingRecipients ? (
                <div className="flex justify-center p-8"><Activity className="w-6 h-6 text-indigo-500 animate-spin" /></div>
              ) : filteredRecipients.map(r => (
                <div 
                  key={r.id} 
                  className={clsx(
                    "flex items-center justify-between p-4 border-b border-slate-100 transition-colors",
                    selectedRecipients.has(r.id) ? "bg-indigo-50/50" : "bg-white hover:bg-slate-50"
                  )}
                >
                  <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                    <input 
                      type="checkbox"
                      className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedRecipients.has(r.id)}
                      onChange={() => toggleRecipient(r.id)}
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={clsx("text-sm font-semibold truncate", selectedRecipients.has(r.id) ? "text-indigo-900" : "text-slate-800")}>{r.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{r.type}</span>
                      </div>
                      <span className="text-xs text-slate-500 truncate">{r.city || 'Unknown City'}</span>
                    </div>
                  </label>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingFacilityId(r.dbId);
                      setEditingEntityType(r.type);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-2 shrink-0"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0">
              <button 
                onClick={() => setMobileRecipientsOpen(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-sm"
              >
                Done ({selectedRecipients.size} Selected)
              </button>
            </div>
          </div>
        )}

      </div>
      
      {editingFacilityId && editingEntityType && (
        <FacilityDetailModal 
          facilityId={editingFacilityId} 
          entityType={editingEntityType}
          onClose={() => {
            setEditingFacilityId(null);
            setEditingEntityType(null);
          }} 
        />
      )}

      {/* AI Prompt Modal */}
      {aiPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col transform transition-all">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-500" />
                Auto-Generate Campaign
              </h2>
              <button 
                onClick={() => setAiPromptOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitAiPrompt} className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What should this email be about?
              </label>
              <textarea
                autoFocus
                rows={4}
                placeholder="e.g. Remind all facilities about the upcoming Q3 inspection and to prep their logs..."
                value={aiPromptText}
                onChange={(e) => setAiPromptText(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400 resize-none transition-colors mb-2"
                disabled={agentLoading}
              />
              
              {aiErrorText && (
                <p className="text-sm text-red-500 mt-1 mb-3 font-medium">
                  {aiErrorText}
                </p>
              )}
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAiPromptOpen(false)}
                  disabled={agentLoading}
                  className="px-4 py-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!aiPromptText.trim() || agentLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {agentLoading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {followUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Schedule Follow Up</h2>
              <button onClick={() => setFollowUpOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFollowUpSubmit} className="p-6 space-y-4">
              <div className="text-sm text-slate-600 bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4">
                You are updating <strong>{selectedRecipients.size}</strong> selected recipient(s).
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Pipeline Stage</label>
                <select 
                  value={followUpPipelineStage}
                  onChange={e => setFollowUpPipelineStage(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                >
                  <option value="No Change">-- No Change --</option>
                  <option value="Lead">Lead</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="License Renewed">License Renewed</option>
                  <option value="Unresponsive">Unresponsive</option>
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Schedule Task (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Alert Time (Start Date)</label>
                    <input 
                      type="date" 
                      value={followUpStartDate}
                      onChange={e => setFollowUpStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                    />
                  </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Due Date (End Date)</label>
                <input 
                  type="date" 
                  value={followUpEndDate}
                  onChange={e => setFollowUpEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (Optional)</label>
                <textarea 
                  rows={3}
                  value={followUpNotes}
                  onChange={e => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Discuss Q3 requirements..."
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setFollowUpOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={followUpLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {followUpLoading ? <Activity className="w-4 h-4 animate-spin" /> : null}
                  {followUpLoading ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
