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
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  overdue: {
    label: 'Atrasado',
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  processed: {
    label: 'Processado',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  future: {
    label: 'Futuro',
    className: 'bg-slate-900 text-slate-400 border-slate-800',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
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
