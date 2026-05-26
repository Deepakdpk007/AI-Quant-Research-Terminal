'use client';

import { useEffect, useRef } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import { cn, biasColor } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface Props {
  symbol: string;
  autoStart?: boolean;
}

export function AgentStreamPanel({ symbol, autoStart = true }: Props) {
  const stream = useAgentStream();
  const listRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef<string | null>(null);

  useEffect(() => {
    if (autoStart && symbol && startedRef.current !== symbol) {
      stream.start(symbol);
      startedRef.current = symbol;
      window.dispatchEvent(new CustomEvent('aiqrt:streaming', { detail: { symbol } }));
    }
  }, [symbol, autoStart, stream]);

  useEffect(() => {
    if (!stream.streaming) {
      window.dispatchEvent(new CustomEvent('aiqrt:streaming', { detail: { symbol: null } }));
    }
  }, [stream.streaming]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [stream.lines, stream.consensus]);

  return (
    <section className="panel flex flex-col">
      <header className="panel-header">
        <span className="flex items-center gap-2">
          <Activity
            className={cn(
              'h-3 w-3',
              stream.streaming ? 'animate-pulse text-accent-cyan' : 'text-text-dim',
            )}
          />
          Agent stream
        </span>
        <button
          onClick={() => stream.start(symbol)}
          className="rounded border border-border px-2 py-0.5 text-2xs uppercase tracking-[0.18em] text-text-muted transition-colors hover:border-accent-cyan/40"
        >
          {stream.streaming ? 'streaming' : 're-stream'}
        </button>
      </header>
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3 font-mono text-xs">
        {stream.lines.length === 0 && !stream.consensus && (
          <div className="text-2xs text-text-dim">Waiting for agent results...</div>
        )}

        {stream.lines.map((line) => (
          <div
            key={line.id}
            className="animate-slide-up rounded border border-border bg-bg-raised p-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">
                [{line.agent}] · {new Date(line.ts).toLocaleTimeString()}
              </span>
              <span className={cn('text-xs font-medium', biasColor(line.bias))}>
                {line.bias} · {line.score.toFixed(0)}
              </span>
            </div>
            <p className="mt-1 leading-snug text-text">{line.reasoning}</p>
          </div>
        ))}

        {stream.consensus && (
          <div className="animate-fade-in rounded border border-accent-cyan/40 bg-accent-cyan/5 p-2">
            <div className="text-2xs uppercase tracking-[0.18em] text-accent-cyan">
              Final consensus
            </div>
            <div className={cn('text-sm font-semibold', biasColor(stream.consensus.consensus))}>
              {stream.consensus.consensus} · {stream.consensus.confidence.toFixed(0)}%
            </div>
            <p className="mt-1 leading-snug text-text">
              {stream.consensus.thesis.slice(0, 240)}...
            </p>
          </div>
        )}

        {stream.error && (
          <div className="rounded border border-bias-bear/40 bg-bias-bear/5 p-2 text-2xs text-bias-bear">
            {stream.error}
          </div>
        )}
      </div>
    </section>
  );
}
