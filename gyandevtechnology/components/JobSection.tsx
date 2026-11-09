'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Mail,
  Copy,
  Check,
  Send,
  Building,
  Sparkles
} from 'lucide-react';

import {
  type JobPosition,
  getStoredJobs,
  JOBS_UPDATED_EVENT,
  fetchJobsWithSupabaseSync,
  submitApplicationToSupabase
} from '@/lib/jobsData';
import { sanitizeUrl, isValidEmail, sanitizeText } from '@/lib/security';

export const JobSection: React.FC = () => {
  const [jobs, setJobs] = useState<JobPosition[]>(() => getStoredJobs());
  const [selectedDept, setSelectedDept] = useState('All');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobPosition | null>(null);
  const [detailsJob, setDetailsJob] = useState<JobPosition | null>(null);

  // Sync with live updates from /iamtheadmin & Supabase
  React.useEffect(() => {
    // Background sync with Supabase
    fetchJobsWithSupabaseSync().then((synced) => {
      setJobs(synced || []);
    });

    const handleUpdate = () => {
      setJobs(getStoredJobs());
    };
    window.addEventListener(JOBS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(JOBS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Application form state
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantPortfolio, setApplicantPortfolio] = useState('');
  const [applicantMessage, setApplicantMessage] = useState('');
  const [applicantHoneypot, setApplicantHoneypot] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const activeJobs = jobs.filter((j) => j.status !== 'archived');
  const availableDepts = ['All', ...Array.from(new Set(activeJobs.map((j) => j.department)))];

  const filteredJobs = selectedDept === 'All'
    ? activeJobs
    : activeJobs.filter((j) => j.department === selectedDept);

  const toggleExpand = (id: string) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const handleOpenApplyModal = (job: JobPosition) => {
    setApplyingJob(job);
    setIsSubmitted(false);
    setFormError(null);
  };

  const handleCloseApplyModal = () => {
    setApplyingJob(null);
    setIsSubmitted(false);
    setFormError(null);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hr@gyanavsolutions.com');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob || isSubmitting) return;

    // 1. Bot honeypot trap: if filled by automated bots, reject without execution
    if (applicantHoneypot.trim()) {
      setIsSubmitted(true);
      return;
    }

    setFormError(null);

    // 2. Validate input fields
    const trimmedName = applicantName.trim();
    const trimmedEmail = applicantEmail.trim();
    const trimmedPortfolio = applicantPortfolio.trim();

    if (trimmedName.length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // 3. Strict URL validation: reject non-http(s) protocols
    let safePortfolio: string | undefined = undefined;
    if (trimmedPortfolio) {
      const sanitized = sanitizeUrl(trimmedPortfolio);
      if (!sanitized) {
        setFormError('Please provide a valid portfolio or profile URL starting with https:// or http://');
        return;
      }
      safePortfolio = sanitized;
    }

    setIsSubmitting(true);

    try {
      // Save submission to Supabase with sanitized values
      const submitRes = await submitApplicationToSupabase({
        jobId: applyingJob.id,
        candidateName: sanitizeText(trimmedName, 100),
        candidateEmail: sanitizeText(trimmedEmail, 255),
        candidatePhone: applicantPhone ? sanitizeText(applicantPhone, 50) : undefined,
        portfolioUrl: safePortfolio,
        message: applicantMessage ? sanitizeText(applicantMessage, 5000) : undefined,
        stage: 'Review',
      });

      if (!submitRes.success) {
        setFormError(submitRes.error || 'Failed to record application. Please email your resume to hr@gyanavsolutions.com directly.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setFormError('Failed to record application. Please email your resume to hr@gyanavsolutions.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="jobs" className="py-16 sm:py-20 md:py-24 bg-[#fafafc] relative overflow-hidden border-t border-slate-200/80 font-sans">
      {/* Background Precision Grid */}
      <div className="absolute inset-0 bg-grid-light opacity-50 pointer-events-none" />

      {/* Subtle Atmosphere Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-32 bg-blue-100/20 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-[1680px] 2xl:max-w-[1800px] mx-auto px-6 sm:px-10 md:px-12 lg:px-14 xl:px-16 2xl:px-20 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-10 sm:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-950 tracking-tight leading-[1.18] mb-4">
            Build Careers at Gyanav Solutions
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Explore open opportunities to work with our team on meaningful projects. We offer a flexible, collaborative environment where you can do your best work and grow your career.
          </p>
        </motion.div>

        {/* Department Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="flex flex-wrap items-center gap-2 mb-8 pb-3 border-b border-slate-200/80"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 hidden sm:inline-block">
            Filter by:
          </span>
          {availableDepts.map((dept) => {
            const isActive = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </motion.div>

        {/* Jobs Cards Grid or Empty State */}
        {activeJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xs space-y-4 mb-14"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-950">
                No Active Openings Currently Listed
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                We are currently not listing open positions on our public board. However, we are continually interested in meeting exceptional systems architects, clinical integration specialists, and cloud engineering leaders.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-2xs cursor-pointer"
              >
                <span>Submit Prospective Profile</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        ) : filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 text-center max-w-xl mx-auto shadow-2xs space-y-3 mb-14"
          >
            <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-950">
              No positions found in &quot;{selectedDept}&quot;
            </h3>
            <p className="text-xs text-slate-500">
              Select another department or reset to view all open positions.
            </p>
            <button
              onClick={() => setSelectedDept('All')}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              View All Openings
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-14">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(index * 0.08, 0.32),
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden group p-5 sm:p-6"
              >
                {/* Card Upper Content */}
                <div className="space-y-3.5">
                  {/* Department & Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                      {job.department}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {job.type}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {job.experience}
                    </span>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-slate-950 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.location}</span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {job.summary}
                  </p>

                  {/* Tech Tags */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {job.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-600 text-[10px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {job.tags.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        +{job.tags.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setDetailsJob(job)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-950 text-xs font-semibold transition-colors cursor-pointer bg-slate-50/50"
                  >
                    <span>Details</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenApplyModal(job)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide transition-all shadow-2xs hover:shadow-xs transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Apply Now</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Role Details Modal */}
        <AnimatePresence>
          {detailsJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDetailsJob(null)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 max-h-[88vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                        {detailsJob.department}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {detailsJob.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {detailsJob.experience}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                      {detailsJob.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{detailsJob.location}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDetailsJob(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="pt-5 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Role Overview
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {detailsJob.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Key Responsibilities
                    </h4>
                    <ul className="space-y-2">
                      {detailsJob.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                      Required Qualifications
                    </h4>
                    <ul className="space-y-2">
                      {detailsJob.qualifications.map((qual, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <span>{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Core Technologies
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {detailsJob.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Applications reviewed within 2 business days.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailsJob(null)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const j = detailsJob;
                        setDetailsJob(null);
                        handleOpenApplyModal(j);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer"
                    >
                      <span>Apply for this Role</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Spontaneous / General Application Banner */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg font-bold text-slate-950">
              Don’t see an exact match for your specialty?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              We are constantly looking for talented systems engineers, healthcare data architects, and technical advisors. Send your resume and portfolio directly to our human resources team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isCopied ? 'Email Copied' : 'hr@gyanavsolutions.com'}</span>
            </button>

            <a
              href="mailto:hr@gyanavsolutions.com?subject=Spontaneous%20Application%20-%20Gyanav%20Solutions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold tracking-wide transition-all shadow-2xs cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send General Application</span>
            </a>
          </div>
        </div>

      </div>

      {/* Interactive Application Modal */}
      <AnimatePresence>
        {applyingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseApplyModal}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    Application Form
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                    {applyingJob.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>{applyingJob.department}</span>
                    <span>•</span>
                    <span>{applyingJob.location}</span>
                  </div>
                </div>

                <button
                  onClick={handleCloseApplyModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSubmitted ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-950">Email Client Opened!</h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Your pre-formatted application has been directed to your email client. If it did not open automatically, please send your resume directly to{' '}
                    <span className="font-semibold text-slate-900">hr@gyanavsolutions.com</span>.
                  </p>
                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={handleCopyEmail}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {isCopied ? 'Copied!' : 'Copy HR Email'}
                    </button>
                    <button
                      onClick={handleCloseApplyModal}
                      className="px-4 py-2 rounded-xl bg-slate-950 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="pt-5 space-y-4">
                  {/* Spam bot honeypot - invisible to legitimate users */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="company_website_verify">Leave this field blank</label>
                    <input
                      id="company_website_verify"
                      type="text"
                      name="company_website_verify"
                      value={applicantHoneypot}
                      onChange={(e) => setApplicantHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                      <span className="font-semibold">Error:</span> {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Alex Henderson"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={255}
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        maxLength={50}
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      LinkedIn / Portfolio URL
                    </label>
                    <input
                      type="url"
                      maxLength={500}
                      value={applicantPortfolio}
                      onChange={(e) => setApplicantPortfolio(e.target.value)}
                      placeholder="https://linkedin.com/in/... or https://github.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Brief Note &amp; Experience
                    </label>
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={applicantMessage}
                      onChange={(e) => setApplicantMessage(e.target.value)}
                      placeholder="Highlight relevant projects, systems architecture experience, or attach your resume link..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all bg-slate-50/50 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 text-center sm:text-left">
                      Applications are processed securely by our talent team in Virginia.
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default JobSection;
