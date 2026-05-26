'use client';

import { useEffect, useState } from 'react';
import type { Consensus, MemoryPoint } from '@/lib/types';
import { MemoryTrajectoryChart } from '@/components/charts/MemoryTrajectory';
import { Pill } from '@/components/shared/Pill';
import { api } from '@/lib/api';
import { biasColor, biasPillClass } from '@/lib/utils';

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
    <div className="grid grid-cols-12 gap-3 p-3">
      <section className="panel col-span-12 lg:col-span-7">
        <header className="panel-header">
          AI trade thesis
          <span className={`text-2xs font-medium ${biasColor(consensus.consensus)}`}>
            {consensus.consensus} · {consensus.confidence.toFixed(0)}%
          </span>
        </header>
        <p className="px-4 py-3 text-sm leading-relaxed text-text">{consensus.thesis}</p>
        <div className="border-t border-border p-3">
          <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">Invalidations</div>
          <ul className="mt-1.5 space-y-1 text-xs text-text">
            {consensus.invalidations.map((inv, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-bias-bear">✗</span>
                <span className="leading-snug">{inv}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-5">
        <header className="panel-header">Memory delta</header>
        <div className="p-3 text-xs">
          {consensus.memory_delta ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-text-dim">previous</span>
                <span className="font-mono">
                  {consensus.memory_delta.previous_confidence?.toFixed(0) ?? '—'}%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-text-dim">current</span>
                <span className="font-mono">
                  {consensus.memory_delta.current_confidence.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-text-dim">delta</span>
                <span
                  className={`font-mono ${consensus.memory_delta.delta >= 0 ? 'text-bias-bull' : 'text-bias-bear'}`}
                >
                  {consensus.memory_delta.delta >= 0 ? '+' : ''}
                  {consensus.memory_delta.delta.toFixed(1)}
                </span>
              </div>
              <p className="rounded border border-border bg-bg-raised p-2 text-2xs text-text-muted">
                {consensus.memory_delta.reason}
              </p>
            </div>
          ) : (
            <div className="text-text-muted">No prior memory found.</div>
          )}
        </div>
      </section>

      <section className="panel col-span-12">
        <header className="panel-header">Confidence trajectory</header>
        <div className="aspect-[3/1]">
          <MemoryTrajectoryChart points={memory} />
        </div>
      </section>

      <section className="panel col-span-12">
        <header className="panel-header">Multi-horizon</header>
        <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
          {(
            [
              ['Intraday', horizons.intraday],
              ['Swing', horizons.swing],
              ['Positional', horizons.positional],
              ['Long-term', horizons.longterm],
            ] as const
          ).map(([label, h]) => (
            <div key={label} className="rounded border border-border bg-bg-raised p-3">
              <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
              <div className={`mt-1 font-mono text-xl tabular-nums ${biasColor(h.bias)}`}>
                {h.confidence.toFixed(0)}%
              </div>
              <Pill
                className="mt-1"
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
