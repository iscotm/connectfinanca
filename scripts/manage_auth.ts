import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updatePassword(email: string, newPassword: string) {
  console.log(`Searching for user with email: ${email}...`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError.message);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log(`User ${email} not found. Creating user...`);
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true
    });
    
    if (createError) {
      console.error('Error creating user:', createError.message);
    } else {
      console.log(`User created successfully with password: ${newPassword}`);
    }
    return;
  }
  
  console.log(`User found! ID: ${user.id}. Updating password...`);
  
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (updateError) {
    console.error('Error updating password:', updateError.message);
  } else {
    console.log(`Password updated successfully for ${email} to: ${newPassword}`);
  }
}

const email = 'gerenciamake10@gmail.com';
const newPassword = 'Make0205';

updatePassword(email, newPassword);
