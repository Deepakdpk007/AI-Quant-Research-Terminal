'use client';

import { Activity, Command, Search, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Props {
  symbol: string;
  onOpenPalette: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function TopBar({ symbol, onOpenPalette, onRefresh, refreshing }: Props) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-white/[0.06] bg-bg-deep/40 px-5 backdrop-blur-md">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/30 via-accent-violet/20 to-accent-fuchsia/20 shadow-glow-cyan">
          <Activity className="h-4 w-4 text-accent-cyan" strokeWidth={2.5} />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
        </div>
        <div className="hidden md:block">
          <div className="font-display text-sm font-semibold tracking-tight text-text">
            <span className="text-gradient-cyan">AI Quant</span>{' '}
            <span className="text-text/90">Research Terminal</span>
          </div>
          <div className="font-mono text-2xs uppercase tracking-[0.22em] text-text-dim">
            multi-agent · explainable · realtime
          </div>
        </div>
      </motion.div>

      {/* Search trigger */}
      <button
        onClick={onOpenPalette}
        className={cn(
          'group ml-4 flex h-10 flex-1 items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 transition-all',
          'hover:border-accent-cyan/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_-8px_rgba(34,211,238,0.4)]',
        )}
      >
        <Search className="h-4 w-4 text-text-dim transition-colors group-hover:text-accent-cyan" />
        <span className="flex-1 text-left font-mono text-sm">
          {symbol ? (
            <>
              <span className="text-text">{symbol}</span>
              <span className="ml-2 text-text-dim/60">— search any symbol</span>
            </>
          ) : (
            <span className="text-text-muted">Search a symbol…</span>
          )}
        </span>
        <span className="hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.18em] text-text-dim md:flex">
          <Command className="h-3 w-3" /> K
        </span>
      </button>

      {/* Re-run */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onRefresh}
        disabled={refreshing}
        className={cn(
          'btn-primary',
          refreshing && 'cursor-wait opacity-70',
        )}
      >
        {refreshing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" />
        )}
        <span className="hidden uppercase tracking-[0.16em] sm:inline">Re-analyse</span>
      </motion.button>
    </header>
  );
}
