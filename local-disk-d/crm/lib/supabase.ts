import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tglpiduukpekznpptbho.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbHBpZHV1a3Bla3pucHB0YmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjQwOTcsImV4cCI6MjEwMzk0MDA5N30.O8wBJQNdcq-9VinHNdkJn2wUdZ0W9TT7mO3AYOkclts';

export const supabase = createClient(supabaseUrl, supabaseKey);

