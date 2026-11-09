import {
  getSupabaseClient,
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseConfig,
  clearSupabaseConfig
} from './supabaseClient';
import { sanitizeUrl, sanitizeText, isValidEmail } from './security';

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experience: string;
  summary: string;
  tags: string[];
  responsibilities: string[];
  qualifications: string[];
  status?: 'active' | 'draft' | 'archived';
  applicantsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateApplication {
  id?: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  portfolioUrl?: string;
  message?: string;
  stage?: 'Review' | 'Interview' | 'Offer' | 'Rejected';
  createdAt?: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  organization?: string;
  focusArea: string;
  message: string;
  status: 'new' | 'contacted' | 'archived';
  createdAt?: string;
}

export interface AdminUser {
  id?: string;
  email: string;
  role?: string;
  lastLogin?: string;
}

export interface AdminLoginResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  source?: 'supabase_auth';
  needsConfig?: boolean;
}

// Positions are purely managed via Supabase database
export const INITIAL_JOBS: JobPosition[] = [];

const STORAGE_KEY = 'gyanav_jobs_data';
export const JOBS_UPDATED_EVENT = 'gyanav_jobs_updated';
export const INQUIRIES_UPDATED_EVENT = 'gyanav_inquiries_updated';

// -------------------------------------------------------------
// LOCAL CACHE HELPERS
// -------------------------------------------------------------
export function getStoredJobs(): JobPosition[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredJobs(jobs: JobPosition[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    window.dispatchEvent(new CustomEvent(JOBS_UPDATED_EVENT, { detail: jobs }));
  } catch (err) {
    console.error('Failed to save jobs to cache:', err);
  }
}

export function resetDefaultJobs(): JobPosition[] {
  saveStoredJobs([]);
  return [];
}

// -------------------------------------------------------------
// SUPABASE DATABASE INTEGRATION - JOBS
// -------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseRowToJob(row: any): JobPosition {
  return {
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    type: row.type || 'Full-time',
    experience: row.experience || 'Senior',
    summary: row.summary || '',
    tags: Array.isArray(row.tags) ? row.tags : [],
    responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
    qualifications: Array.isArray(row.qualifications) ? row.qualifications : [],
    status: row.status || 'active',
    applicantsCount: row.applicants_count || 0,
    createdAt: row.created_at ? row.created_at.split('T')[0] : undefined,
    updatedAt: row.updated_at,
  };
}

function mapJobToSupabaseRow(job: JobPosition) {
  return {
    id: job.id,
    title: sanitizeText(job.title, 150),
    department: sanitizeText(job.department, 100),
    location: sanitizeText(job.location, 100),
    type: sanitizeText(job.type, 50),
    experience: sanitizeText(job.experience, 50),
    summary: sanitizeText(job.summary, 2000),
    tags: Array.isArray(job.tags) ? job.tags.map((t) => sanitizeText(t, 50)) : [],
    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.map((r) => sanitizeText(r, 500)) : [],
    qualifications: Array.isArray(job.qualifications) ? job.qualifications.map((q) => sanitizeText(q, 500)) : [],
    status: job.status || 'active',
    applicants_count: job.applicantsCount || 0,
  };
}

/**
 * Fetch jobs: For public queries, returns only active jobs.
 * For administrative portal, fetches all jobs including drafts and archived.
 */
export async function fetchJobsWithSupabaseSync(adminView = false): Promise<JobPosition[]> {
  const local = getStoredJobs();
  const client = getSupabaseClient();

  if (!isSupabaseConfigured() || !client) {
    return local;
  }

  try {
    let query = client.from('jobs').select('*');
    if (!adminView) {
      query = query.eq('status', 'active');
    }
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to local cache:', error.message);
      return local;
    }

    if (data && data.length > 0) {
      const realJobs = data.map(mapSupabaseRowToJob);
      saveStoredJobs(realJobs);
      return realJobs;
    } else {
      saveStoredJobs([]);
      return [];
    }
  } catch (err) {
    console.warn('Supabase fetch exception, fallback to local cache:', err);
    return local;
  }
}

/**
 * Create a new job in Supabase (enforced by RLS for administrators only).
 */
export async function createJobInSupabase(job: JobPosition): Promise<JobPosition[]> {
  const current = getStoredJobs();
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      const { data, error } = await client
        .from('jobs')
        .insert(mapJobToSupabaseRow(job))
        .select()
        .single();

      if (error) {
        console.error('Supabase create error:', error.message);
        throw new Error(error.message);
      }
      if (data) {
        const createdJob = mapSupabaseRowToJob(data);
        const updated = [createdJob, ...current.filter((j) => j.id !== job.id)];
        saveStoredJobs(updated);
        return updated;
      }
    } catch (err) {
      console.error('Supabase create exception:', err);
      throw err;
    }
  }

  const updated = [job, ...current];
  saveStoredJobs(updated);
  return updated;
}

/**
 * Update an existing job in Supabase (enforced by RLS for administrators only).
 */
export async function updateJobInSupabase(job: JobPosition): Promise<JobPosition[]> {
  const current = getStoredJobs();
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client
        .from('jobs')
        .update(mapJobToSupabaseRow(job))
        .eq('id', job.id);

      if (error) {
        console.error('Database update error:', error.message || error);
        throw new Error(error.message || 'Database update failed');
      }
    } catch (err) {
      console.error('Database update exception:', err);
      throw err;
    }
  }

  const updated = current.map((j) => (j.id === job.id ? job : j));
  saveStoredJobs(updated);
  return updated;
}

/**
 * Delete a job in Supabase (enforced by RLS for administrators only).
 */
export async function deleteJobInSupabase(jobId: string): Promise<JobPosition[]> {
  const current = getStoredJobs();
  const client = getSupabaseClient();

  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('jobs').delete().eq('id', jobId);
      if (error) {
        console.error('Supabase delete error:', error.message);
        throw new Error(error.message);
      }
    } catch (err) {
      console.error('Supabase delete exception:', err);
      throw err;
    }
  }

  const updated = current.filter((j) => j.id !== jobId);
  saveStoredJobs(updated);
  return updated;
}

// -------------------------------------------------------------
// CANDIDATE JOB APPLICATIONS
// -------------------------------------------------------------

/**
 * Save candidate application into Supabase job_applications table.
 * Inputs are strictly validated and sanitized against XSS and injection.
 */
export async function submitApplicationToSupabase(
  application: CandidateApplication
): Promise<{ success: boolean; error?: string }> {
  // 1. In browser environments, route through the server-side rate-limited API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Submission error (${res.status}). Please try again later.`,
        };
      }
      return { success: true };
    } catch {
      // On network failure or offline state, safely fall back to direct client persistence
    }
  }

  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    console.error('Supabase client is not configured for job application submission');
    return { success: false, error: 'Database service is currently unavailable.' };
  }

  // Strict input validation and sanitization
  const sanitizedName = sanitizeText(application.candidateName, 100);
  const sanitizedEmail = sanitizeText(application.candidateEmail, 255);
  const sanitizedPhone = application.candidatePhone ? sanitizeText(application.candidatePhone, 50) : null;
  const sanitizedMessage = application.message ? sanitizeText(application.message, 5000) : null;

  // Strict URL sanitization: rejects javascript:, data:, vbscript:, and non-http(s) protocols
  const sanitizedPortfolio = application.portfolioUrl ? sanitizeUrl(application.portfolioUrl) : null;

  if (!sanitizedName || sanitizedName.length < 2) {
    return { success: false, error: 'Candidate name must be at least 2 characters.' };
  }

  if (!isValidEmail(sanitizedEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (application.portfolioUrl && application.portfolioUrl.trim() && !sanitizedPortfolio) {
    return { success: false, error: 'Portfolio URL must start with http:// or https://' };
  }

  try {
    const { error } = await client.from('job_applications').insert({
      job_id: application.jobId,
      candidate_name: sanitizedName,
      candidate_email: sanitizedEmail,
      candidate_phone: sanitizedPhone,
      portfolio_url: sanitizedPortfolio,
      message: sanitizedMessage,
      stage: 'Review',
    });

    if (error) {
      console.error('Failed to submit application to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Submission failed';
    return { success: false, error: msg };
  }
}

/**
 * Fetch candidate applications from Supabase.
 * Enforced by PostgreSQL RLS - only authenticated administrators can read applications.
 */
export async function fetchApplicationsFromSupabase(jobId?: string): Promise<CandidateApplication[]> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    return [];
  }

  // Pre-check authentication to prevent unnecessary queries if unauthenticated
  const currentAdmin = typeof window !== 'undefined'
    ? sessionStorage.getItem('gyanav_admin_authenticated') === 'true' ||
      localStorage.getItem('gyanav_admin_authenticated') === 'true'
    : true;
  if (!currentAdmin) {
    return [];
  }

  try {
    let query = client.from('job_applications').select('*').order('created_at', { ascending: false });
    if (jobId) {
      query = query.eq('job_id', jobId);
    }
    const { data, error } = await query;
    if (error) {
      if (!error.message?.includes('permission denied')) {
        console.warn('Supabase fetch applications access restricted / error:', error.message);
      }
      return [];
    }
    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((row: any) => ({
        id: row.id,
        jobId: row.job_id,
        candidateName: row.candidate_name,
        candidateEmail: row.candidate_email,
        candidatePhone: row.candidate_phone,
        portfolioUrl: sanitizeUrl(row.portfolio_url) || undefined,
        message: row.message,
        stage: row.stage,
        createdAt: row.created_at ? row.created_at.split('T')[0] : undefined,
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch applications from Supabase:', err);
    return [];
  }
}

/**
 * Update candidate application stage in Supabase (enforced by RLS for administrators).
 */
export async function updateApplicationStageInSupabase(
  appId: string,
  stage: 'Review' | 'Interview' | 'Offer' | 'Rejected'
): Promise<void> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('job_applications').update({ stage }).eq('id', appId);
      if (error) console.error('Database update application stage error:', error.message || error);
    } catch (err) {
      console.error('Database update application stage exception:', err);
    }
  }
}

/**
 * Delete candidate application from database and decrement job applicants count.
 */
export async function deleteApplicationFromSupabase(
  appId: string,
  jobId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('job_applications').delete().eq('id', appId);
      if (error) console.error('Database delete application error:', error.message || error);
      
      const { count } = await client
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      if (typeof count === 'number') {
        await client.from('jobs').update({ applicants_count: count }).eq('id', jobId);
      }
    } catch (err) {
      console.error('Database delete application exception:', err);
    }
  }
}

// -------------------------------------------------------------
// CLIENT CONTACT & CONSULTATION INQUIRIES
// -------------------------------------------------------------

/**
 * Submit client consultation inquiry to Supabase.
 * Validates inputs against injection, length constraints, and spam.
 * Inquiries are NOT stored in public browser localStorage to prevent PII exposure.
 */
export async function submitContactInquiryToSupabase(
  inquiry: Omit<ContactInquiry, 'id' | 'createdAt'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  // 1. In browser environments, route through the server-side rate-limited API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiry),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data.error || `Submission error (${res.status}). Please try again later.`,
        };
      }
      return { success: true };
    } catch {
      // On network failure or offline state, safely fall back to direct client persistence
    }
  }

  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    return { success: false, error: 'Database service is currently unavailable.' };
  }

  const sanitizedName = sanitizeText(inquiry.name, 100);
  const sanitizedEmail = sanitizeText(inquiry.email, 255);
  const sanitizedOrg = inquiry.organization ? sanitizeText(inquiry.organization, 150) : null;
  const sanitizedFocus = sanitizeText(inquiry.focusArea, 100);
  const sanitizedMessage = sanitizeText(inquiry.message, 5000);

  if (!sanitizedName || sanitizedName.length < 2) {
    return { success: false, error: 'Please provide a valid full name.' };
  }
  if (!isValidEmail(sanitizedEmail)) {
    return { success: false, error: 'Please provide a valid corporate or professional email address.' };
  }
  if (!sanitizedMessage || sanitizedMessage.length < 5) {
    return { success: false, error: 'Please provide a brief project summary or inquiry message.' };
  }

  try {
    const { error } = await client
      .from('contact_inquiries')
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        organization: sanitizedOrg,
        focus_area: sanitizedFocus,
        message: sanitizedMessage,
        status: inquiry.status || 'new',
      });

    if (error) {
      console.warn('Failed to insert inquiry to Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Submission failed';
    return { success: false, error: msg };
  }
}

/**
 * Fetch contact inquiries from Supabase.
 * Enforced by PostgreSQL RLS - only verified administrators can view inquiry records.
 */
export async function fetchContactInquiriesFromSupabase(): Promise<ContactInquiry[]> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) {
    return [];
  }

  // Pre-check authentication to prevent unnecessary queries if unauthenticated
  const currentAdmin = typeof window !== 'undefined'
    ? sessionStorage.getItem('gyanav_admin_authenticated') === 'true' ||
      localStorage.getItem('gyanav_admin_authenticated') === 'true'
    : true;
  if (!currentAdmin) {
    return [];
  }

  try {
    const { data, error } = await client
      .from('contact_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (!error.message?.includes('permission denied')) {
        console.warn('Supabase inquiries access restricted / error:', error.message);
      }
      return [];
    }

    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        organization: row.organization || '',
        focusArea: row.focus_area,
        message: row.message,
        status: row.status || 'new',
        createdAt: row.created_at ? row.created_at.split('T')[0] : undefined,
      }));
    }
    return [];
  } catch (err) {
    console.error('Exception fetching inquiries from Supabase:', err);
    return [];
  }
}

/**
 * Update inquiry status (new / contacted / archived) in Supabase.
 */
export async function updateContactInquiryStatusInSupabase(
  id: string,
  status: 'new' | 'contacted' | 'archived'
): Promise<void> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('contact_inquiries').update({ status }).eq('id', id);
      if (error) console.error('Database update inquiry error:', error.message || error);
    } catch (err) {
      console.error('Database update inquiry exception:', err);
    }
  }
}

/**
 * Delete inquiry from database.
 */
export async function deleteContactInquiryFromSupabase(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (isSupabaseConfigured() && client) {
    try {
      const { error } = await client.from('contact_inquiries').delete().eq('id', id);
      if (error) console.error('Database delete inquiry error:', error.message || error);
    } catch (err) {
      console.error('Database delete inquiry exception:', err);
    }
  }
}

// -------------------------------------------------------------
// SUPABASE AUTHENTICATION & AUTHORIZATION
// -------------------------------------------------------------

const ADMIN_AUTH_KEY = 'gyanav_admin_authenticated';
const ADMIN_USER_KEY = 'gyanav_admin_user';

/**
 * Authenticate administrator directly using the public.admin_users database table.
 * Matches email and password against the table and verifies is_active status.
 */
export async function signInAdminWithSupabase(
  email: string,
  passphrase: string
): Promise<AdminLoginResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPass = passphrase.trim();

  if (!normalizedEmail || !trimmedPass) {
    return { success: false, error: 'Email and password are required.' };
  }

  const client = getSupabaseClient();

  if (!isSupabaseConfigured() || !client) {
    return {
      success: false,
      error: 'Database service is not configured. Please check Supabase credentials.',
    };
  }

  try {
    // Query public.admin_users table in the database
    const { data, error } = await client
      .from('admin_users')
      .select('id, email, password, is_active')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('Database query error:', error.message);
      return { success: false, error: `Database error: ${error.message}` };
    }

    if (!data) {
      return { success: false, error: 'Invalid administrator email or password.' };
    }

    if (data.is_active === false) {
      return { success: false, error: 'Account is deactivated. Please contact support.' };
    }

    // Verify password from database table
    if (data.password !== trimmedPass) {
      return { success: false, error: 'Invalid administrator email or password.' };
    }

    // Update last_login timestamp in database
    try {
      await client
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
    } catch {
      // non-fatal
    }

    const adminUser: AdminUser = {
      id: data.id,
      email: data.email,
      lastLogin: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
    }

    return {
      success: true,
      user: adminUser,
      source: 'supabase_auth',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication service error';
    return { success: false, error: `Authentication error: ${msg}` };
  }
}

/**
 * Check active administrator session.
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  if (typeof window === 'undefined') return null;

  try {
    const isAuth = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true' ||
                   localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    if (!isAuth) return null;

    const raw = sessionStorage.getItem(ADMIN_USER_KEY) || localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;

    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

/**
 * Sign out administrator and clear stored credentials.
 */
export async function signOutAdmin(): Promise<void> {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }
}

/**
 * Maintained for backward compatibility: delegates directly to signInAdminWithSupabase.
 */
export async function verifyAdminLoginInDatabase(
  email: string,
  passphrase: string
): Promise<AdminLoginResult> {
  return signInAdminWithSupabase(email, passphrase);
}

// -------------------------------------------------------------
// DATABASE STORAGE TELEMETRY
// -------------------------------------------------------------

export interface TableStorageInfo {
  table_name: string;
  row_count: number;
  total_bytes: number;
  total_size: string;
  table_size: string;
  index_size: string;
}

export interface DatabaseStorageStats {
  db_name: string;
  consumed_bytes: number;
  consumed_pretty: string;
  quota_bytes: number;
  quota_pretty: string;
  remaining_bytes: number;
  remaining_pretty: string;
  percentage_used: number;
  tables: TableStorageInfo[];
}

/**
 * Fetch real database storage consumed and remaining quota from PostgreSQL.
 */
export async function fetchDatabaseStorageStats(): Promise<DatabaseStorageStats | null> {
  const client = getSupabaseClient();
  if (!isSupabaseConfigured() || !client) return null;

  try {
    const { data, error } = await client.rpc('get_database_storage_stats');
    if (error) {
      console.error('Failed to fetch database storage telemetry:', error.message);
      return null;
    }
    return data as DatabaseStorageStats;
  } catch (err) {
    console.error('Exception fetching database storage telemetry:', err);
    return null;
  }
}

export {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseConfig,
  clearSupabaseConfig
};

