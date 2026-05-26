'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Command } from 'lucide-react';
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
    api
      .universe()
      .then(setUniverse)
      .catch(() => setUniverse(['TATAMOTORS', 'RELIANCE', 'INFY']));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return universe;
    return universe.filter((s) => s.toUpperCase().includes(q));
  }, [universe, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

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

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg/80 px-4 pt-24 backdrop-blur-sm">
      <div className="panel w-full max-w-xl shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-3 py-3">
          <Command className="h-4 w-4 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a symbol or command..."
            className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-text-dim"
          />
          <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">esc</span>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-xs text-text-muted">No matches.</div>
          )}
          {filtered.map((sym, i) => (
            <button
              key={sym}
              className={cn(
                'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                i === activeIdx
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-text hover:bg-bg-hover',
              )}
              onClick={() => {
                onSelect(sym);
                onClose();
              }}
            >
              <span className="font-mono">{sym}</span>
              <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">
                {sym === current ? 'current' : 'analyse'}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-2xs uppercase tracking-[0.18em] text-text-dim">
          <span>↑↓ navigate · ↵ select</span>
          <span>aiqrt://palette</span>
        </div>
      </div>
    </div>
  );
}
