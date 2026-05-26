'use client';

import { useCallback, useEffect, useState } from 'react';
import { RegimeStrip } from '@/components/layout/RegimeStrip';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { ConsensusTab } from '@/components/tabs/ConsensusTab';
import { ThesisTab } from '@/components/tabs/ThesisTab';
import { ScenariosTab } from '@/components/tabs/ScenariosTab';
import { PlaybookTab } from '@/components/tabs/PlaybookTab';
import { WatcherTab } from '@/components/tabs/WatcherTab';
import { AgentStreamPanel } from '@/components/panels/AgentStream';
import { MarketNarrative } from '@/components/panels/MarketNarrative';
import { ResearchChat } from '@/components/panels/ResearchChat';
import { useAnalysis } from '@/hooks/useAnalysis';
import { cn } from '@/lib/utils';

const TABS = ['overview', 'consensus', 'thesis', 'scenarios', 'playbook', 'watcher'] as const;
type Tab = (typeof TABS)[number];

const DEFAULT_SYMBOL = 'TATAMOTORS';

export default function Terminal() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tab, setTab] = useState<Tab>('overview');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { snapshot, quant, consensus, loading, error, refresh } = useAnalysis(symbol);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = useCallback((s: string) => {
    setSymbol(s);
    setTab('overview');
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <RegimeStrip />
      <TopBar
        symbol={symbol}
        onOpenPalette={() => setPaletteOpen(true)}
        onRefresh={refresh}
        refreshing={loading}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={symbol} onSelect={handleSelect} />

        <main className="grid flex-1 grid-cols-12 overflow-hidden">
          {/* Center column: tabs + tab content */}
          <div className="col-span-12 flex min-w-0 flex-col overflow-hidden xl:col-span-8">
            <nav className="flex items-center gap-1 border-b border-border bg-bg-panel px-3 py-1.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'rounded px-3 py-1 text-2xs uppercase tracking-[0.2em] transition-colors',
                    tab === t
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-text-muted hover:bg-bg-hover hover:text-text',
                  )}
                >
                  {t}
                </button>
              ))}
              {error && (
                <span className="ml-auto text-2xs text-bias-bear">{error.slice(0, 80)}</span>
              )}
            </nav>
            <section className="flex-1 overflow-y-auto bg-bg">
              {!snapshot || !quant ? (
                <div className="grid place-items-center p-12 text-sm text-text-muted">
                  {loading ? 'Loading market snapshot...' : 'Pick a symbol to begin.'}
                </div>
              ) : tab === 'overview' ? (
                <OverviewTab snapshot={snapshot} quant={quant} consensus={consensus} />
              ) : tab === 'consensus' ? (
                <ConsensusTab consensus={consensus} symbol={symbol} />
              ) : tab === 'thesis' ? (
                <ThesisTab consensus={consensus} symbol={symbol} />
              ) : tab === 'scenarios' ? (
                <ScenariosTab consensus={consensus} symbol={symbol} />
              ) : tab === 'playbook' ? (
                <PlaybookTab consensus={consensus} />
              ) : (
                <WatcherTab symbol={symbol} />
              )}
            </section>
          </div>

          {/* Right rail */}
          <aside className="col-span-12 flex min-w-0 flex-col gap-3 overflow-y-auto border-l border-border bg-bg-panel p-3 xl:col-span-4">
            <div className="flex-1 min-h-[280px]">
              <AgentStreamPanel symbol={symbol} />
            </div>
            <MarketNarrative narrative={consensus?.narrative ?? null} />
            <div className="flex-1 min-h-[260px]">
              <ResearchChat symbol={symbol} />
            </div>
          </aside>
        </main>
      </div>
      <StatusBar />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelect={handleSelect}
        current={symbol}
      />
    </div>
  );
}
