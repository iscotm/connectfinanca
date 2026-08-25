import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Expense, Boleto } from '@/contexts/FinanceContext';
import { usePurchases } from '@/hooks/usePurchases';
import { RangeDatePicker } from '@/components/ui/RangeDatePicker';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer, 
  ReferenceLine, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function Dashboard() {
  const {
    expenses,
    boletos,
    dailySales,
    updateExpense,
    updateBoleto,
    getDREConfigForMonth,
  } = useFinance();

  const { purchases } = usePurchases();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [activeDetailsStatus, setActiveDetailsStatus] = useState<'paid' | 'pending' | 'overdue' | null>(null);

  // States for sales chart filter
  const [chartPeriod, setChartPeriod] = useState<'yesterday' | '7days' | '15days' | '30days' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return `Junho 2026`;
  });

  const [selectedMonthIndex, selectedYear] = useMemo(() => {
    const [monthName, yearStr] = selectedMonth.split(' ');
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return [months.indexOf(monthName), parseInt(yearStr)];
  }, [selectedMonth]);

  // Toggle visible chart lines
  const [showReceitas, setShowReceitas] = useState(true);
  const [showDespesas, setShowDespesas] = useState(true);
  const [showLucro, setShowLucro] = useState(true);

  // Day summary selector (Hoje / Ontem)
  const [resumoDia, setResumoDia] = useState<'hoje' | 'ontem'>('hoje');
  const [isResumoModalOpen, setIsResumoModalOpen] = useState(false);

  // Get active DRE config for selected month
  const activeDREConfig = useMemo(() => {
    return getDREConfigForMonth(selectedMonthIndex, selectedYear);
  }, [selectedMonthIndex, selectedYear, getDREConfigForMonth]);

  // Calculate total separated in Fundo de Caixa this month
  const totalFundoSeparado = useMemo(() => {
    const monthSales = dailySales.filter(
      s => s.month === selectedMonthIndex && s.year === selectedYear && s.totalLiquido > 0
    );
    return monthSales.length * activeDREConfig.metaDiariaFundo;
  }, [dailySales, selectedMonthIndex, selectedYear, activeDREConfig.metaDiariaFundo]);

  // Total withdrawals from Fundo de Caixa
  const withdrawals = useMemo(() => {
    return activeDREConfig.withdrawals || [];
  }, [activeDREConfig]);

  const totalRetirado = useMemo(() => {
    return withdrawals.reduce((sum, w) => sum + w.amount, 0);
  }, [withdrawals]);

  // Current balance of Fundo de Caixa
  const saldoAtualFundo = useMemo(() => {
    return totalFundoSeparado - totalRetirado;
  }, [totalFundoSeparado, totalRetirado]);

  // Calculate faturamento for selected month
  const totalSalesForSelectedMonth = useMemo(() => {
    return dailySales
      .filter(s => s.month === selectedMonthIndex && s.year === selectedYear)
      .reduce((sum, s) => sum + s.totalLiquido, 0);
  }, [dailySales, selectedMonthIndex, selectedYear]);

  const activeItemsList = useMemo(() => {
    if (!activeDetailsStatus) return [];
    
    const filterByMonthAndStatus = (items: (Expense | Boleto)[], type: 'cnpj' | 'boleto') => 
      items.filter(item => {
        const d = new Date(item.dueDate);
        const matchesMonth = d.getMonth() === selectedMonthIndex && d.getFullYear() === selectedYear;
        const matchesStatus = item.status === activeDetailsStatus;
        return matchesMonth && matchesStatus;
      }).map(item => ({ ...item, type }));

    return [
      ...filterByMonthAndStatus(expenses, 'cnpj'),
      ...filterByMonthAndStatus(boletos, 'boleto')
    ];
  }, [expenses, boletos, activeDetailsStatus, selectedMonthIndex, selectedYear]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.info("Buscando novas transações da adquirente...", { id: "refresh-toast" });

    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Todas as conciliações e boletos foram atualizados!", { id: "refresh-toast" });
    }, 1200);
  };

  const simulateExport = (format: string) => {
    setIsExportModalOpen(false);
    toast.info(`Gerando estrutura de dados em formato ${format}...`, { id: "export-toast" });
    
    setTimeout(() => {
      toast.success(`O download de seu relatório ${format} iniciará automaticamente!`, { id: "export-toast" });
    }, 1800);
  };

  // Metrics calculating despesas & efficiency for selected month
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
      if (!item.dueDate) return false;
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

  // Comparative metrics vs previous month
  const comparisonMetrics = useMemo(() => {
    // Current month sales
    const currentSales = totalSalesForSelectedMonth;

    // Previous month
    let prevMonth = selectedMonthIndex - 1;
    let prevYear = selectedYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = selectedYear - 1;
    }

    const prevMonthSales = dailySales
      .filter(s => s.month === prevMonth && s.year === prevYear)
      .reduce((sum, s) => sum + s.totalLiquido, 0);

    const salesDiffPercent = prevMonthSales > 0 
      ? ((currentSales - prevMonthSales) / prevMonthSales) * 100 
      : 0;

    // Previous month expenses
    const filterByMonth = (items: (Expense | Boleto)[], m: number, y: number) => items.filter(item => {
      if (!item.dueDate) return false;
      const d = new Date(item.dueDate);
      return d.getMonth() === m && d.getFullYear() === y;
    });

    const prevExpenses = filterByMonth(expenses, prevMonth, prevYear) as Expense[];
    const prevBoletos = filterByMonth(boletos, prevMonth, prevYear) as Boleto[];
    const prevTotalDespesas = prevExpenses.reduce((sum, e) => sum + e.value, 0) +
      prevBoletos.reduce((sum, b) => sum + b.value, 0);

    const despesasDiffPercent = prevTotalDespesas > 0 
      ? ((metrics.despesasMes - prevTotalDespesas) / prevTotalDespesas) * 100 
      : 0;

    return {
      salesDiffPercent,
      despesasDiffPercent
    };
  }, [totalSalesForSelectedMonth, dailySales, selectedMonthIndex, selectedYear, expenses, boletos, metrics.despesasMes]);

  const lucroLiquido = useMemo(() => {
    return totalSalesForSelectedMonth - metrics.despesasMes;
  }, [totalSalesForSelectedMonth, metrics.despesasMes]);

  const margemLucro = useMemo(() => {
    return totalSalesForSelectedMonth > 0 ? (lucroLiquido / totalSalesForSelectedMonth) * 100 : 0;
  }, [lucroLiquido, totalSalesForSelectedMonth]);

  // Chart data based on selected filter
  const chartDataAndMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start = new Date(today);
    let end = new Date(today);
    
    if (chartPeriod === 'yesterday') {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (chartPeriod === '7days') {
      start.setDate(today.getDate() - 6);
    } else if (chartPeriod === '15days') {
      start.setDate(today.getDate() - 14);
    } else if (chartPeriod === '30days') {
      start.setDate(today.getDate() - 29);
    } else if (chartPeriod === 'custom') {
      if (customStartDate) {
        const [y, m, d] = customStartDate.split('-').map(Number);
        start = new Date(y, m - 1, d);
      }
      if (customEndDate) {
        const [y, m, d] = customEndDate.split('-').map(Number);
        end = new Date(y, m - 1, d);
      }
    }
    
    const dataList = [];
    let current = new Date(start);
    const monthsShort = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // Daily expense rateio for selected month
    const dailyDespesaRateio = activeDREConfig.despesasRestantes / (activeDREConfig.totalDiasMes || 30);

    while (current <= end) {
      const curDay = current.getDate();
      const curMonth = current.getMonth();
      const curYear = current.getFullYear();
      
      const sale = dailySales.find(s => s.day === curDay && s.month === curMonth && s.year === curYear);
      const receita = sale?.totalLiquido || 0;
      const despesa = dailyDespesaRateio;
      const lucro = receita - despesa;

      const dateLabel = `${String(curDay).padStart(2, '0')}/${monthsShort[curMonth]}`;
      dataList.push({
        label: dateLabel,
        receitas: receita,
        despesas: despesa,
        lucro: lucro,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    const totalSales = dataList.reduce((sum, d) => sum + d.receitas, 0);
    const mediaDiaria = dataList.length > 0 ? totalSales / dataList.length : 0;
    
    return {
      data: dataList,
      totalSales,
      mediaDiaria
    };
  }, [dailySales, chartPeriod, customStartDate, customEndDate, activeDREConfig]);

  // Today / Yesterday summary metrics (SAÍDAS = TOTAL COMPRAS DO DIA + RETIRADAS DO FUNDO DE CAIXA)
  const resumoDiaData = useMemo(() => {
    const targetDate = new Date();
    if (resumoDia === 'ontem') {
      targetDate.setDate(targetDate.getDate() - 1);
    }
    targetDate.setHours(0, 0, 0, 0);
    const day = targetDate.getDate();
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();

    // Entradas (Sales)
    const saleEntry = dailySales.find(s => s.day === day && s.month === month && s.year === year);
    const entradas = saleEntry?.totalLiquido || 0;

    const formatDateString = (d: Date) => d.toISOString().split('T')[0];
    const targetDateStr = formatDateString(targetDate);

    // Total de Compras do Dia
    const dayPurchases = purchases.filter(p => p.date === targetDateStr);
    const totalPurchasesToday = dayPurchases.reduce((sum, p) => sum + p.value, 0);

    // Retiradas do Fundo de Caixa do Dia
    const dayWithdrawals = activeDREConfig.withdrawals?.filter(w => w.date === targetDateStr) || [];
    const totalWithdrawalsToday = dayWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    const saidas = totalPurchasesToday + totalWithdrawalsToday;
    const resultado = entradas - saidas;

    // Alerta
    let alertaTexto = '';
    let alertaIcon = 'fa-exclamation-triangle';
    let alertaCor = 'text-amber-400';

    const totalSaidasCount = dayPurchases.length + dayWithdrawals.length;

    if (resumoDia === 'hoje') {
      if (totalSaidasCount > 0) {
        alertaTexto = `${totalSaidasCount} saídas registradas hoje • ${formatCurrency(saidas)}`;
      } else {
        alertaTexto = `Nenhuma saída registrada hoje`;
        alertaIcon = 'fa-check-circle';
        alertaCor = 'text-emerald-400';
      }
    } else {
      if (totalSaidasCount > 0) {
        alertaTexto = `${totalSaidasCount} saídas registradas ontem • ${formatCurrency(saidas)}`;
        alertaIcon = 'fa-check-circle';
        alertaCor = 'text-emerald-400';
      } else {
        alertaTexto = `Nenhuma saída registrada ontem`;
        alertaIcon = 'fa-info-circle';
        alertaCor = 'text-slate-400';
      }
    }

    return {
      entradas,
      saidas,
      resultado,
      alertaTexto,
      alertaIcon,
      alertaCor,
      dayPurchases,
      dayWithdrawals
    };
  }, [resumoDia, dailySales, purchases, activeDREConfig]);

  const recentExpenses = useMemo(() => {
    const allExpenses = [
      ...expenses.map(e => ({ ...e, type: 'cnpj' as const })),
      ...boletos.map(b => ({ ...b, type: 'boleto' as const })),
    ];

    return allExpenses
      .sort((a, b) => b.id - a.id)
      .slice(0, 5); // Display top 5 recently created items as per mockup
  }, [expenses, boletos]);

  const monthsList = ["Janeiro 2026", "Fevereiro 2026", "Março 2026", "Abril 2026", "Maio 2026", "Junho 2026", "Julho 2026", "Agosto 2026"];

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    setIsMonthDropdownOpen(false);
    toast.success(`Exibindo as informações de ${month}.`);
  };

  // Recharts donut chart formatted data
  const donutData = useMemo(() => {
    const total = metrics.despesasMes;
    if (total === 0) {
      return [
        { name: 'Nenhuma despesa', value: 1, color: '#1e293b' }
      ];
    }
    return [
      { name: 'Processado', value: metrics.despesasProcessadas, color: '#10b981' },
      { name: 'Pendente', value: metrics.despesasPendentes, color: '#f59e0b' },
      { name: 'Atrasado', value: metrics.despesasAtrasadas, color: '#f43f5e' }
    ];
  }, [metrics]);

  return (
    <MainLayout>
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto no-scrollbar font-sans text-slate-100 max-w-[1600px] mx-auto w-full">
        
        {/* HEADER DO DASHBOARD */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h2>
              <div className="relative inline-block mt-0.5">
                <button 
                  onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-full"
                >
                  <span><i className="fas fa-calendar-alt text-blue-400 mr-1.5"></i>{selectedMonth}</span>
                  <i className="fas fa-chevron-down text-[10px]"></i>
                </button>

                {isMonthDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-48 glass-panel rounded-2xl shadow-2xl p-2 z-40">
                    {monthsList.map(m => (
                      <button 
                        key={m}
                        onClick={() => handleSelectMonth(m)} 
                        className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-slate-800/50 text-slate-300 hover:text-white transition-colors"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 md:flex-none flex items-center justify-center gap-2.5 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700/80 text-slate-300 hover:text-white font-bold py-3 px-5 rounded-full transition-all duration-200 text-[10px] tracking-wider uppercase"
            >
              <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
              <span>Atualizar</span>
            </button>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-blue-600/15 hover:shadow-blue-600/25 active:scale-[0.98] transition-all duration-200 text-[10px] tracking-wider uppercase"
            >
              <i className="fas fa-file-export"></i><span>Exportar</span>
            </button>
          </div>
        </header>

        {/* 1. KPIS FINANCEIROS COMPACTOS NO TOPO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* FATURAMENTO */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Faturamento</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs">
                <i className="fas fa-wallet"></i>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(totalSalesForSelectedMonth)}</h3>
              <span className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${comparisonMetrics.salesDiffPercent >= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                <i className={`fas ${comparisonMetrics.salesDiffPercent >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i> 
                {Math.abs(comparisonMetrics.salesDiffPercent).toFixed(1)}% 
                <span className="text-slate-500 font-medium">vs. mês anterior</span>
              </span>
            </div>
          </div>

          {/* DESPESAS */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Despesas</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs">
                <i className="fas fa-arrow-down-left"></i>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(metrics.despesasMes)}</h3>
              <span className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${comparisonMetrics.despesasDiffPercent <= 0 ? 'text-emerald-400' : 'text-rose-455'}`}>
                <i className={`fas ${comparisonMetrics.despesasDiffPercent >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i> 
                {Math.abs(comparisonMetrics.despesasDiffPercent).toFixed(1)}% 
                <span className="text-slate-500 font-medium">vs. mês anterior</span>
              </span>
            </div>
          </div>

          {/* LUCRO */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Lucro LÍQUIDO</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">
                <i className="fas fa-chart-line"></i>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(lucroLiquido)}</h3>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                Margem de <span className="text-emerald-400 font-extrabold">{margemLucro.toFixed(1)}%</span>
              </span>
            </div>
          </div>

          {/* SALDO EM CAIXA */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700/60 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">FUNDO DE CAIXA</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs">
                <i className="fas fa-piggy-bank"></i>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(saldoAtualFundo)}</h3>
              <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1 mt-1">
                <i className="fas fa-check-circle"></i> Disponível agora
              </span>
            </div>
          </div>

        </div>

        {/* 2. FLUXO FINANCEIRO */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl mb-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-white tracking-tight">Fluxo Financeiro</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                  {chartPeriod === 'yesterday' && 'Ontem'}
                  {chartPeriod === '7days' && '7 DIAS'}
                  {chartPeriod === '15days' && '15 DIAS'}
                  {chartPeriod === '30days' && '30 DIAS'}
                  {chartPeriod === 'custom' && 'PERSONALIZADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Acompanhamento consolidado de Receitas, Despesas e Lucro</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Controles para Ativar / Desativar Linhas */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80">
                <button 
                  onClick={() => setShowReceitas(!showReceitas)} 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${showReceitas ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'opacity-40 grayscale bg-transparent border-transparent'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-[11px]">Receitas</span>
                </button>
                <button 
                  onClick={() => setShowDespesas(!showDespesas)} 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${showDespesas ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 'opacity-40 grayscale bg-transparent border-transparent'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-[11px]">Despesas</span>
                </button>
                <button 
                  onClick={() => setShowLucro(!showLucro)} 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${showLucro ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'opacity-40 grayscale bg-transparent border-transparent'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px]">Lucro</span>
                </button>
              </div>

              {/* Filtros de Período */}
              <select 
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer w-full md:w-auto"
              >
                <option value="yesterday">Ontem</option>
                <option value="7days">7 dias</option>
                <option value="15days">15 dias</option>
                <option value="30days">30 dias</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {chartPeriod === 'custom' && (
            <div className="flex items-center gap-4 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200">
              <RangeDatePicker
                startDate={customStartDate}
                endDate={customEndDate}
                onChange={(start, end) => {
                  setCustomStartDate(start);
                  setCustomEndDate(end);
                }}
              />
            </div>
          )}

          {/* Canvas do Gráfico Recharts */}
          <div className="w-full h-[320px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataAndMetrics.data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="receitasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="lucroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.2} />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="600" 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="600" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(1).replace('.0', '') + 'k' : val}`}
                  dx={-5}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-panel p-3 rounded-xl border border-slate-800/80 shadow-2xl text-xs font-semibold text-white">
                          <p className="text-slate-400 font-bold mb-1">{payload[0].payload.label}</p>
                          {payload.map((p, idx) => (
                            <p key={idx} style={{ color: p.color }} className="font-black">
                              {p.name}: {formatCurrency(Number(p.value))}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {showReceitas && (
                  <Area 
                    type="monotone" 
                    name="Receitas"
                    dataKey="receitas" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#receitasGrad)" 
                    dot={{ r: 4, strokeWidth: 1, stroke: '#fff', fill: '#6366f1' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {showDespesas && (
                  <Area 
                    type="monotone" 
                    name="Despesas"
                    dataKey="despesas" 
                    stroke="#f43f5e" 
                    strokeWidth={2.5} 
                    fill="none" 
                    dot={{ r: 4, strokeWidth: 1, stroke: '#fff', fill: '#f43f5e' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {showLucro && (
                  <Area 
                    type="monotone" 
                    name="Lucro"
                    dataKey="lucro" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    strokeDasharray="5 5" 
                    fill="url(#lucroGrad)"
                    dot={{ r: 4, strokeWidth: 1, stroke: '#fff', fill: '#10b981' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
                {chartDataAndMetrics.mediaDiaria > 0 && showReceitas && (
                  <ReferenceLine 
                    y={chartDataAndMetrics.mediaDiaria} 
                    stroke="#818cf8" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Média Receitas: ${formatCurrency(chartDataAndMetrics.mediaDiaria)}`, 
                      position: 'top', 
                      fill: '#818cf8', 
                      fontSize: 10,
                      fontWeight: '800'
                    }} 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LINHA 1: RESUMO DE HOJE/ONTEM | DESPESAS DO MÊS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* 3. RESUMO DO DIA (HOJE / ONTEM SELEÇÃO) */}
          <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Resumo</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Balanço das movimentações registradas no dia</p>
                </div>
                {/* Seletor de Hoje / Ontem */}
                <div className="flex items-center p-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-bold">
                  <button 
                    onClick={() => setResumoDia('hoje')} 
                    className={`px-3 py-1 rounded-full transition-all ${resumoDia === 'hoje' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    HOJE
                  </button>
                  <button 
                    onClick={() => setResumoDia('ontem')} 
                    className={`px-3 py-1 rounded-full transition-all ${resumoDia === 'ontem' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    ONTEM
                  </button>
                </div>
              </div>

              {/* 3 Indicadores principais */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {/* ENTRADAS */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Entradas</span>
                  <span className="text-base sm:text-lg font-extrabold text-emerald-400 block tracking-tight">
                    {formatCurrency(resumoDiaData.entradas)}
                  </span>
                </div>
                {/* SAÍDAS (COMPRAS + RETIRADAS) */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Saídas</span>
                  <span className="text-base sm:text-lg font-extrabold text-rose-455 block tracking-tight">
                    {formatCurrency(resumoDiaData.saidas)}
                  </span>
                </div>
                {/* RESULTADO */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 text-center">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Resultado</span>
                  <span className={`text-base sm:text-lg font-extrabold block tracking-tight ${resumoDiaData.resultado >= 0 ? 'text-emerald-450' : 'text-rose-455'}`}>
                    {resumoDiaData.resultado >= 0 ? '+' : ''} {formatCurrency(resumoDiaData.resultado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerta de Vencimentos */}
            <div 
              onClick={() => setIsResumoModalOpen(true)} 
              className="bg-slate-950/40 border border-slate-900/80 rounded-2xl p-3.5 text-center cursor-pointer hover:bg-slate-900/60 hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-bold">
                <i className={`fas ${resumoDiaData.alertaIcon} ${resumoDiaData.alertaCor}`}></i>
                <span className={resumoDiaData.alertaCor}>{resumoDiaData.alertaTexto}</span>
                <i className="fas fa-chevron-right text-[9px] opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400"></i>
              </div>
            </div>
          </div>

          {/* 4. DESPESAS DO MÊS / PERÍODO */}
          <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Despesas do Mês</h3>
                <p className="text-xs text-slate-400 mt-0.5">Composição consolidada das obrigações do período</p>
              </div>
              <div className="px-3 py-1 bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-full uppercase tracking-wider">
                {selectedMonth}
              </div>
            </div>

            {/* Donut + Total do Mês */}
            <div className="flex items-center justify-between bg-slate-950/40 border border-slate-900/80 rounded-2xl p-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={30}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Total no Período</span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(metrics.despesasMes)}</h2>
              </div>
            </div>

            {/* Valores Individuais por Status */}
            <div className="grid grid-cols-3 gap-3">
              <div 
                onClick={() => setActiveDetailsStatus('paid')}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3 text-center transition-all hover:bg-slate-900/50 cursor-pointer hover:border-emerald-500/30"
              >
                <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block mb-1">Processado</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-100 block">{formatCurrency(metrics.despesasProcessadas)}</span>
              </div>
              <div 
                onClick={() => setActiveDetailsStatus('pending')}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3 text-center transition-all hover:bg-slate-900/50 cursor-pointer hover:border-amber-500/30"
              >
                <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider block mb-1">Pendente</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-100 block">{formatCurrency(metrics.despesasPendentes)}</span>
              </div>
              <div 
                onClick={() => setActiveDetailsStatus('overdue')}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3 text-center transition-all hover:bg-slate-900/50 cursor-pointer hover:border-rose-500/30"
              >
                <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider block mb-1">Atrasado</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-100 block">{formatCurrency(metrics.despesasAtrasadas)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* LINHA 2: PRÓXIMOS VENCIMENTOS | SALDO PROJETADO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* 5. PRÓXIMOS VENCIMENTOS */}
          <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Próximos Vencimentos</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Contas e obrigações a vencer nos próximos dias</p>
                </div>
                <Link to="/boletos" className="px-3.5 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all">
                  Ver todos
                </Link>
              </div>

              {/* Lista de Vencimentos */}
              <div className="space-y-2.5">
                {[...expenses, ...boletos]
                  .filter(item => item.status !== 'paid')
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 3)
                  .map((item, idx) => {
                    const itemDate = new Date(item.dueDate);
                    const dayFormatted = String(itemDate.getDate()).padStart(2, '0');
                    const monthFormatted = itemDate.toLocaleDateString('pt-BR', { month: 'short' }).substring(0, 3).toUpperCase();
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/30 border border-slate-900/50 hover:bg-slate-900/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-extrabold text-[10px] uppercase text-center border border-slate-700/50 min-w-[55px]">
                            {dayFormatted} {monthFormatted}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{item.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              {'type' in item ? (item.type === 'cnpj' ? 'CNPJ Mensal' : 'Boleto') : 'Despesa'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-white">{formatCurrency(item.value)}</p>
                        </div>
                      </div>
                    );
                  })
                }
                {[...expenses, ...boletos].filter(item => item.status !== 'paid').length === 0 && (
                  <p className="text-slate-500 text-xs italic text-center py-6">Nenhuma conta pendente.</p>
                )}
              </div>
            </div>

            {/* Resumo Próximos 7 Dias */}
            <div className="mt-4 pt-4 border-t border-slate-900/80 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Próximos 7 Dias</span>
              <span className="font-extrabold text-white text-sm">
                {formatCurrency(
                  [...expenses, ...boletos]
                    .filter(item => {
                      if (item.status === 'paid') return false;
                      const diffTime = new Date(item.dueDate).getTime() - new Date().getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays >= 0 && diffDays <= 7;
                    })
                    .reduce((sum, item) => sum + item.value, 0)
                )}
              </span>
            </div>
          </div>

          {/* 6. SALDO PROJETADO */}
          <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Saldo Projetado</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Previsão financeira considerando obrigações</p>
                </div>
                <div className="px-3 py-1 bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-full uppercase tracking-wider">
                  Projeção
                </div>
              </div>

              {/* Componentes do Cálculo */}
              <div className="space-y-3 text-xs mb-4">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium">Faturamento no período</span>
                  <span className="font-bold text-white text-sm">{formatCurrency(totalSalesForSelectedMonth)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span className="font-medium">Contas pagas / a pagar</span>
                  <span className="font-bold text-sm">- {formatCurrency(metrics.despesasMes)}</span>
                </div>
              </div>
            </div>

            <div>
              {/* Separador Visual */}
              <div className="h-px bg-slate-800/80 w-full my-4"></div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Saldo Líquido Projetado</span>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight">{formatCurrency(lucroLiquido)}</h3>
                </div>

                {/* Indicador Contextual */}
                <div>
                  <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-2 border ${lucroLiquido >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-455'}`}>
                    <span className={`w-2 h-2 rounded-full animate-pulse ${lucroLiquido >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`}></span> 
                    {lucroLiquido >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 7. DESPESAS RECENTES */}
        <section className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl">
          <div className="w-full flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Despesas Recentes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos lançamentos de despesas e boletos no painel</p>
            </div>
            <Link to="/despesas-cnpj" className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1">
              Ver Todas <i className="fas fa-chevron-right text-[8px] ml-1"></i>
            </Link>
          </div>

          {/* Tabela/Lista Ultra Compacta */}
          <div className="w-full space-y-2">
            {recentExpenses.length === 0 ? (
              <p className="text-slate-500 text-xs italic text-center py-6">Nenhuma despesa registrada.</p>
            ) : (
              recentExpenses.map((expense, idx) => {
                const statusInfo = {
                  paid: { label: 'Processado', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                  pending: { label: 'Pendente', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                  overdue: { label: 'Atrasado', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-455' },
                }[expense.status] || { label: expense.status, bg: 'bg-slate-800 text-slate-400' };

                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-slate-900/30 border border-slate-900/50 hover:bg-slate-900/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 font-black text-xs shadow-sm border border-slate-800 uppercase group-hover:border-blue-500/40 transition-colors">
                        {expense.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <p className="text-xs font-bold text-white uppercase">{expense.name}</p>
                        <span className="hidden sm:inline-block text-slate-700">•</span>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          {expense.type === 'cnpj' ? 'CNPJ Mensal' : 'Boleto Bancário'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 hidden md:inline-block">
                        {new Date(expense.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                      <p className="text-xs font-extrabold text-white w-24 text-right">{formatCurrency(expense.value)}</p>
                      <div className={`w-24 text-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </div>

      {/* MODAL DE EXPORTAÇÃO (GLASSMORPHIC) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-[28px] p-8 shadow-2xl relative">
            <button 
              onClick={() => setIsExportModalOpen(false)} 
              className="absolute right-6 top-6 text-slate-455 hover:text-white transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Exportar Relatórios</h3>
              <p className="text-xs text-slate-400">Selecione o formato desejado para baixar o demonstrativo financeiro consolidado.</p>
            </div>

            <div className="space-y-3">
              <button onClick={() => simulateExport('PDF')} className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all duration-200 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-455"><i className="fas fa-file-pdf text-lg"></i></span>
                  <div>
                    <span className="block text-xs font-bold text-white">Documento PDF (.pdf)</span>
                    <span className="block text-[10px] text-slate-400">Ideal para impressões, relatórios formais e apresentações</span>
                  </div>
                </div>
                <i className="fas fa-download text-slate-500 text-xs"></i>
              </button>

              <button onClick={() => simulateExport('Excel')} className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all duration-200 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-455"><i className="fas fa-file-excel text-lg"></i></span>
                  <div>
                    <span className="block text-xs font-bold text-white">Planilha Excel (.xlsx)</span>
                    <span className="block text-[10px] text-slate-400">Ideal para manipulação de fórmulas, auditorias e projeções</span>
                  </div>
                </div>
                <i className="fas fa-download text-slate-500 text-xs"></i>
              </button>

              <button onClick={() => simulateExport('CSV')} className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all duration-200 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-455"><i className="fas fa-file-csv text-lg"></i></span>
                  <div>
                    <span className="block text-xs font-bold text-white">Separado por Vírgulas (.csv)</span>
                    <span className="block text-[10px] text-slate-400">Ideal para integração com outros sistemas de ERP ou BI</span>
                  </div>
                </div>
                <i className="fas fa-download text-slate-500 text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DAS CONTAS DO MÊS */}
      {activeDetailsStatus && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl rounded-[28px] p-8 shadow-2xl relative max-h-[85vh] flex flex-col border border-slate-900/50">
            <button 
              onClick={() => setActiveDetailsStatus(null)} 
              className="absolute right-6 top-6 text-slate-450 hover:text-white transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">
                Contas: {
                  activeDetailsStatus === 'paid' ? 'Processadas (Pagas)' :
                  activeDetailsStatus === 'pending' ? 'Pendentes' : 'Atrasadas'
                }
              </h3>
              <p className="text-xs text-slate-400">Listando lançamentos para {selectedMonth}.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {activeItemsList.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 font-semibold italic text-center">Nenhum lançamento encontrado com este status.</p>
              ) : (
                activeItemsList.map((item: any, idx) => {
                  const statusInfo = {
                    paid: { label: 'Processado', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                    pending: { label: 'Pendente', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                    overdue: { label: 'Atrasado', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-455' },
                  }[item.status as 'paid' | 'pending' | 'overdue'] || { label: item.status, bg: 'bg-slate-800 text-slate-400' };

                  const handleToggleStatus = async () => {
                    const nextStatus = item.status === 'paid' ? 'pending' : 'paid';
                    try {
                      if (item.type === 'cnpj') {
                        await updateExpense(item.id, { status: nextStatus });
                      } else {
                        await updateBoleto(item.id, { status: nextStatus });
                      }
                      toast.success(`Status de "${item.name}" updated to ${nextStatus === 'paid' ? 'Pago' : 'Pendente'}!`);
                    } catch (e) {
                      toast.error("Erro ao atualizar status do lançamento.");
                    }
                  };

                  return (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-slate-900/50 hover:bg-slate-900/50 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-455 font-black text-xs shadow-sm uppercase border border-slate-800">
                          {item.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white uppercase">{item.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                            <span>{item.type === 'cnpj' ? 'CNPJ' : 'Boleto'}</span>
                            <span>•</span>
                            <span>Vence em {formatDate(item.dueDate)}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold text-white">{formatCurrency(item.value)}</p>
                        
                        <button
                          onClick={handleToggleStatus}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${
                            item.status === 'paid' 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-455' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-455 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-405'
                          }`}
                          title={item.status === 'paid' ? "Marcar como Pendente" : "Marcar como Pago"}
                        >
                          {item.status === 'paid' ? 'Pago ✓' : 'Marcar Pago'}
                        </button>

                        <Link
                          to={item.type === 'cnpj' ? "/despesas-cnpj" : "/boletos"}
                          className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                          title="Redirecionar para página"
                        >
                          <i className="fas fa-external-link-alt"></i>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES DE SAÍDAS DO RESUMO (COMPRAS + RETIRADAS) */}
      {isResumoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${resumoDia === 'hoje' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                  <i className={`fas ${resumoDia === 'hoje' ? 'fa-exclamation-triangle' : 'fa-check-circle'} text-base`}></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    {resumoDia === 'hoje' ? 'Saídas de Hoje' : 'Saídas de Ontem'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {`${resumoDiaData.dayPurchases.length + resumoDiaData.dayWithdrawals.length} movimentações no período`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsResumoModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-450 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>

            {/* Lista de Itens (Compras e Retiradas) */}
            <div className="py-4 space-y-2.5 max-h-[300px] overflow-y-auto no-scrollbar">
              {resumoDiaData.dayPurchases.map((item, idx) => (
                <div key={`pur-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{item.location}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      Compra
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs font-extrabold text-white">{formatCurrency(item.value)}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-rose-500/10 border-rose-500/25 text-rose-400">
                      Pago
                    </span>
                  </div>
                </div>
              ))}
              {resumoDiaData.dayWithdrawals.map((item, idx) => (
                <div key={`wit-${idx}`} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">{item.obs || 'Retirada de Fundo'}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      Retirada
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs font-extrabold text-white">{formatCurrency(item.amount)}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-amber-500/10 border-amber-500/25 text-amber-400">
                      Retirado
                    </span>
                  </div>
                </div>
              ))}
              {resumoDiaData.dayPurchases.length + resumoDiaData.dayWithdrawals.length === 0 && (
                <p className="text-slate-500 text-xs italic text-center py-6">Nenhuma movimentação de saída para este dia.</p>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Total de Saídas</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(resumoDiaData.saidas)}</span>
              </div>
              <button 
                onClick={() => setIsResumoModalOpen(false)} 
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </MainLayout>
  );
}
