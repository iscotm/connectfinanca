import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Settings,
  CreditCard,
  Building2,
  Calculator,
  Save,
  RefreshCcw,
  Percent,
  Calendar,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { useFinance, banks } from '@/contexts/FinanceContext';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { TaxasDialog } from '@/components/configuracoes/TaxasDialog';
import { ResetSistemaDialog } from '@/components/configuracoes/ResetSistemaDialog';

export default function ConfiguracoesDRE() {
  const {
    dreConfig,
    updateDREConfig,
    paymentFees,
    diasRestantes,
    rateioDiarioDespesas,
    resetAllData
  } = useFinance();

  const [isTaxasDialogOpen, setIsTaxasDialogOpen] = useState(false);

  const totalFundoPeriodo = dreConfig.metaDiariaFundo * diasRestantes;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    switch (name) {
      case 'diasMes':
        updateDREConfig({ totalDiasMes: parseInt(value) || 0 });
        break;
      case 'diaAtual':
        updateDREConfig({ diaAtual: parseInt(value) || 0 });
        break;
      case 'despesasRestantes':
        updateDREConfig({ despesasRestantes: numValue });
        break;
      case 'metaFundo':
        updateDREConfig({ metaDiariaFundo: numValue });
        break;
      case 'percentualCMV':
        updateDREConfig({ percentualCMV: numValue });
        break;
    }
  };

  const handleBankChange = (type: 'despesas' | 'cmv' | 'fundo' | 'sobras', value: string) => {
    switch (type) {
      case 'despesas':
        updateDREConfig({ bancoDespesas: value });
        break;
      case 'cmv':
        updateDREConfig({ bancoCMV: value });
        break;
      case 'fundo':
        updateDREConfig({ bancoFundo: value });
        break;
      case 'sobras':
        updateDREConfig({ bancoSobras: value });
        break;
    }
  };

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleReset = () => {
    resetAllData();
    toast.success('Sistema resetado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 font-sans text-slate-100 pb-12">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

          {/* Cabeçalho */}
          <header className="mb-8 border-b border-slate-900 pb-6 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg text-white">
              <Settings size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Configurações DRE</h1>
              <p className="text-slate-400 text-sm mt-0.5">Configure os parâmetros financeiros para cálculos automáticos de separação</p>
            </div>
          </header>

          <div className="space-y-6">

            {/* Secção: Taxas de Pagamento */}
            <section className="glass-panel border border-slate-900/50 p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 font-bold text-white">
                  <CreditCard size={18} className="text-blue-400" />
                  <h2>Taxas de Pagamento</h2>
                </div>
                <button
                  onClick={() => setIsTaxasDialogOpen(true)}
                  className="text-xs font-bold text-blue-400 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all flex items-center gap-1"
                >
                  <Settings size={14} /> Configurar Taxas
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Pix', value: `${paymentFees.pix}%` },
                  { label: 'Débito', value: `${paymentFees.debit}%` },
                  { label: 'Crédito', value: `${paymentFees.credit}%` }
                ].map((item) => (
                  <div key={item.label} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 hover:bg-slate-900 transition-all">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-wider">{item.label}</p>
                    <p className="text-xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Secção: Bancos de Destino */}
            <section className="glass-panel border border-slate-900/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 font-bold text-white mb-6">
                <Building2 size={18} className="text-blue-400" />
                <h2>Bancos de Destino</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Despesas Fixas</label>
                  <select
                    value={dreConfig.bancoDespesas}
                    onChange={(e) => handleBankChange('despesas', e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">CMV</label>
                  <select
                    value={dreConfig.bancoCMV}
                    onChange={(e) => handleBankChange('cmv', e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Fundo de Caixa</label>
                  <select
                    value={dreConfig.bancoFundo}
                    onChange={(e) => handleBankChange('fundo', e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Sobras</label>
                  <select
                    value={dreConfig.bancoSobras}
                    onChange={(e) => handleBankChange('sobras', e.target.value)}
                    className="bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank} className="bg-slate-950 text-white">{bank}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Secção: Parâmetros */}
            <section className="glass-panel border border-slate-900/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2 font-bold text-white mb-6">
                <Percent size={18} className="text-blue-400" />
                <h2>Parâmetros</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    <Calendar size={14} /> Total de dias do mês
                  </label>
                  <input
                    type="number"
                    name="diasMes"
                    value={dreConfig.totalDiasMes === 0 ? '' : dreConfig.totalDiasMes}
                    onChange={handleInputChange}
                    className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    <Calendar size={14} /> Dia atual
                  </label>
                  <input
                    type="number"
                    name="diaAtual"
                    value={dreConfig.diaAtual === 0 ? '' : dreConfig.diaAtual}
                    onChange={handleInputChange}
                    className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    <Wallet size={14} /> Despesas restantes (R$)
                  </label>
                  <input
                    type="number"
                    name="despesasRestantes"
                    value={dreConfig.despesasRestantes === 0 ? '' : dreConfig.despesasRestantes}
                    onChange={handleInputChange}
                    step="0.01"
                    className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    Meta diária fundo (R$)
                  </label>
                  <input
                    type="number"
                    name="metaFundo"
                    value={dreConfig.metaDiariaFundo === 0 ? '' : dreConfig.metaDiariaFundo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                    Percentual de CMV (%)
                  </label>
                  <input
                    type="number"
                    name="percentualCMV"
                    value={dreConfig.percentualCMV === 0 ? '' : dreConfig.percentualCMV}
                    onChange={handleInputChange}
                    step="0.1"
                    className="bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Secção: Cálculos Automáticos */}
            <section className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl">
              <div className="flex items-center gap-2 font-extrabold text-blue-400 mb-6">
                <Calculator size={20} />
                <h2>Cálculos Automáticos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Dias Restantes</p>
                  <p className="text-3xl font-black text-white">{diasRestantes}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{dreConfig.totalDiasMes} - {dreConfig.diaAtual} + 1</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Rateio Diário</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(rateioDiarioDespesas)}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{formatCurrency(dreConfig.despesasRestantes)} ÷ {diasRestantes} dias</p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Total Fundo no Período</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(totalFundoPeriodo)}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{formatCurrency(dreConfig.metaDiariaFundo)} × {diasRestantes} dias</p>
                </div>
              </div>

              <div className="bg-slate-950/20 border border-slate-900/60 rounded-xl p-5">
                <h3 className="text-xs font-black text-white mb-3 flex items-center gap-2 uppercase tracking-wide">
                  Fórmulas Aplicadas
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Separação CMV', value: `Venda do dia × ${dreConfig.percentualCMV}%` },
                    { label: 'Separação Despesas', value: `${formatCurrency(rateioDiarioDespesas)} por dia` },
                    { label: 'Separação Fundo', value: `${formatCurrency(dreConfig.metaDiariaFundo)} por dia` },
                    { label: 'Sobras', value: 'Venda - CMV - Despesas - Fundo' }
                  ].map((formula, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm group text-slate-400">
                      <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                      <span className="font-bold text-white min-w-[150px]">{formula.label}:</span>
                      <span>{formula.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 pb-12">
              <ResetSistemaDialog onConfirm={handleReset} customTrigger={
                <button className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-slate-900 border border-slate-800 text-rose-450 font-bold hover:bg-rose-950/20 transition-all outline-none">
                  <RefreshCcw size={18} /> Reset total
                </button>
              } />

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-12 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-blue-600/10 outline-none"
              >
                <Save size={18} /> Salvar Configurações
              </button>
            </div>

          </div>
        </div>
      </div>

      <TaxasDialog open={isTaxasDialogOpen} onOpenChange={setIsTaxasDialogOpen} />
    </MainLayout>
  );
}
