import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Expense, Boleto } from '@/contexts/FinanceContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function Dashboard() {
  const {
    expenses,
    boletos,
    dailySales,
    updateExpense,
    updateBoleto,
  } = useFinance();

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
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const now = new Date();
    // Default to June 2026 as per design or current date if needed
    return `Junho 2026`;
  });

  const [selectedMonthIndex, selectedYear] = useMemo(() => {
    const [monthName, yearStr] = selectedMonth.split(' ');
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return [months.indexOf(monthName), parseInt(yearStr)];
  }, [selectedMonth]);

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
    
    while (current <= end) {
      const curDay = current.getDate();
      const curMonth = current.getMonth();
      const curYear = current.getFullYear();
      
      const sale = dailySales.find(s => s.day === curDay && s.month === curMonth && s.year === curYear);
      
      const dateLabel = `${String(curDay).padStart(2, '0')}/${monthsShort[curMonth]}`;
      dataList.push({
        label: dateLabel,
        vendas: sale?.totalLiquido || 0,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    const totalSales = dataList.reduce((sum, d) => sum + d.vendas, 0);
    const mediaDiaria = dataList.length > 0 ? totalSales / dataList.length : 0;
    
    return {
      data: dataList,
      totalSales,
      mediaDiaria
    };
  }, [dailySales, chartPeriod, customStartDate, customEndDate]);

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
      .slice(0, 3);
  }, [expenses, boletos]);

  const monthsList = ["Janeiro 2026", "Fevereiro 2026", "Março 2026", "Abril 2026", "Maio 2026", "Junho 2026"];

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
    setIsMonthDropdownOpen(false);
    toast.success(`Exibindo as informações de ${month}.`);
  };

  // Progress calculations
  const pendingPercentage = metrics.despesasMes > 0 ? Math.round((metrics.despesasPendentes / metrics.despesasMes) * 100) : 0;
  const delayedPercentage = metrics.despesasMes > 0 ? Math.round((metrics.despesasAtrasadas / metrics.despesasMes) * 100) : 0;

  return (
    <MainLayout>
      <div className="flex-1 p-2 md:p-4 z-10 overflow-y-auto no-scrollbar font-sans text-slate-100">
        
        {/* Header Principal */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          
          {/* Identificação da Página */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/5">
              <i className="fas fa-th-large text-lg"></i>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h2>
              
              {/* Seletor Interativo de Meses */}
              <div className="relative inline-block mt-0.5">
                <button 
                  onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)} 
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-medium bg-slate-900/30 border border-slate-800/60 px-3 py-1.5 rounded-full"
                >
                  <span><i className="fas fa-calendar-alt text-blue-400 mr-1.5"></i>{selectedMonth}</span>
                  <i className="fas fa-chevron-down text-[10px]"></i>
                </button>
                
                {/* Menu Dropdown do Seletor de Meses */}
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

          {/* Botões de Ação Superiores */}
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
              <i className="fas fa-file-export"></i>
              <span>Exportar</span>
            </button>
          </div>
        </header>

        {/* Divisor Fluxo de Caixa */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-[10px] font-black text-blue-400 tracking-widest uppercase block shrink-0">
            Fluxo de Caixa: <span>{selectedMonth}</span>
          </span>
          <div className="h-px bg-gradient-to-r from-blue-500/20 via-slate-800 to-transparent w-full"></div>
        </div>

        {/* GRÁFICO DE VENDAS DIÁRIAS */}
        <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-xl mb-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-bold text-white tracking-tight">Gráfico de Vendas Diárias</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wider">
                  {chartPeriod === 'yesterday' && 'Ontem'}
                  {chartPeriod === '7days' && '7 DIAS'}
                  {chartPeriod === '15days' && '15 DIAS'}
                  {chartPeriod === '30days' && '30 DIAS'}
                  {chartPeriod === 'custom' && 'PERSONALIZADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Evolução do volume de vendas dia a dia no período selecionado</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Legends */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span>Vendas (R$)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-px border-t border-dashed border-indigo-400/80"></span>
                  <span>Média Diária</span>
                </div>
              </div>

              {/* Selector Select Dropdown */}
              <select
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer w-full md:w-auto"
              >
                <option value="yesterday">Ontem</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="15days">Últimos 15 dias</option>
                <option value="30days">Esse mês (últimos 30 dias)</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {chartPeriod === 'custom' && (
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">De</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 outline-none cursor-pointer w-full sm:w-[150px]"
                />
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl p-2.5 outline-none cursor-pointer w-full sm:w-[150px]"
                />
              </div>
            </div>
          )}

          {/* Recharts Area Chart */}
          <div className="w-full h-[320px] mt-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataAndMetrics.data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="vendasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
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
                          <p className="text-blue-400 font-black">Vendas: {formatCurrency(Number(payload[0].value))}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#vendasGrad)" 
                  dot={{ r: 4, strokeWidth: 1, stroke: '#fff', fill: '#4f46e5' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                {chartDataAndMetrics.mediaDiaria > 0 && (
                  <ReferenceLine 
                    y={chartDataAndMetrics.mediaDiaria} 
                    stroke="#818cf8" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    label={{ 
                      value: `Média: ${formatCurrency(chartDataAndMetrics.mediaDiaria)}`, 
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

        {/* SEÇÃO DE INSIGHTS E COMPOSIÇÃO DE DESPESAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* PAINEL 1: Resumo do Dia */}
          <div className="glass-panel rounded-[28px] p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Resumo do Dia</h3>
                <p className="text-xs text-slate-400 mt-0.5">Visão rápida das obrigações diárias corporativas</p>
              </div>
              <div className="px-3 py-1 bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-full">
                Lançamentos de Hoje
              </div>
            </div>

            <div className="space-y-6">
              {/* Despesas Pendentes */}
              <div 
                onClick={() => setActiveDetailsStatus('pending')}
                className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-4 transition-all hover:bg-slate-900/40 duration-200 cursor-pointer hover:border-amber-500/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-widest text-amber-500/90 bg-amber-500/10 border border-amber-500/10 px-2.5 py-1 rounded-full uppercase">
                    <i className="fas fa-clock mr-1"></i> Despesas Pendentes
                  </span>
                  <span className="text-lg font-bold text-amber-400">{formatCurrency(metrics.despesasPendentes)}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-1.5 rounded-full" style={{ width: `${pendingPercentage}%` }}></div>
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-slate-500 font-medium">
                  <span>{pendingPercentage}% do volume do mês</span>
                  <span>A vencer</span>
                </div>
              </div>

              {/* Despesas Atrasadas */}
              <div 
                onClick={() => setActiveDetailsStatus('overdue')}
                className="bg-slate-900/20 border border-slate-800/40 rounded-2xl p-4 transition-all hover:bg-slate-900/40 duration-200 cursor-pointer hover:border-rose-500/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold tracking-widest text-rose-500/90 bg-rose-500/10 border border-rose-500/10 px-2.5 py-1 rounded-full uppercase">
                    <i className="fas fa-circle-exclamation mr-1"></i> Despesas Atrasadas
                  </span>
                  <span className="text-lg font-bold text-rose-400">{formatCurrency(metrics.despesasAtrasadas)}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-rose-600 to-rose-400 h-1.5 rounded-full" style={{ width: `${delayedPercentage}%` }}></div>
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-slate-500 font-medium">
                  <span>{delayedPercentage}% do volume do mês</span>
                  <span>Ação necessária urgente</span>
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL 2: Despesas do Mês */}
          <div className="glass-panel rounded-[28px] p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Despesas de {selectedMonth.split(' ')[0]}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Composição combinada das despesas por CNPJ e Boletos</p>
              </div>
              <div className="px-3 py-1 bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-slate-400 rounded-full uppercase tracking-wider">
                Total CNPJ + Boletos
              </div>
            </div>

            {/* Painel de Valor Principal Centralizado */}
            <div className="flex flex-col items-center justify-center bg-slate-950/40 border border-slate-900/80 rounded-2xl p-6 text-center mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Consolidado</span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">{formatCurrency(metrics.despesasMes)}</h2>
            </div>

            {/* Detalhes Finais por Categoria */}
            <div className="grid grid-cols-3 gap-3">
              <div 
                onClick={() => setActiveDetailsStatus('paid')}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3.5 text-center transition-all hover:bg-slate-900/50 duration-150 cursor-pointer hover:border-emerald-500/30"
              >
                <span className="text-[9px] font-extrabold text-emerald-400/90 uppercase tracking-wider block mb-1">Processado</span>
                <span className="text-xs font-bold text-slate-100 block">{formatCurrency(metrics.despesasProcessadas)}</span>
              </div>

              <div 
                onClick={() => setActiveDetailsStatus('pending')}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3.5 text-center transition-all hover:bg-slate-900/50 duration-150 cursor-pointer hover:border-amber-500/30"
              >
                <span className="text-[9px] font-extrabold text-amber-500/90 uppercase tracking-wider block mb-1">Pendente</span>
                <span className="text-xs font-bold text-slate-100 block">{formatCurrency(metrics.despesasPendentes)}</span>
              </div>

              <div 
                onClick={() => setActiveDetailsStatus('overdue')}
                className="bg-slate-900/30 border border-slate-900 rounded-2xl p-3.5 text-center transition-all hover:bg-slate-900/50 duration-150 cursor-pointer hover:border-rose-500/30"
              >
                <span className="text-[9px] font-extrabold text-rose-500/90 uppercase tracking-wider block mb-1">Atrasado</span>
                <span className="text-xs font-bold text-slate-100 block">{formatCurrency(metrics.despesasAtrasadas)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: Despesas Recentes */}
        <section className="glass-panel rounded-[28px] p-8 shadow-xl">
          <div className="w-full flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Despesas Recentes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos lançamentos de despesas e boletos no painel</p>
            </div>
            <Link to="/despesas-cnpj" className="px-5 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all flex items-center gap-1">
              Ver Todas <i className="fas fa-chevron-right text-[8px] ml-1"></i>
            </Link>
          </div>

          <div className="w-full space-y-3">
            {recentExpenses.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 font-semibold italic text-center">Nenhuma despesa recente encontrada.</p>
            ) : (
              recentExpenses.map((expense, idx) => {
                const statusInfo = {
                  paid: { label: 'Processado', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                  pending: { label: 'Pendente', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                  overdue: { label: 'Atrasado', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
                }[expense.status] || { label: expense.status, bg: 'bg-slate-800 text-slate-400', border: 'border-transparent' };

                return (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-slate-900/50 hover:bg-slate-900/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 font-black text-sm shadow-sm group-hover:scale-110 transition-transform uppercase border border-slate-800">
                        {expense.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase">{expense.name}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{expense.type === 'cnpj' ? 'CNPJ Mensal' : 'Boleto Bancário'}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <p className="text-sm font-bold text-white">{formatCurrency(expense.value)}</p>
                      <div className={`w-24 text-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.bg}`}>
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
              className="absolute right-6 top-6 text-slate-400 hover:text-white transition-colors"
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
                  <span className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-400"><i class="fas fa-file-pdf text-lg"></i></span>
                  <div>
                    <span className="block text-xs font-bold text-white">Documento PDF (.pdf)</span>
                    <span className="block text-[10px] text-slate-400">Ideal para impressões, relatórios formais e apresentações</span>
                  </div>
                </div>
                <i className="fas fa-download text-slate-500 text-xs"></i>
              </button>

              <button onClick={() => simulateExport('Excel')} className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all duration-200 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400"><i class="fas fa-file-excel text-lg"></i></span>
                  <div>
                    <span className="block text-xs font-bold text-white">Planilha Excel (.xlsx)</span>
                    <span className="block text-[10px] text-slate-400">Ideal para manipulação de fórmulas, auditorias e projeções</span>
                  </div>
                </div>
                <i className="fas fa-download text-slate-500 text-xs"></i>
              </button>

              <button onClick={() => simulateExport('CSV')} className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all duration-200 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400"><i class="fas fa-file-csv text-lg"></i></span>
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

      {/* MODAL DE DETALHES DAS CONTAS */}
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
                    overdue: { label: 'Atrasado', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
                  }[item.status as 'paid' | 'pending' | 'overdue'] || { label: item.status, bg: 'bg-slate-800 text-slate-400' };

                  const handleToggleStatus = async () => {
                    const nextStatus = item.status === 'paid' ? 'pending' : 'paid';
                    try {
                      if (item.type === 'cnpj') {
                        await updateExpense(item.id, { status: nextStatus });
                      } else {
                        await updateBoleto(item.id, { status: nextStatus });
                      }
                      toast.success(`Status de "${item.name}" atualizado para ${nextStatus === 'paid' ? 'Pago' : 'Pendente'}!`);
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
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-450 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
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
    </MainLayout>
  );
}
