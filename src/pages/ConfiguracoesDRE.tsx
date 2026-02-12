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

  // Cálculos automáticos baseados no contexto
  const totalFundoPeriodo = dreConfig.metaDiariaFundo * diasRestantes;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Map internal UI names to context names if they differ, or match them directly
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
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 font-sans">
        {/* Container Centralizado com Max-Width */}
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">

          {/* Cabeçalho */}
          <header className="mb-8 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white">
                <Settings size={24} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações DRE</h1>
            </div>
            <p className="text-gray-500 italic">Configure os parâmetros financeiros para cálculos automáticos de separação</p>
          </header>

          <div className="space-y-6">

            {/* Secção: Taxas de Pagamento */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 font-semibold text-gray-800">
                  <CreditCard size={18} className="text-indigo-500" />
                  <h2>Taxas de Pagamento</h2>
                </div>
                <button
                  onClick={() => setIsTaxasDialogOpen(true)}
                  className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1"
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
                  <div key={item.label} className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1 tracking-wider">{item.label}</p>
                    <p className="text-xl font-bold text-gray-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Secção: Bancos de Destino */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-6">
                <Building2 size={18} className="text-indigo-500" />
                <h2>Bancos de Destino</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Despesas Fixas</label>
                  <select
                    value={dreConfig.bancoDespesas}
                    onChange={(e) => handleBankChange('despesas', e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">CMV</label>
                  <select
                    value={dreConfig.bancoCMV}
                    onChange={(e) => handleBankChange('cmv', e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Fundo de Caixa</label>
                  <select
                    value={dreConfig.bancoFundo}
                    onChange={(e) => handleBankChange('fundo', e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600">Sobras</label>
                  <select
                    value={dreConfig.bancoSobras}
                    onChange={(e) => handleBankChange('sobras', e.target.value)}
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  >
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Secção: Parâmetros */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-6">
                <Percent size={18} className="text-indigo-500" />
                <h2>Parâmetros</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Calendar size={14} /> Total de dias do mês
                  </label>
                  <input
                    type="number"
                    name="diasMes"
                    value={dreConfig.totalDiasMes}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Calendar size={14} /> Dia atual
                  </label>
                  <input
                    type="number"
                    name="diaAtual"
                    value={dreConfig.diaAtual}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Wallet size={14} /> Despesas restantes (R$)
                  </label>
                  <input
                    type="number"
                    name="despesasRestantes"
                    value={dreConfig.despesasRestantes}
                    onChange={handleInputChange}
                    step="0.01"
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    Meta diária fundo (R$)
                  </label>
                  <input
                    type="number"
                    name="metaFundo"
                    value={dreConfig.metaDiariaFundo}
                    onChange={handleInputChange}
                    step="0.01"
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    Percentual de CMV (%)
                  </label>
                  <input
                    type="number"
                    name="percentualCMV"
                    value={dreConfig.percentualCMV}
                    onChange={handleInputChange}
                    step="0.1"
                    className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Secção: Cálculos Automáticos */}
            <section className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-6">
              <div className="flex items-center gap-2 font-bold text-indigo-900 mb-6">
                <Calculator size={20} />
                <h2>Cálculos Automáticos</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                  <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Dias Restantes</p>
                  <p className="text-3xl font-black text-indigo-900">{diasRestantes}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{dreConfig.totalDiasMes} - {dreConfig.diaAtual} + 1</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                  <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Rateio Diário</p>
                  <p className="text-3xl font-black text-indigo-900">{formatCurrency(rateioDiarioDespesas)}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{formatCurrency(dreConfig.despesasRestantes)} ÷ {diasRestantes} dias</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm">
                  <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Total Fundo no Período</p>
                  <p className="text-3xl font-black text-indigo-900">{formatCurrency(totalFundoPeriodo)}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{formatCurrency(dreConfig.metaDiariaFundo)} × {diasRestantes} dias</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-5 border border-white">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2 uppercase tracking-tight">
                  Fórmulas Aplicadas
                </h3>
                <ul className="space-y-2.5">
                  {[
                    { label: 'Separação CMV', value: `Venda do dia × ${dreConfig.percentualCMV}%` },
                    { label: 'Separação Despesas', value: `${formatCurrency(rateioDiarioDespesas)} por dia` },
                    { label: 'Separação Fundo', value: `${formatCurrency(dreConfig.metaDiariaFundo)} por dia` },
                    { label: 'Sobras', value: 'Venda - CMV - Despesas - Fundo' }
                  ].map((formula, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm group">
                      <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                      <span className="font-semibold text-indigo-800 min-w-[150px]">{formula.label}:</span>
                      <span className="text-indigo-600/80">{formula.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 pb-12">
              <ResetSistemaDialog onConfirm={handleReset} customTrigger={
                <button className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-white border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors shadow-sm order-2 sm:order-1 outline-none focus:ring-2 focus:ring-red-200">
                  <RefreshCcw size={18} /> Reset total
                </button>
              } />

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 px-12 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 order-1 sm:order-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <Save size={18} /> Salvar Configurações
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TaxasDialog open={isTaxasDialogOpen} onOpenChange={setIsTaxasDialogOpen} />
    </MainLayout>
  );
}
