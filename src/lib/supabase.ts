import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rfzhyhsxepojwfrzknie.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_03CJZ9WkmRzKPrrNrRFRfw_lqsjgUYW';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
