'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Consensus, MemoryPoint } from '@/lib/types';
import { MemoryTrajectoryChart } from '@/components/charts/MemoryTrajectory';
import { Pill } from '@/components/shared/Pill';
import { api } from '@/lib/api';
import { biasColor, biasPillClass, cn } from '@/lib/utils';

export function ThesisTab({ consensus, symbol }: { consensus: Consensus | null; symbol: string }) {
  const [memory, setMemory] = useState<MemoryPoint[]>([]);

  useEffect(() => {
    let mounted = true;
    api.memory(symbol).then((m) => {
      if (mounted) setMemory(m.points);
    });
    return () => {
      mounted = false;
    };
  }, [symbol, consensus?.timestamp]);

  if (!consensus) return null;

  const horizons = consensus.multi_horizon;
  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Thesis */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="panel col-span-12 lg:col-span-7 overflow-hidden"
      >
        <header className="panel-header">
          <span>AI Trade Thesis</span>
          <span className={cn('font-mono text-xs font-semibold', biasColor(consensus.consensus))}>
            {consensus.consensus} · {consensus.confidence.toFixed(0)}%
          </span>
        </header>
        <div className="relative px-5 py-4">
          <div className="absolute -left-2 top-4 h-12 w-1 rounded-full bg-gradient-cyan" />
          <p className="text-sm leading-relaxed text-text/95">{consensus.thesis}</p>
        </div>
        <div className="border-t border-white/[0.04] p-4">
          <div className="text-2xs uppercase tracking-[0.2em] text-text-dim">Invalidations</div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {consensus.invalidations.map((inv, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-bias-bear/15 text-2xs text-bias-bear">
                  ✕
                </span>
                <span className="leading-relaxed text-text">{inv}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Memory delta */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="panel col-span-12 lg:col-span-5"
      >
        <header className="panel-header">Memory Delta</header>
        <div className="p-4 text-xs">
          {consensus.memory_delta ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <DeltaStat
                  label="previous"
                  value={
                    consensus.memory_delta.previous_confidence?.toFixed(0) ?? '—'
                  }
                />
                <DeltaStat
                  label="current"
                  value={consensus.memory_delta.current_confidence.toFixed(0)}
                  highlight
                />
                <DeltaStat
                  label="delta"
                  value={
                    (consensus.memory_delta.delta >= 0 ? '+' : '') +
                    consensus.memory_delta.delta.toFixed(1)
                  }
                  trend={consensus.memory_delta.delta >= 0 ? 'up' : 'down'}
                />
              </div>
              <p className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-2xs leading-relaxed text-text-muted">
                {consensus.memory_delta.reason}
              </p>
            </div>
          ) : (
            <div className="text-text-muted">No prior memory found.</div>
          )}
        </div>
      </motion.section>

      {/* Trajectory */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="panel col-span-12"
      >
        <header className="panel-header">
          <span>Confidence Trajectory</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            {memory.length} memory points
          </span>
        </header>
        <div className="aspect-[3.5/1] p-4">
          <MemoryTrajectoryChart points={memory} />
        </div>
      </motion.section>

      {/* Multi-horizon */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="panel col-span-12"
      >
        <header className="panel-header">Multi-horizon View</header>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {(
            [
              ['Intraday', horizons.intraday, '5m / 15m'],
              ['Swing', horizons.swing, 'Daily'],
              ['Positional', horizons.positional, 'Weekly'],
              ['Long-term', horizons.longterm, 'Monthly'],
            ] as const
          ).map(([label, h, hint], i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="panel-interactive rounded-lg border border-white/5 bg-white/[0.02] p-3.5"
            >
              <div className="text-2xs uppercase tracking-[0.2em] text-text-dim">{label}</div>
              <div className="text-2xs text-text-dim/60">{hint}</div>
              <div className={cn('mt-2 font-display text-2xl font-semibold tabular', biasColor(h.bias))}>
                {h.confidence.toFixed(0)}%
              </div>
              <Pill
                className="mt-1.5"
                variant={
                  biasPillClass(h.bias).includes('bull')
                    ? 'bull'
                    : biasPillClass(h.bias).includes('bear')
                      ? 'bear'
                      : 'neutral'
                }
              >
                {h.bias}
              </Pill>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}

function DeltaStat({
  label,
  value,
  highlight,
  trend,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-center">
      <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
      <div
        className={cn(
          'mt-1 font-mono text-xl font-semibold tabular',
          highlight && 'text-gradient-cyan',
          trend === 'up' && 'text-bias-bull',
          trend === 'down' && 'text-bias-bear',
          !highlight && !trend && 'text-text',
        )}
      >
        {value}
      </div>
    </div>
  );
}
