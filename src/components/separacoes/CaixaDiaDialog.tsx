import { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Coins,
  Send,
  Trash2
} from 'lucide-react';
import { useFinance, DailySalesEntry } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';

interface CaixaDiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: number | null;
  monthName: string;
  onSave: (data: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
    totalLiquido: number;
  }) => void;
  existingData?: DailySalesEntry;
}

export function CaixaDiaDialog({
  open,
  onOpenChange,
  selectedDay,
  monthName,
  onSave,
  existingData,
}: CaixaDiaDialogProps) {
  const { paymentFees, dreConfig, rateioDiarioDespesas } = useFinance();

  const [formData, setFormData] = useState({
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0
  });

  // Load existing data when dialog opens
  useEffect(() => {
    if (open) {
      if (existingData) {
        setFormData({
          dinheiro: existingData.dinheiro || 0,
          pix: existingData.pix || 0,
          debito: existingData.debito || 0,
          credito: existingData.credito || 0,
        });
      } else {
        setFormData({ dinheiro: 0, pix: 0, debito: 0, credito: 0 });
      }
    }
  }, [open, existingData]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Calculations
  const calculos = useMemo(() => {
    const liq = {
      dinheiro: formData.dinheiro,
      pix: formData.pix * (1 - paymentFees.pix / 100),
      debito: formData.debito * (1 - paymentFees.debit / 100),
      credito: formData.credito * (1 - paymentFees.credit / 100)
    };

    const totalLiquido = Object.values(liq).reduce((a, b) => a + b, 0);

    // Only calculate separations if there are sales
    const hasInput = totalLiquido > 0;
    const cmv = hasInput ? totalLiquido * (dreConfig.percentualCMV / 100) : 0;
    const despesas = hasInput ? rateioDiarioDespesas : 0;
    const fundo = hasInput ? dreConfig.metaDiariaFundo : 0;
    const sobras = hasInput ? totalLiquido - cmv - despesas - fundo : 0;

    return { liq, totalLiquido, cmv, despesas, fundo, sobras };
  }, [formData, paymentFees, dreConfig, rateioDiarioDespesas]);

  const handleSave = () => {
    onSave({
      dinheiro: calculos.liq.dinheiro, // Storing Pre-Tax or Post-Tax? 
      // Context expects: dinheiro, pix, debito, credito. 
      // Usually we store the Gross input for editing later, but the app seems to pass these to `addOrUpdateDailySale`.
      // Let's stick to existing logic which seemed to pass `calculations.dinheiro` etc.
      // Wait, existing logic passed: `dinheiro: calculations.dinheiro` (gross), `pix: calculations.pixBruto` (gross).
      // So we should pass the GROSS values from `formData` so they can be edited later.
      // BUT `totalLiquido` is calculated.
      dinheiro: formData.dinheiro,
      pix: formData.pix,
      debito: formData.debito,
      credito: formData.credito,
      totalLiquido: calculos.totalLiquido,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    setFormData({ dinheiro: 0, pix: 0, debito: 0, credito: 0 });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white sm:bg-slate-900/40 sm:backdrop-blur-sm p-0 sm:p-4 font-sans text-slate-900 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl sm:rounded-[2rem] sm:shadow-2xl flex flex-col h-full sm:h-auto max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <header className="px-6 py-6 sm:px-10 sm:py-8 flex justify-between items-center border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
              Caixa do Dia {selectedDay}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {monthName} • Resumo Operacional
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </header>

        {/* Área Principal */}
        <main className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">

          {/* Entradas (Esquerda) */}
          <section className="lg:col-span-7 p-6 sm:p-10 space-y-10">
            <div className="space-y-8">
              <InputBlock
                label="Dinheiro"
                name="dinheiro"
                value={formData.dinheiro}
                liq={calculos.liq.dinheiro}
                icon={Coins}
                onChange={handleInputChange}
              />
              <InputBlock
                label="Pix"
                name="pix"
                value={formData.pix}
                liq={calculos.liq.pix}
                taxa={paymentFees.pix}
                icon={ArrowUpRight}
                onChange={handleInputChange}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputBlock
                  label="Débito"
                  name="debito"
                  value={formData.debito}
                  liq={calculos.liq.debito}
                  taxa={paymentFees.debit}
                  icon={Receipt}
                  onChange={handleInputChange}
                />
                <InputBlock
                  label="Crédito"
                  name="credito"
                  value={formData.credito}
                  liq={calculos.liq.credito}
                  taxa={paymentFees.credit}
                  icon={Receipt}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          {/* Resumo (Direita) */}
          <section className="lg:col-span-5 bg-slate-50/50 p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-100 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Separação Automática</h3>
            </div>

            <div className="grid gap-4">
              <ResultRow label="Total Líquido" value={calculos.totalLiquido} variant="main" />
              <ResultRow label={`CMV (${dreConfig.percentualCMV}%)`} value={calculos.cmv} />
              <ResultRow label="Despesas (Rateio Diario)" value={calculos.despesas} />
              <ResultRow label="Fundo de Caixa" value={calculos.fundo} />
              <ResultRow label="Sobras" value={calculos.sobras} variant="success" />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleClear}
            className="text-slate-400 text-sm font-bold hover:text-rose-500 flex items-center gap-2 transition-colors order-2 sm:order-1"
          >
            <Trash2 size={16} />
            Limpar formulário
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3 order-1 sm:order-2 shadow-lg shadow-slate-200"
          >
            Salvar e Processar
            <Send size={18} />
          </button>
        </footer>
      </div>
    </div>
  );
}

// Componentes Auxiliares
const InputBlock = ({
  label,
  name,
  value,
  liq,
  taxa,
  icon: Icon,
  onChange
}: {
  label: string,
  name: string,
  value: number,
  liq: number,
  taxa?: number,
  icon: any,
  onChange: (name: string, value: string) => void
}) => (
  <div className="flex flex-col gap-3 group">
    <div className="flex justify-between items-end">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-slate-300 group-focus-within:text-slate-900 transition-colors" />
        <span className="text-base font-bold text-slate-800">{label}</span>
        {taxa !== undefined && (
          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
            {taxa}%
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
        Líquido: {formatCurrency(liq)}
      </span>
    </div>

    <div className="relative">
      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-medium group-focus-within:text-slate-900 transition-colors">R$</span>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full bg-slate-50/50 border border-transparent rounded-2xl py-5 pl-14 pr-6 text-xl font-bold text-slate-800 placeholder:text-slate-200 focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-50 transition-all outline-none"
        placeholder="0,00"
      />
    </div>
  </div>
);

const ResultRow = ({ label, value, variant }: { label: string, value: number, variant?: 'main' | 'success' }) => {
  const isMain = variant === 'main';
  const isSuccess = variant === 'success';

  return (
    <div className={`
      flex justify-between items-center p-5 rounded-2xl border transition-all
      ${isMain ? 'bg-slate-900 text-white border-slate-900 shadow-xl' :
        isSuccess ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
          'bg-white border-slate-100 text-slate-600'}
    `}>
      <span className={`text-xs font-bold uppercase tracking-widest ${isMain ? 'opacity-60' : 'opacity-80'}`}>
        {label}
      </span>
      <span className={`font-black tracking-tight ${isMain ? 'text-2xl' : 'text-lg'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
};
