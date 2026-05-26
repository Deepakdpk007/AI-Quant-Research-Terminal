import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}

export function MetricCard({ label, value, hint, trend, className }: MetricCardProps) {
  return (
    <div className={cn('panel px-3 py-2', className)}>
      <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
      <div
        className={cn(
          'mt-1 font-mono text-lg font-medium tabular-nums',
          trend === 'up' && 'text-bias-bull',
          trend === 'down' && 'text-bias-bear',
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 truncate text-2xs text-text-dim">{hint}</div>}
    </div>
  );
}
