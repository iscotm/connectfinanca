import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Settings,
  Calendar as CalendarIcon,
  Info,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { CaixaDiaDialog } from '@/components/separacoes/CaixaDiaDialog';
import { ConfiguracoesDREDialog } from '@/components/separacoes/ConfiguracoesDREDialog';

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Separacoes() {
  const { 
    getDREConfigForMonth, 
    getRateioDiarioDespesasForMonth, 
    addOrUpdateDailySale, 
    getDailySale, 
    totalExpensesPending,
    expenses,
    isLoading 
  } = useFinance();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigDREOpen, setIsConfigDREOpen] = useState(false);

  // Helper formatting
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Get active DRE config for current month
  const activeDREConfig = useMemo(() => {
    return getDREConfigForMonth(currentMonth, currentYear);
  }, [currentMonth, currentYear, getDREConfigForMonth]);

  const activeRateioDiario = useMemo(() => {
    return getRateioDiarioDespesasForMonth(activeDREConfig);
  }, [activeDREConfig, getRateioDiarioDespesasForMonth]);

  // Calculate total expenses of the selected month (respecting date range hierarchy)
  const totalExpensesMonth = useMemo(() => {
    if (activeDREConfig.despesasRestantes !== undefined && activeDREConfig.despesasRestantes !== 0) {
      return activeDREConfig.despesasRestantes;
    }
    return expenses
      .filter(e => {
        if (!e.dueDate) return false;
        const [yr, mt] = e.dueDate.split('-').map(Number);
        return yr === currentYear && (mt - 1) === currentMonth;
      })
      .reduce((sum, e) => sum + e.value, 0);
  }, [activeDREConfig.despesasRestantes, expenses, currentMonth, currentYear]);

  // Generate month data based on stored sales
  const monthData = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const isPastMonth = currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth < today.getMonth());
    
    const effectiveRateio = activeRateioDiario;
    let allocatedDespesasSoFar = 0;

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const existingSale = getDailySale(day, currentMonth, currentYear);

      let status: 'pending' | 'processed' | 'future' = 'future';

      if (existingSale) {
        status = existingSale.status;
      } else if (isCurrentMonth) {
        if (day <= today.getDate()) {
          status = 'pending';
        }
      } else if (isPastMonth) {
        status = 'pending';
      }

      // Calculate logic for this specific day
      const sales = existingSale?.totalLiquido || 0;
      let dayCMV = 0;
      let dayDespesas = 0;
      let dayFundo = 0;
      let daySobras = 0;
      let isUnderRateio = false;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isWithinRange = activeDREConfig.startDate && activeDREConfig.endDate
        ? (dateStr >= activeDREConfig.startDate && dateStr <= activeDREConfig.endDate)
        : false;
      const isAfterEnd = activeDREConfig.endDate
        ? dateStr > activeDREConfig.endDate
        : false;

      if (isAfterEnd) {
        if (sales > 0) {
          dayDespesas = 0;
          let remaining = sales;

          const targetCMV = sales * (activeDREConfig.percentualCMV / 100);
          dayCMV = Math.min(remaining, targetCMV);
          remaining -= dayCMV;

          dayFundo = Math.min(remaining, activeDREConfig.metaDiariaFundo);
          remaining -= dayFundo;

          daySobras = Math.max(0, remaining);
        }
      } else {
        if (sales > 0) {
          const needed = Math.max(0, totalExpensesMonth - allocatedDespesasSoFar);
          dayDespesas = Math.min(sales, Math.min(effectiveRateio, needed));
          allocatedDespesasSoFar += dayDespesas;
          isUnderRateio = dayDespesas < Math.min(effectiveRateio, needed);

          let remaining = sales - dayDespesas;
          const targetCMV = sales * (activeDREConfig.percentualCMV / 100);
          dayCMV = Math.min(remaining, targetCMV);
          remaining -= dayCMV;

          dayFundo = Math.min(remaining, activeDREConfig.metaDiariaFundo);
          remaining -= dayFundo;

          daySobras = Math.max(0, remaining);
        }
      }

      return {
        day,
        sales,
        cmv: dayCMV,
        despesas: dayDespesas,
        fundo: dayFundo,
        sobras: daySobras,
        status,
        hasData: sales > 0,
        effectiveRateio,
        isUnderRateio
      };
    });
  }, [currentMonth, currentYear, getDailySale, activeDREConfig, activeRateioDiario, totalExpensesMonth]);

  // Totals calculations
  const daysWithSales = monthData.filter((d) => d.sales > 0);
  const totalSales = daysWithSales.reduce((sum, d) => sum + d.sales, 0);
  const cmv = daysWithSales.reduce((sum, d) => sum + d.cmv, 0);
  const despesasRateio = daysWithSales.reduce((sum, d) => sum + d.despesas, 0);
  const fundoCaixa = daysWithSales.reduce((sum, d) => sum + d.fundo, 0);
  const totalSobras = daysWithSales.reduce((sum, d) => sum + d.sobras, 0);

  const stats = [
    { label: `CMV (${activeDREConfig.percentualCMV || 0}%)`, value: formatCurrency(cmv), color: 'text-orange-400', bg: 'bg-orange-500/10 border border-orange-500/20', icon: TrendingUp },
    { label: 'Despesas', value: formatCurrency(despesasRateio), color: 'text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/20', icon: TrendingDown },
    { label: 'Fundo de Caixa', value: formatCurrency(fundoCaixa), color: 'text-slate-400', bg: 'bg-slate-900 border border-slate-800', icon: Wallet },
    { label: 'Sobras', value: formatCurrency(totalSobras), color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', icon: PiggyBank },
  ];

  // Calendar Grid generation
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const days = [];

    // Empty cells for shift
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);

    // Actual days
    monthData.forEach(day => days.push(day));

    return days;
  }, [currentYear, currentMonth, monthData]);

  const mobileCalendarDays = useMemo(() => {
    return monthData;
  }, [monthData]);

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

  const handleDayClick = (dayData: { day: number; status: string; sobras: number; hasData: boolean; sales: number }) => {
    if (dayData) {
      setSelectedDay(dayData.day);
      setIsDialogOpen(true);
    }
  };

  const renderDayCard = (dayData: any, idx: number) => {
    const day = dayData?.day;
    const isToday = isDayToday(day);
    const hasData = dayData?.hasData;
    const isFuture = dayData?.status === 'future';
    const isNegative = hasData && (dayData.sobras < 0 || dayData.isUnderRateio);
    const isProcessed = dayData?.status === 'processed';

    if ((isToday && !isProcessed) || (day && !hasData)) {
      return (
        <div
          key={idx}
          onClick={() => handleDayClick(dayData)}
          className={`
            bg-orange-500/10 border border-orange-500/20 rounded-[1.5rem] p-4 flex flex-col shadow-sm min-h-[180px] cursor-pointer transition-all hover:bg-orange-500/20
            ${isToday ? 'ring-1 ring-orange-400' : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {day}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center mt-4 text-center">
            <span className="text-[12px] font-bold text-orange-400 uppercase tracking-widest">
              {isToday ? 'Hoje' : 'Sem Dados'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={idx}
        onClick={() => handleDayClick(dayData)}
        className={`
          relative group min-h-[180px] rounded-[1.5rem] p-4 flex flex-col transition-all border cursor-pointer
          ${isNegative ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 shadow-sm' : 'glass-panel border-slate-900/60 hover:border-slate-800 shadow-sm'}
          ${isFuture ? 'opacity-40' : ''}
        `}
      >
        <div className="flex justify-between items-start">
          <div className={`
            w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center border
            ${isNegative ? 'bg-rose-500/20 text-rose-450 border-rose-500/25' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/25'}
          `}>
            {day}
          </div>
          <ArrowUpRight className={`w-5 h-5 ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>

        <div className="mt-4 flex flex-col items-start">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sobras</div>
          <div className="text-base font-extrabold text-white leading-tight mt-0.5">
            {formatCurrency(dayData.sobras)}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className={`
            rounded-xl p-2.5 w-full flex flex-col items-start
            ${isNegative ? 'bg-rose-500/10' : 'bg-emerald-500/10'}
          `}>
            <div className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${isNegative ? 'text-rose-405' : 'text-emerald-405'}`}>
              Total Vendido
            </div>
            <div className="text-sm font-extrabold text-white">
              {formatCurrency(dayData.sales)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveSales = (data: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
    totalLiquido: number;
    status: 'pending' | 'processed';
  }) => {
    if (selectedDay !== null) {
      addOrUpdateDailySale({
        day: selectedDay,
        month: currentMonth,
        year: currentYear,
        dinheiro: data.dinheiro,
        pix: data.pix,
        debito: data.debito,
        credito: data.credito,
        totalLiquido: data.totalLiquido,
        status: data.status,
      });
    }
  };

  const monthName = months[currentMonth];
  const existingDayData = selectedDay ? getDailySale(selectedDay, currentMonth, currentYear) : undefined;

  const isDayToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center font-sans text-slate-100">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse">Carregando dados financeiros...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent flex flex-col items-center p-0 md:p-8 font-sans text-slate-100 animate-fade-in pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-0">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-2">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
                Separações - Tela de Caixa (DRE)
              </h1>
              <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 text-sm">
                Registro diário de vendas e separações automáticas
                <Info className="w-4 h-4 text-slate-500 cursor-help" />
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => setIsConfigDREOpen(true)}
                className="group relative flex items-center gap-3 bg-slate-900 text-white px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 rounded-full border-2 border-blue-600 opacity-80 group-hover:border-blue-400 transition-colors"></div>
                <Settings className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
                <span className="relative font-bold text-base tracking-wide">
                  Configurar Taxas / Parâmetros DRE
                </span>
              </button>
            </div>
          </div>
          
          {/* AREA SUPERIOR MOBILE */}
          <div className="md:hidden overflow-y-auto flex flex-col p-4 space-y-4 max-h-[45vh] mb-4">
            {stats.slice(0, 3).map((item, index) => (
              <div key={index} className="glass-panel rounded-3xl p-6 shadow-sm border border-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                    <item.icon className={item.color} size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{item.label}</h4>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-slate-600" />
              </div>
            ))}

            <div className="glass-panel rounded-3xl shadow-sm border border-slate-900/50 p-6 text-center border-t-4 border-t-emerald-500">
              <h2 className="text-slate-500 font-extrabold text-xs tracking-widest uppercase">Sobras Total</h2>
              <p className="text-[32px] font-bold text-emerald-400 mt-1">{formatCurrency(totalSobras)}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-900/50 shadow-sm flex flex-col items-center text-center group hover:border-slate-800 transition-all">
                <div className={`${stat.bg} p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {stat.label}
                </span>
                <div className={`text-xl font-black ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Calendário */}
          <div className="glass-panel rounded-[28px] border border-slate-900/50 shadow-xl overflow-hidden mb-8 p-0">
            <div className="flex items-center justify-between px-8 py-8 border-b border-slate-900/60 bg-transparent">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Relatório Diário
                </div>
                <h2 className="text-2xl font-black text-white capitalize tracking-tight">
                  {monthName} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-3 hover:bg-slate-800 rounded-2xl transition-all text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="hidden md:grid grid-cols-7 bg-slate-950/20 border-b border-slate-900/60">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid do Calendário */}
            <div className="p-6 gap-4 bg-transparent overflow-y-auto">
              {/* DESKTOP GRID */}
              <div className="hidden md:grid grid-cols-7 gap-4">
                {calendarDays.map((dayData, idx) => {
                  const day = dayData?.day;
                  if (!day) return <div key={idx} className="min-h-[180px]" />;
                  return renderDayCard(dayData, idx);
                })}
              </div>

              {/* MOBILE GRID */}
              <div className="grid md:hidden grid-cols-2 gap-4">
                {mobileCalendarDays.map((dayData, idx) => {
                  return renderDayCard(dayData, idx);
                })}
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg bg-emerald-500/20 border border-emerald-500/25"></div>
              <span>Com Movimentação</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg bg-orange-500 shadow-md"></div>
              <span>Hoje</span>
            </div>
          </div>
        </div>

        {/* Caixa Dialog */}
        <CaixaDiaDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedDay={selectedDay}
          monthName={months[currentMonth]}
          onSave={handleSaveSales}
          existingData={existingDayData}
          dreConfig={activeDREConfig}
          rateioDiarioDespesas={activeRateioDiario}
          month={currentMonth}
          year={currentYear}
        />

        {/* DRE Config Dialog */}
        <ConfiguracoesDREDialog
          open={isConfigDREOpen}
          onOpenChange={setIsConfigDREOpen}
          month={currentMonth}
          year={currentYear}
          monthName={months[currentMonth]}
        />
      </div>
    </MainLayout>
  );
}
