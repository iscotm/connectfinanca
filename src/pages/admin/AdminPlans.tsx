import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPlanModal } from '@/components/admin/AdminPlanModal';

export function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<any | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao buscar planos');
    } finally {
      setIsLoading(false);
    }
  };

  const openNewPlanModal = () => {
    setPlanToEdit(null);
    setIsModalOpen(true);
  };

  const openEditPlanModal = (plan: any) => {
    setPlanToEdit(plan);
    setIsModalOpen(true);
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este plano? Isso pode afetar usuários que já o assinaram.')) return;
    
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Plano removido.');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao remover plano.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Planos e Assinaturas</h1>
          <p className="text-slate-400">Configure os pacotes oferecidos no seu SaaS.</p>
        </div>
        <button 
          onClick={openNewPlanModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={18} />
          Novo Plano
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500">Carregando planos...</div>
        ) : plans.length === 0 ? (
          <div className="col-span-full glass-panel rounded-2xl p-12 text-center flex flex-col items-center border border-slate-800/60 bg-slate-900/40">
             <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-4">
               <Package size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-200 mb-2">Nenhum plano cadastrado</h3>
             <p className="text-slate-400 max-w-sm mb-6">Crie seu primeiro plano para começar a vender assinaturas do seu sistema.</p>
             <button
               onClick={async () => {
                 try {
                   toast.loading("Gerando planos iniciais...");
                   const defaultPlans = [
                     { name: 'Plano Mensal', description: 'Acesso mensal a todas as funcionalidades.', price: 10.00, duration_days: 30, color: '#3b82f6', icon: 'fas fa-calendar', status: 'ativo' },
                     { name: 'Plano Trimestral', description: 'Acesso por 3 meses com desconto.', price: 247.00, duration_days: 90, color: '#10b981', icon: 'fas fa-calendar-alt', status: 'ativo' },
                     { name: 'Plano Anual', description: 'O mais popular. Acesso por 1 ano.', price: 797.00, duration_days: 365, color: '#f59e0b', icon: 'fas fa-star', status: 'ativo' },
                     { name: 'Plano Vitalício', description: 'Acesso para sempre sem mensalidade.', price: 4997.00, duration_days: 0, color: '#8b5cf6', icon: 'fas fa-infinity', status: 'ativo' }
                   ];
                   const { error } = await supabase.from('plans').insert(defaultPlans);
                   if (error) throw error;
                   toast.dismiss();
                   toast.success("Planos gerados com sucesso!");
                   fetchPlans();
                 } catch (err: any) {
                   toast.dismiss();
                   toast.error("Erro ao gerar planos: " + err.message);
                 }
               }}
               className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
             >
               Gerar Planos Padrão Automaticamente
             </button>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="glass-panel rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col relative overflow-hidden group">
              
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white`} style={{ backgroundColor: plan.color }}>
                  <i className={`${plan.icon} text-xl`}></i>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditPlanModal(plan)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800/0 hover:bg-slate-800/80 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/0 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <p className="text-sm text-slate-400 flex-1">{plan.description}</p>
              
              <div className="mt-6 pt-6 border-t border-slate-800/60">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}
                  </span>
                  <span className="text-sm font-medium text-slate-500">
                    /{plan.duration_days === 30 ? 'mês' : `${plan.duration_days} dias`}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  {plan.status === 'ativo' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle size={12} /> Plano Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <AdminPlanModal 
          planToEdit={planToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setPlanToEdit(null);
          }} 
          onUpdate={fetchPlans} 
        />
      )}
    </div>
  );
}
