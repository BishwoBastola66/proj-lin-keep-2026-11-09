import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key';

// Initialize the Supabase client using the service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
