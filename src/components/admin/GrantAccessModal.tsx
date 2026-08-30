import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Send, ShieldCheck, Mail, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';

interface GrantAccessModalProps {
  onClose: () => void;
  onSuccess: () => void;
  plans: any[];
}

export function GrantAccessModal({ onClose, onSuccess, plans }: GrantAccessModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    planId: 'manual', // or a plan id
    durationDays: '7',
    provider: 'manual'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Informe um e-mail válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Chama a Edge Function para gerenciar o acesso
      const { data, error } = await supabase.functions.invoke('admin-manage-access', {
        body: {
          action: 'grant_access',
          email: formData.email,
          plan: formData.planId,
          durationDays: parseInt(formData.durationDays, 10),
          provider: formData.provider
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao conceder acesso');
      }

      toast.success(data?.message || 'Acesso concedido com sucesso!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Não foi possível conceder o acesso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md bg-[#0B1120] border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={24} />
              Conceder Acesso
            </h2>
            <p className="text-sm text-slate-400 mt-1">Libere acesso manual ou trial para um e-mail.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">
              <Mail size={14} /> E-mail do Cliente
            </label>
            <input 
              type="email" 
              required
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="cliente@exemplo.com"
            />
            <p className="text-[10px] text-slate-500 mt-1">Se não possuir conta, um e-mail de convite será enviado.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">
              <Package size={14} /> Plano
            </label>
            <select 
              value={formData.planId}
              onChange={(e) => setFormData({...formData, planId: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="trial">Trial (Período de Testes)</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
              <option value="manual">Acesso Manual Genérico</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">
              <Calendar size={14} /> Duração (Dias)
            </label>
            <select 
              value={formData.durationDays}
              onChange={(e) => setFormData({...formData, durationDays: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="7">7 Dias</option>
              <option value="15">15 Dias</option>
              <option value="30">30 Dias (Mensal)</option>
              <option value="365">1 Ano (Anual)</option>
              <option value="0">Vitalício (Sem Expiração)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>Salvando...</>
              ) : (
                <>
                  <Send size={16} />
                  Conceder Acesso
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
