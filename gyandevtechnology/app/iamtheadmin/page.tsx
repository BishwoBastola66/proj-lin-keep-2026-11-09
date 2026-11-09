'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  Unlock,
  Shield,
  ShieldCheck,
  Briefcase,
  Users,
  Cpu,
  Sparkles,
  Calendar,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Tag,
  ArrowUpRight,
  LogOut,
  ExternalLink,
  Mail,
  Copy,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  X,
  Database,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  type JobPosition,
  INITIAL_JOBS,
  getStoredJobs,
  saveStoredJobs,
  JOBS_UPDATED_EVENT,
  fetchJobsWithSupabaseSync,
  createJobInSupabase,
  updateJobInSupabase,
  deleteJobInSupabase,
  fetchApplicationsFromSupabase,
  updateApplicationStageInSupabase,
  deleteApplicationFromSupabase,
  type ContactInquiry,
  fetchContactInquiriesFromSupabase,
  updateContactInquiryStatusInSupabase,
  deleteContactInquiryFromSupabase,
  INQUIRIES_UPDATED_EVENT,
  isSupabaseConfigured,
  signInAdminWithSupabase,
  getCurrentAdminUser,
  signOutAdmin,
  type DatabaseStorageStats,
  fetchDatabaseStorageStats
} from '@/lib/jobsData';
import { sanitizeUrl } from '@/lib/security';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { Navbar } from '@/components/Navbar';

// Real Candidate Applicant Interface
interface ApplicantItem {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  portfolio: string;
  stage: 'Review' | 'Interview' | 'Offer' | 'Rejected';
  appliedDate: string;
  note: string;
}

export default function AdminPage() {
  // Navigation View State
  const [activeAdminTab, setActiveAdminTab] = useState<'jobs' | 'inquiries'>('jobs');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Job Management State
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Client Inquiries State
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<'All' | 'new' | 'contacted' | 'archived'>('All');
  const [isDeleteInquiryModalOpen, setIsDeleteInquiryModalOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<ContactInquiry | null>(null);

  // Modals & Drawers
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosition | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosition | null>(null);
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState<JobPosition | null>(null);
  const [dbApplicants, setDbApplicants] = useState<ApplicantItem[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

  // Form Fields for Add / Edit Job
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('Healthcare Technology');
  const [formLocation, setFormLocation] = useState('Virginia, USA / Remote');
  const [formType, setFormType] = useState('Full-time');
  const [formExperience, setFormExperience] = useState('5+ Years Exp');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [formSummary, setFormSummary] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formResponsibilities, setFormResponsibilities] = useState('');
  const [formQualifications, setFormQualifications] = useState('');
  const [formFeedbackMessage, setFormFeedbackMessage] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscription Days Remaining (Target: 20 Sep 2027)
  const subscriptionDaysRemaining = useMemo(() => {
    const target = new Date('2027-09-20T00:00:00Z');
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, []);

  // Database Storage Telemetry State
  const [storageStats, setStorageStats] = useState<DatabaseStorageStats | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  const loadStorageStats = async () => {
    setIsLoadingStorage(true);
    try {
      const stats = await fetchDatabaseStorageStats();
      if (stats) {
        setStorageStats(stats);
      }
    } catch (err) {
      console.error('Failed to load storage stats:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check Supabase authentication and session on mount
  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseClient();

    const checkAdminSession = async () => {
      if (!isSupabaseConfigured() || !client) {
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthLoading(false);
        }
        return;
      }

      try {
        const admin = await getCurrentAdminUser();
        if (isMounted) {
          if (admin) {
            setIsAuthenticated(true);
            loadStorageStats();
            const [syncedJobs, syncedInqs] = await Promise.all([
              fetchJobsWithSupabaseSync(true),
              fetchContactInquiriesFromSupabase(),
            ]);
            if (isMounted) {
              setJobs(syncedJobs || []);
              setInquiries(syncedInqs || []);
            }
          } else {
            setIsAuthenticated(false);
          }
          setAuthLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthLoading(false);
        }
      }
    };

    checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to store updates
  useEffect(() => {
    const handleUpdate = () => {
      setJobs(getStoredJobs());
      if (isAuthenticated) {
        fetchContactInquiriesFromSupabase().then((data) => setInquiries(data || []));
      }
    };
    window.addEventListener(JOBS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(INQUIRIES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(JOBS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(INQUIRIES_UPDATED_EVENT, handleUpdate);
    };
  }, [isAuthenticated]);

  const handleOpenApplicants = (job: JobPosition) => {
    setIsLoadingApplicants(true);
    setViewingApplicantsJob(job);
  };

  const handleCloseApplicants = () => {
    setViewingApplicantsJob(null);
    setDbApplicants([]);
    setIsLoadingApplicants(false);
  };

  // Sync real candidate applications when viewing applicants
  useEffect(() => {
    if (!viewingApplicantsJob) {
      return;
    }

    let isMounted = true;
    fetchApplicationsFromSupabase(viewingApplicantsJob.id)
      .then((apps) => {
        if (!isMounted) return;
        if (apps && apps.length > 0) {
          const mapped: ApplicantItem[] = apps.map((a) => ({
            id: a.id || `app-${Math.random()}`,
            jobId: a.jobId,
            name: a.candidateName,
            email: a.candidateEmail,
            phone: a.candidatePhone || 'Not provided',
            portfolio: a.portfolioUrl || '#',
            stage: a.stage || 'Review',
            appliedDate: a.createdAt || 'Recent',
            note: a.message || 'Application submitted via portal.',
          }));
          setDbApplicants(mapped);
        } else {
          setDbApplicants([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingApplicants(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [viewingApplicantsJob]);

  // Candidate application actions
  const handleStageChange = async (appId: string, newStage: 'Review' | 'Interview' | 'Offer' | 'Rejected') => {
    if (!viewingApplicantsJob) return;
    await updateApplicationStageInSupabase(appId, newStage);
    setDbApplicants((prev) => prev.map((a) => (a.id === appId ? { ...a, stage: newStage } : a)));
    showToast(`Candidate stage updated to ${newStage}.`);
  };

  const handleDeleteApplicant = async (appId: string) => {
    if (!viewingApplicantsJob) return;
    await deleteApplicationFromSupabase(appId, viewingApplicantsJob.id);
    setDbApplicants((prev) => prev.filter((a) => a.id !== appId));
    setJobs((prev) =>
      prev.map((j) => (j.id === viewingApplicantsJob.id ? { ...j, applicantsCount: Math.max(0, (j.applicantsCount || 1) - 1) } : j))
    );
    showToast('Candidate application removed.');
  };

  // Inquiry actions
  const handleUpdateInquiryStatus = async (id: string, status: 'new' | 'contacted' | 'archived') => {
    await updateContactInquiryStatusInSupabase(id, status);
    setInquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    showToast(`Inquiry marked as ${status}.`);
  };

  const handleOpenDeleteInquiry = (inquiry: ContactInquiry) => {
    setInquiryToDelete(inquiry);
    setIsDeleteInquiryModalOpen(true);
  };

  const handleDeleteInquiryConfirm = async () => {
    if (!inquiryToDelete) return;
    await deleteContactInquiryFromSupabase(inquiryToDelete.id);
    setInquiries((prev) => prev.filter((item) => item.id !== inquiryToDelete.id));
    setIsDeleteInquiryModalOpen(false);
    setInquiryToDelete(null);
    showToast('Inquiry removed.');
  };

  // Handle Login Submission via Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    setLoginError('');

    try {
      const res = await signInAdminWithSupabase(loginEmail, loginPassword);

      if (res.success) {
        setIsAuthenticated(true);
        showToast('Welcome back, Administrator.');
        const [syncedJobs, syncedInqs] = await Promise.all([
          fetchJobsWithSupabaseSync(true),
          fetchContactInquiriesFromSupabase(),
        ]);
        setJobs(syncedJobs || []);
        setInquiries(syncedInqs || []);
      } else {
        setLoginError(res.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setLoginError(`Authentication error: ${msg}`);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    await signOutAdmin();
    setJobs([]);
    setInquiries([]);
    setDbApplicants([]);
    showToast('Secure session closed.');
  };

  // Open Add Job Modal
  const handleOpenAddJob = () => {
    setEditingJob(null);
    setFormTitle('');
    setFormDepartment('Healthcare Technology');
    setFormLocation('Virginia, USA / Remote');
    setFormType('Full-time');
    setFormExperience('5+ Years Exp');
    setFormStatus('active');
    setFormSummary('');
    setFormTags('');
    setFormResponsibilities('');
    setFormQualifications('');
    setFormFeedbackMessage('');
    setIsEditModalOpen(true);
  };

  // Open Edit Job Modal
  const handleOpenEditJob = (job: JobPosition) => {
    setEditingJob(job);
    setFormTitle(job.title);
    setFormDepartment(job.department);
    setFormLocation(job.location);
    setFormType(job.type);
    setFormExperience(job.experience);
    setFormStatus(job.status || 'active');
    setFormSummary(job.summary);
    setFormTags(job.tags.join(', '));
    setFormResponsibilities(job.responsibilities.join('\n'));
    setFormQualifications(job.qualifications.join('\n'));
    setFormFeedbackMessage('');
    setIsEditModalOpen(true);
  };

  // Save (Create or Update) Job
  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      setFormFeedbackMessage('Please enter a valid job title.');
      return;
    }

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const respArray = formResponsibilities
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    const qualArray = formQualifications
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    if (editingJob) {
      // Edit existing job
      const updatedJob: JobPosition = {
        ...editingJob,
        title: formTitle.trim(),
        department: formDepartment,
        location: formLocation.trim(),
        type: formType,
        experience: formExperience.trim(),
        status: formStatus,
        summary: formSummary.trim(),
        tags: tagsArray,
        responsibilities: respArray,
        qualifications: qualArray
      };
      updateJobInSupabase(updatedJob).then((res) => setJobs(res));
      showToast(`Position "${formTitle}" updated successfully.`);
    } else {
      // Create new job
      const newJobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newJob: JobPosition = {
        id: newJobId,
        title: formTitle.trim(),
        department: formDepartment,
        location: formLocation.trim(),
        type: formType,
        experience: formExperience.trim(),
        status: formStatus,
        summary: formSummary.trim(),
        tags: tagsArray,
        responsibilities: respArray,
        qualifications: qualArray,
        applicantsCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      createJobInSupabase(newJob).then((res) => setJobs(res));
      showToast(`New position "${formTitle}" created and published.`);
    }

    setIsEditModalOpen(false);
  };

  // Toggle Active / Archived
  const handleToggleStatus = (job: JobPosition) => {
    const nextStatus: 'active' | 'archived' = job.status === 'archived' ? 'active' : 'archived';
    const updatedJob = { ...job, status: nextStatus };
    updateJobInSupabase(updatedJob).then((res) => setJobs(res));
    showToast(`Position "${job.title}" marked as ${nextStatus}.`);
  };

  // Delete Job
  const handleConfirmDelete = () => {
    if (!jobToDelete) return;
    deleteJobInSupabase(jobToDelete.id).then((res) => setJobs(res));
    setIsDeleteModalOpen(false);
    showToast(`Position "${jobToDelete.title}" deleted.`);
    setJobToDelete(null);
  };



  // Derived KPI Metrics
  const totalActive = useMemo(() => jobs.filter((j) => (j.status || 'active') === 'active').length, [jobs]);
  const totalDraft = useMemo(() => jobs.filter((j) => j.status === 'draft').length, [jobs]);
  const totalArchived = useMemo(() => jobs.filter((j) => j.status === 'archived').length, [jobs]);
  const totalApplicants = useMemo(() => jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0), [jobs]);

  // Filtered Jobs for Cards Grid
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept =
        selectedDeptFilter === 'All' || job.department === selectedDeptFilter;

      const currentStatus = job.status || 'active';
      const matchesStatus =
        selectedStatusFilter === 'All' || currentStatus === selectedStatusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [jobs, searchQuery, selectedDeptFilter, selectedStatusFilter]);

  const allDepartments = useMemo(() => {
    return ['All', ...Array.from(new Set(jobs.map((j) => j.department)))];
  }, [jobs]);

  // Derived Inquiry Metrics
  const totalInquiries = inquiries.length;
  const newInquiriesCount = useMemo(() => inquiries.filter((i) => (i.status || 'new') === 'new').length, [inquiries]);
  const contactedInquiriesCount = useMemo(() => inquiries.filter((i) => i.status === 'contacted').length, [inquiries]);
  const archivedInquiriesCount = useMemo(() => inquiries.filter((i) => i.status === 'archived').length, [inquiries]);
  const itInquiriesCount = useMemo(() => inquiries.filter((i) => (i.focusArea || '').toLowerCase().includes('it')).length, [inquiries]);
  const healthcareInquiriesCount = useMemo(() => inquiries.filter((i) => (i.focusArea || '').toLowerCase().includes('healthcare')).length, [inquiries]);

  // Filtered Inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      const q = inquirySearch.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.organization && item.organization.toLowerCase().includes(q)) ||
        item.message.toLowerCase().includes(q) ||
        item.focusArea.toLowerCase().includes(q);

      const currentStatus = item.status || 'new';
      const matchesStatus =
        inquiryStatusFilter === 'All' || currentStatus === inquiryStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, inquirySearch, inquiryStatusFilter]);


  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafc] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // SECURED LOGIN VIEW
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#fafafc] text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans pt-20 sm:pt-24">
        {/* Sticky Official Home Section Navbar without marketing navigation links */}
        <Navbar hideNavLinks />

        {/* Subtle Ambient Engineering Grid & Glows */}
        <div className="absolute inset-0 bg-grid-light opacity-70 pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] bg-gradient-to-tr from-blue-100/50 via-indigo-100/30 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-[600px] h-[400px] bg-blue-50/60 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Center Login Form Only (No Container Box, Substantial Size) */}
        <main className="w-full max-w-lg sm:max-w-xl mx-auto px-6 sm:px-8 my-auto py-16 relative z-10 space-y-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
              Sign In
            </h1>
          </div>

          {/* Error Alert */}
          {loginError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@gyanavsolutions.com"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 text-slate-900 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white transition-all font-sans shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm sm:text-base font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 text-slate-900 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white transition-all font-sans shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full mt-4 py-4 sm:py-4.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-bold tracking-wide transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingLogin ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </main>

        {/* Bottom Security Footer */}
        <footer className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-5 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Gyanav Solutions • Virginia, USA</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            SOC-2 &amp; HIPAA Compliant Stack • Support: hr@gyanavsolutions.com
          </span>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-900 font-sans selection:bg-blue-600/15 selection:text-blue-950 flex flex-col">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs py-3 px-4 sm:px-8">
        <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Logo & Portal Info */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
              <Image
                src="/logo.png"
                alt="Gyanav Solutions Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
                unoptimized
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-950 text-sm sm:text-base leading-tight">
                  GYANAV SOLUTIONS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Internal Career &amp; Job Position Management
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Header Title, Section Switcher & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {activeAdminTab === 'jobs' ? 'Job Position Management' : 'Client Inquiries & Consultation Requests'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {activeAdminTab === 'jobs'
                ? 'Configure open positions, review candidate applications, and control public listing status.'
                : 'Review client leads, prospective engagements, and project scope submissions from the website.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Pills */}
            <div className="flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveAdminTab('jobs')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeAdminTab === 'jobs'
                    ? 'bg-white text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Positions ({jobs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAdminTab('inquiries')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeAdminTab === 'inquiries'
                    ? 'bg-white text-slate-950 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Client Inquiries ({inquiries.length})</span>
                {newInquiriesCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                )}
              </button>
            </div>

            {/* Database Storage Telemetry Button */}
            <button
              type="button"
              onClick={() => {
                setIsStorageModalOpen(true);
                loadStorageStats();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-200/90 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              title="View database storage consumed & remaining quota"
            >
              <Database className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Database</span>
              {storageStats ? (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
                  <span className="font-mono text-[11px] font-bold text-slate-900">
                    {storageStats.consumed_pretty}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 font-mono">
                    {storageStats.remaining_pretty} free
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">...</span>
              )}
            </button>

            {activeAdminTab === 'jobs' && (
              <button
                onClick={handleOpenAddJob}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow-md cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create New Position</span>
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ROW OF 5 KPI SUMMARY CARDS */}
        {/* ------------------------------------------------------------- */}
        {activeAdminTab === 'jobs' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {/* Card 1: Active Postings */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  ACTIVE POSTINGS
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {totalActive}
              </div>
            </div>

            {/* Card 2: Total Applications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  APPLICANTS
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {totalApplicants}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Across all open roles
              </div>
            </div>

            {/* Card 3: Subscription Status */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  SUBSCRIPTION
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-slate-950 tracking-tight">
                20 Sep 2027
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Cancels 20 Sep 2027</span>
                </span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80 font-mono whitespace-nowrap">
                  {subscriptionDaysRemaining !== null ? `${subscriptionDaysRemaining} days remaining` : '359 days remaining'}
                </span>
              </div>
            </div>

            {/* Card 4: Database Storage */}
            <div
              onClick={() => {
                setIsStorageModalOpen(true);
                loadStorageStats();
              }}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:border-indigo-300"
              title="Click to view database storage breakdown"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors">
                  STORAGE
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-slate-950 tracking-tight">
                {storageStats
                  ? `${Math.max(1, Math.round(storageStats.consumed_bytes / (1024 * 1024)))} / 500 MB`
                  : '1 / 500 MB'}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{storageStats ? `${storageStats.remaining_pretty} remaining` : '499 MB remaining'}</span>
                {storageStats && (
                  <span className="text-[10px] font-semibold text-emerald-600 font-mono">
                    {Math.max(0, 100 - storageStats.percentage_used).toFixed(0)}% free
                  </span>
                )}
              </div>
            </div>

            {/* Card 5: Client Inquiries */}
            <div
              onClick={() => setActiveAdminTab('inquiries')}
              className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:border-blue-300"
              title="Click to view client consultation inquiries"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">
                  CLIENT INQUIRIES
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {totalInquiries}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                {newInquiriesCount > 0 ? `${newInquiriesCount} new consultation leads` : 'Consultation inquiries'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
            {/* Inquiry Card 1: Total Inquiries */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  TOTAL INQUIRIES
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {totalInquiries}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Logged in database
              </div>
            </div>

            {/* Inquiry Card 2: New Inquiries */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  NEW SUBMISSIONS
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {newInquiriesCount}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                {newInquiriesCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                <span>Awaiting initial contact</span>
              </div>
            </div>

            {/* Inquiry Card 3: Contacted */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  CONTACTED
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {contactedInquiriesCount}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Responses delivered
              </div>
            </div>

            {/* Inquiry Card 4: IT Consulting */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  IT CONSULTING
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {itInquiriesCount}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Cloud &amp; Architecture
              </div>
            </div>

            {/* Inquiry Card 5: Healthcare Tech */}
            <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  HEALTHCARE TECH
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {healthcareInquiriesCount}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                FHIR &amp; Interoperability
              </div>
            </div>
          </div>
        )}

        {activeAdminTab === 'jobs' ? (
          <>
            {/* ------------------------------------------------------------- */}
            {/* FILTER & SEARCH BAR */}
            {/* ------------------------------------------------------------- */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, skills, tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department and Status Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Dept:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              >
                {allDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-blue-600 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="draft">Drafts Only</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <span className="text-xs text-slate-400 ml-1 font-medium">
              Showing {filteredJobs.length} of {jobs.length} cards
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* JOB CARDS GRID */}
        {/* ------------------------------------------------------------- */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {jobs.length === 0 ? 'No positions in database' : 'No positions match your filters'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {jobs.length === 0
                  ? 'There are currently zero job listings in your database or storage. Click "Create New Position" to publish a new position.'
                  : 'Try clearing your search query or department filter, or click "Create New Position" to add a new role.'}
              </p>
            </div>
            {jobs.length === 0 ? (
              <button
                onClick={handleOpenAddJob}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Position</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDeptFilter('All');
                  setSelectedStatusFilter('All');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredJobs.map((job) => {
              const status = job.status || 'active';

              return (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Top Card Section */}
                  <div className="p-5 sm:p-6 space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      {job.department && job.department.toLowerCase() !== 'infrastructure' ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 text-blue-700 text-[10px] font-bold uppercase tracking-wider truncate">
                          {job.department}
                        </span>
                      ) : <span />}

                      <button
                        onClick={() => handleToggleStatus(job)}
                        title="Click to toggle status"
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                          status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            status === 'active' ? 'bg-emerald-500' : status === 'draft' ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                        />
                        <span>{status}</span>
                      </button>
                    </div>

                    {/* Role Title */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-950 tracking-tight leading-snug group-hover:text-blue-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{job.location}</span>
                        </span>
                      </div>
                    </div>

                    {/* Meta Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {job.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {job.experience}
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {job.summary}
                    </p>

                    {/* Tags */}
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

                  {/* Bottom Metrics & Actions Bar */}
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <button
                        onClick={() => handleOpenApplicants(job)}
                        className="hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-slate-800">
                          {job.applicantsCount || 0} applicants
                        </span>
                      </button>

                      <span className="text-[11px] text-slate-400">
                        {job.createdAt ? `Posted ${job.createdAt}` : 'Active Listing'}
                      </span>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => handleOpenEditJob(job)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleOpenApplicants(job)}
                        className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer"
                        title="View Applicants"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                      </button>

                      <button
                        onClick={() => {
                          setJobToDelete(job);
                          setIsDeleteModalOpen(true);
                        }}
                        className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
          </>
        ) : (
          <>
            {/* ------------------------------------------------------------- */}
            {/* CLIENT INQUIRIES FILTER & SEARCH BAR */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  placeholder="Search client, email, org, or scope..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                />
                {inquirySearch && (
                  <button
                    onClick={() => setInquirySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">Status:</span>
                  <select
                    value={inquiryStatusFilter}
                    onChange={(e) => setInquiryStatusFilter(e.target.value as 'All' | 'new' | 'contacted' | 'archived')}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50 cursor-pointer"
                  >
                    <option value="All">All Inquiries ({inquiries.length})</option>
                    <option value="new">New Submissions ({newInquiriesCount})</option>
                    <option value="contacted">Contacted ({contactedInquiriesCount})</option>
                    <option value="archived">Archived ({archivedInquiriesCount})</option>
                  </select>
                </div>

                {(inquirySearch || inquiryStatusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setInquirySearch('');
                      setInquiryStatusFilter('All');
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CLIENT INQUIRIES LIST / GRID */}
            {/* ------------------------------------------------------------- */}
            {filteredInquiries.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-8 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No Client Inquiries Found</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {inquirySearch || inquiryStatusFilter !== 'All'
                    ? 'No consultation inquiries match your filter criteria. Clear your search or filters to see all submissions.'
                    : 'New prospective client submissions from the public website consultation form will appear here in real time with database sync.'}
                </p>
                {(inquirySearch || inquiryStatusFilter !== 'All') && (
                  <button
                    onClick={() => {
                      setInquirySearch('');
                      setInquiryStatusFilter('All');
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {filteredInquiries.map((inquiry) => (
                  <motion.div
                    key={inquiry.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Card Top: Client Meta & Status */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-950">
                              {inquiry.name}
                            </h3>
                            {inquiry.organization && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                {inquiry.organization}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-blue-600" />
                              <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">
                                {inquiry.email}
                              </a>
                            </span>
                            {inquiry.createdAt && (
                              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{inquiry.createdAt}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Selector Dropdown */}
                        <div className="flex items-center gap-2">
                          <select
                            value={inquiry.status || 'new'}
                            onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value as 'new' | 'contacted' | 'archived')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-all ${
                              inquiry.status === 'contacted'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : inquiry.status === 'archived'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20'
                            }`}
                          >
                            <option value="new">Status: New</option>
                            <option value="contacted">Status: Contacted</option>
                            <option value="archived">Status: Archived</option>
                          </select>

                          <button
                            onClick={() => handleOpenDeleteInquiry(inquiry)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Focus Area Pill */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200/60 text-blue-700 text-xs font-semibold">
                        <Tag className="w-3 h-3" />
                        <span>Focus: {inquiry.focusArea}</span>
                      </div>

                      {/* Project Scope / Message Block */}
                      <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Problem Summary / Scope
                        </div>
                        <p className="whitespace-pre-wrap">{inquiry.message}</p>
                      </div>
                    </div>

                    {/* Card Bottom: Quick Actions Bar */}
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {inquiry.id.slice(0, 8)}...
                      </span>

                      <a
                        href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: Consulting Inquiry (${inquiry.focusArea}) - Gyanav Solutions`)}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply via Email</span>
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* CREATE / EDIT JOB MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 my-6 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    {editingJob ? 'Edit Position' : 'New Position'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                    {editingJob ? `Update: ${editingJob.title}` : 'Create Job Opportunity'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formFeedbackMessage && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {formFeedbackMessage}
                </div>
              )}

              <form onSubmit={handleSaveJob} className="pt-5 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                  {/* Left Column: Role Details & Classifications */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Position Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. Senior Healthcare Systems Architect"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                      />
                    </div>

                    {/* Dept & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Department
                        </label>
                        <select
                          value={formDepartment}
                          onChange={(e) => setFormDepartment(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                        >
                          <option value="Healthcare Technology">Healthcare Technology</option>
                          <option value="Cloud Security">Cloud Security</option>
                          <option value="Application Engineering">Application Engineering</option>
                          <option value="Strategic Advisory">Strategic Advisory</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Location
                        </label>
                        <input
                          type="text"
                          required
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="e.g. Virginia, USA / Remote"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                        />
                      </div>
                    </div>

                    {/* Type, Experience, Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Job Type
                        </label>
                        <select
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Part-time">Part-time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Experience
                        </label>
                        <input
                          type="text"
                          value={formExperience}
                          onChange={(e) => setFormExperience(e.target.value)}
                          placeholder="e.g. 5+ Years Exp"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Publication Status
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as 'active' | 'draft' | 'archived')}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50 font-semibold"
                        >
                          <option value="active">Active (Visible)</option>
                          <option value="draft">Draft (Hidden)</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Tech Skills / Tags */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Tech Stack &amp; Skills (Comma separated)
                      </label>
                      <input
                        type="text"
                        value={formTags}
                        onChange={(e) => setFormTags(e.target.value)}
                        placeholder="FHIR R4, HL7, Epic, AWS, Kubernetes"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50"
                      />
                    </div>

                    {/* Summary */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Summary Description
                      </label>
                      <textarea
                        rows={3}
                        value={formSummary}
                        onChange={(e) => setFormSummary(e.target.value)}
                        placeholder="A concise overview of the role for candidate preview..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50 resize-none"
                      />
                    </div>
                  </div>

                  {/* Right Column: In-Depth Role Requirements */}
                  <div className="space-y-4 flex flex-col justify-between">
                    {/* Responsibilities */}
                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Key Responsibilities (One per line)
                      </label>
                      <textarea
                        rows={5}
                        value={formResponsibilities}
                        onChange={(e) => setFormResponsibilities(e.target.value)}
                        placeholder="Architect robust FHIR R4 pipelines&#10;Conduct architectural reviews with client CTOs&#10;Implement zero-trust security postures"
                        className="w-full flex-1 min-h-[125px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50 font-mono text-xs leading-relaxed"
                      />
                    </div>

                    {/* Qualifications */}
                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Required Qualifications (One per line)
                      </label>
                      <textarea
                        rows={5}
                        value={formQualifications}
                        onChange={(e) => setFormQualifications(e.target.value)}
                        placeholder="5+ years in healthcare systems engineering&#10;Proficiency with HL7 and SMART on FHIR&#10;Experience with AWS HealthLake or Cloud APIs"
                        className="w-full flex-1 min-h-[125px] px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50/50 font-mono text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer"
                  >
                    {editingJob ? 'Update Position' : 'Publish Position'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* APPLICANTS ROSTER MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {viewingApplicantsJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseApplicants}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 z-10 max-h-[88vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    Candidate Submissions
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                    {viewingApplicantsJob.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingApplicantsJob.location}</span>
                  </div>
                </div>

                <button
                  onClick={handleCloseApplicants}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Applicants list */}
              <div className="pt-5 space-y-4">
                {isLoadingApplicants ? (
                  <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                    <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Loading candidate applications...</p>
                  </div>
                ) : dbApplicants.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No candidate applications received yet</p>
                    <p className="text-slate-400 max-w-sm mx-auto">
                      Real submissions through the public careers portal or database will appear here automatically.
                    </p>
                  </div>
                ) : (
                  dbApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-950 text-sm">
                            {applicant.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {applicant.appliedDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={applicant.stage}
                            onChange={(e) => handleStageChange(applicant.id, e.target.value as 'Review' | 'Interview' | 'Offer' | 'Rejected')}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-all ${
                              applicant.stage === 'Offer'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : applicant.stage === 'Interview'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : applicant.stage === 'Rejected'
                                ? 'bg-red-50 text-red-800 border-red-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="Review">Stage: Review</option>
                            <option value="Interview">Stage: Interview</option>
                            <option value="Offer">Stage: Offer</option>
                            <option value="Rejected">Stage: Rejected</option>
                          </select>

                          <button
                            onClick={() => handleDeleteApplicant(applicant.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete candidate application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <a href={`mailto:${applicant.email}`} className="text-blue-600 hover:underline">
                            {applicant.email}
                          </a>
                        </span>
                        {applicant.phone && applicant.phone !== 'Not provided' && (
                          <span>{applicant.phone}</span>
                        )}
                        {(() => {
                          const safeUrl = sanitizeUrl(applicant.portfolio);
                          if (!safeUrl) return null;
                          return (
                            <a
                              href={safeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 underline"
                            >
                              <span>Portfolio / Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          );
                        })()}
                      </div>

                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70">
                        &ldquo;{applicant.note}&rdquo;
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Direct candidate emails forward to <span className="font-semibold text-slate-800">hr@gyanavsolutions.com</span>
                </span>
                <button
                  onClick={handleCloseApplicants}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Close Roster
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isDeleteModalOpen && jobToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 z-10 space-y-4 shadow-xl"
            >
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-950">
                  Delete Position?
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete &ldquo;{jobToDelete.title}&rdquo;? It will be immediately removed from the live website.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* DELETE INQUIRY CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isDeleteInquiryModalOpen && inquiryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteInquiryModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 z-10 space-y-4 shadow-xl"
            >
              <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-950">
                  Delete Client Inquiry?
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Are you sure you want to delete the consultation inquiry from <span className="font-semibold text-slate-800">{inquiryToDelete.name}</span> ({inquiryToDelete.email})? This record will be permanently deleted from the database.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setIsDeleteInquiryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInquiryConfirm}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* ------------------------------------------------------------- */}
      {/* DATABASE STORAGE USAGE MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isStorageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStorageModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 my-8"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-600/20 text-blue-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight">
                        Database
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time consumed bytes, remaining free quota, and per-table allocations.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsStorageModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {isLoadingStorage && !storageStats ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Measuring database user tables and allocations...</p>
                  </div>
                ) : storageStats ? (
                  <>
                    {/* Storage Quota Card */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Tier Quota Status
                          </span>
                          <h4 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-0.5">
                            {storageStats.percentage_used}% Consumed
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Quota</span>
                          <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
                            {storageStats.quota_pretty}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 border border-slate-200/60 rounded-full h-3 p-0.5 mb-5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, Math.min(100, storageStats.percentage_used))}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full bg-blue-600 rounded-full shadow-2xs"
                        />
                      </div>

                      {/* 3 Metric Tiles */}
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Consumed</span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-950 font-mono block mt-0.5">
                            {storageStats.consumed_pretty}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                            {storageStats.consumed_bytes.toLocaleString()} bytes
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Remaining Free</span>
                          <span className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
                            {storageStats.remaining_pretty}
                          </span>
                          <span className="text-[10px] text-emerald-600 block font-mono mt-0.5">
                            {storageStats.remaining_bytes.toLocaleString()} bytes
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Database</span>
                          <span className="text-sm sm:text-base font-extrabold text-slate-950 font-mono truncate block mt-0.5">
                            {storageStats.db_name}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-medium mt-0.5">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Per-Table Storage Breakdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Public User Tables Breakdown ({storageStats.tables.length})
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          Data &amp; B-Tree Index sizes
                        </span>
                      </div>

                      <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600">
                            <tr>
                              <th className="py-2.5 px-4">Table</th>
                              <th className="py-2.5 px-3 text-right">Rows</th>
                              <th className="py-2.5 px-3 text-right">Data</th>
                              <th className="py-2.5 px-3 text-right">Indexes</th>
                              <th className="py-2.5 px-4 text-right">Total Size</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans">
                            {storageStats.tables.map((t) => (
                              <tr key={t.table_name} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                                  {t.table_name}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                  {t.row_count}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                                  {t.table_size}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                                  {t.index_size}
                                </td>
                                <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-600">
                                  {t.total_size}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="text-xs font-semibold text-amber-800">
                      Unable to retrieve database telemetry. Please ensure your database connection is active.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={loadStorageStats}
                  disabled={isLoadingStorage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoadingStorage ? 'animate-spin' : ''}`} />
                  <span>{isLoadingStorage ? 'Checking...' : 'Refresh Storage'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStorageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-950 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
