import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Search,
  Filter,
  Layers,
  Clock,
  Menu,
  AlertCircle,
  LayoutDashboard,
  X,
  Calendar,
  DollarSign,
  Tag,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Expense } from '@/contexts/FinanceContext';
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useEffect } from 'react';

// Local StatusBadge Component
const StatusBadge = ({ status }: { status: Expense['status'] }) => {
  const styles = {
    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    overdue: 'bg-rose-100 text-rose-700 border-rose-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const labels = {
    paid: 'Pago',
    overdue: 'Atrasado',
    pending: 'Pendente',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[11px] font-bold border inline-block",
      styles[status]
    )}>
      {labels[status]}
    </span>
  );
};

// Local StatCard Component
const StatCard = ({ title, value, icon: Icon, color, bg, progress = 0 }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className={cn("text-2xl font-bold mt-1", color)}>{value}</h3>
      </div>
      <div className={cn(bg, "p-3 rounded-2xl")}>
        <Icon className={color} size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className={cn("h-full opacity-40 transition-all duration-500", color.replace('text-', 'bg-'))}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  </div>
);

// Header component to use useSidebar hook correctly within MainLayout's SidebarProvider
const PageHeader = ({
  isDialogOpen,
  setIsDialogOpen,
  handleOpenDialog,
  searchQuery,
  setSearchQuery,
  editingExpense,
  formData,
  setFormData,
  handleSave
}: any) => {
  const { toggleSidebar } = useSidebar();

  // Formata o valor para moeda BRL enquanto o usuário digita
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const amount = Number(rawValue) / 100;

    // Store localized string in formData.value for display
    const formatted = amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    setFormData({ ...formData, value: formatted });
  };

  // Format initial value if editing
  useEffect(() => {
    if (isDialogOpen && editingExpense && formData.value && !formData.value.includes('R$')) {
      const amount = Number(formData.value);
      const formatted = amount.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      setFormData(prev => ({ ...prev, value: formatted }));
    }
  }, [isDialogOpen, editingExpense]);


  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Despesas Fixas CNPJ</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group hidden md:block text-slate-800">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Pesquisar despesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 rounded-xl text-sm w-64 transition-all outline-none"
          />
        </div>

        <button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus size={18} />
          Nova Despesa
        </button>

        {/* Custom Modal Implementation */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
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
              <form className="px-8 pb-8 space-y-6">

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
                        {/* <span className="font-semibold text-sm">R$</span> */}
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
                    type="button"
                    onClick={() => handleSave()}
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
    </header>
  );
};

export default function DespesasCNPJ() {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpenseAsPaid
  } = useFinance();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: '',
    status: 'pending' as Expense['status'],
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery]);

  const metrics = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.value, 0);
    const paid = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.value, 0);
    const pending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.value, 0);
    const overdue = expenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + e.value, 0);

    return {
      total,
      paid,
      pending,
      overdue,
      paidProgress: total > 0 ? (paid / total) * 100 : 0,
      pendingProgress: total > 0 ? (pending / total) * 100 : 0,
      overdueProgress: total > 0 ? (overdue / total) * 100 : 0,
      totalProgress: 100
    };
  }, [expenses]);

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        name: expense.name,
        value: expense.value.toString(),
        dueDate: expense.dueDate,
        status: expense.status,
      });
    } else {
      setEditingExpense(null);
      setFormData({ name: '', value: '', dueDate: '', status: 'pending' });
    }
    setIsDialogOpen(true);
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

    // Parse formatted currency string back to number
    // Remove all non-numeric characters except comma (if needed) or just remove everything non-digit and divide by 100
    // The mask used was: rawValue / 100. So we can just strip non-digits and divide by 100.
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

  return (
    <MainLayout>
      <div className="flex h-full flex-col bg-[#F8FAFC]">
        <PageHeader
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
          handleOpenDialog={handleOpenDialog}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          editingExpense={editingExpense}
          formData={formData}
          setFormData={setFormData}
          handleSave={handleSave}
        />

        <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Despesas"
              value={formatCurrency(metrics.total)}
              icon={LayoutDashboard}
              color="text-slate-600"
              bg="bg-slate-50"
              progress={metrics.totalProgress}
            />
            <StatCard
              title="Pago"
              value={formatCurrency(metrics.paid)}
              icon={CheckCircle}
              color="text-emerald-600"
              bg="bg-emerald-50"
              progress={metrics.paidProgress}
            />
            <StatCard
              title="Pendente"
              value={formatCurrency(metrics.pending)}
              icon={Clock}
              color="text-amber-600"
              bg="bg-amber-50"
              progress={metrics.pendingProgress}
            />
            <StatCard
              title="Atrasado"
              value={formatCurrency(metrics.overdue)}
              icon={AlertCircle}
              color="text-rose-600"
              bg="bg-rose-50"
              progress={metrics.overdueProgress}
            />
          </div>

          {/* Alert Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Layers size={20} />
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              <span className="font-bold text-blue-900">Integração automática:</span> O total de despesas pendentes + atrasadas é sincronizado com as
              <span className="font-bold text-blue-900 mx-1 border-b border-blue-200">Configurações DRE</span>. Ao marcar como pago, o valor é deduzido.
            </p>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-slate-800 text-lg">Listagem Detalhada</h3>
              <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                <Filter size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest whitespace-nowrap">Despesa</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest text-right whitespace-nowrap">Valor</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest whitespace-nowrap">Vencimento</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest whitespace-nowrap">Status</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-400 border-b border-slate-100 uppercase tracking-widest text-center whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                      <td className="px-6 py-5">
                        <span className="font-bold text-slate-700 block text-sm">{expense.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CNPJ Mensal</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-mono font-bold text-slate-700 text-sm">
                          {formatCurrency(expense.value)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                          <Clock size={16} className="text-slate-400" />
                          {formatDate(expense.dueDate)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={expense.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          {expense.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(expense.id)}
                              title="Pagar"
                              className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDialog(expense)}
                            title="Editar"
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            title="Excluir"
                            className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                        Nenhuma despesa encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 font-medium">
              <p>Exibindo <span className="text-slate-700 font-bold">{filteredExpenses.length}</span> registros</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-slate-200 rounded-xl bg-white disabled:opacity-50 transition-all hover:bg-slate-50" disabled>Anterior</button>
                <button className="px-4 py-2 border border-slate-200 rounded-xl bg-white transition-all hover:bg-slate-50">Próximo</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
