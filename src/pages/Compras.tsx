import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Plus,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Wallet,
  Trash2,
  ChevronDown,
  Filter,
  ArrowUpRight,
  X,
  Calendar,
  DollarSign,
  MapPin,
  AlignLeft,
  Check
} from 'lucide-react';
import { usePurchases } from '@/hooks/usePurchases';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from "@/components/ui/use-toast";

export default function Compras() {
  const { purchases, isLoading, addPurchase, deletePurchase } = usePurchases();
  const { toast } = useToast();

  // State for Month Filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeMonthLabel, setActiveMonthLabel] = useState(() => {
    const date = new Date();
    return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  });

  // State for Goal
  const [monthlyGoal, setMonthlyGoal] = useState(5000);

  // State for Search
  const [searchQuery, setSearchQuery] = useState('');

  // State for Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    location: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Calculate Stats
  const today = new Date().toISOString().split('T')[0];

  // Filter purchases by month
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesMonth = p.date.startsWith(selectedMonth);
      const matchesSearch = p.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMonth && matchesSearch;
    });
  }, [purchases, selectedMonth, searchQuery]);

  const spentToday = purchases
    .filter(p => p.date === today)
    .reduce((sum, p) => sum + p.value, 0);

  const totalSpentMonth = purchases
    .filter(p => p.date.startsWith(selectedMonth))
    .reduce((sum, p) => sum + p.value, 0);

  const spentYesterday = purchases
    .filter(p => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return p.date === d.toISOString().split('T')[0];
    })
    .reduce((sum, p) => sum + p.value, 0);

  const comparisonPercentage = spentYesterday > 0
    ? ((spentToday - spentYesterday) / spentYesterday) * 100
    : 0;

  const available = Math.max(0, monthlyGoal - totalSpentMonth);
  const percentUsed = monthlyGoal > 0 ? (totalSpentMonth / monthlyGoal) * 100 : 0;

  const stats = [
    {
      label: 'Gasto Hoje',
      value: formatCurrency(spentToday),
      percent: spentYesterday > 0 ? `${comparisonPercentage.toFixed(0)}%` : '0%',
      icon: <ShoppingBag size={20} />,
      color: 'blue',
      trend: comparisonPercentage > 0 ? 'up' : 'stable'
    },
    {
      label: 'Total do Mês',
      value: formatCurrency(totalSpentMonth),
      percent: monthlyGoal > 0 ? `${percentUsed.toFixed(0)}%` : '0%',
      icon: <TrendingUp size={20} />,
      color: 'indigo',
      trend: 'up'
    },
    {
      label: 'Meta do Mês',
      value: formatCurrency(monthlyGoal),
      percent: `${(monthlyGoal > 0 ? 100 : 0)}%`,
      icon: <TrendingDown size={20} />,
      color: 'slate',
      trend: 'neutral'
    },
    {
      label: 'Disponível',
      value: formatCurrency(available),
      percent: monthlyGoal > 0 ? `${((available / monthlyGoal) * 100).toFixed(0)}%` : '0%',
      icon: <Wallet size={20} />,
      color: 'emerald',
      trend: 'stable'
    },
  ];

  // Actions
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.location || !formData.value || !formData.date) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setLoading(true);

    try {
      const purchaseData = {
        location: formData.location,
        value: parseFloat(formData.value) || 0,
        date: formData.date,
        notes: formData.notes,
      };

      await addPurchase(purchaseData);

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setIsDialogOpen(false);
        setFormData({ location: '', value: '', date: new Date().toISOString().split('T')[0], notes: '' });
        toast({
          title: "Sucesso",
          description: "Compra registrada com sucesso!",
        });
      }, 1500);

    } catch (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar compra.",
      });
    }
  };

  const handleDelete = async (id: number) => {
    await deletePurchase(id);
    toast({
      title: "Sucesso",
      description: "Compra removida com sucesso!",
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Local', 'Valor', 'Data', 'Observações'],
      ...filteredPurchases.map(p => [p.location, p.value.toString(), p.date, p.notes])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compras-${selectedMonth}.csv`;
    a.click();
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    const [year, month] = value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    setActiveMonthLabel(label.charAt(0).toUpperCase() + label.slice(1));
  };


  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full min-h-screen">
          <div className="text-slate-400 font-medium animate-pulse">Carregando compras...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
        {/* Top Header */}
        <div className="max-w-7xl mx-auto mb-10 flex flex-col items-center text-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Controle de Compras</h1>
            <p className="text-slate-500 mt-2 font-medium text-lg">Gerencie e monitore suas transações mensais</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={18} />
              Exportar
            </button>

            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Plus size={18} />
              Nova Compra
            </button>

            {/* Custom Modal */}
            {isDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                  {/* Header */}
                  <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                      Registrar Compra
                    </h2>
                    <button
                      onClick={() => setIsDialogOpen(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSave} className="px-8 pb-8 space-y-5">

                    {/* Local da Compra */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        Local da compra
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Supermercado Central"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-slate-800"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>

                    {/* Row: Valor e Data */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                          <DollarSign size={14} className="text-slate-400" />
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-800"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          Data
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-800"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                        <AlignLeft size={14} className="text-slate-400" />
                        Observações
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Descrição opcional da compra..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all resize-none text-slate-800"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1 py-3.5 px-4 text-slate-600 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={loading || success}
                        className={`flex-[1.5] py-3.5 px-4 font-bold rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 ${success
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                          }`}
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : success ? (
                          <>
                            <Check size={20} />
                            Salvo!
                          </>
                        ) : (
                          'Salvar Registro'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid - Itens Centralizados */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all group flex flex-col items-center text-center">
              <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300 mb-4`}>
                {stat.icon}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">{stat.value}</h3>
              <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${stat.trend === 'up' ? 'bg-rose-50 text-rose-600' :
                stat.trend === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                {stat.percent}
                <ArrowUpRight size={12} />
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden mb-20">
          {/* Table Filters/Header - Centralizado no Mobile, Espaçado no Desktop */}
          <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800">Compras Registradas</h2>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors relative">
                <Filter size={14} />
                {/* Invisible Select Overlay for Month Picking */}
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), i, 1);
                    const value = date.toISOString().slice(0, 7);
                    const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                    return (
                      <option key={value} value={value}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </option>
                    );
                  })}
                </select>
                <span>{activeMonthLabel}</span>
                <ChevronDown size={14} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por local..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all"
                />
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-1 pr-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Meta</span>
                <input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>

          {/* Table - Conteúdo Centralizado */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Local</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Valor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Observações</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                      Nenhuma compra encontrada para este mês.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            {item.location.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                          {formatCurrency(item.value)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-black tracking-wide">
                          {formatDate(item.date)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center max-w-xs">
                        <p className={`text-sm leading-relaxed ${!item.notes ? 'text-slate-300 italic' : 'text-slate-500 font-medium'}`}>
                          {item.notes || '-'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* 
                          <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                            <MoreHorizontal size={20} />
                          </button> 
                          */}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-8 flex justify-center border-t border-slate-50 bg-slate-50/30">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Fim da lista • {filteredPurchases.length} registros encontrados
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
