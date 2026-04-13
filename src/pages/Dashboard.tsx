import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatCurrency } from '@/lib/formatters';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance, Expense, Boleto } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';

// Ícone customizado baseado na imagem enviada
const CustomDashboardIcon = () => (
  <div className="relative w-16 h-16 bg-[#0B1120] rounded-[1.8rem] flex items-center justify-center overflow-hidden shadow-xl shadow-slate-200">
    <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-[#5C87F6] rounded-r-full"></div>
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#5C87F6"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  </div>
);

const PremiumStatCard = ({ title, value, icon: Icon, color, trendValue }: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  trendValue?: string
}) => (
  <div className="bg-white p-6 xl:p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-500 flex flex-col items-center text-center group">
    <div className={cn("p-4 rounded-[2rem] mb-5 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", color)}>
      <Icon size={28} className="text-white" />
    </div>
    <div className="space-y-1 w-full">
      <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">{title}</p>
      <h3 className="text-2xl xl:text-3xl font-black text-[#0F172A] whitespace-nowrap tracking-tighter">{value}</h3>
      {trendValue && (
        <div className="flex justify-center mt-3">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#E6F4EA] text-[#10B981] flex items-center gap-1">
            <ArrowUpRight size={12} strokeWidth={3} />
            {trendValue}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default function Dashboard() {
  const {
    expenses,
    boletos,
    dailySales,
  } = useFinance();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const now = new Date();
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });

  const [selectedMonthIndex, selectedYear] = useMemo(() => {
    const [monthName, yearStr] = selectedMonth.split(' ');
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return [months.indexOf(monthName), parseInt(yearStr)];
  }, [selectedMonth]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const metrics = useMemo(() => {
    const now = new Date();

    // Ontem
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.getDate();
    const yesterdayMonth = yesterday.getMonth();
    const yesterdayYear = yesterday.getFullYear();

    const yesterdaySale = dailySales.find(
      s => s.day === yesterdayDate && s.month === yesterdayMonth && s.year === yesterdayYear
    );
    const vendidoOntem = yesterdaySale?.totalLiquido || 0;

    // 15 dias
    const fifteenDaysAgo = new Date(now);
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const receita15dias = dailySales
      .filter(s => {
        const saleDate = new Date(s.year, s.month, s.day);
        return saleDate >= fifteenDaysAgo && saleDate <= now;
      })
      .reduce((sum, s) => sum + s.totalLiquido, 0);

    // 30 dias
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const receita30dias = dailySales
      .filter(s => {
        const saleDate = new Date(s.year, s.month, s.day);
        return saleDate >= thirtyDaysAgo && saleDate <= now;
      })
      .reduce((sum, s) => sum + s.totalLiquido, 0);

    // Total Geral
    const totalLiquido = dailySales.reduce((sum, s) => sum + s.totalLiquido, 0);

    // Despesas do Mês Selecionado
    const currentMonth = selectedMonthIndex;
    const currentYear = selectedYear;

    const filterByMonth = (items: (Expense | Boleto)[]) => items.filter(item => {
      const d = new Date(item.dueDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentExpenses = filterByMonth(expenses) as Expense[];
    const currentBoletos = filterByMonth(boletos) as Boleto[];

    const totalDespesas = currentExpenses.reduce((sum, e) => sum + e.value, 0) +
      currentBoletos.reduce((sum, b) => sum + b.value, 0);

    const processadas = [
      ...currentExpenses.filter(e => e.status === 'paid'),
      ...currentBoletos.filter(b => b.status === 'paid')
    ].reduce((sum, item) => sum + item.value, 0);

    const pendentes = [
      ...currentExpenses.filter(e => e.status === 'pending'),
      ...currentBoletos.filter(b => b.status === 'pending')
    ].reduce((sum, item) => sum + item.value, 0);

    const atrasadas = [
      ...currentExpenses.filter(e => e.status === 'overdue'),
      ...currentBoletos.filter(b => b.status === 'overdue')
    ].reduce((sum, item) => sum + item.value, 0);

    const eficiencia = totalDespesas > 0 ? Math.round((processadas / totalDespesas) * 100) : 0;

    return {
      vendidoOntem,
      receita15dias,
      receita30dias,
      totalLiquido,
      totalLiquidoDia: vendidoOntem,
      despesasMes: totalDespesas,
      despesasProcessadas: processadas,
      despesasPendentes: pendentes,
      despesasAtrasadas: atrasadas,
      eficiencia
    };
  }, [expenses, boletos, dailySales, selectedMonthIndex, selectedYear]);

  const recentExpenses = useMemo(() => {
    const allExpenses = [
      ...expenses.map(e => ({ ...e, type: 'cnpj' as const })),
      ...boletos.map(b => ({ ...b, type: 'boleto' as const })),
    ];

    return allExpenses
      .sort((a, b) => b.id - a.id)
      .slice(0, 3); // Top 3 as per design
  }, [expenses, boletos]);

  const monthsList = useMemo(() => {
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const now = new Date();
    const list = [];
    
    // Gerar últimos 9 meses e próximos 3 para navegação flexível
    for (let i = 9; i >= -3; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
    }

    return Array.from(new Set(list));
  }, []);

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-jakarta p-6 md:p-12 animate-fade-in">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Header Centralizado */}
          <header className="flex flex-col items-center text-center space-y-6">
            <div className="animate-in fade-in zoom-in duration-700">
              <CustomDashboardIcon />
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Dashboard</h1>

              <div className="relative inline-block group">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-white border-2 border-slate-100 px-12 py-3 rounded-full text-xs font-black uppercase tracking-widest text-[#94A3B8] shadow-sm cursor-pointer hover:border-[#5C87F6]/30 hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-[#5C87F6]/10"
                >
                  {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#5C87F6] pointer-events-none">
                  <Calendar size={16} />
                </div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all text-slate-600 shadow-sm active:scale-95 disabled:opacity-50"
                disabled={isRefreshing}
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                Atualizar
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-[#0B1120] text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-[#1E2638] transition-all shadow-lg active:scale-95">
                <Download size={14} />
                Exportar
              </button>
            </div>
          </header>

          {/* Fluxo de Caixa */}
          <section className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="px-4 py-1 bg-slate-100/50 rounded-full mb-4">
                <h2 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.25em]">Fluxo de Caixa: {selectedMonth}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <PremiumStatCard
                  title="Vendido Ontem"
                  value={formatCurrency(metrics.vendidoOntem)}
                  icon={DollarSign}
                  color="bg-[#94A3B8]"
                />
                <PremiumStatCard
                  title="Receita 15 Dias"
                  value={formatCurrency(metrics.receita15dias)}
                  icon={Calendar}
                  color="bg-[#6366F1]"
                  trendValue="+12.5%"
                />
                <PremiumStatCard
                  title="Receita 30 Dias"
                  value={formatCurrency(metrics.receita30dias)}
                  icon={TrendingUp}
                  color="bg-[#3B82F6]"
                  trendValue="+8.4%"
                />
                <PremiumStatCard
                  title="Total Geral Líquido"
                  value={formatCurrency(metrics.totalLiquido)}
                  icon={CheckCircle2}
                  color="bg-[#10B981]"
                />
              </div>
            </div>
          </section>

          {/* Middle Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Resumo do Dia */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <h2 className="text-xl font-black mb-10 text-[#0F172A]">Resumo do Dia</h2>

              <div className="w-full space-y-8 mb-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-[#F59E0B] mb-1 px-4 py-1 bg-[#FEF3E6] rounded-full">
                    <Clock size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Despesas Pendentes</span>
                  </div>
                  <span className="text-2xl font-black text-[#F59E0B]">{formatCurrency(metrics.despesasPendentes)}</span>
                </div>

                <div className="w-16 h-[2px] bg-slate-50 mx-auto rounded-full"></div>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-[#EF4444] mb-1 px-4 py-1 bg-[#FDEAEA] rounded-full">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Despesas Atrasadas</span>
                  </div>
                  <span className="text-2xl font-black text-[#EF4444]">{formatCurrency(metrics.despesasAtrasadas)}</span>
                </div>
              </div>

              <div className="w-full bg-[#0B1120] text-white p-8 rounded-[2.5rem] shadow-2xl shadow-[#0B1120]/20 transform transition-transform hover:scale-[1.02] flex flex-col md:flex-row justify-between items-center px-10">
                <p className="text-[#94A3B8] text-[11px] font-black uppercase tracking-[0.2em] mb-2 md:mb-0">Total Líquido do Dia</p>
                <p className="text-4xl font-black text-[#10B981]">{formatCurrency(metrics.totalLiquidoDia)}</p>
              </div>
            </section>

            {/* Despesas Gerais do Mês */}
            <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <h2 className="text-xl font-black mb-2 text-[#0F172A]">Despesas de {selectedMonth.split(' ')[0]}</h2>
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-10">Total (CNPJ + Boletos)</p>

              <div className="text-center mb-10">
                <p className="text-5xl font-black text-[#0F172A] tracking-tighter">{formatCurrency(metrics.despesasMes)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
                <div className="bg-[#E6F4EA] p-4 rounded-[1.5rem] text-center">
                  <p className="text-[9px] font-black text-[#10B981] uppercase mb-1">Processado</p>
                  <p className="text-sm font-black text-[#059669]">{formatCurrency(metrics.despesasProcessadas)}</p>
                </div>
                <div className="bg-[#FEF3E6] p-4 rounded-[1.5rem] text-center">
                  <p className="text-[9px] font-black text-[#F59E0B] uppercase mb-1">Pendente</p>
                  <p className="text-sm font-black text-[#D97706]">{formatCurrency(metrics.despesasPendentes)}</p>
                </div>
                <div className="bg-[#FDEAEA] p-4 rounded-[1.5rem] text-center">
                  <p className="text-[9px] font-black text-[#EF4444] uppercase mb-1">Atrasado</p>
                  <p className="text-sm font-black text-[#DC2626]">{formatCurrency(metrics.despesasAtrasadas)}</p>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="flex justify-between text-[10px] font-black text-[#94A3B8] uppercase px-1">
                  <span>Eficiência Financeira</span>
                  <span className="text-[#10B981]">{metrics.eficiencia}%</span>
                </div>
                <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    style={{ width: `${metrics.eficiencia}%` }}
                  ></div>
                </div>
              </div>
            </section>
          </div>

          {/* Despesas Recentes */}
          <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden p-10 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-10 px-2">
              <h2 className="text-xl font-black text-[#0F172A]">Despesas Recentes</h2>
              <Link to="/despesas-cnpj" className="px-5 py-2 bg-[#5C87F6]/10 text-[#5C87F6] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#5C87F6] hover:text-white transition-all flex items-center gap-1">
                Ver Todas <ChevronRight size={14} />
              </Link>
            </div>

            <div className="w-full space-y-3">
              {recentExpenses.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 font-bold">Nenhuma despesa recente encontrada.</p>
              ) : (
                recentExpenses.map((expense, idx) => {
                  const statusInfo = {
                    paid: { label: 'Processado', bg: 'bg-[#E6F4EA]', text: 'text-[#10B981]' },
                    pending: { label: 'Pendente', bg: 'bg-[#FEF3E6]', text: 'text-[#F59E0B]' },
                    overdue: { label: 'Atrasado', bg: 'bg-[#FDEAEA]', text: 'text-[#EF4444]' },
                  }[expense.status] || { label: expense.status, bg: 'bg-slate-100', text: 'text-slate-600' };

                  return (
                    <div key={idx} className="flex items-center justify-between p-6 rounded-[2.5rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-[#94A3B8] font-black text-sm shadow-sm group-hover:scale-110 transition-transform uppercase">
                          {expense.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-md font-black text-[#0F172A]">{expense.name}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <p className="text-lg font-black text-[#0F172A]">{formatCurrency(expense.value)}</p>
                        <div className={cn("w-24 text-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", statusInfo.bg, statusInfo.text)}>
                          {statusInfo.label}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <footer className="text-center pb-12">
            <div className="inline-block px-6 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
              <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em]">Gestão Financeira Premium • 2026</p>
            </div>
          </footer>
        </div>
      </div>
    </MainLayout>
  );
}
