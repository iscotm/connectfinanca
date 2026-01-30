import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatCard } from '@/components/ui/stat-card';
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
import { Plus, ShoppingCart, TrendingUp, TrendingDown, Download, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { usePurchases } from '@/hooks/usePurchases';
import { useToast } from "@/components/ui/use-toast";

export default function Compras() {
  const { purchases, isLoading, addPurchase, deletePurchase } = usePurchases();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyGoal, setMonthlyGoal] = useState(5000);
  const [formData, setFormData] = useState({
    location: '',
    value: '',
    date: '',
    notes: '',
  });

  const today = new Date().toISOString().split('T')[0];
  const spentToday = purchases
    .filter(p => p.date === today)
    .reduce((sum, p) => sum + p.value, 0);

  const filteredPurchases = purchases.filter(p => p.date.startsWith(selectedMonth));
  const totalSpentMonth = filteredPurchases.reduce((sum, p) => sum + p.value, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const spentYesterday = purchases
    .filter(p => p.date === yesterday.toISOString().split('T')[0])
    .reduce((sum, p) => sum + p.value, 0);

  const comparisonPercentage = spentYesterday > 0
    ? ((spentToday - spentYesterday) / spentYesterday) * 100
    : 0;

  const handleSave = async () => {
    if (!formData.location || !formData.value || !formData.date) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    const purchaseData = {
      location: formData.location,
      value: parseFloat(formData.value) || 0,
      date: formData.date,
      notes: formData.notes,
    };

    await addPurchase(purchaseData);
    setIsDialogOpen(false);
    setFormData({ location: '', value: '', date: '', notes: '' });
  };

  const handleDelete = async (id: number) => {
    await deletePurchase(id);
  };

  const handleExport = () => {
    const csvContent = [
      ['Local', 'Valor', 'Data', 'Observações'],
      ...purchases.map(p => [p.location, p.value.toString(), p.date, p.notes])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compras-${selectedMonth}.csv`;
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Controle de Compras</h1>
            <p className="page-description">Registre e acompanhe suas compras avulsas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Compra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Compra</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Local da compra</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Ex: Supermercado Central"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor (R$)</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Descrição da compra..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                      Salvar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Gasto Hoje"
            value={formatCurrency(spentToday)}
            icon={ShoppingCart}
            trend={{
              value: parseFloat(Math.abs(comparisonPercentage).toFixed(1)),
              isPositive: comparisonPercentage < 0
            }}
          />
          <StatCard
            title="Total do Mês"
            value={formatCurrency(totalSpentMonth)}
            icon={TrendingUp}
          />
          <StatCard
            title="Meta do Mês"
            value={formatCurrency(monthlyGoal)}
            icon={TrendingDown}
          />
          <StatCard
            title="Disponível"
            value={formatCurrency(Math.max(0, monthlyGoal - totalSpentMonth))}
            icon={ShoppingCart}
            trend={{
              value: 0,
              isPositive: totalSpentMonth <= monthlyGoal
            }}
          />
        </div>

        {/* Month Filter */}
        <div className="flex gap-4 items-center">
          <Label>Filtrar por mês:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(new Date().getFullYear(), i, 1);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                return (
                  <SelectItem key={value} value={value}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="flex gap-2 items-center ml-auto">
            <Label>Meta mensal:</Label>
            <Input
              type="number"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(parseFloat(e.target.value) || 0)}
              className="w-32"
            />
          </div>
        </div>

        {/* Purchases List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Compras Registradas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Local</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Observações</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma compra registrada neste mês.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{purchase.location}</td>
                      <td className="px-4 py-3 text-expense font-medium">{formatCurrency(purchase.value)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(purchase.date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{purchase.notes}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(purchase.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
