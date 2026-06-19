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
import { toast } from 'sonner';

export default function Compras() {
  const { purchases, isLoading, addPurchase, deletePurchase } = usePurchases();

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
      colorClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/10',
      trend: comparisonPercentage > 0 ? 'up' : 'stable'
    },
    {
      label: 'Total do Mês',
      value: formatCurrency(totalSpentMonth),
      percent: monthlyGoal > 0 ? `${percentUsed.toFixed(0)}%` : '0%',
      icon: <TrendingUp size={20} />,
      colorClass: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10',
      trend: 'up'
    },
    {
      label: 'Meta do Mês',
      value: formatCurrency(monthlyGoal),
      percent: `${(monthlyGoal > 0 ? 100 : 0)}%`,
      icon: <TrendingDown size={20} />,
      colorClass: 'bg-slate-900 border border-slate-800 text-slate-400',
      trend: 'neutral'
    },
    {
      label: 'Disponível',
      value: formatCurrency(available),
      percent: monthlyGoal > 0 ? `${((available / monthlyGoal) * 100).toFixed(0)}%` : '0%',
      icon: <Wallet size={20} />,
      colorClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10',
      trend: 'stable'
    },
  ];

  // Actions
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.location || !formData.value || !formData.date) {
      toast.error("Preencha todos os campos obrigatórios.");
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
        toast.success("Compra registrada com sucesso!");
      }, 1500);

    } catch (error) {
      setLoading(false);
      toast.error("Erro ao salvar compra.");
    }
  };

  const handleDelete = async (id: number) => {
    await deletePurchase(id);
    toast.success("Compra removida com sucesso!");
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
    toast.success("Relatório CSV baixado com sucesso!");
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
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans text-slate-100 pb-8">
        {/* Top Header */}
        <div className="max-w-7xl mx-auto mb-10 flex flex-col items-center text-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Controle de Compras</h1>
            <p className="text-slate-400 mt-2 font-medium text-lg">Gerencie e monitore suas transações mensais</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900/50 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700/80 text-slate-300 hover:text-white font-semibold rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={18} />
              Exportar
            </button>

            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-blue-600/15"
            >
              <Plus size={18} />
              Nova Compra
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-[28px] border border-slate-900/50 shadow-sm glass-card-hover flex flex-col items-center text-center group transition-all">
              <div className={`p-4 rounded-2xl ${stat.colorClass} group-hover:scale-110 transition-transform duration-300 mb-4`}>
                {stat.icon}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-white tracking-tight mb-3">{stat.value}</h3>
              <div className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${
                stat.trend === 'up' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
                stat.trend === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}>
                {stat.percent}
                <ArrowUpRight size={12} />
              </div>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto glass-panel rounded-[28px] overflow-hidden border border-slate-900/50 shadow-xl mb-20">
          {/* Table Filters/Header */}
          <div className="p-8 border-b border-slate-900/60 flex flex-col lg:flex-row items-center justify-between gap-6 bg-transparent">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h2 className="text-xl font-bold text-white">Compras Registradas</h2>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors relative">
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
                      <option key={value} value={value} className="bg-slate-950 text-white">
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por local..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all placeholder:text-slate-500 text-sm"
                />
              </div>
              <div className="flex items-center gap-3 bg-slate-900/60 p-1 pr-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Meta</span>
                <input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-sm font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950/20">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Local</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Valor</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Data</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Observações</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                      Nenhuma compra encontrada para este mês.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/20 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            {item.location.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-white text-sm uppercase whitespace-nowrap">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="font-extrabold text-white text-lg tracking-tight">
                          {formatCurrency(item.value)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[11px] font-black tracking-wide border border-blue-500/10">
                          {formatDate(item.date)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center max-w-xs">
                        <p className={`text-sm leading-relaxed ${!item.notes ? 'text-slate-650 italic' : 'text-slate-400 font-medium'}`}>
                          {item.notes || '-'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-3 text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 rounded-2xl transition-all"
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
          <div className="p-8 flex justify-center border-t border-slate-900/60 bg-slate-950/20">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Fim da lista • {filteredPurchases.length} registros encontrados
            </p>
          </div>
        </div>
      </div>

      {/* Custom Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-panel rounded-[28px] border border-slate-900/50 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 font-sans p-0">

            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-900/60">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Registrar Compra
              </h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">
              {/* Local da Compra */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-500" />
                  Local da compra
                </label>
                <input
                  type="text"
                  placeholder="Ex: Supermercado Central"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              {/* Row: Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <DollarSign size={14} className="text-slate-500" />
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-bold"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                    <Calendar size={14} className="text-slate-500" />
                    Data
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                  <AlignLeft size={14} className="text-slate-500" />
                  Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Descrição opcional da compra..."
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all resize-none font-medium"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 py-3.5 px-4 bg-slate-900 border border-slate-800 text-slate-350 font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`flex-[1.5] py-3.5 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${success
                      ? 'bg-emerald-500 text-white border-transparent shadow-emerald-500/10'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]'
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
    </MainLayout>
  );
}
