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

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Separacoes() {
  const { dreConfig, rateioDiarioDespesas, addOrUpdateDailySale, getDailySale } = useFinance();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Helper formatting
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Generate month data based on stored sales
  const monthData = useMemo(() => {
    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

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
      } else if (currentYear < today.getFullYear() ||
        (currentYear === today.getFullYear() && currentMonth < today.getMonth())) {
        status = 'pending';
      }

      // Calculate logic for this specific day
      const sales = existingSale?.totalLiquido || 0;
      let daySobras = 0;

      if (sales > 0) {
        const dayCMV = sales * (dreConfig.percentualCMV / 100);
        const dayDespesas = rateioDiarioDespesas;
        const dayFundo = dreConfig.metaDiariaFundo;
        daySobras = sales - dayCMV - dayDespesas - dayFundo;
      }

      return {
        day,
        sales,
        sobras: daySobras,
        status,
        hasData: sales > 0
      };
    });
  }, [currentMonth, currentYear, getDailySale, dreConfig, rateioDiarioDespesas]);

  // Totals calculations
  const daysWithSales = monthData.filter((d) => d.sales > 0);
  const totalSales = daysWithSales.reduce((sum, d) => sum + d.sales, 0);
  const cmv = totalSales * (dreConfig.percentualCMV / 100);
  const despesasRateio = rateioDiarioDespesas * daysWithSales.length;
  const fundoCaixa = dreConfig.metaDiariaFundo * daysWithSales.length;

  // Calculate total sobras (summing only positive sobras from days with sales)
  const totalSobras = daysWithSales.reduce((acc, day) => {
    return acc + (day.sobras > 0 ? day.sobras : 0);
  }, 0);

  const stats = [
    { label: `CMV (${dreConfig.percentualCMV || 0}%)`, value: formatCurrency(cmv), color: 'text-orange-500', bg: 'bg-orange-50', icon: TrendingUp },
    { label: 'Despesas', value: formatCurrency(despesasRateio), color: 'text-red-500', bg: 'bg-red-50', icon: TrendingDown },
    { label: 'Fundo de Caixa', value: formatCurrency(fundoCaixa), color: 'text-slate-600', bg: 'bg-slate-50', icon: Wallet },
    { label: 'Sobras', value: formatCurrency(totalSobras), color: 'text-emerald-500', bg: 'bg-emerald-50', icon: PiggyBank },
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

  const handleDayClick = (dayData: any) => {
    if (dayData && dayData.status !== 'future') {
      setSelectedDay(dayData.day);
      setIsDialogOpen(true);
    }
  };

  const handleSaveSales = (data: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
    totalLiquido: number;
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
        status: 'processed',
      });
    }
  };

  const monthName = months[currentMonth];
  const existingDayData = selectedDay ? getDailySale(selectedDay, currentMonth, currentYear) : undefined;

  // Check if a day is "today"
  const isDayToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 font-sans text-slate-900 animate-fade-in">
        <div className="w-full max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-2">
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                Separações - Tela de Caixa (DRE)
              </h1>
              <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2 text-sm">
                Registro diário de vendas e separações automáticas
                <Info className="w-4 h-4 text-slate-400 cursor-help" />
              </p>
            </div>

            <div className="flex justify-center">
              <Link to="/configuracoes-dre">
                <button className="group relative flex items-center gap-3 bg-[#0f172a] text-white px-7 py-3.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] overflow-hidden">
                  <div className="absolute inset-0 rounded-full border-2 border-blue-600 opacity-80 group-hover:border-blue-400 transition-colors"></div>
                  <Settings className="w-5 h-5 text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="relative font-bold text-base tracking-wide">
                    Configurar Taxas / Parâmetros DRE
                  </span>
                </button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-slate-300 transition-all">
                <div className={`${stat.bg} p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {stat.label}
                </span>
                <div className={`text-xl font-black ${stat.color}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Calendário */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden mb-8">
            <div className="flex items-center justify-between px-8 py-8 border-b border-slate-100 bg-white">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Relatório Diário
                </div>
                <h2 className="text-2xl font-black text-slate-800 capitalize tracking-tight">
                  {monthName} {currentYear}
                </h2>
              </div>
              <button
                onClick={() => navigateMonth('next')}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 p-4 gap-3 bg-white">
              {calendarDays.map((dayData, idx) => {
                const day = dayData?.day;
                const isToday = day ? isDayToday(day) : false;
                const hasData = dayData?.hasData;
                const isFuture = dayData?.status === 'future';

                return (
                  <div
                    key={idx}
                    onClick={() => day && handleDayClick(dayData)}
                    className={`
                      relative min-h-[140px] md:min-h-[160px] rounded-[2rem] p-4 flex flex-col transition-all border
                      ${!day ? 'bg-transparent border-transparent pointer-events-none' : 'border-slate-100'}
                      ${isToday ? 'bg-orange-50 border-orange-200 shadow-[0_0_20px_-5px_rgba(249,115,22,0.2)] ring-1 ring-orange-200' : (day ? 'bg-white' : '')}
                      ${hasData && !isToday ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50 hover:scale-[1.02] shadow-sm hover:shadow-md' : (day && !isFuture ? 'hover:bg-slate-50' : '')}
                      ${isFuture ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}
                    `}
                  >
                    {day && (
                      <>
                        {/* Dia no canto superior */}
                        <div className="flex justify-between items-start mb-auto">
                          <span className={`
                            flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black
                            ${isToday ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' :
                              hasData ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}
                          `}>
                            {day}
                          </span>
                          {hasData && !isToday && <ArrowUpRight className="w-4 h-4 text-emerald-400" />}
                          {!hasData && !isFuture && !isToday && <div className="w-2 h-2 rounded-full bg-slate-200"></div>}
                        </div>

                        {/* Conteúdo Estilizado */}
                        <div className="mt-3 space-y-2">
                          {/* Sobras */}
                          {hasData && (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Sobras</span>
                              <span className={`text-xs font-bold ${isToday ? 'text-orange-600' : 'text-slate-600'}`}>
                                {formatCurrency(dayData.sobras)}
                              </span>
                            </div>
                          )}

                          {/* Total Vendido (Pílula Estilo Referência) */}
                          {hasData ? (
                            <div className={`
                              mt-1 flex flex-col px-3 py-2 rounded-2xl
                              ${isToday ? 'bg-orange-200/50' : 'bg-emerald-100/60'}
                            `}>
                              <span className={`text-[8px] font-black uppercase ${isToday ? 'text-orange-700' : 'text-emerald-700'}`}>Total Vendido</span>
                              <span className={`text-[13px] font-black leading-tight ${isToday ? 'text-orange-800' : 'text-emerald-800'}`}>
                                {formatCurrency(dayData.sales)}
                              </span>
                            </div>
                          ) : (
                            !isFuture && (
                              <div className="mt-auto pt-4 text-center">
                                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Sem dados</span>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div className="flex justify-center items-center gap-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg bg-emerald-100 border border-emerald-200"></div>
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
        />
      </div>
    </MainLayout>
  );
}
