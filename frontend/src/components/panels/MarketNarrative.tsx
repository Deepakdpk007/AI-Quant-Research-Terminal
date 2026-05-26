'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { Narrative } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MarketNarrative({ narrative }: { narrative: Narrative | null }) {
  if (!narrative) {
    return (
      <section className="panel">
        <header className="panel-header">Market Narrative</header>
        <div className="p-3 text-xs text-text-muted">
          Run an analysis to generate the current market narrative.
        </div>
      </section>
    );
  }
  const strength = Math.max(0, Math.min(100, narrative.strength));
  const color = strength >= 65 ? '#22d3ee' : strength >= 40 ? '#fbbf24' : '#f43f5e';

  return (
    <section className="panel">
      <header className="panel-header">
        <span>Market Narrative</span>
        <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
          age <span className="text-text">{narrative.age_days}d</span>
          <span className="mx-1.5 text-text-dim/40">·</span>
          decay <span className="text-text">−{narrative.decay_rate.toFixed(1)}%/d</span>
        </span>
      </header>
      <div className="space-y-3 p-3">
        <p className="text-xs leading-relaxed text-text">{narrative.text}</p>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-2xs uppercase tracking-[0.2em] text-text-dim">strength</span>
            <span className="font-mono text-sm font-semibold tabular" style={{ color }}>
              {strength.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${strength}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'h-full rounded-full',
                strength >= 65
                  ? 'bg-gradient-to-r from-accent-cyan/50 to-accent-cyan'
                  : strength >= 40
                    ? 'bg-gradient-to-r from-accent-amber/50 to-accent-amber'
                    : 'bg-gradient-to-r from-bias-bear/50 to-bias-bear',
              )}
            />
          </div>
        </div>

        {narrative.conflicting_signal && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-lg border border-accent-amber/30 bg-accent-amber/5 p-2 text-2xs text-accent-amber"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            <span className="leading-relaxed">{narrative.conflicting_signal}</span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
