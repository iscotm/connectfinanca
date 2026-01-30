import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Calculator, ArrowRight, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import { useFinance, banks } from '@/contexts/FinanceContext';
import { TaxasDialog } from '@/components/configuracoes/TaxasDialog';
import { ResetSistemaDialog } from '@/components/configuracoes/ResetSistemaDialog';

export default function ConfiguracoesDRE() {
  const { 
    dreConfig, 
    updateDREConfig, 
    paymentFees,
    despesasRestantes,
    rateioDiarioDespesas,
    diasRestantes,
    resetAllData,
  } = useFinance();

  const [isTaxasDialogOpen, setIsTaxasDialogOpen] = useState(false);

  const totalFundoPeriodo = dreConfig.metaDiariaFundo * diasRestantes;

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
  };

  const handleReset = () => {
    resetAllData();
    toast.success('Sistema resetado com sucesso!');
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="page-header">
          <h1 className="page-title">Configurações DRE</h1>
          <p className="page-description">
            Configure os parâmetros financeiros para cálculos automáticos de separação
          </p>
        </div>

        {/* Payment Fees Section */}
        <section className="finance-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Taxas de Pagamento
            </h2>
            <Button variant="outline" onClick={() => setIsTaxasDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Configurar Taxas
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Pix</p>
              <p className="text-lg font-semibold">{paymentFees.pix}%</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Débito</p>
              <p className="text-lg font-semibold">{paymentFees.debit}%</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Crédito</p>
              <p className="text-lg font-semibold">{paymentFees.credit}%</p>
            </div>
          </div>
        </section>

        {/* Bank Destinations */}
        <section className="finance-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Bancos de Destino
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Despesas Fixas</Label>
              <Select
                value={dreConfig.bancoDespesas}
                onValueChange={(value) => updateDREConfig({ bancoDespesas: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CMV</Label>
              <Select
                value={dreConfig.bancoCMV}
                onValueChange={(value) => updateDREConfig({ bancoCMV: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fundo de Caixa</Label>
              <Select
                value={dreConfig.bancoFundo}
                onValueChange={(value) => updateDREConfig({ bancoFundo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sobras</Label>
              <Select
                value={dreConfig.bancoSobras}
                onValueChange={(value) => updateDREConfig({ bancoSobras: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {banks.map(bank => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Parameters */}
        <section className="finance-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Parâmetros
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalDiasMes">Total de dias do mês</Label>
              <Input
                id="totalDiasMes"
                type="number"
                value={dreConfig.totalDiasMes || ''}
                onChange={(e) => updateDREConfig({ totalDiasMes: parseInt(e.target.value) || 0 })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diaAtual">Dia atual</Label>
              <Input
                id="diaAtual"
                type="number"
                value={dreConfig.diaAtual || ''}
                onChange={(e) => updateDREConfig({ diaAtual: parseInt(e.target.value) || 0 })}
                placeholder="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="despesasRestantes">Total de despesas restantes (R$)</Label>
              <Input
                id="despesasRestantes"
                type="number"
                step="0.01"
                value={dreConfig.despesasRestantes || ''}
                onChange={(e) => updateDREConfig({ despesasRestantes: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDiariaFundo">Meta diária do fundo (R$)</Label>
              <Input
                id="metaDiariaFundo"
                type="number"
                step="0.01"
                value={dreConfig.metaDiariaFundo || ''}
                onChange={(e) => updateDREConfig({ metaDiariaFundo: parseFloat(e.target.value) || 0 })}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentualCMV">Percentual de CMV (%)</Label>
              <Input
                id="percentualCMV"
                type="number"
                step="0.1"
                value={dreConfig.percentualCMV || ''}
                onChange={(e) => updateDREConfig({ percentualCMV: parseFloat(e.target.value) || 0 })}
                placeholder="35"
              />
            </div>
          </div>
        </section>

        {/* Calculated Values */}
        <section className="finance-card p-6 bg-muted/30">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculos Automáticos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Dias Restantes</p>
              <p className="text-2xl font-bold text-foreground">{diasRestantes}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {dreConfig.totalDiasMes} - {dreConfig.diaAtual} = {diasRestantes}
              </p>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Rateio Diário de Despesas</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(rateioDiarioDespesas)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(despesasRestantes)} ÷ {diasRestantes} dias
              </p>
            </div>

            <div className="p-4 bg-card rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total Fundo no Período</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(totalFundoPeriodo)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatCurrency(dreConfig.metaDiariaFundo)} × {diasRestantes} dias
              </p>
            </div>
          </div>

          {/* Formula explanation */}
          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="font-medium text-foreground mb-2">Fórmulas Aplicadas</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>Separação CMV:</strong> Venda do dia × {dreConfig.percentualCMV}%
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>Separação Despesas:</strong> {formatCurrency(rateioDiarioDespesas)} por dia
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>Separação Fundo:</strong> {formatCurrency(dreConfig.metaDiariaFundo)} por dia
              </p>
              <p className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>Sobras:</strong> Venda - CMV - Despesas - Fundo
              </p>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <ResetSistemaDialog onConfirm={handleReset} />
          <Button size="lg" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </div>

      <TaxasDialog open={isTaxasDialogOpen} onOpenChange={setIsTaxasDialogOpen} />
    </MainLayout>
  );
}
