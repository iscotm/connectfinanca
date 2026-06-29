import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface UserDetailModalProps {
  user: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserDetailModal({ user, onClose, onUpdate }: UserDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: user.status || 'ativo',
    access_type: user.access_type || 'Acesso Manual',
    access_expires_at: user.access_expires_at ? new Date(user.access_expires_at).toISOString().split('T')[0] : '',
    admin_notes: user.admin_notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updates: any = {
        status: formData.status,
        access_type: formData.access_type,
        admin_notes: formData.admin_notes,
        access_defined_by_admin: true,
        updated_at: new Date().toISOString()
      };

      if (formData.access_expires_at) {
        updates.access_expires_at = new Date(formData.access_expires_at).toISOString();
      } else {
        updates.access_expires_at = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Log the action
      await supabase.from('admin_logs').insert({
        user_id: user.id,
        action: 'UPDATE_USER',
        description: `Status alterado para ${formData.status}. Tipo de acesso: ${formData.access_type}`
      });

      toast.success('Cliente atualizado com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-2xl bg-[#0B1120] border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <div>
            <h2 className="text-xl font-bold text-white">Gerenciar Cliente</h2>
            <p className="text-sm text-slate-400 mt-1">Detalhes e acessos de {user.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <label className="block text-xs font-medium text-slate-500 mb-1">Razão Social / Empresa</label>
                <input type="text" readOnly value={user.razao_social || 'Não informado'} className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 cursor-not-allowed" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-2">Controle de Acesso</h3>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status da Conta</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="ativo">🟢 Ativo</option>
                  <option value="pausado">🟡 Pausado</option>
                  <option value="bloqueado">🔴 Bloqueado</option>
                  <option value="expirado">⚪ Expirado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Acesso / Plano</label>
                <input 
                  type="text" 
                  value={formData.access_type} 
                  onChange={(e) => setFormData({...formData, access_type: e.target.value})}
                  placeholder="Ex: Plano Pro, Vitalício, Piloto..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data de Expiração (Vazio = Vitalício)</label>
                <input 
                  type="date" 
                  value={formData.access_expires_at}
                  onChange={(e) => setFormData({...formData, access_expires_at: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notas Internas (Apenas Admin)</label>
            <textarea 
              value={formData.admin_notes}
              onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
              rows={3}
              placeholder="Anotações sobre este cliente, histórico de pagamentos manuais, etc..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
            >
              {isSaving ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
