import { useState, useMemo } from 'react';
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  X,
  Search,
  Filter,
  TrendingUp,
  Edit2,
  Check
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinance, Boleto } from '@/contexts/FinanceContext';
import { toast } from 'sonner';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDate } from '@/lib/formatters';

const Boletos = () => {
  const { boletos, addBoleto, updateBoleto, deleteBoleto, markBoletoAsPaid } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: '',
    status: 'pending' as Boleto['status']
  });

  // Métricas
  const metrics = useMemo(() => {
    const total = boletos.reduce((acc, curr) => acc + curr.value, 0);
    const pago = boletos.filter(b => b.status === 'paid').reduce((acc, curr) => acc + curr.value, 0);
    const pendente = boletos.filter(b => b.status === 'pending').reduce((acc, curr) => acc + curr.value, 0);
    const atrasado = boletos.filter(b => b.status === 'overdue').reduce((acc, curr) => acc + curr.value, 0);
    return { total, pago, pendente, atrasado };
  }, [boletos]);

  const filteredBoletos = boletos.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleOpenModal = (boleto?: Boleto) => {
    if (boleto) {
      setEditingBoleto(boleto);
      setFormData({
        name: boleto.name,
        value: boleto.value.toString(),
        dueDate: boleto.dueDate.split('T')[0],
        status: boleto.status,
      });
    } else {
      setEditingBoleto(null);
      setFormData({ name: '', value: '', dueDate: '', status: 'pending' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.value || !formData.dueDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const boletoData = {
      name: formData.name,
      value: parseFloat(formData.value) || 0,
      dueDate: formData.dueDate,
      status: formData.status,
    };

    if (editingBoleto) {
      updateBoleto(editingBoleto.id, boletoData);
      toast.success("Boleto atualizado com sucesso.");
    } else {
      addBoleto(boletoData);
      toast.success("Boleto cadastrado com sucesso.");
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteBoleto(id);
    toast.success("Boleto excluído com sucesso.");
  };

  const handleMarkAsPaid = (id: number) => {
    markBoletoAsPaid(id);
    toast.success("Boleto marcado como pago.");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent p-0 font-sans text-slate-100 selection:bg-blue-900/50 animate-fade-in pb-8">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em]">
              <TrendingUp size={16} />
              Finanças
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Boletos</h1>
            <p className="text-slate-400 text-lg font-medium">Gerencie suas contas a pagar com facilidade.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-full font-bold active:scale-95 transition-all shadow-lg shadow-blue-600/15 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Boleto
          </button>
        </header>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Acumulado" value={formatCurrency(metrics.total)} icon={FileText} />
          <StatCard title="Total Pago" value={formatCurrency(metrics.pago)} icon={CheckCircle2} variant="success" />
          <StatCard title="Aguardando" value={formatCurrency(metrics.pendente)} icon={Clock} variant="warning" />
          <StatCard title="Vencidos" value={formatCurrency(metrics.atrasado)} icon={AlertCircle} variant="danger" />
        </div>

        {/* Main Container */}
        <main className="glass-panel rounded-[28px] overflow-hidden border border-slate-900/50 shadow-xl">
          {/* Table Filters */}
          <div className="p-8 border-b border-slate-900/60 flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-transparent">
            <div className="relative flex-1 max-w-lg group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Pesquisar fatura..."
                className="w-full pl-12 pr-4 py-3.5 rounded-full border border-slate-800 bg-slate-900/60 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-white font-medium placeholder:text-slate-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-3.5 border border-slate-800 bg-slate-900/60 text-slate-300 rounded-full hover:bg-slate-800 font-bold transition-all active:scale-95">
                <Filter size={18} />
                Filtrar
              </button>
            </div>
          </div>

          {/* Custom Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/20">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-900/60">Descrição do Lançamento</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-900/60">Valor Nominal</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-900/60">Vencimento</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-900/60">Status</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-900/60 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredBoletos.length > 0 ? (
                  filteredBoletos.map((boleto) => (
                    <tr key={boleto.id} className="hover:bg-slate-900/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:border-slate-600 transition-all">
                            <FileText size={18} />
                          </div>
                          <span className="font-bold text-white uppercase">{boleto.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-white font-bold">{formatCurrency(boleto.value)}</td>
                      <td className="px-8 py-6 text-slate-400 font-medium">{formatDate(boleto.dueDate)}</td>
                      <td className="px-8 py-6">
                        <StatusBadge status={boleto.status as 'pending' | 'paid' | 'overdue'} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {boleto.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkAsPaid(boleto.id)}
                              className="p-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all"
                              title="Marcar como Pago"
                            >
                              <Check size={20} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(boleto)}
                            className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(boleto.id)}
                            className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-slate-900/60 border border-slate-800 rounded-[2rem] flex items-center justify-center text-slate-500">
                          <Search size={40} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-white font-bold text-xl">Nenhum boleto encontrado</p>
                          <p className="text-slate-400">Tente ajustar sua busca ou adicione um novo registro.</p>
                        </div>
                        <button
                          onClick={() => handleOpenModal()}
                          className="mt-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-500 hover:text-white transition-all"
                        >
                          Adicionar agora
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>

        {/* Modal Novo/Editar Boleto */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative glass-panel w-full max-w-xl rounded-[28px] border border-slate-900/50 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 font-sans p-0">
              <div className="p-10 border-b border-slate-900/60 flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">
                    {editingBoleto ? 'Editar Registro' : 'Novo Registro'}
                  </h2>
                  <p className="text-slate-400 font-medium">Preencha os dados da fatura abaixo.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-2xl hover:bg-slate-800 transition-all">
                  <X size={28} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Descrição</label>
                  <input
                    required
                    type="text"
                    className="w-full px-6 py-4 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                    placeholder="Ex: Conta de Luz Março/2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest text-center block">Valor (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-6 py-4 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-bold"
                      placeholder="0,00"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest text-center block">Vencimento</label>
                    <input
                      required
                      type="date"
                      className="w-full px-6 py-4 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Status Inicial</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['pending', 'paid', 'overdue'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={`py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-all border-2 ${formData.status === status
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg scale-105'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                      >
                        {status === 'paid' ? 'Pago' : status === 'pending' ? 'Pendente' : 'Atrasado'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    Salvar Lançamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Boletos;
