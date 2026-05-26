'use client';

import { Activity, Command, Search, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  symbol: string;
  onOpenPalette: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function TopBar({ symbol, onOpenPalette, onRefresh, refreshing }: Props) {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-bg-panel px-4 py-2.5">
      <div className="flex items-center gap-2 font-mono">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-accent-cyan/10 text-accent-cyan">
          <Activity className="h-4 w-4" strokeWidth={2.4} />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">AI QUANT RESEARCH TERMINAL</div>
          <div className="text-2xs uppercase tracking-[0.18em] text-text-dim">
            multi-agent · explainable · realtime · v0.1
          </div>
        </div>
      </div>

      <button
        onClick={onOpenPalette}
        className="ml-6 flex flex-1 items-center gap-3 rounded border border-border bg-bg-raised px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-accent-cyan/40"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="font-mono">
          {symbol ? <span className="text-text">{symbol}</span> : 'Search a symbol...'}
        </span>
        <span className="ml-auto flex items-center gap-1 text-2xs uppercase tracking-[0.18em] text-text-dim">
          <Command className="h-3 w-3" /> K
        </span>
      </button>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className={cn(
          'flex items-center gap-1.5 rounded border border-border bg-bg-raised px-3 py-1.5 text-2xs uppercase tracking-[0.18em] text-text-muted hover:border-accent-cyan/40',
          refreshing && 'opacity-60',
        )}
      >
        <RefreshCcw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
        Re-run
      </button>
    </header>
  );
}
