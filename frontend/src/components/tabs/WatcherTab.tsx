'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import type { WatcherAlert } from '@/lib/types';
import { Pill } from '@/components/shared/Pill';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

const TYPE_VARIANT: Record<string, 'amber' | 'cyan' | 'violet' | 'bull' | 'bear' | 'neutral' | 'rose'> = {
  volume_spike: 'amber',
  news: 'violet',
  regime: 'cyan',
  sentiment: 'bull',
  technical: 'amber',
  flow: 'rose',
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
    <div className="grid grid-cols-12 gap-4 p-4">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="panel col-span-12 overflow-hidden"
      >
        <header className="panel-header">
          <span className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-accent-cyan" strokeWidth={2.5} />
            Autonomous Watcher
          </span>
          <span className="font-mono text-2xs normal-case tracking-normal text-text-muted">
            background scan · anomalies + events
          </span>
        </header>
        {loading && (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        )}
        {!loading && alerts.length === 0 && (
          <div className="p-8 text-center text-sm text-text-muted">No alerts yet for {symbol}.</div>
        )}
        <div className="divide-y divide-white/[0.04]">
          {alerts.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <span className="w-20 shrink-0 font-mono text-2xs uppercase tracking-[0.18em] text-text-dim">
                {timeAgo(a.created_at)}
              </span>
              <Pill variant={TYPE_VARIANT[a.alert_type] ?? 'neutral'}>{a.alert_type}</Pill>
              <span className="flex-1 text-xs leading-snug text-text">{a.message}</span>
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
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
