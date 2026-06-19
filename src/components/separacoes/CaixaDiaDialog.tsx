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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-5xl sm:rounded-[28px] sm:shadow-2xl flex flex-col h-full sm:h-auto max-h-[90vh] overflow-hidden border border-slate-900/50 animate-in zoom-in-95 duration-200 p-0">

        {/* Header */}
        <header className="px-6 py-6 sm:px-10 sm:py-8 flex justify-between items-center border-b border-slate-900/60">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Caixa do Dia {selectedDay}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {monthName} • Resumo Operacional
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
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
          <section className="lg:col-span-5 bg-slate-950/20 p-6 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-900/60 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-blue-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Separação Automática</h3>
            </div>

            <div className="grid gap-4">
              <ResultRow label="Total Líquido" value={calculos.totalLiquido} variant="main" />
              <ResultRow label={`CMV (${dreConfig.percentualCMV}%)`} value={calculos.cmv} />
              <ResultRow label="Despesas (Rateio Diário)" value={calculos.despesas} />
              <ResultRow label="Fundo de Caixa" value={calculos.fundo} />
              <ResultRow label="Sobras" value={calculos.sobras} variant="success" />
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-900/60 bg-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={handleClear}
            className="text-slate-400 text-sm font-bold hover:text-rose-400 flex items-center gap-2 transition-colors order-2 sm:order-1"
          >
            <Trash2 size={16} />
            Limpar formulário
          </button>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 order-1 sm:order-2 shadow-lg shadow-blue-600/15 active:scale-95"
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
  icon: React.ElementType,
  onChange: (name: string, value: string) => void
}) => (
  <div className="flex flex-col gap-3 group">
    <div className="flex justify-between items-end">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        <span className="text-base font-bold text-white">{label}</span>
        {taxa !== undefined && (
          <span className="text-[10px] font-black bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
            {taxa}%
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
        Líquido: {formatCurrency(liq)}
      </span>
    </div>

    <div className="relative">
      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-550 font-bold group-focus-within:text-blue-400 transition-colors">R$</span>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-xl font-extrabold text-white placeholder:text-slate-650 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
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
      ${isMain ? 'bg-gradient-to-r from-blue-600 to-indigo-650 text-white border-blue-500 shadow-xl' :
        isSuccess ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
          'bg-slate-900/40 border-slate-800 text-slate-350'}
    `}>
      <span className={`text-xs font-bold uppercase tracking-widest ${isMain ? 'opacity-70' : 'opacity-80'}`}>
        {label}
      </span>
      <span className={`font-black tracking-tight ${isMain ? 'text-2xl' : 'text-lg'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
};
