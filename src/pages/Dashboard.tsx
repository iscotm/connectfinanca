import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatCurrency } from '@/lib/formatters';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Download,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

// Local MiniStat component refined to match the new design system
const MiniStat = ({ label, value, color }: { label: string; value: string; color: 'green' | 'orange' | 'red' }) => {
  const colorStyles = {
    green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    red: 'bg-red-50 border-red-100 text-red-700',
  };

  return (
    <div className={cn(
      "p-4 rounded-2xl border text-center transition-transform hover:scale-[1.02] font-jakarta",
      colorStyles[color]
    )}>
      <p className="text-[10px] uppercase font-bold opacity-70 mb-1 tracking-wider">{label}</p>
      <p className="text-sm font-black">{value}</p>
    </div>
  );
};

export default function Dashboard() {
  const {
    expenses,
    boletos,
    dailySales,
  } = useFinance();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate dashboard metrics from real data
  const metrics = useMemo(() => {
    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get yesterday's sales
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayDate = yesterday.getDate();
    const yesterdayMonth = yesterday.getMonth();
    const yesterdayYear = yesterday.getFullYear();

    const yesterdaySale = dailySales.find(
      s => s.day === yesterdayDate && s.month === yesterdayMonth && s.year === yesterdayYear
    );
    const vendidoOntem = yesterdaySale?.totalLiquido || 0;

    // Get last 15 days sales
    const fifteenDaysAgo = new Date(now);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const receita15dias = dailySales
      .filter(s => {
        const saleDate = new Date(s.year, s.month, s.day);
        return saleDate >= fifteenDaysAgo && saleDate <= now;
      })
      .reduce((sum, s) => sum + s.totalLiquido, 0);

    // Get last 30 days sales
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const receita30dias = dailySales
      .filter(s => {
        const saleDate = new Date(s.year, s.month, s.day);
        return saleDate >= thirtyDaysAgo && saleDate <= now;
      })
      .reduce((sum, s) => sum + s.totalLiquido, 0);

    // Total liquid (all time)
    const totalLiquido = dailySales.reduce((sum, s) => sum + s.totalLiquido, 0);

    // Total expenses (CNPJ + Boletos)
    const totalDespesas = expenses.reduce((sum, e) => sum + e.value, 0) +
      boletos.reduce((sum, b) => sum + b.value, 0);

    // Paid sums
    const despesasPagas = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.value, 0);
    const boletosPagos = boletos.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.value, 0);

    // Pending amounts
    const despesasPendentes = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.value, 0);
    const boletosPendentes = boletos.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.value, 0);

    // Overdue amounts
    const despesasAtrasadas = expenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + e.value, 0);
    const boletosAtrasados = boletos.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.value, 0);

    return {
      vendidoOntem,
      receita15dias,
      receita30dias,
      totalLiquido,
      totalLiquidoDia: vendidoOntem,
      despesasMes: totalDespesas,
      despesasProcessadas: despesasPagas + boletosPagos,
      despesasPendentes: despesasPendentes + boletosPendentes,
      despesasAtrasadas: despesasAtrasadas + boletosAtrasados,
    };
  }, [expenses, boletos, dailySales]);

  // Get recent expenses (last 5, mixed from both)
  const recentExpenses = useMemo(() => {
    const allExpenses = [
      ...expenses.map(e => ({ ...e, type: 'cnpj' as const })),
      ...boletos.map(b => ({ ...b, type: 'boleto' as const })),
    ];

    return allExpenses
      .sort((a, b) => b.id - a.id) // Sort by most recent
      .slice(0, 5);
  }, [expenses, boletos]);

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in pb-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
            <p className="text-slate-500 text-sm">Visão geral financeira em tempo real</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={16} /> Exportar
            </button>
          </div>
        </header>

        {/* Receitas Caixa */}
        <section>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-jakarta">Receitas Caixa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Vendido Ontem"
              value={formatCurrency(metrics.vendidoOntem)}
              icon={DollarSign}
              variant="success"
            />
            <StatCard
              title="Receita 15 dias"
              value={formatCurrency(metrics.receita15dias)}
              icon={TrendingUp}
            />
            <StatCard
              title="Receita 30 dias"
              value={formatCurrency(metrics.receita30dias)}
              icon={TrendingUp}
            />
            <StatCard
              title="Total Geral Líquido"
              value={formatCurrency(metrics.totalLiquido)}
              icon={CheckCircle2}
              variant="success"
              className="border-dashed"
            />
          </div>
        </section>

        {/* Middle Section: Resumo and Despesas Gerais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumo do Dia */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-jakarta">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <h3 className="font-bold text-slate-900 tracking-tight">Resumo do Dia</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-500 font-medium tracking-tight">Despesas Pendentes</span>
                <span className="font-bold text-orange-500">{formatCurrency(metrics.despesasPendentes)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-500 font-medium tracking-tight">Despesas Atrasadas</span>
                <span className="font-bold text-red-500">{formatCurrency(metrics.despesasAtrasadas)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-900 rounded-2xl mt-4 shadow-xl shadow-slate-200">
                <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">Total Líquido do Dia</span>
                <span className="font-black text-emerald-400 text-lg tracking-tight">{formatCurrency(metrics.totalLiquidoDia)}</span>
              </div>
            </div>
          </div>

          {/* Despesas Gerais do Mês */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Despesas Gerais do Mês</h3>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total (CNPJ + Boletos)</p>
                <p className="font-bold text-slate-900">{formatCurrency(metrics.despesasMes)}</p>
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              <MiniStat label="Processado" value={formatCurrency(metrics.despesasProcessadas)} color="green" />
              <MiniStat label="Pendente" value={formatCurrency(metrics.despesasPendentes)} color="orange" />
              <MiniStat label="Atrasado" value={formatCurrency(metrics.despesasAtrasadas)} color="red" />
            </div>
          </div>
        </div>

        {/* Despesas Recentes */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden font-jakarta">
          <div className="p-8 border-b border-slate-50 bg-white flex justify-between items-center">
            <h3 className="font-black text-slate-900 text-lg tracking-tight">Despesas Recentes</h3>
            <Link
              to="/despesas-cnpj"
              className="text-blue-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline bg-blue-50 px-4 py-2 rounded-xl transition-all hover:bg-blue-100"
            >
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-50">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">
                      Nenhuma despesa recente encontrada.
                    </td>
                  </tr>
                ) : (
                  recentExpenses.map((expense) => (
                    <tr key={`${expense.type}-${expense.id}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-[11px] font-black text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-100 uppercase tracking-tighter">
                            {expense.name.substring(0, 2)}
                          </div>
                          <span className="text-sm font-bold text-slate-700 tracking-tight">{expense.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">{formatCurrency(expense.value)}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={expense.status as any} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
