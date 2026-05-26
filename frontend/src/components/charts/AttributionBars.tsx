'use client';

import { motion } from 'framer-motion';
import type { AttributionItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const AGENT_TINT: Record<string, string> = {
  Macro: 'text-accent-violet',
  Sentiment: 'text-accent-cyan',
  Technical: 'text-accent-amber',
  Valuation: 'text-accent-blue',
  Risk: 'text-bias-bear',
};

export function AttributionBars({ items }: { items: AttributionItem[] }) {
  if (!items.length) {
    return <div className="text-xs text-text-muted">No attribution available.</div>;
  }
  const max = Math.max(...items.map((i) => Math.abs(i.delta))) || 1;
  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const pct = (Math.abs(item.delta) / max) * 100;
        const positive = item.delta >= 0;
        return (
          <motion.div
            key={`${item.label}-${idx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.04 }}
            className="text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-semibold',
                    positive
                      ? 'bg-bias-bull/15 text-bias-bull'
                      : 'bg-bias-bear/15 text-bias-bear',
                  )}
                >
                  {positive ? '+' : '−'}
                </span>
                <span className="truncate text-text">{item.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 font-mono tabular">
                <span
                  className={cn(
                    'text-2xs font-semibold',
                    positive ? 'text-bias-bull' : 'text-bias-bear',
                  )}
                >
                  {positive ? '+' : ''}
                  {item.delta.toFixed(1)}
                </span>
                <span
                  className={cn(
                    'text-2xs uppercase tracking-[0.18em]',
                    AGENT_TINT[item.agent] ?? 'text-text-dim',
                  )}
                >
                  {item.agent}
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: idx * 0.04 + 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'h-full rounded-full',
                  positive
                    ? 'bg-gradient-to-r from-bias-bull/40 to-bias-bull'
                    : 'bg-gradient-to-r from-bias-bear/40 to-bias-bear',
                )}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
