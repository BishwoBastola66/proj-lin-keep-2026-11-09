'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { ArrowRight, Copy, Check, Mail, Clock, ShieldCheck, ChevronDown, Loader2 } from 'lucide-react';
import { submitContactInquiryToSupabase } from '@/lib/jobsData';
import { isValidEmail, sanitizeText } from '@/lib/security';

const Converging3DNetwork = dynamic(
  () => import('./canvas/Converging3DNetwork'),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 pointer-events-none opacity-45" />,
  }
);

const FOCUS_AREAS = [
  { value: 'IT Consulting', label: 'IT Consulting & Advisory' },
  { value: 'Healthcare Technology', label: 'Healthcare Technology Interoperability' },
];

interface ContactCTAProps {
  onOpenContact?: () => void;
}

export const ContactCTA: React.FC<ContactCTAProps> = () => {
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    focusArea: 'IT Consulting',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('hr@gyanavsolutions.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Honeypot check for bots
    if (honeypot.trim()) {
      setIsSubmitted(true);
      return;
    }

    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (trimmedName.length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setFormError('Please enter a valid work or professional email address.');
      return;
    }

    if (trimmedMessage.length < 5) {
      setFormError('Please provide a brief problem summary or project scope (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Persist directly to Supabase table contact_inquiries with sanitized values
      const res = await submitContactInquiryToSupabase({
        name: sanitizeText(trimmedName, 100),
        email: sanitizeText(trimmedEmail, 255),
        organization: formData.organization.trim() ? sanitizeText(formData.organization.trim(), 150) : undefined,
        focusArea: sanitizeText(formData.focusArea, 100),
        message: sanitizeText(trimmedMessage, 5000),
        status: 'new',
      });

      if (!res.success && res.error) {
        setFormError(res.error);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting contact inquiry:', err);
      setFormError('An error occurred while logging your inquiry. Please email hr@gyanavsolutions.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <section id="contact" className="py-14 sm:py-18 md:py-22 bg-[#fafafc] relative overflow-hidden border-t border-slate-200/70 font-sans">
      {/* Background Fine Grid Pattern */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[550px] bg-blue-100/20 blur-3xl pointer-events-none -z-10" />

      {/* Soft Atmosphere Transition */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#fafafc] to-transparent pointer-events-none" />

      {/* 3D WebGL Wide Flank Constellation */}
      <Converging3DNetwork />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-start">
          
          {/* Left Column: Direct Engagement Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5 space-y-6"
          >
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                ENGAGEMENT &amp; INQUIRY
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-slate-950 tracking-tight leading-[1.14]">
                Let&apos;s Solve the Right Problem Together.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-4 max-w-xl">
                Have a complex integration, cloud modernization, or healthcare data challenge? Submit your requirements directly to our senior technology team.
              </p>
            </div>

            {/* Direct Email Strip & Assurances — Hidden on mobile as requested */}
            <div className="hidden sm:block space-y-5">
              <div className="border-t border-slate-200/90 pt-5 space-y-3">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  DIRECT INQUIRY CHANNEL
                </span>
                
                <div className="flex items-center justify-between gap-3 py-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <a
                      href="mailto:hr@gyanavsolutions.com?subject=Consulting%20Inquiry%20-%20Gyanav%20Solutions"
                      className="text-base sm:text-lg font-bold text-slate-950 hover:text-blue-600 transition-colors truncate"
                    >
                      hr@gyanavsolutions.com
                    </a>
                  </div>

                  <button
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-200/60 text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors cursor-pointer shrink-0"
                    title="Copy email to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Advisory Assurance Points */}
              <div className="space-y-2.5 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Responses delivered within 24 business hours by principal engineers.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>100% vendor-neutral evaluation. No sales reps, zero proprietary lock-in.</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Embedded Inquiry Form seamlessly part of the page */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 lg:border-l lg:border-slate-200/90 lg:pl-10 xl:pl-12"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                  Project Inquiry &amp; Advisory Request
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill in your project details below to initiate direct consultation.
                </p>
              </div>

              {isSubmitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Inquiry Received &amp; Logged</h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Your inquiry has been recorded and routed directly to our principal engineers. We review and respond to all technical inquiries within 24 business hours.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                    <a
                      href={`mailto:hr@gyanavsolutions.com?subject=${encodeURIComponent(`Consulting Inquiry: ${formData.focusArea} - ${formData.organization || formData.name}`)}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Email Client</span>
                    </a>
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', organization: '', focusArea: 'IT Consulting', message: '' });
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Spam bot honeypot - invisible to legitimate users */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="company_client_verify">Leave this field blank</label>
                    <input
                      id="company_client_verify"
                      type="text"
                      name="company_client_verify"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <span className="font-semibold">Notice:</span> {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Eleanor Vance"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/80 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={255}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@organization.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/80 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Organization / Company
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Organization or Firm"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/80 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 shadow-2xs"
                      />
                    </div>

                    <div ref={dropdownRef} className="relative">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Engagement Focus
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/80 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all cursor-pointer shadow-2xs text-left"
                        aria-haspopup="listbox"
                        aria-expanded={isDropdownOpen}
                      >
                        <span className="truncate font-medium">
                          {FOCUS_AREAS.find((a) => a.value === formData.focusArea)?.label || formData.focusArea}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in duration-150">
                          {FOCUS_AREAS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, focusArea: opt.value }));
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-colors cursor-pointer ${
                                formData.focusArea === opt.value
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {formData.focusArea === opt.value && (
                                <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Problem Summary or Project Scope *
                    </label>
                    <textarea
                      required
                      rows={3}
                      maxLength={5000}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Briefly describe the systems, requirements, or architecture challenges you are looking to address..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300/80 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-slate-400 resize-none shadow-2xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-sm shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Recording Inquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Inquiry</span>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400 text-center pt-1 font-sans">
                    Direct consultation with principal engineers. No spam, no sales representatives.
                  </div>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ContactCTA;
