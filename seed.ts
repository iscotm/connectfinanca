import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const plans = [
  {
    name: 'Plano Mensal',
    description: 'Acesso completo por 1 mês.',
    price: 10.00,
    duration_days: 30,
    color: '#3b82f6',
    icon: 'fas fa-calendar',
    status: 'ativo'
  },
  {
    name: 'Plano Trimestral',
    description: 'Acesso completo por 3 meses.',
    price: 247.00,
    duration_days: 90,
    color: '#10b981',
    icon: 'fas fa-calendar-alt',
    status: 'ativo'
  },
  {
    name: 'Plano Anual',
    description: 'Melhor escolha. Acesso por 1 ano.',
    price: 797.00,
    duration_days: 365,
    color: '#f59e0b',
    icon: 'fas fa-star',
    status: 'ativo'
  },
  {
    name: 'Plano Vitalício',
    description: 'Acesso para sempre. Pagamento único.',
    price: 4997.00,
    duration_days: 0,
    color: '#8b5cf6',
    icon: 'fas fa-infinity',
    status: 'ativo'
  }
];

async function seed() {
  console.log('Seeding plans...');
  for (const plan of plans) {
    const { data, error } = await supabase.from('plans').insert([plan]).select();
    if (error) {
      console.error(`Error inserting ${plan.name}:`, error);
    } else {
      console.log(`Inserted ${plan.name} successfully!`, data);
    }
  }
  console.log('Done!');
}

seed();
