import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, MoreVertical, Edit2, ShieldAlert, CheckCircle, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { GrantAccessModal } from '@/components/admin/GrantAccessModal';

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isGrantAccessModalOpen, setIsGrantAccessModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, plansRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('plans').select('*'),
        supabase.from('subscriptions').select('*')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (plansRes.error) throw plansRes.error;
      if (subsRes.error) throw subsRes.error;

      setUsers(usersRes.data || []);
      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
    } catch (error) {
      console.error('Error fetching admin users data:', error);
      toast.error('Erro ao buscar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.razao_social?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'active':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle size={12} /> Ativo</span>;
      case 'pausado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock size={12} /> Pausado</span>;
      case 'bloqueado':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><ShieldAlert size={12} /> Bloqueado</span>;
      case 'expirado':
      case 'canceled':
      case 'past_due':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20"><Clock size={12} /> Expirado/Cancelado</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  const getUserSubscriptionInfo = (userId: string) => {
    // Find active first, if not, get the latest
    const userSubs = subscriptions.filter(s => s.user_id === userId);
    if (!userSubs.length) return null;
    
    const activeSub = userSubs.find(s => s.status === 'active');
    return activeSub || userSubs[0]; // fallback to whatever they have
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Clientes</h1>
          <p className="text-slate-400">Gerencie os acessos e assinaturas dos usuários do seu sistema.</p>
        </div>
        <button 
          onClick={() => setIsGrantAccessModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Conceder Acesso
        </button>
      </header>

      <div className="glass-panel rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60">
                <th className="pb-3 px-4 font-medium text-slate-400 text-sm">Cliente</th>
                <th className="pb-3 px-4 font-medium text-slate-400 text-sm">Status da Assinatura</th>
                <th className="pb-3 px-4 font-medium text-slate-400 text-sm">Plano / Tipo</th>
                <th className="pb-3 px-4 font-medium text-slate-400 text-sm">Provedor</th>
                <th className="pb-3 px-4 font-medium text-slate-400 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Carregando clientes...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const subInfo = getUserSubscriptionInfo(user.id);
                  let displayPlan = subInfo ? subInfo.plan : (user.access_type || 'Sem plano');
                  let displayStatus = subInfo ? subInfo.status : user.status;
                  let provider = subInfo ? subInfo.provider : 'N/A';
                  let isLegacy = subInfo?.legacy_access;

                  // Find plan name if it's an ID
                  const matchedPlan = plans.find(p => p.id === displayPlan);
                  if (matchedPlan) displayPlan = matchedPlan.name;

                  return (
                    <tr key={user.id} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-medium">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                            {user.role === 'admin' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mt-1 inline-block">Admin</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(displayStatus)}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-slate-300 capitalize">{displayPlan}</p>
                        {subInfo?.current_period_end && (
                           <p className="text-[10px] text-slate-500 mt-0.5">Vence: {new Date(subInfo.current_period_end).toLocaleDateString('pt-BR')}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {provider === 'asaas' ? (
                          <span className="inline-flex items-center bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-800/50">Asaas</span>
                        ) : provider === 'manual' ? (
                          <span className="inline-flex items-center bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-slate-700">Manual</span>
                        ) : isLegacy ? (
                          <span className="inline-flex items-center bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded text-xs font-bold border border-amber-800/50">Legado</span>
                        ) : (
                          <span className="text-xs text-slate-500">Sem Vínculo</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-slate-400 hover:text-white bg-slate-800/0 hover:bg-slate-800/80 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          subscriptions={subscriptions.filter(s => s.user_id === selectedUser.id)}
          plans={plans}
          onClose={() => setSelectedUser(null)} 
          onUpdate={fetchData}
        />
      )}

      {isGrantAccessModalOpen && (
        <GrantAccessModal
          plans={plans}
          onClose={() => setIsGrantAccessModalOpen(false)}
          onSuccess={() => {
            setIsGrantAccessModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
