'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, FileText, Sparkles } from 'lucide-react';
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
  'How does JLR margin trajectory look over the next two quarters?',
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
      setTurns((t) =>
        t.map((tt) => (tt === turn ? { ...tt, answer: ans, loading: false } : tt)),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'failed';
      setTurns((t) =>
        t.map((tt) => (tt === turn ? { ...tt, error: message, loading: false } : tt)),
      );
    }
  };

  return (
    <section className="panel flex min-h-0 flex-col">
      <header className="panel-header">
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-accent-violet" strokeWidth={2.5} />
          Research Chat
        </span>
        <span className="rounded-md bg-accent-violet/10 px-1.5 py-0.5 font-mono text-2xs uppercase tracking-[0.18em] text-accent-violet">
          rag · {symbol}
        </span>
      </header>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3 text-xs">
        {turns.length === 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-2xs uppercase tracking-[0.2em] text-text-dim">
              <Sparkles className="h-3 w-3" />
              suggested questions
            </div>
            <div className="space-y-1.5">
              {SUGGESTED.map((q, i) => (
                <motion.button
                  key={q}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => ask(q)}
                  className="block w-full rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left text-xs text-text-muted transition-all hover:border-accent-violet/30 hover:bg-accent-violet/5 hover:text-text"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {turns.map((t, i) => (
            <div key={i} className="space-y-1.5">
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border border-white/5 bg-white/[0.04] px-3 py-2"
              >
                <span className="text-2xs uppercase tracking-[0.18em] text-text-dim">you</span>
                <div className="mt-0.5 text-text">{t.question}</div>
              </motion.div>
              {t.loading && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-2xs text-text-dim">
                  <span className="status-dot text-accent-violet" />
                  retrieving + synthesising…
                </div>
              )}
              {t.error && (
                <div className="rounded-lg border border-bias-bear/30 bg-bias-bear/5 px-3 py-2 text-bias-bear">
                  {t.error}
                </div>
              )}
              {t.answer && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-accent-violet/25 bg-gradient-to-br from-accent-violet/10 via-accent-violet/[0.03] to-transparent p-3"
                >
                  <span className="text-2xs uppercase tracking-[0.18em] text-accent-violet">
                    ✦ rag synthesis
                  </span>
                  <p className="mt-1 leading-relaxed text-text/95">{t.answer.answer}</p>
                  {t.answer.sources.length > 0 && (
                    <div className="mt-2.5 space-y-1">
                      {t.answer.sources.slice(0, 3).map((s, idx) => (
                        <div
                          key={s.chunk_id}
                          className="rounded-md border border-white/5 bg-white/[0.02] p-2 text-2xs"
                        >
                          <div className="flex items-center justify-between text-text-dim">
                            <span>source {idx + 1}</span>
                            <span className="font-mono">score {s.score.toFixed(2)}</span>
                          </div>
                          <div className="mt-1 line-clamp-3 leading-relaxed text-text-muted">
                            {s.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
        className={cn(
          'flex items-center gap-2 border-t border-white/[0.04] p-2',
        )}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a research question…"
          className="flex-1 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs outline-none transition-colors placeholder:text-text-dim/60 focus:border-accent-violet/40 focus:bg-white/[0.04]"
        />
        <button
          type="submit"
          className="btn-ghost"
          disabled={!input.trim()}
        >
          <Send className="h-3 w-3" /> ask
        </button>
      </form>
    </section>
  );
}
