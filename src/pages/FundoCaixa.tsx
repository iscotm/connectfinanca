import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  TrendingDown,
  Wallet,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  FileText
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { NovaRetiradaDialog } from '@/components/fundocaixa/NovaRetiradaDialog';
import { formatCurrency } from '@/lib/formatters';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function FundoCaixa() {
  const { 
    getDREConfigForMonth, 
    dailySales,
    deleteFundoWithdrawal
  } = useFinance();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isNovaRetiradaOpen, setIsNovaRetiradaOpen] = useState(false);

  // Get active DRE config for current month
  const activeDREConfig = useMemo(() => {
    return getDREConfigForMonth(currentMonth, currentYear);
  }, [currentMonth, currentYear, getDREConfigForMonth]);

  // Calculate total separated in this month
  const totalFundoSeparado = useMemo(() => {
    const monthSales = dailySales.filter(
      s => s.month === currentMonth && s.year === currentYear && s.totalLiquido > 0
    );
    return monthSales.length * activeDREConfig.metaDiariaFundo;
  }, [dailySales, currentMonth, currentYear, activeDREConfig.metaDiariaFundo]);

  // Total withdrawals
  const withdrawals = activeDREConfig.withdrawals || [];
  const totalRetirado = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  // Balance
  const saldoAtual = totalFundoSeparado - totalRetirado;

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta retirada?')) {
      await deleteFundoWithdrawal(currentMonth, currentYear, id);
    }
  };

  const monthName = months[currentMonth];

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent flex flex-col items-center p-4 md:p-8 font-sans text-slate-100 animate-fade-in pb-12">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-white shadow-lg shadow-emerald-500/20">
                  <PiggyBank size={24} />
                </div>
                Controle de Fundo de Caixa
              </h1>
              <p className="text-slate-400 text-sm mt-2 ml-1">
                Acompanhe as reservas mensais e gerencie as retiradas de despesas.
              </p>
            </div>

            <button
              onClick={() => setIsNovaRetiradaOpen(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Plus size={18} />
              Nova Retirada
            </button>
          </div>

          {/* Month Selector */}
          <div className="glass-panel rounded-2xl border border-slate-800 flex items-center justify-between p-4 px-6 shadow-sm">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <CalendarIcon size={16} className="text-blue-400" />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                {monthName} {currentYear}
              </h2>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <Wallet size={18} />
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Separado</span>
              </div>
              <div className="text-3xl font-black text-white relative">{formatCurrency(totalFundoSeparado)}</div>
              <div className="text-[10px] text-slate-500 mt-2 font-medium relative">
                Baseado na meta diária de {formatCurrency(activeDREConfig.metaDiariaFundo)}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all"></div>
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                  <TrendingDown size={18} />
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Retirado</span>
              </div>
              <div className="text-3xl font-black text-white relative">{formatCurrency(totalRetirado)}</div>
              <div className="text-[10px] text-slate-500 mt-2 font-medium relative">
                Soma das retiradas no mês
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all ${saldoAtual >= 0 ? 'bg-blue-500/5 group-hover:bg-blue-500/10' : 'bg-rose-500/5 group-hover:bg-rose-500/10'}`}></div>
              <div className="flex items-center gap-3 mb-4 relative">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                  <PiggyBank size={18} />
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo em Caixa</span>
              </div>
              <div className={`text-3xl font-black relative ${saldoAtual >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {formatCurrency(saldoAtual)}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 font-medium relative">
                Restante livre no fundo
              </div>
            </div>
          </div>

          {/* Lista de Retiradas */}
          <div className="glass-panel rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/80 bg-slate-900/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                Histórico de Retiradas
              </h3>
            </div>

            {withdrawals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                  <PiggyBank className="text-slate-600" size={24} />
                </div>
                <h4 className="text-slate-300 font-bold mb-1">Nenhuma retirada registrada</h4>
                <p className="text-slate-500 text-sm">O fundo de caixa deste mês está intacto.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shrink-0">
                        <TrendingDown size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">{w.obs}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><CalendarIcon size={12} /> {w.date.split('-').reverse().join('/')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-14 sm:pl-0">
                      <div className="text-lg font-black text-rose-400">
                        - {formatCurrency(w.amount)}
                      </div>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Excluir retirada"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <NovaRetiradaDialog
        open={isNovaRetiradaOpen}
        onOpenChange={setIsNovaRetiradaOpen}
        month={currentMonth}
        year={currentYear}
      />
    </MainLayout>
  );
}
