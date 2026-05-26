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
  const [streaming, setStreaming] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const h = await api.health();
        if (mounted) setHealth(h);
      } catch {
        if (mounted) setHealth(null);
      }
    };
    void load();
    const id = setInterval(load, 60_000);
    const tick = setInterval(() => setNow(new Date()), 1_000);
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ symbol: string | null }>).detail;
      setStreaming(detail?.symbol ?? null);
    };
    window.addEventListener('aiqrt:streaming', handler as EventListener);
    return () => {
      mounted = false;
      clearInterval(id);
      clearInterval(tick);
      window.removeEventListener('aiqrt:streaming', handler as EventListener);
    };
  }, []);

  const ok = health !== null;

  return (
    <footer className="flex h-7 items-center gap-3 border-t border-white/[0.04] bg-bg-deep/60 px-4 font-mono text-2xs uppercase tracking-[0.18em] text-text-dim backdrop-blur-md">
      <span className="flex items-center gap-1.5">
        <span className={cn('status-dot', ok ? 'text-bias-bull' : 'text-bias-bear')} />
        {ok ? 'Online' : 'Disconnected'}
      </span>
      <Sep />
      <span>v{health?.version ?? '?'}</span>
      <Sep />
      <span>
        mode <span className="text-text">{health?.mode ?? '?'}</span>
      </span>
      <Sep />
      <Service name="llm" value={health?.services?.llm} />
      <Service name="market" value={health?.services?.market} />
      <Service name="cache" value={health?.services?.redis} />
      <Service name="rag" value={health?.services?.rag} />
      {streaming && (
        <span className="ml-2 flex items-center gap-1.5 text-accent-cyan">
          <span className="status-dot text-accent-cyan" />
          streaming {streaming}
        </span>
      )}
      <span className="ml-auto normal-case tracking-normal text-text-muted">
        {now.toISOString().slice(0, 19).replace('T', ' ')} UTC
      </span>
    </footer>
  );
}

function Sep() {
  return <span className="text-text-dim/30">·</span>;
}

function Service({ name, value }: { name: string; value?: string }) {
  return (
    <span>
      {name}{' '}
      <span
        className={cn(
          value === 'real' ? 'text-bias-bull' : value === 'mock' ? 'text-accent-cyan' : 'text-text-muted',
        )}
      >
        {value ?? '?'}
      </span>
    </span>
  );
}
