'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Command, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  current?: string;
}

export function CommandPalette({ open, onClose, onSelect, current }: Props) {
  const [query, setQuery] = useState('');
  const [universe, setUniverse] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    api.universe().then(setUniverse).catch(() => setUniverse(['TATAMOTORS', 'RELIANCE', 'INFY']));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return universe;
    return universe.filter((s) => s.toUpperCase().includes(q));
  }, [universe, query]);

  useEffect(() => setActiveIdx(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => (i + 1) % Math.max(filtered.length, 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
      }
      if (e.key === 'Enter') {
        const sym = filtered[activeIdx];
        if (sym) {
          onSelect(sym);
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIdx, onSelect, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-bg-deep/80 px-4 pt-32 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="panel panel-elevated w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
              <Search className="h-4 w-4 text-text-dim" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a symbol…"
                className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-text-dim/60"
              />
              <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.18em] text-text-dim">
                esc
              </span>
            </div>
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-text-muted">No matches.</div>
              )}
              {filtered.map((sym, i) => (
                <button
                  key={sym}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => {
                    onSelect(sym);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors',
                    i === activeIdx
                      ? 'bg-accent-cyan/8 text-text'
                      : 'text-text-muted hover:bg-white/[0.03]',
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md font-mono text-2xs font-semibold',
                        i === activeIdx
                          ? 'bg-accent-cyan/15 text-accent-cyan'
                          : 'bg-white/[0.04] text-text-dim',
                      )}
                    >
                      {sym.slice(0, 2)}
                    </span>
                    <span className="font-display text-sm">{sym}</span>
                  </span>
                  <span className="flex items-center gap-2 text-2xs uppercase tracking-[0.18em] text-text-dim">
                    {sym === current ? 'current' : 'open'}
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 font-mono text-2xs uppercase tracking-[0.18em] text-text-dim">
              <span className="flex items-center gap-3">
                <Kbd>↑↓</Kbd> navigate
                <Kbd>↵</Kbd> select
              </span>
              <span className="flex items-center gap-1.5 text-accent-cyan/70">
                <Command className="h-3 w-3" /> aiqrt://palette
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono normal-case tracking-normal text-text-muted">
      {children}
    </span>
  );
}
