'use client';

import type { AttributionItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AttributionBars({ items }: { items: AttributionItem[] }) {
  if (!items.length) {
    return <div className="text-xs text-text-muted">No attribution available.</div>;
  }
  const max = Math.max(...items.map((i) => Math.abs(i.delta))) || 1;
  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => {
        const pct = (Math.abs(item.delta) / max) * 100;
        const positive = item.delta >= 0;
        return (
          <div key={`${item.label}-${idx}`} className="text-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="truncate text-text">
                <span
                  className={cn(
                    'mr-2 inline-block w-3 text-center font-semibold',
                    positive ? 'text-bias-bull' : 'text-bias-bear',
                  )}
                >
                  {positive ? '+' : '−'}
                </span>
                {item.label}
              </span>
              <span className="font-mono tabular-nums text-text-muted">
                <span
                  className={cn('mr-2 text-2xs', positive ? 'text-bias-bull' : 'text-bias-bear')}
                >
                  {positive ? '+' : ''}
                  {item.delta.toFixed(1)}
                </span>
                <span className="text-2xs uppercase text-text-dim">{item.agent}</span>
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-muted">
              <div
                className={cn(
                  'h-full rounded-full',
                  positive ? 'bg-bias-bull/70' : 'bg-bias-bear/70',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
