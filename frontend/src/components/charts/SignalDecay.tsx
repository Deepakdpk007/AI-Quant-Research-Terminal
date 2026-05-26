'use client';

import { motion } from 'framer-motion';
import type { DecayRow } from '@/lib/types';
import { cn } from '@/lib/utils';

const AGENT_COLOR: Record<string, string> = {
  Sentiment: 'text-accent-cyan border-accent-cyan/30 bg-accent-cyan/10',
  Technical: 'text-accent-amber border-accent-amber/30 bg-accent-amber/10',
  Macro: 'text-accent-violet border-accent-violet/30 bg-accent-violet/10',
  Risk: 'text-bias-bear border-bias-bear/30 bg-bias-bear/10',
  Valuation: 'text-accent-blue border-accent-blue/30 bg-accent-blue/10',
};

export function SignalDecayTable({ rows }: { rows: DecayRow[] }) {
  if (!rows.length) {
    return <div className="text-xs text-text-muted">No decay signals to display.</div>;
  }
  return (
    <div className="space-y-2.5">
      {rows.map((row, idx) => {
        const pct = (row.score_current / Math.max(row.score_original, 1)) * 100;
        const heavy = row.delta_pct < -10;
        return (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="space-y-1.5 text-xs"
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'rounded-md border px-1.5 py-0.5 text-2xs uppercase tracking-[0.15em]',
                  AGENT_COLOR[row.agent] ?? 'border-white/10 bg-white/5 text-text-muted',
                )}
              >
                {row.agent}
              </span>
              <span className="flex-1 truncate text-text">{row.label}</span>
              <span className="flex shrink-0 items-center gap-2 font-mono tabular">
                <span className="text-text">{row.score_current.toFixed(0)}</span>
                <span className="text-text-dim">/ {row.score_original.toFixed(0)}</span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-2xs',
                    heavy
                      ? 'bg-bias-bear/15 text-bias-bear'
                      : 'bg-white/5 text-text-muted',
                  )}
                >
                  {row.delta_pct.toFixed(0)}% · {row.days_elapsed.toFixed(1)}d
                </span>
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
                transition={{ duration: 0.8, delay: idx * 0.06 + 0.15 }}
                className={cn(
                  'h-full rounded-full',
                  heavy
                    ? 'bg-gradient-to-r from-bias-bear/30 to-bias-bear'
                    : 'bg-gradient-to-r from-accent-cyan/30 to-accent-cyan',
                )}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
