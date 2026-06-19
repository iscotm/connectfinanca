import { useState } from 'react';
import {
  X,
  Settings,
  CreditCard,
  Building2,
  Percent,
  Calculator,
  Calendar,
  Wallet,
  ArrowRight,
  RefreshCcw,
  Save
} from 'lucide-react';
import { useFinance, banks } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { TaxasDialog } from '@/components/configuracoes/TaxasDialog';
import { ResetSistemaDialog } from '@/components/configuracoes/ResetSistemaDialog';

interface ConfiguracoesDREDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: number;
  year: number;
  monthName: string;
}

export function ConfiguracoesDREDialog({
  open,
  onOpenChange,
  month,
  year,
  monthName,
}: ConfiguracoesDREDialogProps) {
  const {
    getDREConfigForMonth,
    updateDREConfigForMonth,
    getDiasRestantesForMonth,
    getRateioDiarioDespesasForMonth,
    paymentFees,
    resetAllData
  } = useFinance();

  const [isTaxasDialogOpen, setIsTaxasDialogOpen] = useState(false);

  // Load the DRE config for this specific month/year
  const config = getDREConfigForMonth(month, year);
  const diasRestantes = getDiasRestantesForMonth(config);
  const rateioDiarioDespesas = getRateioDiarioDespesasForMonth(config);
  const totalFundoPeriodo = config.metaDiariaFundo * diasRestantes;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    switch (name) {
      case 'diasMes':
        updateDREConfigForMonth(month, year, { totalDiasMes: parseInt(value) || 0 });
        break;
      case 'diaAtual':
        updateDREConfigForMonth(month, year, { diaAtual: parseInt(value) || 0 });
        break;
      case 'despesasRestantes':
        updateDREConfigForMonth(month, year, { despesasRestantes: numValue });
        break;
      case 'metaFundo':
        updateDREConfigForMonth(month, year, { metaDiariaFundo: numValue });
        break;
      case 'percentualCMV':
        updateDREConfigForMonth(month, year, { percentualCMV: numValue });
        break;
    }
  };

  const handleBankChange = (type: 'despesas' | 'cmv' | 'fundo' | 'sobras', value: string) => {
    switch (type) {
      case 'despesas':
        updateDREConfigForMonth(month, year, { bancoDespesas: value });
        break;
      case 'cmv':
        updateDREConfigForMonth(month, year, { bancoCMV: value });
        break;
      case 'fundo':
        updateDREConfigForMonth(month, year, { bancoFundo: value });
        break;
      case 'sobras':
        updateDREConfigForMonth(month, year, { bancoSobras: value });
        break;
    }
  };

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
    onOpenChange(false);
  };

  const handleReset = () => {
    resetAllData();
    toast.success('Sistema resetado com sucesso!');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-4xl sm:rounded-[28px] sm:shadow-2xl flex flex-col h-full sm:h-auto max-h-[90vh] overflow-hidden border border-slate-900/50 animate-in zoom-in-95 duration-200 p-0">
        
        {/* Header */}
        <header className="px-6 py-6 sm:px-10 sm:py-8 flex justify-between items-center border-b border-slate-900/60 bg-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg text-white">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Parâmetros DRE — {monthName} {year}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                Ajuste as taxas e regras específicas de cálculo para este mês
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
          
          {/* Secção: Taxas de Pagamento */}
          <section className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 font-bold text-white">
                <CreditCard size={18} className="text-blue-400" />
                <h3 className="text-sm uppercase tracking-wider">Taxas de Pagamento</h3>
              </div>
              <button
                onClick={() => setIsTaxasDialogOpen(true)}
                className="text-xs font-bold text-blue-400 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all flex items-center gap-1"
              >
                <Settings size={12} /> Configurar Taxas
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pix', value: `${paymentFees.pix}%` },
                { label: 'Débito', value: `${paymentFees.debit}%` },
                { label: 'Crédito', value: `${paymentFees.credit}%` }
              ].map((item) => (
                <div key={item.label} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/40 hover:bg-slate-900 transition-all text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-0.5 tracking-wider">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Secção: Parâmetros */}
          <section className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 font-bold text-white">
              <Percent size={18} className="text-blue-400" />
              <h3 className="text-sm uppercase tracking-wider">Parâmetros do Mês</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> Total de dias do mês
                </label>
                <input
                  type="number"
                  name="diasMes"
                  value={config.totalDiasMes}
                  onChange={handleInputChange}
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={12} /> Dia atual
                </label>
                <input
                  type="number"
                  name="diaAtual"
                  value={config.diaAtual}
                  onChange={handleInputChange}
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Wallet size={12} /> Despesas restantes (R$)
                </label>
                <input
                  type="number"
                  name="despesasRestantes"
                  value={config.despesasRestantes}
                  onChange={handleInputChange}
                  step="0.01"
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Meta diária fundo (R$)
                </label>
                <input
                  type="number"
                  name="metaFundo"
                  value={config.metaDiariaFundo}
                  onChange={handleInputChange}
                  step="0.01"
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  Percentual de CMV (%)
                </label>
                <input
                  type="number"
                  name="percentualCMV"
                  value={config.percentualCMV}
                  onChange={handleInputChange}
                  step="0.1"
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none"
                />
              </div>
            </div>
          </section>

          {/* Secção: Bancos de Destino */}
          <section className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 font-bold text-white">
              <Building2 size={18} className="text-blue-400" />
              <h3 className="text-sm uppercase tracking-wider">Bancos de Destino</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider ml-1">Despesas Fixas</label>
                <select
                  value={config.bancoDespesas}
                  onChange={(e) => handleBankChange('despesas', e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950">Selecione...</option>
                  {banks.map(bank => (
                    <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider ml-1">CMV</label>
                <select
                  value={config.bancoCMV}
                  onChange={(e) => handleBankChange('cmv', e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950">Selecione...</option>
                  {banks.map(bank => (
                    <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider ml-1">Fundo de Caixa</label>
                <select
                  value={config.bancoFundo}
                  onChange={(e) => handleBankChange('fundo', e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950">Selecione...</option>
                  {banks.map(bank => (
                    <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider ml-1">Sobras</label>
                <select
                  value={config.bancoSobras}
                  onChange={(e) => handleBankChange('sobras', e.target.value)}
                  className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 text-sm outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950">Selecione...</option>
                  {banks.map(bank => (
                    <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Secção: Cálculos Automáticos */}
          <section className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 font-extrabold text-blue-400">
              <Calculator size={18} />
              <h3 className="text-sm uppercase tracking-wider">Cálculos do Período</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">Dias Restantes</p>
                <p className="text-xl font-black text-white">{diasRestantes}</p>
                <p className="text-[9px] text-slate-500 mt-1">{config.totalDiasMes} - {config.diaAtual} + 1</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">Rateio Diário</p>
                <p className="text-xl font-black text-white">{formatCurrency(rateioDiarioDespesas)}</p>
                <p className="text-[9px] text-slate-500 mt-1">{formatCurrency(config.despesasRestantes)} ÷ {diasRestantes} dias</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">Fundo do Período</p>
                <p className="text-xl font-black text-white">{formatCurrency(totalFundoPeriodo)}</p>
                <p className="text-[9px] text-slate-500 mt-1">{formatCurrency(config.metaDiariaFundo)} × {diasRestantes} dias</p>
              </div>
            </div>

            <div className="bg-slate-950/20 rounded-xl p-4">
              <ul className="space-y-1.5">
                {[
                  { label: 'Separação CMV', value: `Venda × ${config.percentualCMV}%` },
                  { label: 'Separação Despesas', value: `${formatCurrency(rateioDiarioDespesas)}/dia` },
                  { label: 'Separação Fundo', value: `${formatCurrency(config.metaDiariaFundo)}/dia` },
                  { label: 'Sobras', value: 'Venda - CMV - Despesas - Fundo' }
                ].map((formula, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                    <ArrowRight size={12} className="text-blue-400" />
                    <span className="font-bold text-white min-w-[120px]">{formula.label}:</span>
                    <span>{formula.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-900/60 bg-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
          <ResetSistemaDialog onConfirm={handleReset} customTrigger={
            <button className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-450 font-bold hover:bg-rose-950/20 transition-all outline-none text-sm">
              <RefreshCcw size={16} /> Reset total
            </button>
          } />

          <button
            onClick={handleSave}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-blue-600/10 outline-none text-sm"
          >
            <Save size={16} /> Confirmar e Fechar
          </button>
        </footer>

      </div>

      <TaxasDialog open={isTaxasDialogOpen} onOpenChange={setIsTaxasDialogOpen} />
    </div>
  );
}
