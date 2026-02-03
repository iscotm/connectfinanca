import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
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
import { Plus, Edit2, Trash2, Check, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useFinance, Boleto } from '@/contexts/FinanceContext';
import { useToast } from "@/components/ui/use-toast";

export default function Boletos() {
  const { boletos, addBoleto, updateBoleto, deleteBoleto, markBoletoAsPaid } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    dueDate: '',
    status: 'pending' as Boleto['status'],
  });

  const totalBoletos = boletos.reduce((sum, b) => sum + b.value, 0);
  const paidBoletos = boletos.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.value, 0);
  const pendingBoletos = boletos.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.value, 0);
  const overdueBoletos = boletos.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.value, 0);

  const handleOpenDialog = (boleto?: Boleto) => {
    if (boleto) {
      setEditingBoleto(boleto);
      setFormData({
        name: boleto.name,
        value: boleto.value.toString(),
        dueDate: boleto.dueDate,
        status: boleto.status,
      });
    } else {
      setEditingBoleto(null);
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

    const boletoData = {
      name: formData.name,
      value: parseFloat(formData.value) || 0,
      dueDate: formData.dueDate,
      status: formData.status,
    };

    if (editingBoleto) {
      updateBoleto(editingBoleto.id, boletoData);
    } else {
      addBoleto(boletoData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteBoleto(id);
  };

  const handleMarkAsPaid = (id: number) => {
    markBoletoAsPaid(id);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="page-title">Boletos</h1>
            <p className="page-description">Controle de boletos a pagar</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Boleto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome / Descrição</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Fornecedor ABC"
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
                  <Label htmlFor="dueDate">Data de vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Boleto['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingBoleto ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Boletos"
            value={formatCurrency(totalBoletos)}
            icon={FileText}
          />
          <StatCard
            title="Pago"
            value={formatCurrency(paidBoletos)}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Pendente"
            value={formatCurrency(pendingBoletos)}
            icon={AlertTriangle}
            variant="warning"
          />
          <StatCard
            title="Atrasado"
            value={formatCurrency(overdueBoletos)}
            icon={AlertTriangle}
            variant="danger"
          />
        </div>

        {/* Boletos Table */}
        <div className="finance-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {boletos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum boleto cadastrado. Clique em "Novo Boleto" para adicionar.
                  </td>
                </tr>
              ) : (
                boletos
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((boleto) => (
                    <tr key={boleto.id}>
                      <td className="font-medium">{boleto.name}</td>
                      <td>{formatCurrency(boleto.value)}</td>
                      <td>{formatDate(boleto.dueDate)}</td>
                      <td>
                        <StatusBadge status={boleto.status} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          {boleto.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkAsPaid(boleto.id)}
                              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(boleto)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(boleto.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
