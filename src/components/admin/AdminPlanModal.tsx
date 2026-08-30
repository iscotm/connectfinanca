import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AdminPlanModalProps {
  onClose: () => void;
  onUpdate: () => void;
  planToEdit?: any;
}

export function AdminPlanModal({ onClose, onUpdate, planToEdit }: AdminPlanModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '30',
    color: '#3b82f6',
    icon: 'fas fa-star',
    status: 'ativo'
  });

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name || '',
        description: planToEdit.description || '',
        price: planToEdit.price ? planToEdit.price.toString().replace('.', ',') : '',
        duration_days: planToEdit.duration_days ? planToEdit.duration_days.toString() : '30',
        color: planToEdit.color || '#3b82f6',
        icon: planToEdit.icon || 'fas fa-star',
        status: planToEdit.status || 'ativo'
      });
    }
  }, [planToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Preencha o nome e o preço do plano.');
      return;
    }

    setIsSaving(true);

    try {
      const priceValue = parseFloat(formData.price.replace(',', '.'));
      const durationValue = parseInt(formData.duration_days, 10);

      const payload = {
        name: formData.name,
        description: formData.description,
        price: priceValue,
        duration_days: durationValue,
        color: formData.color,
        icon: formData.icon,
        status: formData.status
      };

      if (planToEdit) {
        const { error } = await supabase
          .from('plans')
          .update(payload)
          .eq('id', planToEdit.id);
        
        if (error) throw error;
        toast.success('Plano atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([payload]);
        
        if (error) throw error;
        toast.success('Plano criado com sucesso!');
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Erro ao salvar plano.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg bg-[#0B1120] border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
          <div>
            <h2 className="text-xl font-bold text-white">{planToEdit ? 'Editar Plano' : 'Novo Plano'}</h2>
            <p className="text-sm text-slate-400 mt-1">{planToEdit ? 'Atualize os dados do pacote' : 'Crie um novo pacote de assinatura.'}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Nome do Plano</label>
            <input 
              type="text" 
              required
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Plano Pro Mensal"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição Rápida</label>
            <input 
              type="text" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Acesso completo a todas as ferramentas"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Preço (R$)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="Ex: 49.90"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Duração (Dias)</label>
              <input 
                type="number" 
                required
                value={formData.duration_days} 
                onChange={(e) => setFormData({...formData, duration_days: e.target.value})}
                placeholder="Ex: 30"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Cor de Destaque</label>
              <select 
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="#3b82f6">Azul (Padrão)</option>
                <option value="#8b5cf6">Roxo</option>
                <option value="#10b981">Verde</option>
                <option value="#f59e0b">Laranja</option>
                <option value="#ef4444">Vermelho</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Ícone (FontAwesome)</label>
              <input 
                type="text" 
                value={formData.icon} 
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="Ex: fas fa-star"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="ativo">Ativo (Visível)</option>
              <option value="inativo">Inativo (Oculto)</option>
            </select>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-800/60">
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
              {isSaving ? 'Salvando...' : (
                <>
                  <Save size={18} />
                  {planToEdit ? 'Salvar Alterações' : 'Criar Plano'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
