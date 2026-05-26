'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Consensus, MarketSnapshot, QuantBundle } from '@/lib/types';

interface State {
  snapshot: MarketSnapshot | null;
  quant: QuantBundle | null;
  consensus: Consensus | null;
  loading: boolean;
  error: string | null;
}

export function useAnalysis(symbol: string) {
  const [state, setState] = useState<State>({
    snapshot: null,
    quant: null,
    consensus: null,
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [snapshot, quant, consensus] = await Promise.all([
        api.market(symbol),
        api.quant(symbol),
        api.analyze(symbol),
      ]);
      setState({ snapshot, quant, consensus, loading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, [symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, refresh: load };
}
