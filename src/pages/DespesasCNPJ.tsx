import { useState, useMemo } from 'react';
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
  Pencil
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Expense } from '@/contexts/FinanceContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

function DespesasCNPJContent() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpenseAsPaid
  } = useFinance();

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
      { label: 'TOTAL DE DESPESAS', value: formatCurrency(total), Icon: Wallet, color: 'text-slate-400', bg: 'bg-slate-900/60 border border-slate-800' },
      { label: 'PAGO', value: formatCurrency(paid), Icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
      { label: 'PENDENTE', value: formatCurrency(pending), Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20' },
      { label: 'ATRASADO', value: formatCurrency(overdue), Icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/20' },
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-100 antialiased pb-20 overflow-y-auto">
      {/* Cabeçalho Superior */}
      <header className="max-w-6xl mx-auto pt-12 px-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Despesas Fixas CNPJ</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">Gerencie e monitore as suas contas fixas mensais</p>

        <div className="flex items-center gap-3 mb-12">
          <button className="flex items-center gap-2 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700/80 text-slate-300 hover:text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-slate-50 transition-all shadow-sm">
            <FileText className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-lg shadow-blue-600/15"
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
              <div className="mt-3 px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-bold text-slate-500 flex items-center gap-1">
                0% <ChevronRight className="w-2.5 h-2.5 rotate-[-45deg]" />
              </div>
            </div>
          ))}
        </section>

        {/* Listagem Centralizada */}
        <section className="glass-panel rounded-[28px] p-0 shadow-xl overflow-hidden border border-slate-900/50">
          {/* Barra de Ferramentas da Tabela */}
          <div className="px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-900/60">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white">Despesas Registradas</h2>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 cursor-pointer hover:bg-slate-800 transition-colors">
                <Filter className="w-3.5 h-3.5" />
                Fevereiro de 2026
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-900/60">
                  <th className="px-10 py-5">Despesa</th>
                  <th className="px-8 py-5">Valor</th>
                  <th className="px-8 py-5">Data</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-10 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredExpenses.map((expense) => (
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
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
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
                    <td colSpan={5} className="px-10 py-12 text-center text-slate-500 italic">
                      Nenhuma despesa encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-10 py-6 flex items-center justify-center gap-6 border-t border-slate-900/60">
            <button className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(p => (
                <span key={p} className={`w-2 h-2 rounded-full ${p === 1 ? 'bg-blue-500' : 'bg-slate-800'}`} />
              ))}
            </div>
            <button className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* Informação do Rodapé */}
        <section className="glass-panel border border-slate-900/50 rounded-2xl p-4 flex items-center justify-center gap-3">
          <Settings2 className="w-4 h-4 text-slate-400" />
          <p className="text-[11px] text-slate-400 font-medium">
            Registo diário de despesas e conciliação bancária automática <span className="text-blue-500 cursor-pointer">ⓘ</span>
          </p>
        </section>
      </main>

      {/* Modal */}
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
