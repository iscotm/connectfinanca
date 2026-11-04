import { useState, useMemo, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  Calendar,
  Settings2,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Tag,
  DollarSign,
  Pencil,
  Copy,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Loader2,
  Layers,
  Info
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Expense } from '@/contexts/FinanceContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTH_NAMES_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

const getStatusLabel = (status: Expense['status']) => {
  switch (status) {
    case 'paid': return 'Pago';
    case 'pending': return 'Pendente';
    case 'overdue': return 'Atrasado';
    default: return status;
  }
};

function statusBadgeStyles(status: Expense['status']) {
  switch (status) {
    case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'overdue': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default: return 'bg-slate-800 text-slate-400 border-transparent';
  }
}

function computeNextMonthDueDate(dueDateStr: string): string {
  if (!dueDateStr) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  const [yearStr, monthStr, dayStr] = dueDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12
  const day = parseInt(dayStr, 10);

  let nextYear = year;
  let nextMonth = month + 1; // 2-13
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear += 1;
  }

  // Obter o último dia válido do mês seguinte (ex: 28/29 para fev, 30 para abr)
  const maxDays = new Date(nextYear, nextMonth, 0).getDate();
  const adjustedDay = Math.min(day, maxDays);

  const yyyy = nextYear.toString();
  const mm = String(nextMonth).padStart(2, '0');
  const dd = String(adjustedDay).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

function DespesasCNPJContent() {
  const {
    expenses,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
    markExpenseAsPaid
  } = useFinance();

  // Estados de Modais
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [navigateAfterDuplicate, setNavigateAfterDuplicate] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Itens para duplicação com exclusão e ajuste de valor
  interface DuplicateExpenseItem {
    id: number;
    name: string;
    originalValue: number;
    value: number;
    formattedValue: string;
    originalDueDate: string;
    dueDate: string;
    included: boolean;
  }
  const [duplicateItems, setDuplicateItems] = useState<DuplicateExpenseItem[]>([]);

  // Filtro de Mês e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isCustomPickerView, setIsCustomPickerView] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mês e Ano Selecionados (0-11, ano)
  const [selectedMonthYear, setSelectedMonthYear] = useState<{ month: number; year: number }>(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

  // Ano de navegação no seletor customizado
  const [customYear, setCustomYear] = useState<number>(() => selectedMonthYear.year);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMonthDropdownOpen(false);
        setIsCustomPickerView(false);
      }
    }
    if (isMonthDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthDropdownOpen]);

  // Redefinir página para 1 quando o filtro ou busca mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonthYear, searchTerm]);

  // Lista dos últimos 3 meses (Mês atual e os 2 meses anteriores)
  const quickMonths = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        isCurrent: i === 0,
      });
    }
    return list;
  }, []);

  const isSelectedInQuick = useMemo(() => {
    return quickMonths.some(
      qm => qm.month === selectedMonthYear.month && qm.year === selectedMonthYear.year
    );
  }, [quickMonths, selectedMonthYear]);

  const selectedMonthLabel = `${MONTH_NAMES[selectedMonthYear.month]} ${selectedMonthYear.year}`;

  // Próximo mês calculado para duplicação
  const nextMonthYear = useMemo(() => {
    let nextMonth = selectedMonthYear.month + 1;
    let nextYear = selectedMonthYear.year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    return {
      month: nextMonth,
      year: nextYear,
      label: `${MONTH_NAMES[nextMonth]} ${nextYear}`
    };
  }, [selectedMonthYear]);

  // Despesas pertencentes ao mês atualmente selecionado
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.dueDate) return false;
      const [y, m] = e.dueDate.split('-').map(Number);
      return (m - 1) === selectedMonthYear.month && y === selectedMonthYear.year;
    });
  }, [expenses, selectedMonthYear]);

  // Despesas já existentes no próximo mês
  const nextMonthExistingExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.dueDate) return false;
      const [y, m] = e.dueDate.split('-').map(Number);
      return (m - 1) === nextMonthYear.month && y === nextMonthYear.year;
    });
  }, [expenses, nextMonthYear]);

  // Despesas filtradas por termo de busca
  const filteredExpenses = useMemo(() => {
    if (!searchTerm.trim()) return currentMonthExpenses;
    const lower = searchTerm.toLowerCase();
    return currentMonthExpenses.filter(e => e.name.toLowerCase().includes(lower));
  }, [currentMonthExpenses, searchTerm]);

  // Paginação aplicada
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE));
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  // Métricas do Mês
  const metrics = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.value, 0);
    const paid = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.value, 0);
    const pending = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.value, 0);
    const overdue = filteredExpenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + e.value, 0);

    const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
    const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;
    const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;

    return [
      {
        label: 'TOTAL DE DESPESAS',
        value: formatCurrency(total),
        badgeText: `${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'conta' : 'contas'}`,
        Icon: Wallet,
        color: 'text-slate-400',
        bg: 'bg-slate-900/60 border border-slate-800'
      },
      {
        label: 'PAGO',
        value: formatCurrency(paid),
        badgeText: `${paidPct}% do total`,
        Icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border border-emerald-500/20'
      },
      {
        label: 'PENDENTE',
        value: formatCurrency(pending),
        badgeText: `${pendingPct}% do total`,
        Icon: Clock,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border border-amber-500/20'
      },
      {
        label: 'ATRASADO',
        value: formatCurrency(overdue),
        badgeText: `${overduePct}% do total`,
        Icon: AlertCircle,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border border-rose-500/20'
      },
    ];
  }, [filteredExpenses]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: '',
    status: 'pending' as Expense['status'],
  });

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        value: expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        dueDate: expense.dueDate,
        status: expense.status,
      });
    } else {
      setEditingExpense(null);
      // Data padrão ajustada para o mês selecionado
      const defDay = '10';
      const defMonth = String(selectedMonthYear.month + 1).padStart(2, '0');
      const defDate = `${selectedMonthYear.year}-${defMonth}-${defDay}`;
      setFormData({ name: '', value: '', dueDate: defDate, status: 'pending' });
    }
    setIsDialogOpen(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const amount = Number(rawValue) / 100;
    const formatted = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    setFormData({ ...formData, value: formatted });
  };

  const handleSave = () => {
    if (!formData.name || !formData.value || !formData.dueDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const rawValue = formData.value.toString().replace(/\D/g, '');
    const numericValue = parseFloat(rawValue) / 100;

    const expenseData = {
      name: formData.name,
      value: numericValue || 0,
      dueDate: formData.dueDate,
      status: formData.status,
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
      toast.success("Despesa atualizada com sucesso!");
    } else {
      addExpense(expenseData);
      toast.success("Despesa criada com sucesso!");
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteExpense(id);
    toast.success("Despesa removida com sucesso.");
  };

  const handleMarkAsPaid = (id: number) => {
    markExpenseAsPaid(id);
    toast.success("Despesa marcada como paga.");
  };

  const isDueToday = (dueDateStr: string) => {
    if (!dueDateStr) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return dueDateStr === todayStr;
  };

  const handleAddDays = (id: number, currentDueDate: string, days: number) => {
    const [year, month, day] = currentDueDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const newDueDate = `${yyyy}-${mm}-${dd}`;
    updateExpense(id, { dueDate: newDueDate });
    toast.success(`Vencimento adiado em ${days} dias.`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Exportar dados para CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      toast.info("Nenhuma despesa para exportar.");
      return;
    }
    const headers = ["Nome", "Valor", "Vencimento", "Status"];
    const rows = filteredExpenses.map(e => [
      `"${e.name.replace(/"/g, '""')}"`,
      e.value.toFixed(2),
      e.dueDate,
      getStatusLabel(e.status)
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `despesas_fixas_${selectedMonthLabel.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Despesas exportadas com sucesso!");
  };

  // Abrir Modal de Duplicação e inicializar lista editável
  const handleOpenDuplicateDialog = () => {
    if (currentMonthExpenses.length === 0) {
      toast.info(`Não há despesas em ${selectedMonthLabel} para duplicar.`);
      return;
    }

    const items: DuplicateExpenseItem[] = currentMonthExpenses.map(e => ({
      id: e.id,
      name: e.name,
      originalValue: e.value,
      value: e.value,
      formattedValue: e.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      originalDueDate: e.dueDate,
      dueDate: computeNextMonthDueDate(e.dueDate),
      included: true,
    }));

    setDuplicateItems(items);
    setIsDuplicateDialogOpen(true);
  };

  const handleToggleIncludeItem = (id: number) => {
    setDuplicateItems(prev => prev.map(item =>
      item.id === id ? { ...item, included: !item.included } : item
    ));
  };

  const handleExcludeItem = (id: number) => {
    setDuplicateItems(prev => prev.map(item =>
      item.id === id ? { ...item, included: false } : item
    ));
  };

  const handleIncludeAll = (include: boolean) => {
    setDuplicateItems(prev => prev.map(item => ({ ...item, included: include })));
  };

  const handleItemValueChange = (id: number, rawInput: string) => {
    const digits = rawInput.replace(/\D/g, '');
    const num = Number(digits) / 100;
    const formatted = num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    setDuplicateItems(prev => prev.map(item =>
      item.id === id ? { ...item, value: num, formattedValue: formatted } : item
    ));
  };

  const includedDuplicateItems = useMemo(() => {
    return duplicateItems.filter(item => item.included);
  }, [duplicateItems]);

  const totalDuplicateValue = useMemo(() => {
    return includedDuplicateItems.reduce((sum, item) => sum + item.value, 0);
  }, [includedDuplicateItems]);

  // Executar Duplicação para o Próximo Mês com as despesas e valores ajustados
  const handleDuplicateExpenses = async () => {
    if (includedDuplicateItems.length === 0) {
      toast.error('Selecione ao menos uma despesa para duplicar.');
      return;
    }
    setIsDuplicating(true);

    try {
      const duplicatedList = includedDuplicateItems.map(item => ({
        name: item.name,
        value: item.value,
        dueDate: item.dueDate,
        status: 'pending' as const,
      }));

      const success = await addExpenses(duplicatedList);

      if (success) {
        toast.success(
          `${duplicatedList.length} despesa(s) duplicada(s) para ${nextMonthYear.label} com sucesso!`
        );
        setIsDuplicateDialogOpen(false);

        if (navigateAfterDuplicate) {
          setSelectedMonthYear({
            month: nextMonthYear.month,
            year: nextMonthYear.year
          });
        }
      }
    } catch (error) {
      console.error('Erro ao duplicar despesas:', error);
      toast.error('Ocorreu um erro ao duplicar as despesas. Tente novamente.');
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-100 antialiased pb-20 overflow-y-auto">
      {/* Cabeçalho Superior */}
      <header className="max-w-6xl mx-auto pt-12 px-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Despesas Fixas CNPJ</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">Gerencie e monitore as suas contas fixas mensais</p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm group"
            title="Exportar despesas em formato CSV"
          >
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
            Exportar
          </button>

          <button
            onClick={handleOpenDuplicateDialog}
            className="flex items-center gap-2 bg-slate-900/60 hover:bg-slate-800/80 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 hover:text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm group"
            title={`Duplicar todas as ${currentMonthExpenses.length} despesas deste mês para o mês seguinte`}
          >
            <Copy className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            Duplicar para Próximo Mês
            {currentMonthExpenses.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[10px] font-bold">
                {currentMonthExpenses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-7 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nova Despesa
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 space-y-8">

        {/* Grelha de Estatísticas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((stat, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-[28px] border border-slate-900/50 shadow-xl glass-card-hover flex flex-col items-center text-center group transition-all">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mb-4`}>
                <stat.Icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2 uppercase">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
              <div className="mt-3 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                {stat.badgeText}
              </div>
            </div>
          ))}
        </section>

        {/* Listagem Centralizada */}
        <section className="glass-panel rounded-[28px] p-0 shadow-xl overflow-hidden border border-slate-900/50">
          {/* Barra de Ferramentas da Tabela */}
          <div className="px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-900/60">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <h2 className="text-lg font-bold text-white">Despesas Registradas</h2>

              {/* Seletor Otimizado de Meses (Últimos 3 meses + Personalizado) */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthDropdownOpen(!isMonthDropdownOpen);
                    setIsCustomPickerView(false);
                    setCustomYear(selectedMonthYear.year);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 bg-slate-900/70 border rounded-xl text-xs font-semibold cursor-pointer transition-all select-none shadow-sm",
                    isMonthDropdownOpen
                      ? "border-blue-500/50 text-white bg-slate-800/80 ring-2 ring-blue-500/20"
                      : "border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800/60"
                  )}
                >
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  <span>{selectedMonthLabel}</span>
                  {!isSelectedInQuick && (
                    <span className="text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                      Personalizado
                    </span>
                  )}
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isMonthDropdownOpen && "rotate-180 text-blue-400")} />
                </button>

                {/* Dropdown Menu */}
                {isMonthDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-[#0c1222] border border-[#1d283f] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
                    {!isCustomPickerView ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-2 pt-1 pb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Últimos 3 meses
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Filtro rápido</span>
                        </div>

                        {/* Lista dos 3 últimos meses */}
                        <div className="space-y-1">
                          {quickMonths.map((qm) => {
                            const isSelected = selectedMonthYear.month === qm.month && selectedMonthYear.year === qm.year;
                            return (
                              <button
                                key={qm.label}
                                onClick={() => {
                                  setSelectedMonthYear({ month: qm.month, year: qm.year });
                                  setIsMonthDropdownOpen(false);
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2.5 text-xs rounded-xl transition-all flex items-center justify-between group",
                                  isSelected
                                    ? "bg-blue-600/15 text-blue-300 font-bold border border-blue-500/30"
                                    : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{qm.label}</span>
                                  {qm.isCurrent && (
                                    <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                                      Atual
                                    </span>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-blue-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Mês customizado selecionado anteriormente (caso não esteja nos 3 últimos) */}
                        {!isSelectedInQuick && (
                          <div className="pt-2">
                            <div className="h-px bg-slate-800/80 mb-2" />
                            <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Mês Selecionado
                            </div>
                            <div className="px-3 py-2 text-xs rounded-xl bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30 flex items-center justify-between">
                              <span>{selectedMonthLabel}</span>
                              <Check className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                          </div>
                        )}

                        <div className="h-px bg-slate-800/80 my-2" />

                        {/* Botão Personalizado */}
                        <button
                          onClick={() => {
                            setCustomYear(selectedMonthYear.year);
                            setIsCustomPickerView(true);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs rounded-xl hover:bg-slate-800/70 text-indigo-400 hover:text-indigo-300 font-semibold transition-all flex items-center justify-between group border border-transparent hover:border-indigo-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Personalizado...</span>
                          </div>
                          <span className="text-xs text-slate-500 group-hover:translate-x-0.5 transition-transform">
                            &rarr;
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* Painel Personalizado */
                      <div className="space-y-3 p-1 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => setIsCustomPickerView(false)}
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors py-1 px-1 rounded-lg hover:bg-slate-800/50"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Voltar
                          </button>
                          <span className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                            Escolher Mês
                          </span>
                        </div>

                        {/* Navegador de Ano */}
                        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-xl px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setCustomYear(y => y - 1)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Ano anterior"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-extrabold text-sm text-white tracking-wide">
                            {customYear}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomYear(y => y + 1)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Próximo ano"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Grade 3x4 com os 12 meses */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          {MONTH_NAMES_SHORT.map((shortName, idx) => {
                            const isSelected = selectedMonthYear.month === idx && selectedMonthYear.year === customYear;
                            const now = new Date();
                            const isCurrentRealMonth = now.getMonth() === idx && now.getFullYear() === customYear;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedMonthYear({ month: idx, year: customYear });
                                  setIsCustomPickerView(false);
                                  setIsMonthDropdownOpen(false);
                                  toast.info(`Exibindo despesas de ${MONTH_NAMES[idx]} de ${customYear}`);
                                }}
                                className={cn(
                                  "py-2 px-1 text-xs font-semibold rounded-xl transition-all relative",
                                  isSelected
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-bold"
                                    : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/60"
                                )}
                              >
                                {shortName}
                                {isCurrentRealMonth && !isSelected && (
                                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Atalho para o Mês Atual */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setSelectedMonthYear({ month: now.getMonth(), year: now.getFullYear() });
                              setCustomYear(now.getFullYear());
                              setIsCustomPickerView(false);
                              setIsMonthDropdownOpen(false);
                            }}
                            className="w-full text-center py-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl"
                          >
                            Ir para Mês Atual
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botão contextual para Duplicar diretamente ao lado do filtro */}
              <button
                onClick={handleOpenDuplicateDialog}
                disabled={currentMonthExpenses.length === 0}
                title={currentMonthExpenses.length === 0 ? "Nenhuma despesa para duplicar neste mês" : `Duplicar todas as ${currentMonthExpenses.length} despesas para ${nextMonthYear.label}`}
                className={cn(
                  "hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm",
                  currentMonthExpenses.length > 0
                    ? "bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 hover:text-white border-indigo-500/30 hover:border-indigo-500/50"
                    : "bg-slate-900/40 text-slate-600 border-slate-800/50 cursor-not-allowed opacity-60"
                )}
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Duplicar para {MONTH_NAMES_SHORT[nextMonthYear.month]}</span>
              </button>
            </div>

            {/* Barra de Busca */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar despesa..."
                  className="w-full pl-11 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-white placeholder:text-slate-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Tabela de Despesas */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-900/60">
                  <th className="px-10 py-5">Despesa</th>
                  <th className="px-8 py-5">Valor</th>
                  <th className="px-8 py-5">Data de Vencimento</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-10 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {paginatedExpenses.map((expense) => (
                  <tr key={expense.id} className="group hover:bg-slate-900/20 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-600 transition-all">
                          {getInitials(expense.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm uppercase">{expense.name}</span>
                          <span className="text-[10px] text-slate-500 font-bold tracking-tight">CNPJ MENSAL</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-white text-sm">
                      {formatCurrency(expense.value)}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                        {formatDate(expense.dueDate)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider",
                        statusBadgeStyles(expense.status)
                      )}>
                        {getStatusLabel(expense.status)}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {expense.status !== 'paid' && (isDueToday(expense.dueDate) || expense.status === 'overdue') && (
                          <>
                            <button
                              onClick={() => handleAddDays(expense.id, expense.dueDate, 3)}
                              className="px-2 py-1 text-[10px] font-black bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all"
                              title="Adicionar 3 dias de prazo"
                            >
                              +3d
                            </button>
                            <button
                              onClick={() => handleAddDays(expense.id, expense.dueDate, 5)}
                              className="px-2 py-1 text-[10px] font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"
                              title="Adicionar 5 dias de prazo"
                            >
                              +5d
                            </button>
                          </>
                        )}
                        {expense.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(expense.id)}
                            className="p-2 text-slate-500 hover:text-emerald-400 transition-colors"
                            title="Marcar como Pago"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDialog(expense)}
                          className="p-2 text-slate-500 hover:text-blue-400 transition-colors"
                          title="Editar Despesa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Excluir Despesa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 font-semibold text-sm">
                          Nenhuma despesa encontrada para {selectedMonthLabel}.
                        </p>
                        <p className="text-xs text-slate-600 max-w-sm">
                          Você pode adicionar uma nova despesa ou duplicar as contas do mês anterior com apenas 1 clique.
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => handleOpenDialog()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-blue-600/20"
                          >
                            Criar Nova Despesa
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {filteredExpenses.length > ITEMS_PER_PAGE && (
            <div className="px-10 py-5 flex items-center justify-between border-t border-slate-900/60 bg-slate-950/20">
              <span className="text-xs text-slate-500">
                Mostrando <span className="font-bold text-slate-300">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a{' '}
                <span className="font-bold text-slate-300">{Math.min(currentPage * ITEMS_PER_PAGE, filteredExpenses.length)}</span> de{' '}
                <span className="font-bold text-slate-300">{filteredExpenses.length}</span> despesas
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-bold text-blue-400">{currentPage}</span>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs text-slate-500">{totalPages}</span>
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Informação do Rodapé */}
        <section className="glass-panel border border-slate-900/50 rounded-2xl p-4 flex items-center justify-center gap-3">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] text-slate-400 font-medium">
            Registo diário de despesas e conciliação bancária automática <span className="text-blue-500 cursor-pointer">ⓘ</span>
          </p>
        </section>
      </main>

      {/* Modal: Criar / Editar Despesa */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md glass-panel rounded-[28px] border border-slate-900/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                </h2>
                <p className="text-sm text-slate-400 mt-1">Preencha os detalhes do pagamento</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form className="px-8 pb-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {/* Nome da Despesa */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Nome da Despesa
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Tag size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Aluguel, Internet..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Valor e Data (Grid) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Valor
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                      <DollarSign size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                      value={formData.value}
                      onChange={handleAmountChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                    Vencimento
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                      <Calendar size={18} />
                    </div>
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Status Select Personalizado */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Status do Pagamento
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none pl-11 pr-10 py-3.5 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Expense['status'] })}
                  >
                    <option value="pending" className="bg-slate-950 text-white">Pendente</option>
                    <option value="paid" className="bg-slate-950 text-white">Pago</option>
                    <option value="overdue" className="bg-slate-950 text-white">Atrasado</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {formData.status === 'paid' ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Clock size={18} className={formData.status === 'overdue' ? 'text-rose-400' : 'text-amber-400'} />
                    )}
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-2xl hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  {editingExpense ? 'Salvar Alterações' : 'Criar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Duplicar Despesas para o Próximo Mês */}
      {isDuplicateDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg glass-panel rounded-[28px] border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    Duplicar Despesas Fixas
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Copiar contas para o mês seguinte
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDuplicateDialogOpen(false)}
                disabled={isDuplicating}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="px-8 py-6 space-y-6 overflow-y-auto">
              {/* Card Comparativo Origem -> Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
                {/* Origem */}
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mês de Origem
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {selectedMonthLabel}
                  </span>
                  <span className="text-xs text-indigo-400 font-semibold">
                    {currentMonthExpenses.length} {currentMonthExpenses.length === 1 ? 'despesa' : 'despesas'}
                  </span>
                </div>

                {/* Seta de Transição */}
                <div className="flex items-center justify-center p-2 rounded-full bg-slate-800/80 text-indigo-400 border border-slate-700/60 mx-auto">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Destino */}
                <div className="flex flex-col gap-1 text-center sm:text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mês de Destino
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {nextMonthYear.label}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {nextMonthExistingExpenses.length > 0 ? (
                      <span className="text-amber-400/90 font-semibold">
                        Já tem {nextMonthExistingExpenses.length} {nextMonthExistingExpenses.length === 1 ? 'conta' : 'contas'}
                      </span>
                    ) : (
                      'Nenhuma despesa ainda'
                    )}
                  </span>
                </div>
              </div>

              {/* Aviso Informativo */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs leading-relaxed">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  Todas as <strong className="text-white">{currentMonthExpenses.length}</strong> despesas serão geradas em{' '}
                  <strong className="text-white">{nextMonthYear.label}</strong> com os vencimentos ajustados para o mesmo dia e status inicial{' '}
                  <strong className="text-white">Pendente</strong>.
                </div>
              </div>

              {/* Lista Prévia das Despesas com Opção de Excluir e Ajustar Valor */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      Despesas ({includedDuplicateItems.length}/{duplicateItems.length})
                    </span>
                    <div className="flex items-center gap-1.5 ml-2 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleIncludeAll(true)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold transition-colors"
                      >
                        Todas
                      </button>
                      <span className="text-slate-600 text-[10px]">•</span>
                      <button
                        type="button"
                        onClick={() => handleIncludeAll(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 font-medium transition-colors"
                      >
                        Nenhuma
                      </button>
                    </div>
                  </div>

                  <span className="text-slate-400 text-[11px]">
                    Total:{' '}
                    <strong className="text-emerald-400 font-extrabold text-xs">
                      {formatCurrency(totalDuplicateValue)}
                    </strong>
                  </span>
                </div>

                {/* Container rolável com as contas */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-800/40 border border-slate-800/60 rounded-2xl bg-slate-950/50 p-2.5">
                  {duplicateItems.map((item) => {
                    const isModified = item.value !== item.originalValue;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl transition-all",
                          item.included
                            ? "bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80"
                            : "bg-slate-950/40 opacity-40 border border-transparent"
                        )}
                      >
                        {/* Checkbox + Nome + Datas */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={() => handleToggleIncludeItem(item.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer shrink-0"
                            title={item.included ? "Desmarcar para não duplicar" : "Marcar para duplicar"}
                          />
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-bold text-xs uppercase truncate max-w-[140px] sm:max-w-[180px]",
                                item.included ? "text-white" : "text-slate-500 line-through"
                              )}>
                                {item.name}
                              </span>
                              {isModified && item.included && (
                                <span className="text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded">
                                  Valor Ajustado
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                              {formatDate(item.originalDueDate)} <ArrowRight className="w-2.5 h-2.5 text-indigo-400 inline" /> {formatDate(item.dueDate)}
                            </span>
                          </div>
                        </div>

                        {/* Campo de Ajuste de Valor + Botão Excluir/Restaurar */}
                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <div className="relative">
                            <input
                              type="text"
                              value={item.formattedValue}
                              onChange={(e) => handleItemValueChange(item.id, e.target.value)}
                              disabled={!item.included}
                              title="Ajuste o valor para o próximo mês"
                              placeholder="R$ 0,00"
                              className={cn(
                                "w-28 px-2.5 py-1.5 rounded-xl text-right text-xs font-bold transition-all outline-none",
                                item.included
                                  ? "bg-slate-950 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white"
                                  : "bg-slate-900/60 border border-slate-800 text-slate-600 cursor-not-allowed"
                              )}
                            />
                          </div>

                          {item.included ? (
                            <button
                              type="button"
                              onClick={() => handleExcludeItem(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Excluir desta duplicação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleIncludeItem(item.id)}
                              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all"
                              title="Incluir na duplicação"
                            >
                              Restaurar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Opção: Navegar para o mês duplicado */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 cursor-pointer text-xs text-slate-300 select-none hover:bg-slate-900/70 transition-colors">
                <input
                  type="checkbox"
                  checked={navigateAfterDuplicate}
                  onChange={(e) => setNavigateAfterDuplicate(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Ir para <strong>{nextMonthYear.label}</strong> após a duplicação</span>
              </label>
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 px-8 pb-7 pt-3 border-t border-slate-900/80 bg-slate-950/30">
              <button
                type="button"
                onClick={() => setIsDuplicateDialogOpen(false)}
                disabled={isDuplicating}
                className="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-2xl hover:bg-slate-800 transition-all text-xs uppercase tracking-wider disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDuplicateExpenses}
                disabled={isDuplicating || includedDuplicateItems.length === 0}
                className="flex-[1.5] px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDuplicating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Duplicando...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Duplicar ({includedDuplicateItems.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DespesasCNPJ() {
  return (
    <MainLayout>
      <DespesasCNPJContent />
    </MainLayout>
  );
}
