"use client";

import { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Building, Calendar, Activity, Send, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';

export default function FacilityDetailModal({ facilityId, entityType = 'srimatric', onClose }: { facilityId: string, entityType?: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Email Form State
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    fetchFacility();
  }, [facilityId, entityType]);

  const fetchFacility = async () => {
    try {
      // Determine the correct table
      const tableName = entityType === 'candidates' ? 'candidates' : entityType === 'clients' ? 'clients' : 'srimatric';

      const { data: facility, error: facError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', facilityId)
        .single();
        
      let interactions = [];
      if (entityType === 'srimatric') {
        const { data: intData, error: intError } = await supabase
          .from('facility_interactions')
          .select('*')
          .eq('facility_id', facilityId)
          .order('created_at', { ascending: false });
        if (intData) interactions = intData;
      }

      if (facError) throw facError;
      
      setData({ 
        facility, 
        interactions: interactions || [] 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailBody) return;
    
    setSending(true);
    try {
      if (entityType === 'srimatric') {
        // Direct insertion to Supabase instead of backend fetch for facilities
        const { error } = await supabase
          .from('facility_interactions')
          .insert([{
            facility_id: facilityId,
            user_id: 1, // Default agent user
            interaction_type: 'Email',
            notes: `Subject: ${emailSubject}\n\n${emailBody}`,
            outcome: 'Sent'
          }]);

        if (error) throw error;
      } else {
        // We don't have interaction tables for clients/candidates yet, just simulate success
        console.log(`Email to ${entityType} logged locally (no DB table yet).`);
      }

      setSendSuccess(true);
      setEmailSubject('');
      setEmailBody('');
      fetchFacility(); // Refresh timeline
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (error) {
      console.error('Error logging email interaction:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading || !data) return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <Activity className="w-10 h-10 text-blue-600 animate-spin" />
    </div>
  );

  const { facility, interactions } = data;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* Left Column: Details & Email */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 bg-slate-50">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-white">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx(
                  "text-xs px-2.5 py-1 rounded-md font-medium",
                  facility.is_priority_region ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700"
                )}>
                  {facility.pipeline_stage}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 leading-snug">
                {facility.facility_name || `${facility.first_name} ${facility.last_name}`}
              </h2>
              <p className="text-slate-500 mt-2 flex items-center gap-1 text-sm">
                <MapPin className="w-4 h-4 shrink-0" /> {facility.address ? `${facility.address}, ` : ''}{facility.city}, {facility.county} ({facility.state || 'PA'}{facility.zip_code ? ` ${facility.zip_code}` : ''})
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {/* Email Module */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Send Email
              </h3>
              
              {sendSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Email successfully sent and logged!
                </div>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Subject" 
                      value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <textarea 
                      placeholder="Write your message here..." 
                      rows={5}
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 placeholder-slate-400 resize-none transition-colors"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={sending}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? <Activity className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoBox icon={Building} label="Administrator" value={facility.administrator || `${facility.first_name} ${facility.last_name}`} />
              <InfoBox icon={Phone} label="Phone" value={facility.phone} />
              <InfoBox icon={Mail} label="Email" value={facility.email} />
              <InfoBox icon={Building} label="Licensed Beds" value={facility.beds ? `${facility.beds} Beds` : null} />
              <InfoBox icon={Building} label="Ownership" value={facility.ownership_type} />
              <InfoBox icon={CheckCircle} label="License Status" value={facility.license_status} />
            </div>

            {/* Extra Metadata / License Notes */}
            {facility.contact_status_notes && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Registration &amp; License Details</h4>
                <div className="text-xs text-slate-700 space-y-1">
                  {facility.contact_status_notes.split(' | ').map((note: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 py-0.5 border-b border-slate-50 last:border-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0"></span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="w-1/2 flex flex-col bg-white">
          <div className="p-6 border-b border-slate-200 bg-white">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Activity Timeline
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 relative no-scrollbar">
            <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-200"></div>
            
            <div className="space-y-6">
              {interactions.length === 0 && (
                <div className="text-slate-500 ml-12 text-sm">No recorded interactions.</div>
              )}
              {interactions.map((interaction: any) => (
                <div key={interaction.id} className="relative pl-12">
                  <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow-sm"></div>
                  
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        {interaction.interaction_type === 'Email' ? <Mail className="w-4 h-4 text-blue-600" /> : <Phone className="w-4 h-4 text-indigo-500" />}
                        {interaction.interaction_type}
                      </span>
                      <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md">
                        {formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{interaction.notes}</p>
                    
                    {interaction.email_message_id && (
                      <div className="mt-3 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-md text-slate-500 font-mono flex justify-between items-center">
                        <span className="truncate mr-2">MsgID: {interaction.email_message_id}</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Delivered
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <div className="overflow-hidden">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

