import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useFinance, DailySalesEntry } from '@/contexts/FinanceContext';

interface CaixaDiaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: number | null;
  monthName: string;
  onSave: (data: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
    totalLiquido: number;
  }) => void;
  existingData?: DailySalesEntry;
}

export function CaixaDiaDialog({
  open,
  onOpenChange,
  selectedDay,
  monthName,
  onSave,
  existingData,
}: CaixaDiaDialogProps) {
  const { paymentFees, dreConfig, rateioDiarioDespesas } = useFinance();

  const [values, setValues] = useState({
    dinheiro: '',
    pix: '',
    debito: '',
    credito: '',
  });

  // Load existing data when dialog opens
  useEffect(() => {
    if (open && existingData) {
      setValues({
        dinheiro: existingData.dinheiro ? existingData.dinheiro.toString() : '',
        pix: existingData.pix ? existingData.pix.toString() : '',
        debito: existingData.debito ? existingData.debito.toString() : '',
        credito: existingData.credito ? existingData.credito.toString() : '',
      });
    } else if (open && !existingData) {
      setValues({ dinheiro: '', pix: '', debito: '', credito: '' });
    }
  }, [open, existingData]);

  // Calculate net values
  const calculations = useMemo(() => {
    const dinheiro = parseFloat(values.dinheiro) || 0;
    const pixBruto = parseFloat(values.pix) || 0;
    const debitoBruto = parseFloat(values.debito) || 0;
    const creditoBruto = parseFloat(values.credito) || 0;

    const pixLiquido = pixBruto - (pixBruto * paymentFees.pix / 100);
    const debitoLiquido = debitoBruto - (debitoBruto * paymentFees.debit / 100);
    const creditoLiquido = creditoBruto - (creditoBruto * paymentFees.credit / 100);

    const totalLiquido = dinheiro + pixLiquido + debitoLiquido + creditoLiquido;

    // Only calculate separations if there are sales
    const hasInput = totalLiquido > 0;
    const cmv = hasInput ? totalLiquido * (dreConfig.percentualCMV / 100) : 0;
    const despesas = hasInput ? rateioDiarioDespesas : 0;
    const fundo = hasInput ? dreConfig.metaDiariaFundo : 0;
    const sobras = hasInput ? totalLiquido - cmv - despesas - fundo : 0;

    return {
      dinheiro,
      pixBruto,
      pixLiquido,
      debitoBruto,
      debitoLiquido,
      creditoBruto,
      creditoLiquido,
      totalLiquido,
      cmv,
      despesas,
      fundo,
      sobras,
    };
  }, [values, paymentFees, dreConfig, rateioDiarioDespesas]);

  const handleClear = () => {
    setValues({ dinheiro: '', pix: '', debito: '', credito: '' });
  };

  const handleSave = () => {
    onSave({
      dinheiro: calculations.dinheiro,
      pix: calculations.pixBruto,
      debito: calculations.debitoBruto,
      credito: calculations.creditoBruto,
      totalLiquido: calculations.totalLiquido,
    });
    handleClear();
    onOpenChange(false);
  };

  const handleSendToBank = (type: string) => {
    // Future integration - show toast for now
    console.log(`Enviando ${type} para banco`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Caixa do Dia {selectedDay} - {monthName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Payment Values */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">
              Valores Recebidos
            </h3>

            {/* Dinheiro */}
            <div className="space-y-2">
              <Label htmlFor="dinheiro">Dinheiro</Label>
              <Input
                id="dinheiro"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={values.dinheiro}
                onChange={(e) => setValues({ ...values, dinheiro: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Líquido: {formatCurrency(calculations.dinheiro)}
              </p>
            </div>

            {/* Pix */}
            <div className="space-y-2">
              <Label htmlFor="pix">Pix (Taxa: {paymentFees.pix}%)</Label>
              <Input
                id="pix"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={values.pix}
                onChange={(e) => setValues({ ...values, pix: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Líquido: {formatCurrency(calculations.pixLiquido)}
              </p>
            </div>

            {/* Débito */}
            <div className="space-y-2">
              <Label htmlFor="debito">Débito (Taxa: {paymentFees.debit}%)</Label>
              <Input
                id="debito"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={values.debito}
                onChange={(e) => setValues({ ...values, debito: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Líquido: {formatCurrency(calculations.debitoLiquido)}
              </p>
            </div>

            {/* Crédito */}
            <div className="space-y-2">
              <Label htmlFor="credito">Crédito (Taxa: {paymentFees.credit}%)</Label>
              <Input
                id="credito"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={values.credito}
                onChange={(e) => setValues({ ...values, credito: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Líquido: {formatCurrency(calculations.creditoLiquido)}
              </p>
            </div>
          </div>

          {/* Right Column - Automatic Separation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b pb-2">
              Separação Automática
            </h3>

            {/* Total Líquido */}
            <div className="separation-card-total p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">TOTAL LÍQUIDO</p>
                  <p className="text-2xl font-bold">{formatCurrency(calculations.totalLiquido)}</p>
                </div>
              </div>
            </div>

            {/* CMV */}
            <div className="separation-card-cmv p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">CMV ({dreConfig.percentualCMV || 0}%)</p>
                  <p className="text-xl font-bold">{formatCurrency(calculations.cmv)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendToBank('CMV')}
                  className="border-current"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {dreConfig.bancoCMV || 'Banco'}
                </Button>
              </div>
            </div>

            {/* Despesas */}
            <div className="separation-card-expenses p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">DESPESAS (Rateio)</p>
                  <p className="text-xl font-bold">{formatCurrency(calculations.despesas)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendToBank('Despesas')}
                  className="border-current"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {dreConfig.bancoDespesas || 'Banco'}
                </Button>
              </div>
            </div>

            {/* Fundo */}
            <div className="separation-card-fund p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">FUNDO DE CAIXA</p>
                  <p className="text-xl font-bold">{formatCurrency(calculations.fundo)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendToBank('Fundo')}
                  className="border-current"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {dreConfig.bancoFundo || 'Banco'}
                </Button>
              </div>
            </div>

            {/* Sobras */}
            <div className={`p-4 rounded-lg ${calculations.sobras >= 0 ? 'separation-card-total' : 'separation-card-expenses'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">SOBRAS</p>
                  <p className="text-xl font-bold">{formatCurrency(calculations.sobras)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendToBank('Sobras')}
                  className="border-current"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {dreConfig.bancoSobras || 'Banco'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClear}
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={handleSave}>
            Salvar e Processar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
