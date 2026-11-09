-- Migration script to upgrade crm_tasks for Clients, Candidates, and advanced scheduling

ALTER TABLE public.crm_tasks 
  ALTER COLUMN facility_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS entity_type text DEFAULT 'srimatric',
  ADD COLUMN IF NOT EXISTS entity_id bigint,
  ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS notes text;

-- Migrate existing data: Copy facility_id to entity_id for backward compatibility
UPDATE public.crm_tasks 
SET entity_id = facility_id 
WHERE entity_id IS NULL AND facility_id IS NOT NULL;

-- Reload schema cache so API sees the new columns
NOTIFY pgrst, 'reload schema';
