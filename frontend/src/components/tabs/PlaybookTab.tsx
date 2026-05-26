'use client';

import type { Consensus } from '@/lib/types';
import { Pill } from '@/components/shared/Pill';
import { biasColor } from '@/lib/utils';
import { Star } from 'lucide-react';

export function PlaybookTab({ consensus }: { consensus: Consensus | null }) {
  if (!consensus) return null;
  const pb = consensus.playbook;

  const directional = consensus.confidence >= 50;
  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      <section className="panel col-span-12 lg:col-span-7">
        <header className="panel-header">
          Trade playbook
          <span className="text-2xs text-text-muted">{pb.setup}</span>
        </header>
        <div className="space-y-3 p-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">conviction</span>
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < pb.conviction_stars ? 'fill-accent-amber text-accent-amber' : 'text-text-dim'}`}
                />
              ))}
            </span>
            <span className={`text-xs font-medium ${biasColor(consensus.consensus)}`}>
              {consensus.consensus} · {consensus.confidence.toFixed(0)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Entry low" value={pb.entry_low.toFixed(2)} />
            <Stat label="Entry high" value={pb.entry_high.toFixed(2)} />
            <Stat label="Target 1" value={pb.target_1.toFixed(2)} tone="bull" />
            <Stat label="Target 2" value={pb.target_2.toFixed(2)} tone="bull" />
            <Stat label="Stop" value={pb.stop_loss.toFixed(2)} tone="bear" />
            <Stat label="R / R" value={pb.rr_ratio.toFixed(2)} />
            <Stat label="Size %" value={`${pb.position_size_pct.toFixed(1)}%`} />
            <Stat label="Setup" value={directional ? 'Long' : 'Defensive'} />
          </div>
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-5">
        <header className="panel-header">Catalysts</header>
        <ul className="space-y-1.5 px-3 py-3 text-xs">
          {pb.catalysts.map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="mt-0.5 text-bias-bull">✓</span>
              <span className="leading-snug">{c}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-3 py-3">
          <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">Invalidations</div>
          <ul className="mt-1 space-y-1 text-xs">
            {pb.invalidations.map((inv) => (
              <li key={inv} className="flex items-start gap-2">
                <span className="mt-0.5 text-bias-bear">✗</span>
                <span className="leading-snug">{inv}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-border p-3">
          <Pill variant="amber">Educational use only · not financial advice</Pill>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'bull' | 'bear' }) {
  const color =
    tone === 'bull' ? 'text-bias-bull' : tone === 'bear' ? 'text-bias-bear' : 'text-text';
  return (
    <div className="rounded border border-border bg-bg-raised p-3">
      <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">{label}</div>
      <div className={`font-mono text-lg tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
