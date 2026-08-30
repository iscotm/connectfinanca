import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, ShieldAlert, CheckCircle, Clock, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface UserDetailModalProps {
  user: any;
  subscriptions: any[];
  plans: any[];
  onClose: () => void;
  onUpdate: () => void;
}

export function UserDetailModal({ user, subscriptions, plans, onClose, onUpdate }: UserDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    admin_notes: user.admin_notes || ''
  });

  const [newSub, setNewSub] = useState({
    planId: '',
    durationDays: '30'
  });

  const handleUpdateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ admin_notes: formData.admin_notes })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Anotações salvas!');
      onUpdate();
    } catch (err: any) {
      toast.error('Erro ao salvar anotações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddManualSub = async () => {
    if (!newSub.planId) {
      toast.error('Selecione um plano.');
      return;
    }
    try {
      let expiresAt: Date | null = null;
      if (newSub.durationDays !== '0') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(newSub.durationDays, 10));
      }

      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        provider: 'manual',
        plan: newSub.planId,
        status: 'active',
        current_period_end: expiresAt ? expiresAt.toISOString() : null
      });

      if (error) throw error;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('admin_logs').insert({
          user_id: user.id,
          admin_id: session.user.id,
          action: 'ADD_SUBSCRIPTION',
          description: `Assinatura manual adicionada. Plano ID: ${newSub.planId}`
        });
      }
      
      toast.success('Assinatura manual adicionada com sucesso!');
      setNewSub({ planId: '', durationDays: '30' });
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar assinatura manual');
    }
  };

  const handleCancelSub = async (subId: string, provider: string) => {
    if (!confirm('Deseja realmente cancelar esta assinatura?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (provider === 'asaas') {
        // ideally call Edge Function to cancel in Asaas API
        toast.info('Cancelamento no Asaas será feito via API...');
        const { error } = await supabase.functions.invoke('admin-manage-access', {
          body: { action: 'cancel_asaas', subscriptionId: subId }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('id', subId);
        
        if (error) throw error;
      }
      
      if (session) {
        await supabase.from('admin_logs').insert({
          user_id: user.id,
          admin_id: session.user.id,
          action: 'CANCEL_SUBSCRIPTION',
          description: `Assinatura cancelada pelo administrador. Provedor: ${provider}`
        });
      }

      toast.success('Assinatura cancelada com sucesso!');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar assinatura');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-3xl bg-[#0B1120] border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Gerenciar Cliente</h2>
            <p className="text-sm text-slate-400 mt-1">Detalhes e assinaturas de {user.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8">
          {/* Dados Cadastrais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Dados Cadastrais</h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo</label>
                <input type="text" readOnly value={user.name || ''} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">E-mail</label>
                <input type="text" readOnly value={user.email || ''} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
                <input type="text" readOnly value={user.phone || 'Não informado'} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 cursor-not-allowed" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Anotações do Admin</h3>
              <form onSubmit={handleUpdateNotes} className="flex flex-col h-full">
                <textarea 
                  value={formData.admin_notes}
                  onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                  rows={4}
                  placeholder="Anotações internas sobre este cliente..."
                  className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none mb-3"
                />
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="self-end flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                >
                  <Save size={14} />
                  Salvar Notas
                </button>
              </form>
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* Assinaturas */}
          <div>
             <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
               Assinaturas e Acessos
             </h3>

             {subscriptions.length === 0 ? (
               <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm mb-6">
                 Este cliente não possui nenhuma assinatura ativa ou inativa.
               </div>
             ) : (
               <div className="space-y-3 mb-6">
                 {subscriptions.map(sub => {
                   const matchedPlan = plans.find(p => p.id === sub.plan);
                   const planName = matchedPlan ? matchedPlan.name : sub.plan;
                   const isActive = sub.status === 'active';

                   return (
                     <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800/30 border border-slate-700/60 rounded-xl gap-4">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-white capitalize">{planName}</span>
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                             isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                           }`}>
                             {sub.status}
                           </span>
                           <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                             sub.provider === 'asaas' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-700 text-slate-300'
                           }`}>
                             {sub.provider}
                           </span>
                         </div>
                         <p className="text-xs text-slate-400">
                           Criada em: {new Date(sub.created_at).toLocaleDateString('pt-BR')} 
                           {sub.current_period_end && ` • Vence em: ${new Date(sub.current_period_end).toLocaleDateString('pt-BR')}`}
                           {!sub.current_period_end && ` • Vitalício`}
                         </p>
                       </div>
                       
                       {isActive && (
                         <button 
                           onClick={() => handleCancelSub(sub.id, sub.provider)}
                           className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-medium border border-rose-500/20 transition-colors"
                         >
                           <Trash2 size={14} />
                           Cancelar
                         </button>
                       )}
                     </div>
                   );
                 })}
               </div>
             )}

             <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mt-4">
               <h4 className="text-sm font-bold text-white mb-3">Adicionar Acesso Manual</h4>
               <div className="flex flex-col sm:flex-row gap-3">
                 <select 
                   value={newSub.planId}
                   onChange={(e) => setNewSub({...newSub, planId: e.target.value})}
                   className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                 >
                   <option value="">Selecione o plano...</option>
                   <option value="trial">Trial (Período de Testes)</option>
                   {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   <option value="manual">Acesso Manual Genérico</option>
                 </select>
                 
                 <select 
                   value={newSub.durationDays}
                   onChange={(e) => setNewSub({...newSub, durationDays: e.target.value})}
                   className="w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
                 >
                   <option value="7">7 Dias</option>
                   <option value="15">15 Dias</option>
                   <option value="30">30 Dias</option>
                   <option value="365">1 Ano</option>
                   <option value="0">Vitalício</option>
                 </select>
                 
                 <button 
                   onClick={handleAddManualSub}
                   className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                 >
                   <Plus size={16} />
                   Adicionar
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
