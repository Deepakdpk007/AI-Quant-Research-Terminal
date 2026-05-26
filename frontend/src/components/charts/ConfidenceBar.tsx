'use client';

import { cn, biasColor } from '@/lib/utils';

export function ConfidenceBar({ value, bias }: { value: number; bias: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = bias.includes('Bull')
    ? 'bg-bias-bull'
    : bias.includes('Bear')
      ? 'bg-bias-bear'
      : 'bg-bias-neutral';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between font-mono">
        <span className="text-2xs uppercase tracking-[0.2em] text-text-dim">
          Consensus confidence
        </span>
        <span className={cn('text-3xl font-semibold tabular-nums', biasColor(bias))}>
          {pct.toFixed(0)}
          <span className="text-base text-text-muted">%</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-2xs text-text-dim">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
