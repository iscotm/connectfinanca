
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lykjeuuguglwujknhhhw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5a2pldXVndWdsd3Vqa25oaGh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjUxODYsImV4cCI6MjA4NjI0MTE4Nn0.Z0kxmygufP23YLTVpqLduoQ1rI740N5tv10HFZlQTPw';

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
