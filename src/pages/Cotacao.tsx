import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Download,
  FileText,
  Trophy,
  TrendingDown,
  Package,
  Store,
  Info,
  X,
  CheckCircle2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useQuotations } from '@/hooks/useQuotations';
import { useToast } from "@/components/ui/use-toast";

export default function Cotacao() {
  const {
    currentQuotation,
    isLoading,
    addProduct,
    addSupplier,
    removeProduct,
    removeSupplier,
    updatePrice
  } = useQuotations();
  const { toast } = useToast();

  const [newProductName, setNewProductName] = useState('');
  const [newVendorName, setNewVendorName] = useState('');

  // Cálculos de Otimização
  const analysis = useMemo(() => {
    if (!currentQuotation) return { results: [], vendorTotals: [], bestOverallTotal: 0 };

    const results = currentQuotation.products.map(p => {
      let minPrice = Infinity;
      let bestVendorId = null;
      currentQuotation.suppliers.forEach(v => {
        const price = currentQuotation.prices[p]?.[v] || 0;
        if (price > 0 && price < minPrice) {
          minPrice = price;
          bestVendorId = v;
        }
      });
      return { productId: p, minPrice: minPrice === Infinity ? 0 : minPrice, bestVendorId };
    });

    const vendorTotals = currentQuotation.suppliers.map(v => {
      const total = currentQuotation.products.reduce((acc, p) => acc + (currentQuotation.prices[p]?.[v] || 0), 0);
      return { name: v, total };
    });

    const bestOverallTotal = results.reduce((acc, r) => acc + r.minPrice, 0);

    return { results, vendorTotals, bestOverallTotal };
  }, [currentQuotation]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite o nome do produto.",
      });
      return;
    }
    addProduct(newProductName);
    setNewProductName('');
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite o nome do fornecedor.",
      });
      return;
    }
    addSupplier(newVendorName);
    setNewVendorName('');
  };

  const exportCSV = () => {
    if (!currentQuotation) return;
    let csv = "Produto," + currentQuotation.suppliers.join(",") + ",Melhor Preço\n";
    currentQuotation.products.forEach(p => {
      const best = analysis.results.find(r => r.productId === p)?.minPrice || 0;
      csv += p + "," + currentQuotation.suppliers.map(v => currentQuotation.prices[p]?.[v] || 0).join(",") + "," + best + "\n";
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'cotacao_precos.csv');
    a.click();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  if (!currentQuotation) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Erro ao carregar cotação</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-900 flex justify-center">
        <div className="w-full max-w-7xl">

          {/* Header Section - Centralizado */}
          <header className="flex flex-col items-center text-center mb-10 gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Cotação de Produtos</h1>
              <p className="text-slate-500 mt-2 text-lg">Compare preços e maximize sua margem de lucro de forma inteligente.</p>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all shadow-sm hover:shadow"
              >
                <Download size={18} /> Exportar CSV
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-xl text-white font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                <FileText size={18} /> Gerar PDF
              </button>
            </div>
          </header>

          {/* Action Cards - Centralizados e mais compactos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-4 text-indigo-600 font-bold uppercase text-xs tracking-widest">
                <Package size={18} />
                <span>Novo Produto</span>
              </div>
              <form onSubmit={handleAddProduct} className="flex gap-2 w-full">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ex: Cimento, Areia..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                />
                <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-transform active:scale-95">
                  <Plus size={20} />
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold uppercase text-xs tracking-widest">
                <Store size={18} />
                <span>Novo Fornecedor</span>
              </div>
              <form onSubmit={handleAddVendor} className="flex gap-2 w-full">
                <input
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Ex: Loja do Silva..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                />
                <button type="submit" className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-transform active:scale-95">
                  <Plus size={20} />
                </button>
              </form>
            </div>
          </div>

          {/* Main Comparison Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="p-5 font-bold text-slate-700 min-w-[220px]">Produtos</th>
                    {currentQuotation.suppliers.map(supplier => (
                      <th key={supplier} className="p-5 font-bold text-slate-700 text-center relative group min-w-[160px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="truncate max-w-[130px]">{supplier}</span>
                          <button
                            onClick={() => removeSupplier(supplier)}
                            className="text-red-400 opacity-0 group-hover:opacity-100 transition-all absolute -top-1 -right-1 p-2 hover:text-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="p-5 font-bold text-indigo-600 text-center bg-indigo-50/40">Melhor Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuotation.products.length === 0 ? (
                    <tr>
                      <td colSpan={currentQuotation.suppliers.length + 2} className="p-10 text-center text-slate-400">
                        Adicione produtos e fornecedores para começar a cotação.
                      </td>
                    </tr>
                  ) : (
                    currentQuotation.products.map(p => {
                      const productAnalysis = analysis.results.find(r => r.productId === p);
                      return (
                        <tr key={p} className="border-t border-slate-50 hover:bg-slate-50/40 transition-colors">
                          <td className="p-5 flex items-center justify-between group">
                            <span className="font-semibold text-slate-700">{p}</span>
                            <button
                              onClick={() => removeProduct(p)}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                          {currentQuotation.suppliers.map(v => {
                            const isBest = productAnalysis?.bestVendorId === v;
                            const currentPrice = currentQuotation.prices[p]?.[v] || 0;
                            return (
                              <td key={v} className="p-3 text-center">
                                <div className={`relative rounded-xl transition-all p-1 ${isBest && currentPrice > 0 ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-transparent'}`}>
                                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">R$</div>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={currentPrice || ''}
                                    onChange={(e) => updatePrice(p, v, parseFloat(e.target.value) || 0)}
                                    className={`w-full bg-transparent pl-8 pr-4 py-2.5 text-center outline-none focus:ring-1 focus:ring-indigo-300 rounded-lg font-semibold ${isBest && currentPrice > 0 ? 'text-emerald-700' : 'text-slate-600'}`}
                                    placeholder="0.00"
                                  />
                                  {isBest && currentPrice > 0 && (
                                    <Trophy size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 animate-pulse" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="p-3 bg-indigo-50/10">
                            <div className="flex items-center justify-center gap-1 text-indigo-700 font-extrabold text-xl">
                              <span className="text-[10px] font-bold opacity-70">R$</span>
                              {productAnalysis?.minPrice.toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {currentQuotation.products.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100/50 font-extrabold text-sm border-t-2 border-slate-200">
                      <td className="p-6 text-slate-500 uppercase tracking-widest text-[10px]">Totais Acumulados</td>
                      {analysis.vendorTotals.map(vt => (
                        <td key={vt.name} className="p-6 text-center text-slate-800 text-lg">
                          <span className="text-xs font-medium mr-1">R$</span>
                          {vt.total.toFixed(2)}
                        </td>
                      ))}
                      <td className="p-6 text-center bg-indigo-600 text-white text-xl">
                        <span className="text-xs font-medium mr-1 italic opacity-80 text-white">R$</span>
                        {analysis.bestOverallTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Insights Section - Centralizada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-8 rounded-2xl shadow-lg flex flex-col items-center text-center justify-center">
              <div className="bg-white/20 p-4 rounded-full mb-4">
                <TrendingDown size={32} />
              </div>
              <div className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Custo Total Otimizado</div>
              <div className="text-4xl font-black">R$ {analysis.bestOverallTotal.toFixed(2)}</div>
              <p className="text-indigo-200 text-[10px] mt-4 leading-relaxed">Considerando a compra de cada item no fornecedor mais barato disponível.</p>
            </div>

            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm md:col-span-2">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-6 text-lg">
                <Info size={22} className="text-indigo-500" />
                Resumo e Dicas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-emerald-600" /></div>
                    <p className="text-sm text-slate-600 leading-snug">O destaque <span className="text-emerald-600 font-bold">verde</span> aponta a melhor oferta unitária.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-emerald-600" /></div>
                    <p className="text-sm text-slate-600 leading-snug">Remova itens clicando no <span className="text-red-500 font-bold">ícone de lixo</span> ou no "X".</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-emerald-600" /></div>
                    <p className="text-sm text-slate-600 leading-snug">A exportação CSV é compatível com Excel e Google Sheets.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-emerald-100 p-1 rounded-full"><CheckCircle2 size={14} className="text-emerald-600" /></div>
                    <p className="text-sm text-slate-600 leading-snug">Gere um relatório PDF para apresentar à gerência ou financeiro.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          input::-webkit-outer-spin-button,
          input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
          .overflow-x-auto::-webkit-scrollbar {
            height: 6px;
          }
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #f1f5f9;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
