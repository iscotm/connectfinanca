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
    default: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:shadow-blue-500/20',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:shadow-emerald-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:shadow-amber-500/20',
    danger: 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:shadow-rose-500/20',
  }[variant];

  const glowConfig = {
    default: 'from-blue-600/10 to-transparent',
    success: 'from-emerald-600/10 to-transparent',
    warning: 'from-amber-600/10 to-transparent',
    danger: 'from-rose-600/10 to-transparent',
  }[variant];

  return (
    <div className={cn(
      'glass-card-interactive rounded-[28px] p-6 shadow-xl flex flex-col justify-between min-h-[160px] relative overflow-hidden group cursor-default',
      className
    )}>
      {/* Subtle corner radial glow */}
      <div className={cn('absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br blur-2xl pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-300', glowConfig)} />

      <div className="flex justify-between items-start relative z-10">
        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest font-jakarta">{title}</p>
        {Icon && (
          <div className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center shadow-md border transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg',
            iconConfig
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between mt-4 relative z-10">
        <span className="text-2xl font-black text-white tracking-tight font-jakarta">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-[9px] font-bold px-2 py-0.5 rounded-full font-jakarta border flex items-center gap-1',
              trend.isPositive 
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
