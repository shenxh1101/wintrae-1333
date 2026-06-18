import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const colorClasses = {
  primary: 'from-blue-500 to-primary-600',
  success: 'from-emerald-500 to-success-600',
  warning: 'from-amber-500 to-warning-600',
  danger: 'from-red-500 to-danger-600',
  info: 'from-sky-500 to-blue-600',
};

const iconBgClasses = {
  primary: 'bg-white/20',
  success: 'bg-white/20',
  warning: 'bg-white/20',
  danger: 'bg-white/20',
  info: 'bg-white/20',
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 text-white shadow-card-lg bg-gradient-to-br',
        colorClasses[color],
        className
      )}
    >
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          </div>
          {icon && (
            <div
              className={cn(
                'p-3 rounded-xl',
                iconBgClasses[color]
              )}
            >
              {icon}
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-1 text-sm">
            {trend.isUp ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">
              {trend.isUp ? '+' : ''}{trend.value}%
            </span>
            <span className="text-white/70 ml-1">较上周</span>
          </div>
        )}
      </div>
    </div>
  );
}
