'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Consensus, DecayRow } from '@/lib/types';
import { ConsensusOrb } from '@/components/charts/ConsensusOrb';
import { RadarChart } from '@/components/charts/RadarChart';
import { AttributionBars } from '@/components/charts/AttributionBars';
import { SignalDecayTable } from '@/components/charts/SignalDecay';
import { AgentBadge } from '@/components/shared/AgentBadge';
import { DisagreementAlert } from '@/components/shared/DisagreementAlert';
import { api } from '@/lib/api';

export function ConsensusTab({ consensus, symbol }: { consensus: Consensus | null; symbol: string }) {
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
    <div className="grid grid-cols-12 gap-4 p-4">
      {/* Hero — orb + radar side-by-side */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="panel col-span-12 lg:col-span-7 overflow-hidden"
      >
        <header className="panel-header">
          <span>Consensus</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            5-agent weighted aggregation
          </span>
        </header>
        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="flex items-center justify-center">
            <ConsensusOrb
              confidence={consensus.confidence}
              bias={consensus.consensus}
              agents={consensus.agent_results}
              size={260}
            />
          </div>
          <div className="flex items-center justify-center">
            <RadarChart agents={consensus.agent_results} size={300} />
          </div>
        </div>
      </motion.section>

      {/* Agents */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="panel col-span-12 lg:col-span-5"
      >
        <header className="panel-header">
          <span>Agents</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            specialist reasoning · weighted
          </span>
        </header>
        <div className="space-y-2 p-3">
          {consensus.agent_results.map((a, i) => (
            <AgentBadge
              key={a.agent}
              agent={a.agent}
              bias={a.bias}
              score={a.score}
              weight={a.weight}
              delay={i * 0.06}
            />
          ))}
        </div>
        <div className="border-t border-white/[0.04] p-3 text-xs text-text-muted">
          {consensus.agent_results.map((a) => (
            <details key={a.agent} className="group mb-2 last:mb-0">
              <summary className="cursor-pointer list-none text-2xs uppercase tracking-[0.2em] text-text-dim transition-colors hover:text-text">
                <span className="inline-block w-3 transition-transform group-open:rotate-90">
                  ›
                </span>{' '}
                {a.agent} · reasoning
              </summary>
              <div className="ml-4 mt-1 border-l border-white/[0.06] pl-3">
                <p className="leading-relaxed text-text/90">{a.reasoning}</p>
                <div className="mt-1.5 flex flex-wrap gap-1 text-2xs">
                  {a.signals.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-white/10 bg-white/[0.02] px-1.5 py-0.5 font-mono text-text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </motion.section>

      {/* Disagreement */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="panel col-span-12 lg:col-span-5"
      >
        <header className="panel-header">Disagreement</header>
        <div className="p-3">
          <DisagreementAlert d={consensus.disagreement} />
        </div>
      </motion.section>

      {/* Attribution */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="panel col-span-12 lg:col-span-7"
      >
        <header className="panel-header">
          <span>Explainable Attribution</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            contributors to {consensus.confidence.toFixed(0)}%
          </span>
        </header>
        <div className="p-3.5">
          <AttributionBars items={consensus.attribution} />
        </div>
      </motion.section>

      {/* Signal decay */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="panel col-span-12"
      >
        <header className="panel-header">
          <span>Signal Decay</span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            domain-specific half-lives
          </span>
        </header>
        <div className="p-3.5">
          <SignalDecayTable rows={decay} />
        </div>
      </motion.section>
    </div>
  );
}
