'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RegimeSnapshot } from '@/lib/types';
import { cn, regimeColor } from '@/lib/utils';

export function RegimeStrip() {
  const [regime, setRegime] = useState<RegimeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await api.regime();
        if (mounted) setRegime(r);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'failed');
      }
    };
    void load();
    const id = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 border-b border-border bg-bg-panel/80 px-4 py-1.5 text-2xs uppercase tracking-[0.2em] text-text-muted backdrop-blur">
      <span
        className={cn(
          'flex items-center gap-1.5 font-medium',
          regime && regimeColor(regime.regime),
        )}
      >
        <span
          className={cn('inline-block h-1.5 w-1.5 animate-pulse-slow rounded-full bg-current')}
        />
        {regime ? regime.regime : '...'}
      </span>
      <span className="text-text-dim">|</span>
      <span>VIX {regime ? regime.vix.toFixed(2) : '--'}</span>
      <span className="text-text-dim">|</span>
      <span>MOMENTUM {regime ? regime.momentum : '--'}</span>
      <span className="text-text-dim">|</span>
      <span>LIQUIDITY {regime ? regime.liquidity : '--'}</span>
      <span className="text-text-dim">|</span>
      <span>BREADTH {regime ? regime.breadth.toFixed(2) : '--'}</span>
      <span className="ml-auto text-2xs italic text-text-dim">
        {error ? `offline (${error.slice(0, 32)})` : regime?.description.slice(0, 80)}
      </span>
    </div>
  );
}
