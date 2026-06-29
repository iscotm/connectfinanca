import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  const email = 'admin@gmail.com';
  const password = 'ConnectAd';

  console.log(`Tentando criar o usuário ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Erro ao criar usuário:', error.message);
    if (error.message.includes('User already registered')) {
        console.log('O usuário já existe!');
    } else {
        process.exit(1);
    }
  } else {
    console.log('Usuário criado com sucesso no Auth do Supabase!');
    console.log('User ID:', data.user?.id);
  }

  console.log('\\nLEMBRETE: Para que ele tenha acesso admin, você precisa rodar o script SQL (supabase_admin_migration.sql) que inclui o comando de UPDATE, ou alterar manualmente na tabela profiles no Supabase.');
}

createAdminUser();
