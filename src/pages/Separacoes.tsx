import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  TrendingUp,
  DollarSign,
  Wallet,
  PiggyBank,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
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

      return {
        day,
        sales: existingSale?.totalLiquido || 0,
        status,
      };
    });
  }, [currentMonth, currentYear, getDailySale]);

  // Summary calculations
  // Mantém o resumo alinhado com a lógica do diálogo:
  // só aplica CMV/Despesas/Fundo em dias que tiveram venda (> 0).
  const daysWithSales = monthData.filter((d) => d.sales > 0);
  const totalSales = daysWithSales.reduce((sum, d) => sum + d.sales, 0);
  const cmv = totalSales * (dreConfig.percentualCMV / 100);
  const despesasRateio = rateioDiarioDespesas * daysWithSales.length;
  const fundoCaixa = dreConfig.metaDiariaFundo * daysWithSales.length;
  // Calculate sobras by summing only positive daily results
  const sobras = daysWithSales.reduce((acc, day) => {
    const daySales = day.sales;
    const dayCMV = daySales * (dreConfig.percentualCMV / 100);
    const dayDespesas = rateioDiarioDespesas;
    const dayFundo = dreConfig.metaDiariaFundo;

    const daySobras = daySales - dayCMV - dayDespesas - dayFundo;

    // Only add positive sobras to the total
    return acc + (daySobras > 0 ? daySobras : 0);
  }, 0);

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

  const handleDayClick = (day: { day: number; status: string }) => {
    if (day.status !== 'future') {
      setSelectedDay(day.day);
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

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'processed':
        return 'calendar-day-processed';
      case 'pending':
        return 'calendar-day-pending';
      default:
        return 'calendar-day-future';
    }
  };

  // Get existing data for dialog
  const existingDayData = selectedDay ? getDailySale(selectedDay, currentMonth, currentYear) : undefined;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Separações - Tela de Caixa (DRE)</h1>
            <p className="page-description">Registro diário de vendas e separações automáticas</p>
          </div>
          <Button asChild>
            <Link to="/configuracoes-dre">
              <Settings className="h-4 w-4 mr-2" />
              Configurar Taxas / Parâmetros DRE
            </Link>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`CMV (${dreConfig.percentualCMV || 0}%)`}
            value={formatCurrency(cmv)}
            icon={TrendingUp}
            variant="warning"
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(despesasRateio)}
            icon={DollarSign}
            variant="danger"
          />
          <StatCard
            title="Fundo de Caixa"
            value={formatCurrency(fundoCaixa)}
            icon={Wallet}
          />
          <StatCard
            title="Sobras"
            value={formatCurrency(sobras)}
            icon={PiggyBank}
            variant={sobras >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* Calendar */}
        <div className="finance-card">
          {/* Calendar Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold">
              {months[currentMonth]} {currentYear}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for alignment */}
              {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {monthData.map((day) => (
                <div
                  key={day.day}
                  onClick={() => handleDayClick(day)}
                  className={`calendar-day p-2 ${getStatusClass(day.status)}`}
                >
                  <span className="font-semibold">{day.day}</span>
                  {day.status !== 'future' && (
                    <span className="text-xs mt-1">
                      {formatCurrency(day.sales).replace('R$', '')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded calendar-day-processed" />
                <span className="text-muted-foreground">Processado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded calendar-day-pending" />
                <span className="text-muted-foreground">Pendente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded calendar-day-future" />
                <span className="text-muted-foreground">Futuro</span>
              </div>
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
