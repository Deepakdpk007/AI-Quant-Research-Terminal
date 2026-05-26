'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import type { RegimeSnapshot } from '@/lib/types';
import { cn, regimeColor } from '@/lib/utils';

const REGIME_DOT: Record<string, string> = {
  'RISK-ON': 'text-bias-bull',
  NEUTRAL: 'text-text-muted',
  'RISK-OFF': 'text-accent-amber',
  PANIC: 'text-bias-bear',
};

export function RegimeStrip() {
  const [regime, setRegime] = useState<RegimeSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const r = await api.regime();
        if (mounted) {
          setRegime(r);
          setError(null);
        }
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
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-9 items-center gap-4 border-b border-white/[0.04] bg-bg-deep/60 px-5 font-mono text-2xs uppercase tracking-[0.22em] text-text-muted backdrop-blur-md"
    >
      <span
        className={cn(
          'flex items-center gap-2 font-semibold',
          regime && regimeColor(regime.regime),
        )}
      >
        <span className={cn('status-dot', regime ? REGIME_DOT[regime.regime] : 'text-text-dim')} />
        {regime ? regime.regime : '...'}
      </span>
      <Sep />
      <Stat label="VIX" value={regime ? regime.vix.toFixed(2) : '--'} />
      <Sep />
      <Stat label="Momentum" value={regime?.momentum ?? '--'} />
      <Sep />
      <Stat label="Liquidity" value={regime?.liquidity ?? '--'} />
      <Sep />
      <Stat label="Breadth" value={regime ? regime.breadth.toFixed(2) : '--'} />
      <span className="ml-auto truncate text-text-dim/70 normal-case tracking-normal">
        {error
          ? `offline · ${error.slice(0, 56)}`
          : regime?.description}
      </span>
    </motion.div>
  );
}

function Sep() {
  return <span className="text-text-dim/30">·</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-text-dim/60">{label}</span>
      <span className="text-text">{value}</span>
    </span>
  );
}
