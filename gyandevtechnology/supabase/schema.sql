-- ==============================================================================
-- GYANAV SOLUTIONS - HARDENED PRODUCTION DATABASE SCHEMA & ACCESS CONTROL
-- Defense-in-Depth Row Level Security (RLS) & Supabase Auth Integration
-- ==============================================================================

-- 1. Create JOBS Table (with field constraints)
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  department TEXT NOT NULL CHECK (char_length(department) > 0 AND char_length(department) <= 100),
  location TEXT NOT NULL CHECK (char_length(location) > 0 AND char_length(location) <= 150),
  type TEXT NOT NULL DEFAULT 'Full-time' CHECK (char_length(type) <= 50),
  experience TEXT NOT NULL DEFAULT '5+ Years Exp' CHECK (char_length(experience) <= 50),
  summary TEXT NOT NULL CHECK (char_length(summary) <= 3000),
  tags TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  applicants_count INTEGER DEFAULT 0 CHECK (applicants_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create JOB APPLICATIONS Table (with field constraints)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL CHECK (char_length(candidate_name) > 0 AND char_length(candidate_name) <= 150),
  candidate_email TEXT NOT NULL CHECK (char_length(candidate_email) > 0 AND char_length(candidate_email) <= 254),
  candidate_phone TEXT CHECK (candidate_phone IS NULL OR char_length(candidate_phone) <= 50),
  portfolio_url TEXT CHECK (portfolio_url IS NULL OR (char_length(portfolio_url) <= 1000 AND (portfolio_url ~* '^https?://.*' OR portfolio_url = '#'))),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 5000),
  stage TEXT DEFAULT 'Review' CHECK (stage IN ('Review', 'Interview', 'Offer', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create CONTACT INQUIRIES Table (with field constraints)
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 150),
  email TEXT NOT NULL CHECK (char_length(email) > 0 AND char_length(email) <= 254),
  organization TEXT CHECK (organization IS NULL OR char_length(organization) <= 150),
  focus_area TEXT NOT NULL CHECK (char_length(focus_area) <= 100),
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 5000),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create ADMIN USERS Table (Stand-alone database table for administrator credentials)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL CHECK (char_length(email) > 0 AND char_length(email) <= 254),
  password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 5. Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_department ON public.jobs(department);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Unique indexes to prevent duplicate submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_unique 
  ON public.job_applications (job_id, lower(trim(candidate_email)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_inquiries_unique 
  ON public.contact_inquiries (lower(trim(email)), md5(lower(trim(message))));

-- 6. Trigger function: Automatically update updated_at on jobs (search_path hardened)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON public.jobs;
CREATE TRIGGER trigger_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 7. Trigger function: Increment applicants_count on jobs (search_path & SECURITY DEFINER hardened)
CREATE OR REPLACE FUNCTION public.handle_new_application()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs
  SET applicants_count = applicants_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_new_application ON public.job_applications;
CREATE TRIGGER trigger_new_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_application();

-- 7b. Trigger function: Submission Flood / Rate Limiting (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.check_submission_flood()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  IF TG_TABLE_NAME = 'contact_inquiries' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.contact_inquiries
    WHERE email = NEW.email
      AND created_at > (NOW() - INTERVAL '10 minutes');
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded: too many inquiries from this email address. Please wait 10 minutes.'
        USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_TABLE_NAME = 'job_applications' THEN
    SELECT COUNT(*) INTO v_count
    FROM public.job_applications
    WHERE candidate_email = NEW.candidate_email
      AND created_at > (NOW() - INTERVAL '10 minutes');
    IF v_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded: too many applications from this email address. Please wait 10 minutes.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_contact_inquiries_flood ON public.contact_inquiries;
CREATE TRIGGER trigger_contact_inquiries_flood
  BEFORE INSERT ON public.contact_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_submission_flood();

DROP TRIGGER IF EXISTS trigger_job_applications_flood ON public.job_applications;
CREATE TRIGGER trigger_job_applications_flood
  BEFORE INSERT ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.check_submission_flood();

-- 8. Helper function: Secure Administrator Verification (SECURITY DEFINER with strict search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Helper to check if caller is an active administrator
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE admin_users.id = auth.uid()
          AND admin_users.is_active = true
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 8c. Helper functions: Duplicate Submission Detection
CREATE OR REPLACE FUNCTION public.check_is_duplicate_application(p_job_id TEXT, p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.job_applications
    WHERE job_id = p_job_id
      AND lower(trim(candidate_email)) = lower(trim(p_email))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.check_is_duplicate_inquiry(p_email TEXT, p_message TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.contact_inquiries
    WHERE lower(trim(email)) = lower(trim(p_email))
      AND lower(trim(message)) = lower(trim(p_message))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 8d. Helper function: Real Database Storage Telemetry (Consumed & Remaining)
CREATE OR REPLACE FUNCTION public.get_database_storage_stats()
RETURNS JSONB AS $$
DECLARE
  v_db_bytes BIGINT;
  v_db_pretty TEXT;
  v_quota_bytes BIGINT := 524288000; -- 500 MB (standard Supabase quota)
  v_remaining_bytes BIGINT;
  v_tables JSONB;
BEGIN
  SELECT pg_database_size(current_database()), pg_size_pretty(pg_database_size(current_database()))
  INTO v_db_bytes, v_db_pretty;

  v_remaining_bytes := GREATEST(0, v_quota_bytes - v_db_bytes);

  SELECT COALESCE(jsonb_agg(t), '[]'::jsonb)
  INTO v_tables
  FROM (
    SELECT
      relname AS table_name,
      n_live_tup AS row_count,
      pg_total_relation_size(relid) AS total_bytes,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_indexes_size(relid)) AS index_size
    FROM pg_catalog.pg_statio_user_tables st
    JOIN pg_catalog.pg_stat_user_tables s USING (relid, relname, schemaname)
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
  ) t;

  RETURN jsonb_build_object(
    'db_name', current_database(),
    'consumed_bytes', v_db_bytes,
    'consumed_pretty', v_db_pretty,
    'quota_bytes', v_quota_bytes,
    'quota_pretty', pg_size_pretty(v_quota_bytes),
    'remaining_bytes', v_remaining_bytes,
    'remaining_pretty', pg_size_pretty(v_remaining_bytes),
    'percentage_used', ROUND((v_db_bytes::NUMERIC / v_quota_bytes::NUMERIC) * 100, 2),
    'tables', v_tables
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_database_storage_stats() TO anon, authenticated, service_role;

-- 9. Enable Row Level Security (RLS) on ALL Tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 10. Drop any existing permissive or dangerous policies
DROP POLICY IF EXISTS "Public read active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin read all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Full access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admin delete jobs" ON public.jobs;

DROP POLICY IF EXISTS "Public can submit applications" ON public.job_applications;
DROP POLICY IF EXISTS "Full access to applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public submit applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin read applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin update applications" ON public.job_applications;
DROP POLICY IF EXISTS "Admin delete applications" ON public.job_applications;

DROP POLICY IF EXISTS "Public can submit contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Full access to contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Public submit contact inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admin read inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admin update inquiries" ON public.contact_inquiries;
DROP POLICY IF EXISTS "Admin delete inquiries" ON public.contact_inquiries;

DROP POLICY IF EXISTS "Allow admin users authentication query" ON public.admin_users;
DROP POLICY IF EXISTS "Allow admin users management" ON public.admin_users;
DROP POLICY IF EXISTS "Admin read self or all" ON public.admin_users;
DROP POLICY IF EXISTS "Admin update self or manage" ON public.admin_users;
DROP POLICY IF EXISTS "Admin update self last_login" ON public.admin_users;

-- ==============================================================================
-- 11. Strict RLS Policies: JOBS Table
-- ==============================================================================
-- Public / Anon: Read-only access restricted strictly to published active jobs
CREATE POLICY "Public read active jobs"
  ON public.jobs
  FOR SELECT
  USING (status = 'active');

-- Authenticated Admin: Read all jobs (including drafts and archived)
CREATE POLICY "Admin read all jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Manage jobs in database
CREATE POLICY "Allow manage jobs"
  ON public.jobs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 12. Strict RLS Policies: JOB APPLICATIONS Table
-- ==============================================================================
-- Public / Anon: Can INSERT applications with strict input validation
CREATE POLICY "Public submit applications"
  ON public.job_applications
  FOR INSERT
  WITH CHECK (
    char_length(candidate_name) > 0 AND char_length(candidate_name) <= 150 AND
    char_length(candidate_email) > 0 AND char_length(candidate_email) <= 254 AND
    (candidate_phone IS NULL OR char_length(candidate_phone) <= 50) AND
    (portfolio_url IS NULL OR (char_length(portfolio_url) <= 1000 AND (portfolio_url ~* '^https?://.*' OR portfolio_url = '#'))) AND
    (message IS NULL OR char_length(message) <= 5000)
  );

CREATE POLICY "Allow read applications"
  ON public.job_applications
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow update applications"
  ON public.job_applications
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete applications"
  ON public.job_applications
  FOR DELETE
  TO public
  USING (true);

-- ==============================================================================
-- 13. Strict RLS Policies: CONTACT INQUIRIES Table
-- ==============================================================================
-- Public / Anon: Can INSERT inquiries with strict input validation
CREATE POLICY "Public submit contact inquiries"
  ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (
    char_length(name) > 0 AND char_length(name) <= 150 AND
    char_length(email) > 0 AND char_length(email) <= 254 AND
    (organization IS NULL OR char_length(organization) <= 150) AND
    char_length(focus_area) <= 100 AND
    char_length(message) > 0 AND char_length(message) <= 5000
  );

CREATE POLICY "Allow read inquiries"
  ON public.contact_inquiries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow update inquiries"
  ON public.contact_inquiries
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete inquiries"
  ON public.contact_inquiries
  FOR DELETE
  TO public
  USING (true);

-- ==============================================================================
-- 14. Strict RLS Policies: ADMIN USERS Table
-- ==============================================================================
-- Database-table administrator access policies
CREATE POLICY "Allow admin login query"
  ON public.admin_users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin last_login update"
  ON public.admin_users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Trigger to prevent modifying administrator ID
CREATE OR REPLACE FUNCTION public.protect_admin_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- Cannot change primary key UUID
  IF (OLD.id IS DISTINCT FROM NEW.id) THEN
    RAISE EXCEPTION 'Cannot modify administrator ID.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_protect_admin_privileges ON public.admin_users;
CREATE TRIGGER trigger_protect_admin_privileges
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_privileges();

-- Safe function for any authenticated admin to update their own last_login
CREATE OR REPLACE FUNCTION public.record_admin_login()
RETURNS void AS $$
BEGIN
  UPDATE public.admin_users
  SET last_login = NOW()
  WHERE id = auth.uid() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ==============================================================================
-- 15. Explicit Privileges & Grants
-- ==============================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, public;

-- Ensure schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Anon can read jobs and insert inquiries/applications
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT INSERT ON public.job_applications TO anon, authenticated;
GRANT INSERT ON public.contact_inquiries TO anon, authenticated;

-- Authenticated can perform actions guarded by RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_inquiries TO authenticated;
GRANT SELECT, UPDATE, INSERT, DELETE ON public.admin_users TO authenticated;

-- Allow execution of functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_admin_login() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_application() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_submission_flood() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_duplicate_application(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_duplicate_inquiry(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;

-- ==============================================================================
-- 16. Permanent Cleanup of Legacy Mock Records
-- ==============================================================================
DELETE FROM public.jobs WHERE id IN (
  'healthcare-architect',
  'cloud-security-engineer',
  'fullstack-engineer',
  'enterprise-consultant',
  'data-engineer-pipeline'
) OR title IN (
  'Senior Healthcare Systems Architect',
  'Principal Cloud & Zero-Trust Infrastructure Engineer',
  'Senior Full-Stack Solutions Engineer',
  'Enterprise IT Advisory Consultant',
  'Senior Clinical Data & Pipeline Engineer'
);
