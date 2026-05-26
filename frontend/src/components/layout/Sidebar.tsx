'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import type { Quote } from '@/lib/types';
import { cn, formatPct } from '@/lib/utils';

interface Props {
  active: string;
  onSelect: (symbol: string) => void;
}

export function Sidebar({ active, onSelect }: Props) {
  const [universe, setUniverse] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await api.universe();
        if (!mounted) return;
        setUniverse(list);
        const fetched = await Promise.allSettled(list.map((s) => api.market(s)));
        if (!mounted) return;
        const map: Record<string, Quote> = {};
        fetched.forEach((res, i) => {
          if (res.status === 'fulfilled') map[list[i]] = res.value.quote;
        });
        setQuotes(map);
      } catch {
        /* offline */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/[0.04] bg-bg-deep/30 backdrop-blur-md">
      <div className="flex h-10 items-center justify-between border-b border-white/[0.04] px-4">
        <span className="font-mono text-2xs uppercase tracking-[0.22em] text-text-dim">
          watchlist
        </span>
        <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-2xs text-text-muted">
          {universe.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading && (
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        )}
        {!loading &&
          universe.map((sym, idx) => {
            const q = quotes[sym];
            const isActive = sym === active;
            const change = q?.change_pct ?? 0;
            return (
              <motion.button
                key={sym}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onSelect(sym)}
                className={cn(
                  'group relative flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-accent-cyan/10 to-transparent shadow-[inset_2px_0_0_0_#22d3ee]'
                    : 'hover:bg-white/[0.03]',
                )}
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      'font-display text-sm font-medium',
                      isActive ? 'text-text' : 'text-text-muted group-hover:text-text',
                    )}
                  >
                    {sym}
                  </div>
                  <div className="text-2xs text-text-dim/70">{q?.exchange ?? '...'}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={cn(
                      'font-mono text-2xs tabular',
                      isActive ? 'text-text' : 'text-text-muted',
                    )}
                  >
                    {q ? q.price.toFixed(2) : '...'}
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-0.5 font-mono text-2xs tabular',
                      change > 0
                        ? 'text-bias-bull'
                        : change < 0
                          ? 'text-bias-bear'
                          : 'text-text-dim',
                    )}
                  >
                    {change > 0 ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : change < 0 ? (
                      <TrendingDown className="h-2.5 w-2.5" />
                    ) : null}
                    {q ? formatPct(change) : ''}
                  </div>
                </div>
              </motion.button>
            );
          })}
      </div>

      <div className="border-t border-white/[0.04] p-3 text-2xs leading-relaxed text-text-dim/80">
        <div className="mb-1 flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-accent-amber" />
          <span className="font-medium uppercase tracking-[0.18em] text-text-muted">
            Disclaimer
          </span>
        </div>
        Educational use only. Outputs may be derived from synthetic data when in mock mode. Not
        financial advice.
      </div>
    </aside>
  );
}
