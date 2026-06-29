import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPlanModal } from '@/components/admin/AdminPlanModal';

export function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Planos e Assinaturas</h1>
          <p className="text-slate-400">Configure os pacotes oferecidos no seu SaaS.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
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
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="glass-panel rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex flex-col relative overflow-hidden group">
              
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white`} style={{ backgroundColor: plan.color }}>
                  <i className={`${plan.icon} text-xl`}></i>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-white bg-slate-800/0 hover:bg-slate-800/80 rounded-lg transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/0 hover:bg-red-500/10 rounded-lg transition-all">
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
          onClose={() => setIsModalOpen(false)} 
          onUpdate={fetchPlans} 
        />
      )}
    </div>
  );
}
