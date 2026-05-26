'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { Disagreement } from '@/lib/types';
import { cn } from '@/lib/utils';

export function DisagreementAlert({ d }: { d: Disagreement }) {
  return (
    <AnimatePresence mode="wait">
      {!d.flagged ? (
        <motion.div
          key="aligned"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs text-text-muted"
        >
          <span className="status-dot text-bias-bull" />
          <span>Agents broadly aligned — no significant disagreement.</span>
        </motion.div>
      ) : (
        <motion.div
          key="flagged"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'rounded-lg border px-3 py-2.5 text-xs',
            d.severity === 'HIGH'
              ? 'border-bias-bear/30 bg-bias-bear/5 text-bias-bear'
              : d.severity === 'MEDIUM'
                ? 'border-accent-amber/30 bg-accent-amber/5 text-accent-amber'
                : 'border-accent-cyan/30 bg-accent-cyan/5 text-accent-cyan',
          )}
        >
          <div className="flex items-center gap-2 font-medium uppercase tracking-[0.2em]">
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
            Signal divergence · {d.severity}
          </div>
          <div className="mt-1.5 text-xs leading-relaxed text-text">{d.message}</div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-2xs">
            <span className="rounded-md border border-bias-bull/30 bg-bias-bull/10 px-2 py-0.5 text-bias-bull">
              ↑ {d.bull_agents.join(', ') || '—'}
            </span>
            <span className="rounded-md border border-bias-bear/30 bg-bias-bear/10 px-2 py-0.5 text-bias-bear">
              ↓ {d.bear_agents.join(', ') || '—'}
            </span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-text-muted">
              penalty −{Math.round(d.confidence_penalty * 100)}%
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
