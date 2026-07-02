import { useState } from 'react';
import { X, Save, FileText, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { toast } from 'sonner';

interface NovaRetiradaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
}

export function NovaRetiradaDialog({ open, onOpenChange, month, year }: NovaRetiradaDialogProps) {
  const { addFundoWithdrawal } = useFinance();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    obs: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.obs || !formData.date) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    const amount = parseFloat(formData.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Informe um valor válido.');
      return;
    }

    setLoading(true);
    try {
      await addFundoWithdrawal(month, year, {
        amount,
        obs: formData.obs,
        date: formData.date
      });
      toast.success('Retirada salva com sucesso!');
      setFormData({ amount: '', obs: '', date: new Date().toISOString().split('T')[0] });
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar retirada.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold text-white">Nova Retirada</h2>
            <p className="text-xs text-slate-400 mt-1">Registre uma saída do fundo de caixa</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} /> Valor da Retirada (R$) *
            </label>
            <input
              type="text"
              value={formData.amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9,]/g, '');
                setFormData({ ...formData, amount: val });
              }}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon size={14} /> Data *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} /> Observação / Motivo *
            </label>
            <textarea
              value={formData.obs}
              onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
              placeholder="Ex: Compra de material de escritório"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} /> Salvar Retirada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
