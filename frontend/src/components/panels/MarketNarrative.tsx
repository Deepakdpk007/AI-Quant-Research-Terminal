'use client';

import type { Narrative } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MarketNarrative({ narrative }: { narrative: Narrative | null }) {
  if (!narrative) {
    return (
      <section className="panel">
        <header className="panel-header">Market narrative</header>
        <div className="p-3 text-xs text-text-muted">
          Run an analysis to generate the current market narrative.
        </div>
      </section>
    );
  }
  const strength = Math.max(0, Math.min(100, narrative.strength));
  return (
    <section className="panel">
      <header className="panel-header">
        <span>Market narrative</span>
        <span className="text-2xs">
          age {narrative.age_days}d · decay −{narrative.decay_rate.toFixed(1)}%/d
        </span>
      </header>
      <div className="space-y-2 p-3 text-xs">
        <p className="leading-relaxed text-text">{narrative.text}</p>
        <div>
          <div className="flex items-baseline justify-between text-2xs uppercase tracking-[0.18em] text-text-dim">
            <span>narrative strength</span>
            <span className="font-mono text-text">{strength.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-muted">
            <div
              className={cn(
                'h-full rounded-full',
                strength >= 65
                  ? 'bg-accent-cyan'
                  : strength >= 40
                    ? 'bg-accent-amber'
                    : 'bg-bias-bear/70',
              )}
              style={{ width: `${strength}%` }}
            />
          </div>
        </div>
        {narrative.conflicting_signal && (
          <div className="rounded border border-accent-amber/40 bg-accent-amber/5 p-2 text-2xs text-accent-amber">
            ⚠ Conflicting signal: {narrative.conflicting_signal}
          </div>
        )}
      </div>
    </section>
  );
}
