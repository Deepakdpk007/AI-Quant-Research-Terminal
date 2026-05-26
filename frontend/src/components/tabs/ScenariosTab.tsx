'use client';

import { useEffect, useState } from 'react';
import type { Consensus, ScenarioResult } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Pill } from '@/components/shared/Pill';

export function ScenariosTab({
  consensus,
  symbol,
}: {
  consensus: Consensus | null;
  symbol: string;
}) {
  const [scenarios, setScenarios] = useState<{ id: string; trigger: string }[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .scenarios()
      .then(setScenarios)
      .catch(() => setScenarios([]));
  }, []);

  const run = async (id: string) => {
    setActive(id);
    setLoading(true);
    setResult(null);
    try {
      const r = await api.scenario(id, symbol);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      <section className="panel col-span-12 lg:col-span-4">
        <header className="panel-header">
          Causal scenarios
          <span className="text-2xs text-text-muted">propagate hypotheticals</span>
        </header>
        <div className="space-y-1 p-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => run(sc.id)}
              className={cn(
                'flex w-full items-center justify-between rounded border px-3 py-2 text-left text-xs transition-colors',
                active === sc.id
                  ? 'border-accent-cyan/40 bg-accent-cyan/5 text-text'
                  : 'border-border bg-bg-raised text-text-muted hover:border-accent-cyan/40 hover:text-text',
              )}
            >
              <div>
                <div className="font-mono">{sc.trigger}</div>
                <div className="text-2xs text-text-dim">{sc.id}</div>
              </div>
              <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">simulate</span>
            </button>
          ))}
          {scenarios.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">No scenarios available.</div>
          )}
        </div>
      </section>

      <section className="panel col-span-12 lg:col-span-8">
        <header className="panel-header">
          Cascade output
          {consensus && (
            <span className="text-2xs text-text-muted">
              base confidence {consensus.confidence.toFixed(0)}%
            </span>
          )}
        </header>
        <div className="p-4 text-sm">
          {!result && !loading && (
            <div className="text-text-muted">
              Pick a scenario on the left to simulate its causal propagation through {symbol}'s
              thesis.
            </div>
          )}
          {loading && <div className="text-text-muted">Propagating effects...</div>}
          {result && (
            <div className="space-y-4">
              <div>
                <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">Trigger</div>
                <div className="mt-0.5 text-base text-text">{result.trigger}</div>
              </div>
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">before</div>
                  <div className="font-mono text-2xl tabular-nums text-text">
                    {result.confidence_before.toFixed(0)}%
                  </div>
                </div>
                <div className="text-2xl text-text-dim">→</div>
                <div>
                  <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">after</div>
                  <div
                    className={cn(
                      'font-mono text-2xl tabular-nums',
                      result.confidence_delta >= 0 ? 'text-bias-bull' : 'text-bias-bear',
                    )}
                  >
                    {result.confidence_after.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">delta</div>
                  <div
                    className={cn(
                      'font-mono text-lg tabular-nums',
                      result.confidence_delta >= 0 ? 'text-bias-bull' : 'text-bias-bear',
                    )}
                  >
                    {result.confidence_delta >= 0 ? '+' : ''}
                    {result.confidence_delta.toFixed(1)}
                  </div>
                </div>
              </div>
              <p className="rounded border border-border bg-bg-raised p-3 text-xs leading-relaxed">
                {result.narrative_update}
              </p>
              <div>
                <div className="mb-2 text-2xs uppercase tracking-[0.18em] text-text-dim">
                  Cascading effects
                </div>
                <div className="space-y-2">
                  {result.effects.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded border border-border bg-bg-raised p-2 text-xs"
                    >
                      <Pill
                        variant={
                          e.direction === 'positive'
                            ? 'bull'
                            : e.direction === 'negative'
                              ? 'bear'
                              : 'neutral'
                        }
                      >
                        {e.direction}
                      </Pill>
                      <div className="flex-1">
                        <div className="font-medium text-text">{e.entity}</div>
                        <div className="text-text-muted">{e.impact}</div>
                      </div>
                      <div className="font-mono text-2xs uppercase tracking-[0.18em] text-text-dim">
                        magnitude {e.magnitude}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
