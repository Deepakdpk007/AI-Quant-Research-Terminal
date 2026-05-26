'use client';

import { motion } from 'framer-motion';
import { cn, biasPillClass } from '@/lib/utils';
import { Pill } from './Pill';

const AGENT_META: Record<
  string,
  { color: string; bg: string; mark: string; label: string }
> = {
  Macro: {
    color: 'text-accent-violet',
    bg: 'from-accent-violet/20 to-accent-violet/5',
    mark: 'M',
    label: 'macro',
  },
  Sentiment: {
    color: 'text-accent-cyan',
    bg: 'from-accent-cyan/20 to-accent-cyan/5',
    mark: 'S',
    label: 'sentiment',
  },
  Technical: {
    color: 'text-accent-amber',
    bg: 'from-accent-amber/20 to-accent-amber/5',
    mark: 'T',
    label: 'technical',
  },
  Valuation: {
    color: 'text-accent-blue',
    bg: 'from-accent-blue/20 to-accent-blue/5',
    mark: 'V',
    label: 'valuation',
  },
  Risk: {
    color: 'text-bias-bear',
    bg: 'from-bias-bear/20 to-bias-bear/5',
    mark: 'R',
    label: 'risk',
  },
};

export function AgentBadge({
  agent,
  bias,
  score,
  weight,
  delay = 0,
  active,
}: {
  agent: string;
  bias: string;
  score?: number;
  weight?: number;
  delay?: number;
  active?: boolean;
}) {
  const meta = AGENT_META[agent] ?? {
    color: 'text-text-muted',
    bg: 'from-white/10 to-transparent',
    mark: agent[0],
    label: agent.toLowerCase(),
  };
  const variant = biasPillClass(bias).includes('bull')
    ? 'bull'
    : biasPillClass(bias).includes('bear')
      ? 'bear'
      : 'neutral';
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-all',
        'hover:border-white/10 hover:bg-white/[0.04]',
        active && 'ring-1 ring-accent-cyan/40',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br font-display text-sm font-semibold',
          meta.bg,
          meta.color,
        )}
      >
        {meta.mark}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-medium text-text">{agent}</span>
          {weight !== undefined && (
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-2xs tabular text-text-dim">
              {Math.round(weight * 100)}%
            </span>
          )}
        </div>
        {score !== undefined && (
          <div className="mt-0.5 text-2xs text-text-dim">
            score{' '}
            <span className="font-mono tabular text-text-muted">{score.toFixed(0)}</span>
          </div>
        )}
      </div>
      <Pill variant={variant}>{bias}</Pill>
    </motion.div>
  );
}
