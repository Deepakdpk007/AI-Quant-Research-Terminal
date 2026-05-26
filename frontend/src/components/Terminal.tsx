'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Radar, FileText, Zap, Target, Eye } from 'lucide-react';
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

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'consensus', label: 'Consensus', icon: Radar },
  { key: 'thesis', label: 'Thesis', icon: FileText },
  { key: 'scenarios', label: 'Scenarios', icon: Zap },
  { key: 'playbook', label: 'Playbook', icon: Target },
  { key: 'watcher', label: 'Watcher', icon: Eye },
] as const;
type Tab = (typeof TABS)[number]['key'];

const DEFAULT_SYMBOL = 'TATAMOTORS';

export default function Terminal() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tab, setTab] = useState<Tab>('overview');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { snapshot, quant, consensus, loading, error, refresh } = useAnalysis(symbol);

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
    <div className="flex h-screen flex-col overflow-hidden">
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
          {/* Center column */}
          <div className="col-span-12 flex min-w-0 flex-col overflow-hidden xl:col-span-8">
            <nav className="relative flex items-center gap-1 border-b border-white/[0.04] bg-bg-deep/30 px-3 py-1.5 backdrop-blur-md">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-md px-3 py-2 font-display text-2xs font-medium uppercase tracking-[0.2em] transition-colors',
                      active
                        ? 'tab-active text-accent-cyan'
                        : 'text-text-muted hover:bg-white/[0.03] hover:text-text',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    {t.label}
                  </button>
                );
              })}
              {error && (
                <span className="ml-auto truncate font-mono text-2xs text-bias-bear">
                  ⚠ {error.slice(0, 80)}
                </span>
              )}
            </nav>

            <section className="relative flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${symbol}-${tab}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {!snapshot || !quant ? (
                    <LoadingState loading={loading} />
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
                </motion.div>
              </AnimatePresence>
            </section>
          </div>

          {/* Right rail */}
          <aside className="col-span-12 flex min-w-0 flex-col gap-3 overflow-y-auto border-l border-white/[0.04] bg-bg-deep/30 p-3 backdrop-blur-md xl:col-span-4">
            <div className="flex-1 min-h-[260px]">
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

function LoadingState({ loading }: { loading: boolean }) {
  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="panel col-span-12 lg:col-span-8 space-y-3 p-5">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-72" />
        <div className="mt-4 skeleton h-12 w-40" />
        <div className="mt-2 skeleton h-44 w-full" />
      </div>
      <div className="panel col-span-12 lg:col-span-4 space-y-2 p-5">
        <div className="skeleton h-4 w-32" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      </div>
      <div className="col-span-12 text-center text-2xs uppercase tracking-[0.22em] text-text-dim">
        {loading ? 'Loading market snapshot…' : 'Waiting for data'}
      </div>
    </div>
  );
}
