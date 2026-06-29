import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function run() {
  console.log("Tentando logar...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@gmail.com',
    password: 'ConnectAd@'
  });

  if (error) {
    console.error("Erro no login:", error.message);
    return;
  }

  console.log("Login com sucesso. User ID:", data.user?.id);

  console.log("Buscando profile...");
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single();

  if (profileError) {
    console.error("Erro ao buscar profile:", profileError.message);
  } else {
    console.log("Profile encontrado:", profile);
  }
}

run();
