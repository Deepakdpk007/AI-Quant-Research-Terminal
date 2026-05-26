'use client';

import { useState } from 'react';
import { Send, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import type { RagAnswer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  symbol: string;
}

interface Turn {
  question: string;
  answer: RagAnswer | null;
  loading: boolean;
  error?: string;
}

const SUGGESTED = [
  'Summarise the main risks management flagged in the last earnings call.',
  'What is the current EV roadmap?',
  'How does the JLR margin trajectory look over the next two quarters?',
  'Compare valuation versus sector peers.',
];

export function ResearchChat({ symbol }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');

  const ask = async (question: string) => {
    if (!question.trim()) return;
    const turn: Turn = { question, answer: null, loading: true };
    setTurns((t) => [...t, turn]);
    setInput('');
    try {
      const ans = await api.ragQuery(question, symbol);
      setTurns((t) => t.map((tt) => (tt === turn ? { ...tt, answer: ans, loading: false } : tt)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'failed';
      setTurns((t) =>
        t.map((tt) => (tt === turn ? { ...tt, error: message, loading: false } : tt)),
      );
    }
  };

  return (
    <section className="panel flex flex-col">
      <header className="panel-header">
        <span className="flex items-center gap-2">
          <FileText className="h-3 w-3 text-accent-violet" />
          Research chat (RAG)
        </span>
        <span className="text-2xs text-text-dim">grounded · symbol-scoped</span>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 font-mono text-xs">
        {turns.length === 0 && (
          <div className="space-y-2">
            <div className="text-2xs text-text-dim">
              Ask anything grounded in indexed docs. Try one:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => ask(q)}
                  className="rounded border border-border bg-bg-raised px-2 py-1 text-left text-2xs text-text-muted hover:border-accent-cyan/40 hover:text-text"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-1">
            <div className="rounded border border-border bg-bg-raised px-2 py-1 text-text">
              <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">you</span>
              <div className="mt-0.5">{t.question}</div>
            </div>
            {t.loading && (
              <div className="text-2xs text-text-dim">Retrieving + synthesising...</div>
            )}
            {t.error && (
              <div className="rounded border border-bias-bear/40 bg-bias-bear/5 px-2 py-1 text-bias-bear">
                {t.error}
              </div>
            )}
            {t.answer && (
              <div className="rounded border border-accent-violet/30 bg-accent-violet/5 px-2 py-1.5">
                <span className="text-2xs uppercase tracking-[0.18em] text-accent-violet">rag</span>
                <p className="mt-0.5 leading-relaxed">{t.answer.answer}</p>
                {t.answer.sources.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {t.answer.sources.slice(0, 3).map((s, idx) => (
                      <div
                        key={s.chunk_id}
                        className="rounded border border-border bg-bg-panel p-1.5 text-2xs text-text-muted"
                      >
                        <div className="text-text-dim">
                          source {idx + 1} · score {s.score.toFixed(2)}
                        </div>
                        <div className="mt-0.5 line-clamp-3 text-text">{s.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className={cn('flex items-center gap-2 border-t border-border p-2')}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a research question..."
          className="flex-1 rounded border border-border bg-bg-raised px-2 py-1.5 font-mono text-xs outline-none placeholder:text-text-dim focus:border-accent-cyan/40"
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded border border-border bg-bg-raised px-2 py-1.5 text-2xs uppercase tracking-[0.18em] text-text-muted hover:border-accent-cyan/40"
        >
          <Send className="h-3 w-3" /> ask
        </button>
      </form>
    </section>
  );
}
