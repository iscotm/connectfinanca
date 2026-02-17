import { useState, useMemo } from 'react';
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  MoreHorizontal,
  X,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Edit2,
  Check
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinance, Boleto } from '@/contexts/FinanceContext';
import { useToast } from "@/components/ui/use-toast";

const Boletos = () => {
  const { boletos, addBoleto, updateBoleto, deleteBoleto, markBoletoAsPaid } = useFinance();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: '',
    status: 'pending' as Boleto['status']
  });

  // Cálculos de métricas baseados no contexto do sistema
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
        dueDate: boleto.dueDate.split('T')[0], // Ensure date format for input
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
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
      toast({
        title: "Sucesso",
        description: "Boleto atualizado com sucesso.",
      });
    } else {
      addBoleto(boletoData);
      toast({
        title: "Sucesso",
        description: "Boleto cadastrado com sucesso.",
      });
    }

    setIsModalOpen(false);
  };

  const getStatusLabel = (status: Boleto['status']) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      default: return status;
    }
  };

  const getStatusStyle = (status: Boleto['status']) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-500/20';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100 ring-amber-500/20';
      case 'overdue': return 'bg-rose-50 text-rose-700 border-rose-100 ring-rose-500/20';
      default: return 'bg-slate-50 text-slate-700 border-slate-100 ring-slate-500/20';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent p-0 font-sans text-slate-900 selection:bg-indigo-100 animate-fade-in">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
              <TrendingUp size={16} />
              Finanças
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Boletos</h1>
            <p className="text-slate-500 text-lg">Gerencie suas contas a pagar com facilidade.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Boleto
          </button>
        </header>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard title="Total Acumulado" value={metrics.total} icon={<FileText size={22} />} color="slate" />
          <MetricCard title="Total Pago" value={metrics.pago} icon={<CheckCircle2 size={22} />} color="emerald" />
          <MetricCard title="Aguardando" value={metrics.pendente} icon={<Clock size={22} />} color="amber" />
          <MetricCard title="Vencidos" value={metrics.atrasado} icon={<AlertCircle size={22} />} color="rose" />
        </div>

        {/* Main Container */}
        <main className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          {/* Table Filters */}
          <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white">
            <div className="relative flex-1 max-w-lg group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Pesquisar fatura..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 font-bold transition-all active:scale-95">
                <Filter size={18} />
                Filtrar
              </button>
            </div>
          </div>

          {/* Custom Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100">Descrição do Lançamento</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100">Valor Nominal</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100">Vencimento</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100">Status</th>
                  <th className="px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400 border-b border-slate-100 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBoletos.length > 0 ? (
                  filteredBoletos.map((boleto) => (
                    <tr key={boleto.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <FileText size={18} />
                          </div>
                          <span className="font-bold text-slate-800">{boleto.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-900 font-bold">{formatCurrency(boleto.value)}</td>
                      <td className="px-8 py-6 text-slate-500 font-medium">{new Date(boleto.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[13px] font-bold border ring-4 ring-transparent ${getStatusStyle(boleto.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${boleto.status === 'paid' ? 'bg-emerald-500' :
                              boleto.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}></span>
                          {getStatusLabel(boleto.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {boleto.status !== 'paid' && (
                            <button
                              onClick={() => markBoletoAsPaid(boleto.id)}
                              className="p-2.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Marcar como Pago"
                            >
                              <Check size={20} />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(boleto)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => deleteBoleto(boleto.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300">
                          <Search size={40} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-900 font-bold text-xl">Nenhum boleto encontrado</p>
                          <p className="text-slate-500">Tente ajustar sua busca ou adicione um novo registro.</p>
                        </div>
                        <button
                          onClick={() => handleOpenModal()}
                          className="mt-4 bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-100 transition-all"
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
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
              <div className="p-10 border-b border-slate-100 flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                    {editingBoleto ? 'Editar Registro' : 'Novo Registro'}
                  </h2>
                  <p className="text-slate-500 font-medium">Preencha os dados da fatura abaixo.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-slate-900 p-2 rounded-2xl hover:bg-slate-100 transition-all">
                  <X size={28} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Descrição</label>
                  <input
                    required
                    type="text"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-300"
                    placeholder="Ex: Conta de Luz Março/2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest text-center block">Valor (R$)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 outline-none transition-all font-bold text-slate-800"
                      placeholder="0,00"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest text-center block">Vencimento</label>
                    <input
                      required
                      type="date"
                      className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 bg-slate-50/50 outline-none transition-all font-medium text-slate-800"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Status Inicial</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['pending', 'paid', 'overdue'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={`py-3.5 rounded-2xl text-[13px] font-black uppercase tracking-wider transition-all border-2 ${formData.status === status
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-105'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                          }`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98]"
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

// Componente de Cartão de Métricas Refinado
const MetricCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: 'slate' | 'emerald' | 'amber' | 'rose' }) => {
  const styles = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-white text-emerald-600',
    amber: 'bg-white text-amber-600',
    rose: 'bg-white text-rose-600',
  };

  return (
    <div className={`p-7 rounded-[2rem] border transition-all relative overflow-hidden group ${color === 'slate' ? 'border-slate-800 shadow-2xl shadow-slate-200' : 'border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100'
      } ${styles[color]}`}>
      <div className="flex justify-between items-start relative z-10 mb-6">
        <div className={`p-3 rounded-2xl ${color === 'slate' ? 'bg-slate-800' : 'bg-slate-50'} transition-transform group-hover:-rotate-12`}>
          {icon}
        </div>
        <ArrowUpRight size={20} className={color === 'slate' ? 'text-slate-500' : 'text-slate-300'} />
      </div>
      <div className="relative z-10">
        <p className={`text-[13px] font-black uppercase tracking-widest mb-1 ${color === 'slate' ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </p>
        <p className="text-3xl font-black tracking-tight">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
        </p>
      </div>
      {/* Background Decor */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${color === 'emerald' ? 'bg-emerald-400' :
          color === 'amber' ? 'bg-amber-400' :
            color === 'rose' ? 'bg-rose-400' : 'bg-indigo-400'
        }`}></div>
    </div>
  );
};

export default Boletos;
