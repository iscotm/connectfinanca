
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfzhyhsxepojwfrzknie.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmemh5aHN4ZXBvandmcnprbmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MjY1MTYsImV4cCI6MjA4NTMwMjUxNn0.FP_nfnuPkCHdfNCRiyLAIaZ1WEjiHx7CvFgi0o1lilc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
    { email: 'make10@gmail.com', password: 'make10' },
    { email: 'conv@gmail.com', password: 'conv10' }
];

async function createUsers() {
    for (const user of users) {
        console.log(`Creating user: ${user.email}...`);
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
        });

        if (error) {
            console.error(`Error creating ${user.email}:`, error.message);
        } else {
            console.log(`Success! User created: ${data.user?.id}`);
        }
    }
}

createUsers();
