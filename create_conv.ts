
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfzhyhsxepojwfrzknie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemh5aHN4ZXBvandmcnprbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjY1MTYsImV4cCI6MjA4NTMwMjUxNn0.FP_nfnuPkCHdfNCRiyLAIaZ1WEjiHx7CvFgi0o1lilc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUser() {
    console.log('Creating user: conv@gmail.com with password conv12...');
    const { data, error } = await supabase.auth.signUp({
        email: 'conv@gmail.com',
        password: 'conv12',
    });

    if (error) {
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log(`Success! User created: ${data.user?.id}`);
    }
}

createUser();
