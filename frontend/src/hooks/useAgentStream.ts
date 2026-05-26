'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { AgentResult, Consensus } from '@/lib/types';

export interface StreamLine {
  id: string;
  agent: string;
  bias: string;
  score: number;
  reasoning: string;
  ts: string;
}

interface State {
  lines: StreamLine[];
  consensus: Consensus | null;
  streaming: boolean;
  error: string | null;
}

export function useAgentStream() {
  const [state, setState] = useState<State>({
    lines: [],
    consensus: null,
    streaming: false,
    error: null,
  });
  const esRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setState((s) => ({ ...s, streaming: false }));
  }, []);

  const start = useCallback(
    (symbol: string) => {
      stop();
      setState({ lines: [], consensus: null, streaming: true, error: null });

      const es = new EventSource(api.streamUrl(symbol));
      esRef.current = es;

      es.addEventListener('agent_result', (event: MessageEvent) => {
        try {
          const wrapper = JSON.parse(event.data);
          const data = wrapper.data as AgentResult;
          const line: StreamLine = {
            id: `${data.agent}-${wrapper.timestamp}`,
            agent: data.agent,
            bias: data.bias,
            score: data.score,
            reasoning: data.reasoning,
            ts: wrapper.timestamp ?? new Date().toISOString(),
          };
          setState((s) => ({ ...s, lines: [...s.lines, line] }));
        } catch {
          /* swallow malformed event */
        }
      });

      es.addEventListener('consensus', (event: MessageEvent) => {
        try {
          const consensus = JSON.parse(event.data) as Consensus;
          setState((s) => ({ ...s, consensus, streaming: false }));
        } catch {
          /* ignore */
        }
        es.close();
      });

      es.onerror = () => {
        setState((s) => ({ ...s, streaming: false, error: 'Stream connection lost' }));
        es.close();
      };
    },
    [stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { ...state, start, stop };
}
