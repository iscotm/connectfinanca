import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';

interface ResetSistemaDialogProps {
  onConfirm: () => void;
  customTrigger?: ReactNode;
}

export function ResetSistemaDialog({ onConfirm, customTrigger }: ResetSistemaDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {customTrigger ? (
          customTrigger
        ) : (
          <Button
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset total
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar o sistema?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso vai apagar todos os dados salvos neste navegador (despesas, boletos, vendas diárias e
            configurações DRE). Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Resetar agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
