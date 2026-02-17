
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rfzhyhsxepojwfrzknie.supabase.co';
const supabaseAnonKey = 'sb_publishable_03CJZ9WkmRzKPrrNrRFRfw_lqsjgUYW';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
    { email: 'make10@gmail.com', password: 'make10' },
    { email: 'conv@gmail.com', password: 'conv10' },
    { email: 'djgabriel@gmail.com', password: 'Meudj2026@' }
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
