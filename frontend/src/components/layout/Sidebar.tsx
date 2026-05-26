'use client';

import { useEffect, useState } from 'react';
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
    <aside className="flex w-56 flex-col border-r border-border bg-bg-panel">
      <div className="panel-header">Watchlist</div>
      <div className="flex-1 overflow-y-auto py-1">
        {loading && <div className="px-3 py-2 text-2xs text-text-dim">Loading...</div>}
        {universe.map((sym) => {
          const q = quotes[sym];
          const isActive = sym === active;
          const change = q?.change_pct ?? 0;
          return (
            <button
              key={sym}
              onClick={() => onSelect(sym)}
              className={cn(
                'group flex w-full items-center justify-between border-l-2 px-3 py-2 text-left transition-colors',
                isActive
                  ? 'border-accent-cyan bg-accent-cyan/5 text-text'
                  : 'border-transparent text-text-muted hover:border-border-strong hover:bg-bg-hover',
              )}
            >
              <div>
                <div className="font-mono text-sm">{sym}</div>
                <div className="text-2xs text-text-dim">{q?.exchange ?? '...'}</div>
              </div>
              <div className="text-right font-mono text-2xs">
                <div className={cn('tabular-nums', isActive ? 'text-text' : 'text-text-muted')}>
                  {q ? q.price.toFixed(2) : '...'}
                </div>
                <div
                  className={cn(
                    'tabular-nums',
                    change > 0 ? 'text-bias-bull' : change < 0 ? 'text-bias-bear' : 'text-text-dim',
                  )}
                >
                  {q ? formatPct(change) : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="border-t border-border p-3 text-2xs leading-relaxed text-text-dim">
        <div className="mb-1 font-medium uppercase tracking-[0.18em] text-text-muted">
          Disclaimer
        </div>
        Educational use only. Outputs may be derived from synthetic data when in mock mode. Not
        financial advice.
      </div>
    </aside>
  );
}
