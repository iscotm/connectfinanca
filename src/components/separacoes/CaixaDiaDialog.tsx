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
import { useFinance, DailySalesEntry, DREConfig } from '@/contexts/FinanceContext';
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
    status: 'pending' | 'processed';
  }) => void;
  existingData?: DailySalesEntry;
  dreConfig: DREConfig;
  rateioDiarioDespesas: number;
  month: number;
  year: number;
}

export function CaixaDiaDialog({
  open,
  onOpenChange,
  selectedDay,
  monthName,
  onSave,
  existingData,
  dreConfig,
  rateioDiarioDespesas,
  month,
  year,
}: CaixaDiaDialogProps) {
  const { paymentFees: globalFees, expenses, dailySales } = useFinance();
  const paymentFees = dreConfig.paymentFees || globalFees;

  const [formData, setFormData] = useState({
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0
  });

  const [isClosed, setIsClosed] = useState(false);

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
        setIsClosed(existingData.status === 'processed');
      } else {
        setFormData({ dinheiro: 0, pix: 0, debito: 0, credito: 0 });
        setIsClosed(false);
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
    let cmv = hasInput ? totalLiquido * (dreConfig.percentualCMV / 100) : 0;
    
    // Calculate total expenses of the selected month
    const totalExpensesMonth = (dreConfig.despesasRestantes !== undefined && dreConfig.despesasRestantes !== 0)
      ? dreConfig.despesasRestantes
      : expenses
          .filter(e => {
            if (!e.dueDate) return false;
            const [yr, mt] = e.dueDate.split('-').map(Number);
            return yr === year && (mt - 1) === month;
          })
          .reduce((sum, e) => sum + e.value, 0);

    // Sum up despesas allocated for all days of the month prior to selectedDay
    // Sum up despesas allocated for all days of the month prior to selectedDay
    let allocatedDespesasSoFar = 0;
    if (selectedDay !== null) {
      for (let day = 1; day < selectedDay; day++) {
        const sale = dailySales.find(s => s.day === day && s.month === month && s.year === year);
        const daySales = sale?.totalLiquido || 0;
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isWithinRange = dreConfig.startDate && dreConfig.endDate
          ? (dateStr >= dreConfig.startDate && dateStr <= dreConfig.endDate)
          : false;
        const isAfterEnd = dreConfig.endDate
          ? dateStr > dreConfig.endDate
          : false;

        if (isAfterEnd) {
          // No despesas after end date
        } else if (dreConfig.prioridadeCMV_DRE && isWithinRange) {
          const needed = Math.max(0, totalExpensesMonth - allocatedDespesasSoFar);
          const dayDesp = Math.min(daySales, Math.min(rateioDiarioDespesas, needed));
          allocatedDespesasSoFar += dayDesp;
        } else {
          if (daySales > 0) {
            const needed = Math.max(0, totalExpensesMonth - allocatedDespesasSoFar);
            allocatedDespesasSoFar += Math.min(daySales, Math.min(rateioDiarioDespesas, needed));
          }
        }
      }
    }

    let despesas = 0;
    let fundo = 0;
    let sobras = 0;

    if (hasInput && selectedDay !== null) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      const isWithinRange = dreConfig.startDate && dreConfig.endDate
        ? (dateStr >= dreConfig.startDate && dateStr <= dreConfig.endDate)
        : false;
      const isAfterEnd = dreConfig.endDate
        ? dateStr > dreConfig.endDate
        : false;

      if (isAfterEnd) {
        despesas = 0;
        let remaining = totalLiquido;

        const targetCMV = totalLiquido * (dreConfig.percentualCMV / 100);
        cmv = Math.min(remaining, targetCMV);
        remaining -= cmv;

        fundo = Math.min(remaining, dreConfig.metaDiariaFundo);
        remaining -= fundo;

        sobras = Math.max(0, remaining);
      } else if (dreConfig.prioridadeCMV_DRE && isWithinRange) {
        const needed = Math.max(0, totalExpensesMonth - allocatedDespesasSoFar);
        
        // 1. Despesas (minimum of daily rateio)
        despesas = Math.min(totalLiquido, Math.min(rateioDiarioDespesas, needed));
        let remaining = totalLiquido - despesas;

        // 2. CMV
        const targetCMV = totalLiquido * (dreConfig.percentualCMV / 100);
        cmv = Math.min(remaining, targetCMV);
        remaining -= cmv;

        // 3. Fundo de Caixa (optional)
        const targetFundo = dreConfig.incluirFDC ? dreConfig.metaDiariaFundo : 0;
        fundo = Math.min(remaining, targetFundo);
        remaining -= fundo;

        // 4. Sobras
        sobras = Math.max(0, remaining);
      } else {
        const needed = Math.max(0, totalExpensesMonth - allocatedDespesasSoFar);
        despesas = Math.min(totalLiquido, Math.min(rateioDiarioDespesas, needed));
        let remaining = totalLiquido - despesas;

        const targetCMV = totalLiquido * (dreConfig.percentualCMV / 100);
        cmv = Math.min(remaining, targetCMV);
        remaining -= cmv;

        fundo = Math.min(remaining, dreConfig.metaDiariaFundo);
        remaining -= fundo;

        sobras = Math.max(0, remaining);
      }
    }

    return { liq, totalLiquido, cmv, despesas, fundo, sobras };
  }, [formData, paymentFees, dreConfig, rateioDiarioDespesas, selectedDay, month, year, expenses, dailySales]);

  const handleSave = () => {
    onSave({
      dinheiro: formData.dinheiro,
      pix: formData.pix,
      debito: formData.debito,
      credito: formData.credito,
      totalLiquido: calculos.totalLiquido,
      status: isClosed ? 'processed' : 'pending',
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

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto order-1 sm:order-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors select-none py-2">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => setIsClosed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-850 bg-slate-900 accent-blue-500 cursor-pointer focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm font-bold">Fechar caixa deste dia</span>
            </label>

            <button
              onClick={handleSave}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-600/15 active:scale-95"
            >
              Salvar e Processar
              <Send size={18} />
            </button>
          </div>
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
