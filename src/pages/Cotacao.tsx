import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Trophy, Trash2, Plus, X } from 'lucide-react';
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

  const [newProduct, setNewProduct] = useState('');
  const [newSupplier, setNewSupplier] = useState('');

  const handlePriceChange = (product: string, supplier: string, value: string) => {
    updatePrice(product, supplier, parseFloat(value) || 0);
  };

  const handleAddProduct = () => {
    if (newProduct) {
      addProduct(newProduct);
      setNewProduct('');
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite o nome do produto.",
      });
    }
  };

  const handleAddSupplier = () => {
    if (newSupplier) {
      addSupplier(newSupplier);
      setNewSupplier('');
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Digite o nome do fornecedor.",
      });
    }
  };

  const getWinner = (product: string): string | null => {
    if (!currentQuotation) return null;
    const productPrices = currentQuotation.prices[product];
    if (!productPrices) return null;

    let minPrice = Infinity;
    let winner = null;

    Object.entries(productPrices).forEach(([supplier, price]) => {
      if (price > 0 && price < minPrice) {
        minPrice = price;
        winner = supplier;
      }
    });

    return winner;
  };

  const getSupplierTotal = (supplier: string): number => {
    if (!currentQuotation) return 0;
    return Object.values(currentQuotation.prices).reduce((sum, productPrices) => {
      return sum + (productPrices[supplier] || 0);
    }, 0);
  };

  const handleExport = () => {
    if (!currentQuotation) return;

    const headers = ['Produto', ...currentQuotation.suppliers, 'Melhor Preço'];
    const rows = currentQuotation.products.map(product => [
      product,
      ...currentQuotation.suppliers.map(s =>
        (currentQuotation.prices[product]?.[s] || 0).toFixed(2)
      ),
      getWinner(product) || '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cotacao.csv';
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Cotação de Produtos</h1>
            <p className="page-description">Compare preços entre fornecedores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </div>

        {/* Add Product/Supplier */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="font-medium mb-3">Adicionar Produto</h3>
            <div className="flex gap-2">
              <Input
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                placeholder="Nome do produto"
                onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
              />
              <Button onClick={handleAddProduct}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="card p-4">
            <h3 className="font-medium mb-3">Adicionar Fornecedor</h3>
            <div className="flex gap-2">
              <Input
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                placeholder="Nome do fornecedor"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSupplier()}
              />
              <Button onClick={handleAddSupplier}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quotation Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Produto
                  </th>
                  {currentQuotation.suppliers.map(supplier => (
                    <th key={supplier} className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <span>{supplier}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSupplier(supplier)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                    Melhor Preço
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentQuotation.products.length === 0 ? (
                  <tr>
                    <td colSpan={currentQuotation.suppliers.length + 2} className="px-4 py-8 text-center text-muted-foreground">
                      Adicione produtos e fornecedores para começar a cotação.
                    </td>
                  </tr>
                ) : (
                  <>
                    {currentQuotation.products.map(product => {
                      const winner = getWinner(product);
                      return (
                        <tr key={product} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProduct(product)}
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          {currentQuotation.suppliers.map(supplier => {
                            const price = currentQuotation.prices[product]?.[supplier] || 0;
                            const isWinner = winner === supplier && price > 0;
                            return (
                              <td key={supplier} className="px-4 py-3">
                                <div className={`relative ${isWinner ? 'ring-2 ring-success rounded-md' : ''}`}>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={price || ''}
                                    onChange={(e) => handlePriceChange(product, supplier, e.target.value)}
                                    className={`text-center ${isWinner ? 'bg-success/10' : ''}`}
                                    placeholder="0,00"
                                  />
                                  {isWinner && (
                                    <Trophy className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            {winner ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                                <Trophy className="h-3 w-3" />
                                {winner}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals Row */}
                    <tr className="bg-muted/50 font-medium">
                      <td className="px-4 py-3">Total</td>
                      {currentQuotation.suppliers.map(supplier => (
                        <td key={supplier} className="px-4 py-3 text-center">
                          R$ {getSupplierTotal(supplier).toFixed(2)}
                        </td>
                      ))}
                      <td className="px-4 py-3"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tips */}
        <div className="card p-4 bg-muted/50">
          <h3 className="font-medium mb-2">💡 Dicas</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Adicione produtos e fornecedores para criar sua tabela de cotação</li>
            <li>• O menor preço para cada produto será destacado automaticamente</li>
            <li>• Use o botão Exportar para baixar a cotação em formato CSV</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
