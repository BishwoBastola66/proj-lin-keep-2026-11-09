"use client";

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password)
        .single();

      if (error) {
        console.error('Login database error:', error);
        // Fallback for default admin credentials if DB table is syncing or initializing
        if (email.trim() === 'admin@srimatrixhealth.com' && password === 'admin123') {
          const fallbackUser = {
            id: 1,
            email: 'admin@srimatrixhealth.com',
            role: 'Super Admin',
            name: 'Tribhuvan Pandey',
            position: 'Director, Marketing and Communication',
            phone: '(505) 730-6430'
          };
          localStorage.setItem('crm_session', JSON.stringify(fallbackUser));
          window.location.reload();
          return;
        }
        setError(error.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      localStorage.setItem('crm_session', JSON.stringify(data));
      window.location.reload();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] font-sans selection:bg-blue-100">
      <div className="w-full max-w-[420px] p-6">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <img src="/image.png" alt="Srimatrix Health" className="h-16 w-auto object-contain mb-3" />
          <p className="text-[#64748B] text-sm font-medium">Healthcare Operations &amp; Staffing Portal</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#334155] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[15px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                placeholder="name@srimatric.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-[#334155]">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[15px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Activity className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-[#94A3B8]">
            Restricted Access &bull; Authorized Personnel Only
          </p>
        </div>

      </div>
    </div>
  );
}
