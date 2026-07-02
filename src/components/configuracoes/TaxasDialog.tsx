import { useState, useEffect } from 'react';
import {
  X,
  Save,
  CreditCard,
  Smartphone,
  Banknote,
  Percent,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { toast } from 'sonner';

interface TaxasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month?: number;
  year?: number;
}

export function TaxasDialog({ open, onOpenChange, month, year }: TaxasDialogProps) {
  const { paymentFees: globalFees, updatePaymentFees, getDREConfigForMonth, updateDREConfigForMonth } = useFinance();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // State for form values (strings to handle input masking)
  const [fees, setFees] = useState({
    pix: '0,00',
    debit: '0,00',
    credit: '0,00'
  });

  // Sync with context when opening
  useEffect(() => {
    if (open) {
      const currentFees = (month !== undefined && year !== undefined) 
        ? getDREConfigForMonth(month, year).paymentFees || globalFees
        : globalFees;

      setFees({
        pix: currentFees.pix.toString().replace('.', ','),
        debit: currentFees.debit.toString().replace('.', ','),
        credit: currentFees.credit.toString().replace('.', ','),
      });
      setSuccess(false);
      setLoading(false);
    }
  }, [open, month, year, globalFees, getDREConfigForMonth]);

  const handleChange = (method: 'pix' | 'debit' | 'credit', value: string) => {
    // Remove caracteres não numéricos e formata como decimal simples
    // Allow only numbers and one comma
    const cleanValue = value.replace(/[^0-9,]/g, '');

    // Validate only one comma
    const parts = cleanValue.split(',');
    if (parts.length > 2) return;

    setFees(prev => ({ ...prev, [method]: cleanValue }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const newFees = {
        pix: parseFloat(fees.pix.replace(',', '.')) || 0,
        debit: parseFloat(fees.debit.replace(',', '.')) || 0,
        credit: parseFloat(fees.credit.replace(',', '.')) || 0,
      };

      if (month !== undefined && year !== undefined) {
        await updateDREConfigForMonth(month, year, { paymentFees: newFees });
      } else {
        await updatePaymentFees(newFees);
      }

      // Simulate a small delay for the animation if the update is too fast
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        toast.success('Taxas atualizadas com sucesso!');

        setTimeout(() => {
          setSuccess(false);
          onOpenChange(false);
        }, 1500);
      }, 600);

    } catch (error) {
      setLoading(false);
      toast.error('Erro ao salvar taxas.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Configurar Taxas
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Ajuste as percentagens de cobrança por método de pagamento.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">

          {/* Pix Row */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Smartphone size={16} className="text-emerald-500" />
                Taxa Pix
              </label>
              <span className="text-[11px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                Liquidação Instantânea
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={fees.pix}
                onChange={(e) => handleChange('pix', e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-lg text-slate-900"
                placeholder="0,00"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Percent size={18} />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Info size={12} /> Padrão: 0,00% (Sem taxa para Pix)
            </p>
          </div>

          {/* Débito Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Banknote size={16} className="text-blue-500" />
                Taxa Débito
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                value={fees.debit}
                onChange={(e) => handleChange('debit', e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-lg text-slate-900"
                placeholder="0,00"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Percent size={18} />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Info size={12} /> Padrão: 1,01%
            </p>
          </div>

          {/* Crédito Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CreditCard size={16} className="text-indigo-500" />
                Taxa Crédito
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                value={fees.credit}
                onChange={(e) => handleChange('credit', e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium text-lg text-slate-900"
                placeholder="0,00"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Percent size={18} />
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Info size={12} /> Padrão: 3,13%
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-white hover:border-slate-300 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || success}
            className={`flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${success ? 'bg-emerald-600 hover:bg-emerald-600 border-transparent' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 size={18} />
                Taxas Guardadas!
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
