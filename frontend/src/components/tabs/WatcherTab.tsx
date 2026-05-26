'use client';

import { useEffect, useState } from 'react';
import type { WatcherAlert } from '@/lib/types';
import { Pill } from '@/components/shared/Pill';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

const TYPE_VARIANT: Record<string, 'amber' | 'cyan' | 'violet' | 'bull' | 'bear' | 'neutral'> = {
  volume_spike: 'amber',
  news: 'violet',
  regime: 'cyan',
  sentiment: 'bull',
  technical: 'amber',
  flow: 'bear',
  macro: 'neutral',
};

export function WatcherTab({ symbol }: { symbol: string }) {
  const [alerts, setAlerts] = useState<WatcherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .watcherFor(symbol)
      .then((rows) => {
        if (mounted) setAlerts(rows);
      })
      .catch(() => setAlerts([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [symbol]);

  return (
    <div className="grid grid-cols-12 gap-3 p-3">
      <section className="panel col-span-12">
        <header className="panel-header">
          Autonomous watcher
          <span className="text-2xs text-text-muted">background agent — anomaly + event scan</span>
        </header>
        {loading && <div className="p-4 text-sm text-text-muted">Scanning...</div>}
        {!loading && alerts.length === 0 && (
          <div className="p-4 text-sm text-text-muted">No alerts yet for {symbol}.</div>
        )}
        <div className="divide-y divide-border">
          {alerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-2.5 text-xs">
              <span className="w-20 shrink-0 text-2xs uppercase tracking-[0.18em] text-text-dim">
                {timeAgo(a.created_at)}
              </span>
              <Pill variant={TYPE_VARIANT[a.alert_type] ?? 'neutral'}>{a.alert_type}</Pill>
              <span className="flex-1 leading-snug text-text">{a.message}</span>
              <Pill
                variant={
                  a.severity === 'high' || a.severity === 'critical'
                    ? 'bear'
                    : a.severity === 'medium'
                      ? 'amber'
                      : 'neutral'
                }
              >
                {a.severity}
              </Pill>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
