'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Health {
  status: string;
  mode: string;
  version: string;
  services: Record<string, string>;
}

export function StatusBar() {
  const [health, setHealth] = useState<Health | null>(null);
  const [now, setNow] = useState(new Date());
  const [streamingSymbol, setStreamingSymbol] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const h = await api.health();
        if (mounted) setHealth(h);
      } catch {
        /* offline */
      }
    };
    void load();
    const id = setInterval(load, 60_000);
    const tick = setInterval(() => setNow(new Date()), 1_000);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ symbol: string | null }>).detail;
      setStreamingSymbol(detail?.symbol ?? null);
    };
    window.addEventListener('aiqrt:streaming', handler as EventListener);
    return () => {
      mounted = false;
      clearInterval(id);
      clearInterval(tick);
      window.removeEventListener('aiqrt:streaming', handler as EventListener);
    };
  }, []);

  return (
    <footer className="flex items-center gap-3 border-t border-border bg-bg-panel px-4 py-1 text-2xs uppercase tracking-[0.18em] text-text-dim">
      <span className={cn(health ? 'text-bias-bull' : 'text-bias-bear')}>
        ● {health ? 'OK' : 'DISCONNECTED'}
      </span>
      <span>v{health?.version ?? '?'}</span>
      <span>mode: {health?.mode ?? '?'}</span>
      <span>llm: {health?.services?.llm ?? '?'}</span>
      <span>market: {health?.services?.market ?? '?'}</span>
      <span>cache: {health?.services?.redis ?? '?'}</span>
      <span>rag: {health?.services?.rag ?? '?'}</span>
      {streamingSymbol && <span className="text-accent-cyan">streaming {streamingSymbol}...</span>}
      <span className="ml-auto font-mono normal-case">
        {now.toISOString().slice(0, 19).replace('T', ' ')} UTC
      </span>
    </footer>
  );
}
