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
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-0 md:p-8 font-sans text-slate-900 animate-fade-in custom-scrollbar overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-0">

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
          
          {/* AREA SUPERIOR MOBILE: Scroll para cartões de resumo e sobras */}
          <div className="md:hidden overflow-y-auto custom-scrollbar flex flex-col p-4 space-y-4 max-h-[45vh] mb-4">
            {/* Cartões de Resumo Empilhados (CMV, Despesas, Fundo) */}
            {stats.slice(0, 3).map((item, index) => (
              <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                    <item.icon className={item.color} size={24} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{item.label}</h4>
                    <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="text-slate-300" />
              </div>
            ))}

            {/* Cartão de Sobras (Destaque) */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center border-t-4 border-t-emerald-500">
              <h2 className="text-slate-400 font-extrabold text-xs tracking-widest uppercase">Sobras Total</h2>
              <p className="text-[32px] font-bold text-emerald-500 mt-1">{formatCurrency(totalSobras)}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
          <div className="bg-white rounded-[2.5rem] md:rounded-[2.5rem] rounded-t-[3rem] border-x-0 border-b-0 md:border border-slate-200 shadow-xl overflow-hidden mb-8">
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

            <div className="hidden md:grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 p-4 gap-4 bg-white overflow-y-auto">
              {calendarDays.map((dayData, idx) => {
                const day = dayData?.day;
                if (!day) return <div key={idx} className="hidden md:block" />;

                const isToday = isDayToday(day);
                const hasData = dayData?.hasData;
                const isFuture = dayData?.status === 'future';
                const isNegative = hasData && dayData.sobras < 0;

                // Day Card Mobile Style based on snippet
                if (isToday || (day && !hasData && !isFuture)) {
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(dayData)}
                      className={`
                        bg-orange-50 border border-orange-200 rounded-[1.5rem] p-4 flex flex-col shadow-sm min-h-[180px] cursor-pointer transition-transform hover:-translate-y-1
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
                    onClick={() => !isFuture && handleDayClick(dayData)}
                    className={`
                      relative group min-h-[180px] rounded-[1.5rem] p-4 flex flex-col transition-all border cursor-pointer
                      ${isNegative ? 'bg-white border-red-100 shadow-sm hover:-translate-y-1' : 'bg-white border-slate-100 shadow-sm hover:-translate-y-1'}
                      ${isFuture ? 'opacity-40 pointer-events-none' : ''}
                    `}
                  >
                    {/* Header: Circle and Icon */}
                    <div className="flex justify-between items-start">
                      <div className={`
                        w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center
                        ${isNegative ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-700'}
                      `}>
                        {day}
                      </div>
                      {!isFuture && (
                        <ArrowUpRight className={`w-5 h-5 ${isNegative ? 'text-red-500' : 'text-emerald-500'}`} />
                      )}
                    </div>

                    {/* Sobras */}
                    <div className="mt-4 flex flex-col items-start">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sobras</div>
                      <div className="text-base font-extrabold text-slate-600 leading-tight mt-0.5">
                        {formatCurrency(dayData.sobras)}
                      </div>
                    </div>

                    {/* Total Vendido Pill */}
                    <div className="mt-auto pt-4">
                      <div className={`
                        rounded-xl p-2.5 w-full flex flex-col items-start
                        ${isNegative ? 'bg-red-100/60' : 'bg-emerald-100/60'}
                      `}>
                        <div className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${isNegative ? 'text-red-800' : 'text-emerald-700'}`}>
                          Total Vendido
                        </div>
                        <div className={`text-sm font-extrabold ${isNegative ? 'text-red-800' : 'text-emerald-800'}`}>
                          {formatCurrency(dayData.sales)}
                        </div>
                      </div>
                    </div>
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
