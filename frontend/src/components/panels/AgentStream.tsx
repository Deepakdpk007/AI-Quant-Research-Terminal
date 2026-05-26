'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useAgentStream } from '@/hooks/useAgentStream';
import { biasColor, cn } from '@/lib/utils';

const AGENT_TINT: Record<string, string> = {
  Macro: 'border-accent-violet/30 bg-accent-violet/5',
  Sentiment: 'border-accent-cyan/30 bg-accent-cyan/5',
  Technical: 'border-accent-amber/30 bg-accent-amber/5',
  Valuation: 'border-accent-blue/30 bg-accent-blue/5',
  Risk: 'border-bias-bear/30 bg-bias-bear/5',
};

const AGENT_LABEL_TINT: Record<string, string> = {
  Macro: 'text-accent-violet',
  Sentiment: 'text-accent-cyan',
  Technical: 'text-accent-amber',
  Valuation: 'text-accent-blue',
  Risk: 'text-bias-bear',
};

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
    <section className="panel flex min-h-0 flex-col">
      <header className="panel-header">
        <span className="flex items-center gap-2">
          <Activity
            className={cn(
              'h-3.5 w-3.5',
              stream.streaming ? 'animate-pulse text-accent-cyan' : 'text-text-dim',
            )}
            strokeWidth={2.5}
          />
          Agent Stream
        </span>
        <button
          onClick={() => stream.start(symbol)}
          className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-0.5 text-2xs uppercase tracking-[0.18em] text-text-muted transition-all hover:border-accent-cyan/30 hover:text-accent-cyan"
        >
          {stream.streaming ? 'live' : 'replay'}
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {stream.lines.length === 0 && !stream.consensus && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
            <div className="text-center text-2xs uppercase tracking-[0.2em] text-text-dim">
              Waiting for agent results…
            </div>
          </div>
        )}

        <AnimatePresence>
          {stream.lines.map((line, idx) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'rounded-lg border p-2.5 text-xs',
                AGENT_TINT[line.agent] ?? 'border-white/5 bg-white/[0.02]',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-2xs uppercase tracking-[0.18em]',
                    AGENT_LABEL_TINT[line.agent] ?? 'text-text-muted',
                  )}
                >
                  <span className="status-dot" />
                  {line.agent}
                  <span className="text-text-dim/50">·</span>
                  <span className="font-mono text-text-dim/70 normal-case tracking-normal">
                    {new Date(line.ts).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </span>
                <span className={cn('font-mono text-2xs font-semibold tabular', biasColor(line.bias))}>
                  {line.bias} · {line.score.toFixed(0)}
                </span>
              </div>
              <p className="mt-1.5 leading-relaxed text-text">{line.reasoning}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {stream.consensus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-lg border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/10 via-accent-violet/5 to-transparent p-3 shadow-glow-cyan"
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent-cyan/20 blur-3xl" />
            <div className="relative">
              <div className="text-2xs uppercase tracking-[0.2em] text-accent-cyan">
                ✦ final consensus
              </div>
              <div className={cn('mt-1 font-display text-lg font-semibold', biasColor(stream.consensus.consensus))}>
                {stream.consensus.consensus} · {stream.consensus.confidence.toFixed(0)}%
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text/90">
                {stream.consensus.thesis.slice(0, 240)}…
              </p>
            </div>
          </motion.div>
        )}

        {stream.error && (
          <div className="rounded-lg border border-bias-bear/30 bg-bias-bear/5 p-2 text-2xs text-bias-bear">
            {stream.error}
          </div>
        )}
      </div>
    </section>
  );
}
