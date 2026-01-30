import { cn } from '@/lib/utils';

type StatusType = 'paid' | 'pending' | 'overdue' | 'processed' | 'future' | 'completed';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  paid: {
    label: 'Pago',
    className: 'status-paid',
  },
  pending: {
    label: 'Pendente',
    className: 'status-pending',
  },
  overdue: {
    label: 'Atrasado',
    className: 'status-overdue',
  },
  processed: {
    label: 'Processado',
    className: 'status-paid',
  },
  future: {
    label: 'Futuro',
    className: 'bg-muted text-muted-foreground',
  },
  completed: {
    label: 'Concluída',
    className: 'status-paid',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {label || config.label}
    </span>
  );
}
