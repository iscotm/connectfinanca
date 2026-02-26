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
    className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-orange-50 text-orange-600 border-orange-100',
  },
  overdue: {
    label: 'Atrasado',
    className: 'bg-red-50 text-red-600 border-red-100',
  },
  processed: {
    label: 'Processado',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  future: {
    label: 'Futuro',
    className: 'bg-slate-50 text-slate-600 border-slate-100',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border font-jakarta',
        config.className,
        className
      )}
    >
      {label || config.label}
    </span>
  );
}
