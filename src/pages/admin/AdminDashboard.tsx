import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CreditCard, Activity, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    mrr: 0,
    recentLogins: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, status, last_login_at, name, email')
        .neq('role', 'admin');

      if (profilesError) throw profilesError;

      // Fetch subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');

      if (subError) throw subError;

      // Fetch plans to calculate MRR
      const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('name, price, duration_days, id');

      if (plansError) throw plansError;

      const totalUsers = profiles?.length || 0;
      
      // Um usuário é ativo se possuir pelo menos uma subscription ativa
      const activeUserIds = new Set(subscriptions?.map(sub => sub.user_id));
      const activeUsers = activeUserIds.size;
      
      // Calculate MRR based on active subscriptions
      let mrr = 0;
      subscriptions?.forEach(sub => {
        let monthlyValue = 0;
        
        if (sub.plan === 'monthly') monthlyValue = 10.00;
        else if (sub.plan === 'quarterly') monthlyValue = 247.00 / 3;
        else if (sub.plan === 'yearly') monthlyValue = 797.00 / 12;
        else if (sub.plan === 'lifetime') monthlyValue = 0;
        else {
          const matchedPlan = plans?.find(p => p.id === sub.plan || p.name === sub.plan);
          if (matchedPlan) {
            if (matchedPlan.duration_days === 30) monthlyValue = matchedPlan.price;
            else if (matchedPlan.duration_days === 90) monthlyValue = matchedPlan.price / 3;
            else if (matchedPlan.duration_days === 365) monthlyValue = matchedPlan.price / 12;
          }
        }
        
        mrr += monthlyValue;
      });

      // Recent Logins with their current plan
      const recentLogins = [...(profiles || [])]
        .filter(p => p.last_login_at)
        .sort((a, b) => new Date(b.last_login_at).getTime() - new Date(a.last_login_at).getTime())
        .slice(0, 5)
        .map(user => {
          const userSub = subscriptions?.find(s => s.user_id === user.id);
          let displayPlan = 'Sem Plano';
          if (userSub) {
            const matchedPlan = plans?.find(p => p.id === userSub.plan);
            displayPlan = matchedPlan ? matchedPlan.name : userSub.plan;
          }
          return {
            ...user,
            activePlan: displayPlan,
            isActive: activeUserIds.has(user.id)
          };
        });

      setStats({
        totalUsers,
        activeUsers,
        mrr,
        recentLogins
      });
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total de Clientes', 
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      title: 'Assinantes Ativos', 
      value: stats.activeUsers.toString(),
      icon: Activity,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    { 
      title: 'Receita Recorrente (MRR)', 
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.mrr),
      icon: CreditCard,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10'
    }
  ];

  if (isLoading) {
    return <div className="animate-pulse text-slate-400">Carregando métricas...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Visão Geral SaaS</h1>
        <p className="text-slate-400">Monitore o crescimento e saúde do seu negócio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="glass-panel p-6 rounded-2xl border border-slate-800/60 bg-slate-900/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
              <stat.icon size={48} className={stat.color} />
            </div>
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bgColor} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-blue-400" size={20} />
            Acessos Recentes
          </h2>
          <div className="space-y-4">
            {stats.recentLogins.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhum acesso registrado.</p>
            ) : (
              stats.recentLogins.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-800/60">
                  <div>
                    <p className="font-medium text-slate-200">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium capitalize ${user.isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {user.activePlan}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(user.last_login_at).toLocaleDateString('pt-BR')} às {new Date(user.last_login_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
             <ArrowUpRight size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Próximos Passos</h3>
           <p className="text-slate-400 text-sm max-w-sm mb-6">
             Gerencie clientes com planos customizados ou verifique a integração do sistema de faturamento.
           </p>
           <button className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors">
             Gerenciar Planos
           </button>
        </div>
      </div>
    </div>
  );
}
