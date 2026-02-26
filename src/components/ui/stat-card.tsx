import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const isPrimary = variant === 'default';

  return (
    <div className={cn(
      'p-6 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md bg-white',
      isPrimary ? 'border-blue-100 ring-1 ring-blue-50' : 'border-slate-100',
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-jakarta">{title}</p>
        {Icon && (
          <div className={cn(
            'p-2 rounded-lg',
            isPrimary ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className={cn(
          'text-2xl font-black font-jakarta',
          variantStyles[variant]
        )}>
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-bold font-jakarta',
              trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
