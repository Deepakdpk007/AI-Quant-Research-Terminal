'use client';

import { motion } from 'framer-motion';
import { Star, Target, Shield, TrendingUp } from 'lucide-react';
import type { Consensus } from '@/lib/types';
import { Pill } from '@/components/shared/Pill';
import { biasColor, cn } from '@/lib/utils';

export function PlaybookTab({ consensus }: { consensus: Consensus | null }) {
  if (!consensus) return null;
  const pb = consensus.playbook;
  const directional = consensus.confidence >= 50;

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="panel col-span-12 lg:col-span-7 overflow-hidden"
      >
        <header className="panel-header">
          <span className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-accent-cyan" strokeWidth={2.5} />
            Trade Playbook
          </span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            {pb.setup}
          </span>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xs uppercase tracking-[0.2em] text-text-dim">conviction</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 280 }}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      i < pb.conviction_stars
                        ? 'fill-accent-amber text-accent-amber drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                        : 'text-text-dim/30',
                    )}
                  />
                </motion.span>
              ))}
            </span>
            <span className={cn('font-mono text-xs font-semibold', biasColor(consensus.consensus))}>
              {consensus.consensus} · {consensus.confidence.toFixed(0)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="entry low" value={pb.entry_low.toFixed(2)} />
            <Stat label="entry high" value={pb.entry_high.toFixed(2)} />
            <Stat label="target 1" value={pb.target_1.toFixed(2)} tone="bull" icon={<TrendingUp className="h-3 w-3" />} />
            <Stat label="target 2" value={pb.target_2.toFixed(2)} tone="bull" icon={<TrendingUp className="h-3 w-3" />} />
            <Stat label="stop" value={pb.stop_loss.toFixed(2)} tone="bear" icon={<Shield className="h-3 w-3" />} />
            <Stat label="r/r" value={pb.rr_ratio.toFixed(2)} />
            <Stat label="size" value={`${pb.position_size_pct.toFixed(1)}%`} />
            <Stat label="setup" value={directional ? 'Long' : 'Defensive'} />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="panel col-span-12 lg:col-span-5 overflow-hidden"
      >
        <header className="panel-header">Catalysts</header>
        <ul className="space-y-2 px-4 py-3.5 text-xs">
          {pb.catalysts.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-2.5"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-bias-bull/15 text-2xs text-bias-bull">
                ✓
              </span>
              <span className="leading-relaxed text-text">{c}</span>
            </motion.li>
          ))}
        </ul>
        <div className="border-t border-white/[0.04] px-4 py-3.5">
          <div className="text-2xs uppercase tracking-[0.2em] text-text-dim">Invalidations</div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {pb.invalidations.map((inv, i) => (
              <motion.li
                key={inv}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.2 }}
                className="flex items-start gap-2.5"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-bias-bear/15 text-2xs text-bias-bear">
                  ✕
                </span>
                <span className="leading-relaxed text-text">{inv}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="border-t border-white/[0.04] p-3.5">
          <Pill variant="amber">Educational use only · not financial advice</Pill>
        </div>
      </motion.section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: 'bull' | 'bear';
  icon?: React.ReactNode;
}) {
  const color = tone === 'bull' ? 'text-bias-bull' : tone === 'bear' ? 'text-bias-bear' : 'text-text';
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10">
      <div className="flex items-center gap-1 text-2xs uppercase tracking-[0.18em] text-text-dim">
        {icon}
        {label}
      </div>
      <div className={cn('mt-1 font-mono text-xl font-semibold tabular', color)}>{value}</div>
    </div>
  );
}
