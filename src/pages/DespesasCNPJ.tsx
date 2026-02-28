import { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  MoreVertical,
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
  Pencil
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Expense } from '@/contexts/FinanceContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

const StatusBadge = ({ status }: { status: Expense['status'] }) => {
  switch (status) {
    case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-500';
  }
};

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
    case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
    default: return 'bg-slate-50 text-slate-500';
  }
}

function DespesasCNPJContent() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpenseAsPaid
  } = useFinance();
  const { toast } = useToast();
  // useSidebar is now safe because this component is rendered inside MainLayout's SidebarProvider
  const { toggleSidebar } = useSidebar();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: '',
    status: 'pending' as Expense['status'],
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.value, 0);
    const paid = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.value, 0);
    const pending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.value, 0);
    const overdue = expenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + e.value, 0);

    return [
      { label: 'TOTAL DE DESPESAS', value: formatCurrency(total), Icon: Wallet, color: 'text-slate-400', bg: 'bg-slate-50' },
      { label: 'PAGO', value: formatCurrency(paid), Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
      { label: 'PENDENTE', value: formatCurrency(pending), Icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'ATRASADO', value: formatCurrency(overdue), Icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];
  }, [expenses]);

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
      setFormData({ name: '', value: '', dueDate: '', status: 'pending' });
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
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
      toast({ title: "Sucesso", description: "Despesa atualizada." });
    } else {
      addExpense(expenseData);
      toast({ title: "Sucesso", description: "Despesa criada." });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteExpense(id);
    toast({ title: "Excluída", description: "Despesa removida com sucesso." });
  };

  const handleMarkAsPaid = (id: number) => {
    markExpenseAsPaid(id);
    toast({ title: "Pago", description: "Despesa marcada como paga." });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-[#1A202C] antialiased pb-20 overflow-y-auto h-screen">
      {/* Cabeçalho Superior */}
      <header className="max-w-6xl mx-auto pt-12 px-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A]">Despesas Fixas CNPJ</h1>
        </div>
        <p className="text-slate-500 text-sm mb-8">Gerencie e monitore as suas contas fixas mensais</p>

        <div className="flex items-center gap-3 mb-12">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 bg-[#0F172A] text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
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
            <div key={idx} className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center text-center group transition-all hover:translate-y-[-2px]">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mb-4`}>
                <stat.Icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2 uppercase">{stat.label}</p>
              <h3 className="text-2xl font-bold text-[#0F172A]">{stat.value}</h3>
              <div className="mt-3 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 flex items-center gap-1">
                0% <ChevronRight className="w-2.5 h-2.5 rotate-[-45deg]" />
              </div>
            </div>
          ))}
        </section>

        {/* Listagem Centralizada */}
        <section className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Barra de Ferramentas da Tabela */}
          <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Despesas Registradas</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100 transition-colors">
                <Filter className="w-3.5 h-3.5" />
                fevereiro de 2026
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="Pesquisar despesa..."
                  className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all placeholder:text-slate-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-50">
                  <th className="px-10 py-5">Despesa</th>
                  <th className="px-8 py-5">Valor</th>
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-10 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-white group-hover:border-slate-200 transition-all">
                          {getInitials(expense.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0F172A] text-sm uppercase">{expense.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold tracking-tight">CNPJ MENSAL</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-[#0F172A] text-sm">
                      {formatCurrency(expense.value)}
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {formatDate(expense.dueDate)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                        statusBadgeStyles(expense.status)
                      )}>
                        {getStatusLabel(expense.status)}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {expense.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(expense.id)}
                            className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                            title="Marcar como Pago"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDialog(expense)}
                          className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-12 text-center text-slate-400 italic">
                      Nenhuma despesa encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-10 py-6 flex items-center justify-center gap-6 border-t border-slate-50">
            <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(p => (
                <span key={p} className={`w-2 h-2 rounded-full ${p === 1 ? 'bg-blue-500' : 'bg-slate-200'}`} />
              ))}
            </div>
            <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Informação do Rodapé */}
        <section className="bg-white/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center gap-3">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] text-slate-500 font-medium">
            Registo diário de despesas e conciliação bancária automática <span className="text-blue-500 cursor-pointer">ⓘ</span>
          </p>
        </section>
      </main>

      {/* Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Preencha os detalhes do pagamento</p>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form className="px-8 pb-8 space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>

              {/* Nome da Despesa */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Nome da Despesa
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Tag size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Aluguel, Internet..."
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 placeholder:text-slate-400"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Valor e Data (Grid) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Valor
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <DollarSign size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="R$ 0,00"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-medium"
                      value={formData.value}
                      onChange={handleAmountChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                    Vencimento
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Calendar size={18} />
                    </div>
                    <input
                      type="date"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Status Select Personalizado */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Status do Pagamento
                </label>
                <div className="relative">
                  <select
                    className="w-full appearance-none pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Expense['status'] })}
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Atrasado</option>
                  </select>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    {formData.status === 'paid' ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Clock size={18} className={formData.status === 'overdue' ? 'text-rose-500' : 'text-amber-500'} />
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
                  className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] px-6 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  {editingExpense ? 'Salvar Alterações' : 'Criar Despesa'}
                </button>
              </div>
            </form>
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
