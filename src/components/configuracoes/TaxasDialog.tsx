import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance } from '@/contexts/FinanceContext';
import { toast } from 'sonner';

interface TaxasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaxasDialog({ open, onOpenChange }: TaxasDialogProps) {
  const { paymentFees, updatePaymentFees } = useFinance();

  const [localFees, setLocalFees] = useState({
    pix: paymentFees.pix.toString(),
    debit: paymentFees.debit.toString(),
    credit: paymentFees.credit.toString(),
  });

  useEffect(() => {
    if (open) {
      setLocalFees({
        pix: paymentFees.pix.toString(),
        debit: paymentFees.debit.toString(),
        credit: paymentFees.credit.toString(),
      });
    }
  }, [open, paymentFees]);

  const handleSave = () => {
    updatePaymentFees({
      pix: parseFloat(localFees.pix) || 0,
      debit: parseFloat(localFees.debit) || 0,
      credit: parseFloat(localFees.credit) || 0,
    });
    toast.success('Taxas atualizadas com sucesso!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Taxas de Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="taxaPix">Taxa Pix (%)</Label>
            <Input
              id="taxaPix"
              type="number"
              step="0.01"
              value={localFees.pix}
              onChange={(e) => setLocalFees({ ...localFees, pix: e.target.value })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 0% (sem taxa para Pix)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxaDebito">Taxa Débito (%)</Label>
            <Input
              id="taxaDebito"
              type="number"
              step="0.01"
              value={localFees.debit}
              onChange={(e) => setLocalFees({ ...localFees, debit: e.target.value })}
              placeholder="1.01"
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 1.01%
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxaCredito">Taxa Crédito (%)</Label>
            <Input
              id="taxaCredito"
              type="number"
              step="0.01"
              value={localFees.credit}
              onChange={(e) => setLocalFees({ ...localFees, credit: e.target.value })}
              placeholder="3.13"
            />
            <p className="text-xs text-muted-foreground">
              Padrão: 3.13%
            </p>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Taxas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
