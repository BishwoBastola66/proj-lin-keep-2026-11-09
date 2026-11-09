-- CRM Database Schema (Pure Database Mode - No Supabase Auth dependencies, No RLS recursion)
-- Consolidates users, srimatric (facilities), candidates, clients, facility_interactions, and crm_tasks

-- ==============================================================================
-- 1. CRM Users Table (Direct Local / Portal Authentication)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_users (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    auth_user_id uuid,
    email text,
    role text NOT NULL DEFAULT 'Manager' CHECK (role IN ('Super Admin', 'Manager')),
    password text,
    name text,
    phone text,
    position text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT crm_users_pkey PRIMARY KEY (id)
);

-- Ensure public schema permissions for anon & authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- Ensure all columns exist on pre-existing crm_users table
ALTER TABLE public.crm_users ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.crm_users ADD COLUMN IF NOT EXISTS password text;
ALTER TABLE public.crm_users ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.crm_users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.crm_users ADD COLUMN IF NOT EXISTS position text;

-- Remove any old foreign keys to auth.users if they exist
ALTER TABLE public.crm_users DROP CONSTRAINT IF EXISTS crm_users_auth_user_id_fkey;

-- Drop all old recursive or restrictive RLS policies
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.crm_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.crm_users;
DROP POLICY IF EXISTS "Allow anon and authenticated full access to crm_users" ON public.crm_users;
DROP POLICY IF EXISTS "allow_all_crm_users" ON public.crm_users;

-- DISABLE RLS & create fallback open policy in case RLS is re-enabled
ALTER TABLE public.crm_users DISABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_crm_users" ON public.crm_users FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Safely clean up any auth triggers without failing on permissions
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION WHEN OTHERS THEN 
  NULL;
END $$;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS crm_users_email_key ON public.crm_users (email);

-- Insert default admin user
INSERT INTO public.crm_users (email, password, role, name, position, phone)
SELECT 'admin@srimatrixhealth.com', 'admin123', 'Super Admin', 'Tribhuvan Pandey', 'Director, Marketing and Communication', '(505) 730-6430'
WHERE NOT EXISTS (
    SELECT 1 FROM public.crm_users WHERE email = 'admin@srimatrixhealth.com'
);

UPDATE public.crm_users
SET password = 'admin123', role = 'Super Admin', name = 'Tribhuvan Pandey', position = 'Director, Marketing and Communication', phone = '(505) 730-6430'
WHERE email = 'admin@srimatrixhealth.com';



-- ==============================================================================
-- 2. Srimatric (Main Facilities Table)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.srimatric (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    facility_name text,
    type text DEFAULT 'Candidate',
    county text,
    administrator text,
    phone text,
    email text,
    beds integer,
    ownership_type text,
    education text,
    work_authorization text,
    graduation_date date,
    license_status text,
    state text,
    country text,
    city text,
    zip_code text,
    availability_date date,
    address text,
    contact_status_notes text,
    timing_status text,
    is_priority_region boolean DEFAULT false,
    assigned_user_id uuid,
    pipeline_stage text DEFAULT 'Lead',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT srimatric_pkey PRIMARY KEY (id)
);

ALTER TABLE public.srimatric DROP CONSTRAINT IF EXISTS srimatric_assigned_user_id_fkey;
ALTER TABLE public.srimatric DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access on srimatric" ON public.srimatric;
DROP POLICY IF EXISTS "allow_all_srimatric" ON public.srimatric;
CREATE POLICY "allow_all_srimatric" ON public.srimatric FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_srimatric_email ON public.srimatric (email);
CREATE INDEX IF NOT EXISTS idx_srimatric_stage ON public.srimatric (pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_srimatric_priority ON public.srimatric (is_priority_region);

-- Seed Initial Srimatric Facilities for Pipeline & Email Testing
INSERT INTO public.srimatric (
    first_name, last_name, facility_name, administrator, email, phone, city, county, state, zip_code, beds, ownership_type, pipeline_stage, is_priority_region, address, contact_status_notes
)
SELECT 'Dr. Sarah', 'Mitchell', 'Srimatrix Care Center', 'Robert Johnson', 'mrperfect9863@gmail.com', '+1 (555) 234-5678', 'Austin', 'Travis', 'TX', '78701', 120, 'Private Non-Profit', 'Lead', true, '100 Medical Parkway', 'Requested comprehensive brochure for nurse staffing partnerships.'
WHERE NOT EXISTS (SELECT 1 FROM public.srimatric WHERE email = 'mrperfect9863@gmail.com');

INSERT INTO public.srimatric (
    first_name, last_name, facility_name, administrator, email, phone, city, county, state, zip_code, beds, ownership_type, pipeline_stage, is_priority_region, address, contact_status_notes
)
SELECT 'Dr. Michael', 'Chen', 'St. Jude Regional Medical Center', 'Laura Evans', 'mchen.stjude@gmail.com', '+1 (555) 345-6789', 'Dallas', 'Dallas', 'TX', '75201', 250, 'Non-Profit', 'Contacted', true, '450 Healthcare Blvd', 'Spoke on the phone regarding physical therapy placements.'
WHERE NOT EXISTS (SELECT 1 FROM public.srimatric WHERE email = 'mchen.stjude@gmail.com');

INSERT INTO public.srimatric (
    first_name, last_name, facility_name, administrator, email, phone, city, county, state, zip_code, beds, ownership_type, pipeline_stage, is_priority_region, address, contact_status_notes
)
SELECT 'Elena', 'Rodriguez', 'Hill Country Memorial Hospital', 'David Miller', 'elena.rodriguez@example.com', '+1 (555) 456-7890', 'Houston', 'Harris', 'TX', '77002', 180, 'For-Profit', 'In Progress', false, '820 Memorial Drive', 'Contracts under review with legal team.'
WHERE NOT EXISTS (SELECT 1 FROM public.srimatric WHERE email = 'elena.rodriguez@example.com');

INSERT INTO public.srimatric (
    first_name, last_name, facility_name, administrator, email, phone, city, county, state, zip_code, beds, ownership_type, pipeline_stage, is_priority_region, address, contact_status_notes
)
SELECT 'James', 'Wilson', 'MetroHealth Rehabilitation Clinic', 'Karen White', 'jwilson@example.com', '+1 (555) 567-8901', 'San Antonio', 'Bexar', 'TX', '78205', 95, 'Private', 'Follow Up Scheduled', true, '310 Alamo Plaza', 'Scheduled demo presentation for upcoming Monday.'
WHERE NOT EXISTS (SELECT 1 FROM public.srimatric WHERE email = 'jwilson@example.com');

INSERT INTO public.srimatric (
    first_name, last_name, facility_name, administrator, email, phone, city, county, state, zip_code, beds, ownership_type, pipeline_stage, is_priority_region, address, contact_status_notes
)
SELECT 'Dr. Amanda', 'Foster', 'Covenant Specialty Health System', 'Thomas Brown', 'afoster@example.com', '+1 (555) 678-9012', 'Fort Worth', 'Tarrant', 'TX', '76102', 310, 'Church-affiliated Non-Profit', 'License Renewed', false, '1200 Trinity St', 'Licenses verified and credentials up-to-date.'
WHERE NOT EXISTS (SELECT 1 FROM public.srimatric WHERE email = 'afoster@example.com');



-- ==============================================================================
-- 3. Candidates Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    education text,
    work_authorization text,
    graduation_date date,
    license_status text,
    state text,
    country text,
    city text,
    zip_code text,
    availability_date date,
    pipeline_stage text DEFAULT 'Lead',
    assigned_user_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT candidates_pkey PRIMARY KEY (id)
);

ALTER TABLE public.candidates DROP CONSTRAINT IF EXISTS candidates_assigned_user_id_fkey;
ALTER TABLE public.candidates DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access on candidates" ON public.candidates;
DROP POLICY IF EXISTS "allow_all_candidates" ON public.candidates;
CREATE POLICY "allow_all_candidates" ON public.candidates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates (email);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON public.candidates (pipeline_stage);

-- Seed Initial Candidates
INSERT INTO public.candidates (first_name, last_name, email, phone, city, state, education, license_status, pipeline_stage)
SELECT 'Sophia', 'Miller', 'sophia.rn@example.com', '+1 (555) 789-0123', 'Dallas', 'TX', 'BSN - Nursing', 'Active RN License', 'In Progress'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE email = 'sophia.rn@example.com');

INSERT INTO public.candidates (first_name, last_name, email, phone, city, state, education, license_status, pipeline_stage)
SELECT 'David', 'Kim', 'dkim.pt@example.com', '+1 (555) 890-1234', 'Austin', 'TX', 'Doctor of Physical Therapy', 'Active PT License', 'Lead'
WHERE NOT EXISTS (SELECT 1 FROM public.candidates WHERE email = 'dkim.pt@example.com');


-- ==============================================================================
-- 4. Clients Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text,
    phone text,
    city text,
    pipeline_stage text DEFAULT 'Lead',
    assigned_user_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT clients_pkey PRIMARY KEY (id)
);

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_assigned_user_id_fkey;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access on clients" ON public.clients;
DROP POLICY IF EXISTS "allow_all_clients" ON public.clients;
CREATE POLICY "allow_all_clients" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_stage ON public.clients (pipeline_stage);

-- Seed Initial Clients
INSERT INTO public.clients (first_name, last_name, email, phone, city, pipeline_stage)
SELECT 'Marcus', 'Sterling', 'marcus.sterling@example.com', '+1 (555) 901-2345', 'Houston', 'Contacted'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE email = 'marcus.sterling@example.com');

INSERT INTO public.clients (first_name, last_name, email, phone, city, pipeline_stage)
SELECT 'Olivia', 'Vance', 'ovance@example.com', '+1 (555) 012-3456', 'San Antonio', 'Lead'
WHERE NOT EXISTS (SELECT 1 FROM public.clients WHERE email = 'ovance@example.com');



-- ==============================================================================
-- 5. Facility Interactions Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.facility_interactions (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    facility_id bigint REFERENCES public.srimatric(id) ON DELETE CASCADE,
    entity_type text DEFAULT 'srimatric',
    entity_id bigint,
    user_id bigint REFERENCES public.crm_users(id) ON DELETE SET NULL,
    interaction_type text NOT NULL,
    subject text,
    body text,
    notes text,
    outcome text,
    email_message_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT facility_interactions_pkey PRIMARY KEY (id)
);

-- Ensure all columns exist on pre-existing facility_interactions table
ALTER TABLE public.facility_interactions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.facility_interactions ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'srimatric';
ALTER TABLE public.facility_interactions ADD COLUMN IF NOT EXISTS entity_id bigint;

ALTER TABLE public.facility_interactions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access on facility_interactions" ON public.facility_interactions;
DROP POLICY IF EXISTS "allow_all_facility_interactions" ON public.facility_interactions;
CREATE POLICY "allow_all_facility_interactions" ON public.facility_interactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_interactions_facility ON public.facility_interactions (facility_id);
CREATE INDEX IF NOT EXISTS idx_interactions_msg_id ON public.facility_interactions (email_message_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.facility_interactions (created_at DESC);


-- ==============================================================================
-- 6. CRM Tasks Table (Follow-ups, To-dos, and Action Items)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    facility_id bigint REFERENCES public.srimatric(id) ON DELETE SET NULL,
    entity_type text DEFAULT 'srimatric',
    entity_id bigint,
    assigned_to bigint REFERENCES public.crm_users(id) ON DELETE SET NULL,
    task_description text NOT NULL,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    due_date timestamp with time zone,
    notes text,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT crm_tasks_pkey PRIMARY KEY (id)
);

-- Ensure all columns and nullable facility_id exist on pre-existing crm_tasks table
ALTER TABLE public.crm_tasks ALTER COLUMN facility_id DROP NOT NULL;
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'srimatric';
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS entity_id bigint;
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE public.crm_tasks ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.crm_tasks DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow full access on crm_tasks" ON public.crm_tasks;
DROP POLICY IF EXISTS "allow_all_crm_tasks" ON public.crm_tasks;
CREATE POLICY "allow_all_crm_tasks" ON public.crm_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_facility ON public.crm_tasks (facility_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON public.crm_tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON public.crm_tasks (due_date ASC);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_entity ON public.crm_tasks (entity_type, entity_id);

-- Seed Initial Tasks
INSERT INTO public.crm_tasks (facility_id, entity_type, entity_id, task_description, due_date, notes, is_completed)
SELECT 
    s.id, 
    'srimatric', 
    s.id, 
    'Follow up on nurse staffing brochure with Dr. Sarah Mitchell', 
    now() + interval '2 days', 
    'Check if medical board review has concluded.', 
    false
FROM public.srimatric s
WHERE s.email = 'mrperfect9863@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.crm_tasks WHERE task_description LIKE '%Dr. Sarah Mitchell%'
);

INSERT INTO public.crm_tasks (facility_id, entity_type, entity_id, task_description, due_date, notes, is_completed)
SELECT 
    s.id, 
    'srimatric', 
    s.id, 
    'Prepare contract proposal for Hill Country Memorial Hospital', 
    now() + interval '4 days', 
    'Coordinate legal terms with Elena Rodriguez.', 
    false
FROM public.srimatric s
WHERE s.email = 'elena.rodriguez@example.com'
AND NOT EXISTS (
    SELECT 1 FROM public.crm_tasks WHERE task_description LIKE '%Hill Country Memorial Hospital%'
);


-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


