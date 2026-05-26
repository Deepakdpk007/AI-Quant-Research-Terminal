'use client';

import type { DecayRow } from '@/lib/types';
import { cn } from '@/lib/utils';

export function SignalDecayTable({ rows }: { rows: DecayRow[] }) {
  if (!rows.length) {
    return <div className="text-xs text-text-muted">No decay signals to display.</div>;
  }
  return (
    <div className="space-y-2 font-mono">
      {rows.map((row) => {
        const pct = (row.score_current / Math.max(row.score_original, 1)) * 100;
        const isHeavy = row.delta_pct < -10;
        return (
          <div key={row.label} className="grid grid-cols-12 gap-3 text-xs">
            <div className="col-span-3 text-2xs uppercase tracking-[0.18em] text-text-dim">
              {row.agent}
            </div>
            <div className="col-span-5 truncate text-text">{row.label}</div>
            <div className="col-span-2 tabular-nums text-text-muted">
              <span className="text-text">{row.score_current.toFixed(0)}</span>
              <span className="ml-1 text-2xs text-text-dim">/ {row.score_original.toFixed(0)}</span>
            </div>
            <div
              className={cn(
                'col-span-2 text-right tabular-nums',
                isHeavy ? 'text-bias-bear' : 'text-text-muted',
              )}
            >
              {row.delta_pct.toFixed(0)}% / {row.days_elapsed.toFixed(1)}d
            </div>
            <div className="col-span-12 h-1 overflow-hidden rounded-full bg-bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isHeavy ? 'bg-bias-bear/60' : 'bg-accent-cyan/60',
                )}
                style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
