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
  const iconConfig = {
    default: 'bg-slate-900/60 border border-slate-800 text-slate-400',
    success: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
    danger: 'bg-rose-500/10 border border-rose-500/20 text-rose-400',
  }[variant];

  return (
    <div className={cn(
      'glass-panel rounded-[28px] p-6 shadow-xl glass-card-hover border border-slate-900/50 flex flex-col justify-between min-h-[160px]',
      className
    )}>
      <div className="flex justify-between items-start">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-jakarta">{title}</p>
        {Icon && (
          <div className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border',
            iconConfig
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-4">
        <span className="text-2xl font-extrabold text-white tracking-tight font-jakarta">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[9px] font-bold px-2 py-0.5 rounded-full font-jakarta border flex items-center gap-1',
              trend.isPositive 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/10' 
                : 'text-rose-400 bg-rose-500/10 border-rose-500/10'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
