'use client';

import { useEffect, useState } from 'react';
import type { Consensus, DecayRow } from '@/lib/types';
import { RadarChart } from '@/components/charts/RadarChart';
import { ConfidenceBar } from '@/components/charts/ConfidenceBar';
import { AttributionBars } from '@/components/charts/AttributionBars';
import { SignalDecayTable } from '@/components/charts/SignalDecay';
import { AgentBadge } from '@/components/shared/AgentBadge';
import { DisagreementAlert } from '@/components/shared/DisagreementAlert';
import { api } from '@/lib/api';

export function ConsensusTab({
  consensus,
  symbol,
}: {
  consensus: Consensus | null;
  symbol: string;
}) {
  const [decay, setDecay] = useState<DecayRow[]>([]);

  useEffect(() => {
    let mounted = true;
    api.decay(symbol).then((rows) => {
      if (mounted) setDecay(rows);
    });
    return () => {
      mounted = false;
    };
  }, [symbol]);

  if (!consensus) {
    return (
      <div className="grid place-items-center p-12 text-sm text-text-muted">
        Run analysis to see the consensus radar and signal attribution.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      <section className="panel col-span-12 lg:col-span-5">
        <header className="panel-header">Consensus radar</header>
        <div className="aspect-square">
          <RadarChart agents={consensus.agent_results} />
        </div>
        <div className="border-t border-border p-3">
          <ConfidenceBar value={consensus.confidence} bias={consensus.consensus} />
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-4">
        <header className="panel-header">Agents</header>
        <div className="space-y-2 p-3">
          {consensus.agent_results.map((a) => (
            <AgentBadge
              key={a.agent}
              agent={a.agent}
              bias={a.bias}
              score={a.score}
              weight={a.weight}
            />
          ))}
        </div>
        <div className="border-t border-border p-3 text-xs text-text-muted">
          {consensus.agent_results.map((a) => (
            <details key={a.agent} className="mb-2 group">
              <summary className="cursor-pointer text-2xs uppercase tracking-[0.18em] text-text-dim group-open:text-text">
                {a.agent} · reasoning
              </summary>
              <p className="mt-1 leading-snug text-text">{a.reasoning}</p>
              <div className="mt-1 flex flex-wrap gap-1 text-2xs">
                {a.signals.map((s) => (
                  <span
                    key={s}
                    className="rounded border border-border bg-bg-raised px-1.5 py-0.5 text-text-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-3">
        <header className="panel-header">Disagreement</header>
        <div className="p-3">
          <DisagreementAlert d={consensus.disagreement} />
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-7">
        <header className="panel-header">
          Explainable AI · signal attribution
          <span className="text-2xs text-text-muted">
            contributors to {consensus.confidence.toFixed(0)}%
          </span>
        </header>
        <div className="p-3">
          <AttributionBars items={consensus.attribution} />
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-5">
        <header className="panel-header">
          Signal decay
          <span className="text-2xs text-text-muted">domain-specific half-lives</span>
        </header>
        <div className="p-3">
          <SignalDecayTable rows={decay} />
        </div>
      </section>
    </div>
  );
}
