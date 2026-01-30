import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfzhyhsxepojwfrzknie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemh5aHN4ZXBvandmcnprbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjY1MTYsImV4cCI6MjA4NTMwMjUxNn0.FP_nfnuPkCHdfNCRiyLAIaZ1WEjiHx7CvFgi0o1lilc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
