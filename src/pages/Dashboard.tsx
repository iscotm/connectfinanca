import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  Download,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';

export default function Dashboard() {
  const { 
    expenses, 
    boletos, 
    dailySales, 
    totalExpensesPending, 
    totalBoletosPending,
    totalSalesMonth 
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

    // Get today's sales
    const todaySale = dailySales.find(
      s => s.day === today && s.month === currentMonth && s.year === currentYear
    );
    const vendidoHoje = todaySale?.totalLiquido || 0;

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

    // Count total sales entries
    const totalVendas = dailySales.filter(s => s.totalLiquido > 0).length;

    // Total expenses (CNPJ + Boletos)
    const totalDespesas = expenses.reduce((sum, e) => sum + e.value, 0) + 
                          boletos.reduce((sum, b) => sum + b.value, 0);

    // Paid today (expenses + boletos marked as paid today - simplified for now)
    const despesasPagas = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.value, 0);
    const boletosPagos = boletos.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.value, 0);

    // Pending amounts
    const despesasPendentes = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.value, 0);
    const boletosPendentes = boletos.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.value, 0);

    // Overdue amounts
    const despesasAtrasadas = expenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + e.value, 0);
    const boletosAtrasados = boletos.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.value, 0);

    // Available balance
    const saldoDisponivel = totalLiquido - (despesasPagas + boletosPagos);

    return {
      vendidoHoje,
      receita15dias,
      receita30dias,
      totalLiquido,
      totalVendas,
      totalDespesas,
      saldoDisponivel,
      despesasCnpjHoje: 0, // Would need date tracking
      boletosHoje: 0, // Would need date tracking
      totalLiquidoDia: vendidoHoje,
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">Visão geral financeira em tempo real</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button asChild size="sm">
              <Link to="/configuracoes-dre">
                <Settings className="h-4 w-4 mr-2" />
                Configurações DRE
              </Link>
            </Button>
          </div>
        </div>

        {/* Receitas Caixa */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Receitas Caixa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Vendido Hoje"
              value={formatCurrency(metrics.vendidoHoje)}
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
              icon={DollarSign}
              variant="success"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Despesas Pagas Hoje */}
          <section className="finance-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Resumo do Dia</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Despesas Pendentes</span>
                <span className="font-semibold text-warning">
                  {formatCurrency(metrics.despesasPendentes)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Despesas Atrasadas</span>
                <span className="font-semibold text-destructive">
                  {formatCurrency(metrics.despesasAtrasadas)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-sm font-medium text-foreground">Total Líquido do Dia</span>
                <span className="font-bold text-success">
                  {formatCurrency(metrics.totalLiquidoDia)}
                </span>
              </div>
            </div>
          </section>

          {/* Despesas Gerais do Mês */}
          <section className="finance-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Despesas Gerais do Mês</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Total (CNPJ + Boletos)</span>
                <span className="font-semibold">{formatCurrency(metrics.despesasMes)}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-success/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Processado</p>
                  <p className="font-semibold text-success text-sm">
                    {formatCurrency(metrics.despesasProcessadas)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Pendente</p>
                  <p className="font-semibold text-warning text-sm">
                    {formatCurrency(metrics.despesasPendentes)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Atrasado</p>
                  <p className="font-semibold text-destructive text-sm">
                    {formatCurrency(metrics.despesasAtrasadas)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Recent Expenses Table */}
        <section className="finance-card">
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Despesas Recentes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/despesas-cnpj">
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhuma despesa cadastrada ainda.
                    </td>
                  </tr>
                ) : (
                  recentExpenses.map((expense) => (
                    <tr key={`${expense.type}-${expense.id}`}>
                      <td className="font-medium">{expense.name}</td>
                      <td>{formatCurrency(expense.value)}</td>
                      <td>
                        <StatusBadge status={expense.status} />
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
