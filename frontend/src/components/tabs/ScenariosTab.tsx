'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
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
    api.scenarios().then(setScenarios).catch(() => setScenarios([]));
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
    <div className="grid grid-cols-12 gap-4 p-4">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="panel col-span-12 lg:col-span-4"
      >
        <header className="panel-header">
          <span className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent-amber" strokeWidth={2.5} /> Causal Scenarios
          </span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            {scenarios.length} available
          </span>
        </header>
        <div className="space-y-2 p-3">
          {scenarios.map((sc, i) => (
            <motion.button
              key={sc.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => run(sc.id)}
              className={cn(
                'group flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-all',
                active === sc.id
                  ? 'border-accent-cyan/40 bg-accent-cyan/5 shadow-glow-cyan'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]',
              )}
            >
              <div className="min-w-0">
                <div className={cn('font-display text-sm', active === sc.id ? 'text-text' : 'text-text-muted group-hover:text-text')}>
                  {sc.trigger}
                </div>
                <div className="mt-0.5 font-mono text-2xs text-text-dim/70">{sc.id}</div>
              </div>
              <ArrowRight
                className={cn(
                  'h-4 w-4 shrink-0 transition-all',
                  active === sc.id
                    ? 'translate-x-1 text-accent-cyan'
                    : 'text-text-dim group-hover:translate-x-0.5 group-hover:text-text',
                )}
              />
            </motion.button>
          ))}
          {scenarios.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">No scenarios available.</div>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="panel col-span-12 lg:col-span-8"
      >
        <header className="panel-header">
          <span>Cascade Output</span>
          {consensus && (
            <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
              base confidence{' '}
              <span className="text-text">{consensus.confidence.toFixed(0)}%</span>
            </span>
          )}
        </header>
        <div className="p-5 text-sm">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-muted"
              >
                <Zap className="mb-3 h-10 w-10 text-text-dim/40" strokeWidth={1.2} />
                <div className="text-text">Pick a scenario on the left</div>
                <div className="mt-1 text-xs text-text-dim">
                  We'll simulate its causal propagation through {symbol}'s thesis.
                </div>
              </motion.div>
            )}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="skeleton h-6 w-2/3" />
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-20 w-full" />
              </motion.div>
            )}
            {result && (
              <motion.div
                key={result.scenario_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <div className="text-2xs uppercase tracking-[0.2em] text-text-dim">trigger</div>
                  <div className="mt-1 font-display text-lg font-semibold text-text">
                    {result.trigger}
                  </div>
                </div>

                <div className="flex items-end gap-6">
                  <DeltaStat label="before" value={`${result.confidence_before.toFixed(0)}%`} />
                  <ArrowRight className="mb-2 h-5 w-5 text-text-dim" />
                  <DeltaStat
                    label="after"
                    value={`${result.confidence_after.toFixed(0)}%`}
                    tone={result.confidence_delta >= 0 ? 'bull' : 'bear'}
                  />
                  <DeltaStat
                    label="Δ"
                    value={`${result.confidence_delta >= 0 ? '+' : ''}${result.confidence_delta.toFixed(1)}`}
                    tone={result.confidence_delta >= 0 ? 'bull' : 'bear'}
                    small
                  />
                </div>

                <p className="rounded-lg border border-white/5 bg-white/[0.02] p-3.5 text-xs leading-relaxed text-text/95">
                  {result.narrative_update}
                </p>

                <div>
                  <div className="mb-2 text-2xs uppercase tracking-[0.2em] text-text-dim">
                    cascading effects
                  </div>
                  <div className="space-y-2">
                    {result.effects.map((e, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs"
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
                          <div className="font-display font-medium text-text">{e.entity}</div>
                          <div className="mt-0.5 text-text-muted">{e.impact}</div>
                        </div>
                        <div className="font-mono text-2xs uppercase tracking-[0.18em] text-text-dim">
                          mag {e.magnitude}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}

function DeltaStat({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone?: 'bull' | 'bear';
  small?: boolean;
}) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-[0.2em] text-text-dim">{label}</div>
      <div
        className={cn(
          'mt-0.5 font-mono font-semibold tabular',
          small ? 'text-xl' : 'text-3xl',
          tone === 'bull' && 'text-bias-bull',
          tone === 'bear' && 'text-bias-bear',
          !tone && 'text-text',
        )}
      >
        {value}
      </div>
    </div>
  );
}
