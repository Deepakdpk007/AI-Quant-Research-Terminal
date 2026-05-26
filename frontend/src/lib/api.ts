import type {
  Consensus,
  DecayRow,
  MarketSnapshot,
  MemoryTrajectory,
  QuantBundle,
  RagAnswer,
  RegimeSnapshot,
  ScenarioResult,
  WatcherAlert,
} from './types';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} -> ${path} ${detail.slice(0, 120)}`);
  }
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return get<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const api = {
  base: BASE,

  health: () =>
    get<{
      status: string;
      mode: string;
      version: string;
      services: Record<string, string>;
      disclaimer: string;
    }>('/health'),

  universe: () => get<string[]>('/api/market/universe'),
  regime: () => get<RegimeSnapshot>('/api/market/regime'),
  market: (symbol: string) => get<MarketSnapshot>(`/api/market/${symbol}`),

  quant: (symbol: string) => get<QuantBundle>(`/api/quant/${symbol}`),

  analyze: (symbol: string) => get<Consensus>(`/api/agents/${symbol}/analyze`),
  memory: (symbol: string) => get<MemoryTrajectory>(`/api/agents/${symbol}/memory`),
  decay: (symbol: string) => get<DecayRow[]>(`/api/agents/${symbol}/decay`),
  scenarios: () => get<{ id: string; trigger: string }[]>('/api/agents/scenarios'),
  scenario: (scenario_id: string, symbol: string) =>
    post<ScenarioResult>('/api/agents/scenario', { scenario_id, symbol }),

  watcherFor: (symbol: string) => get<WatcherAlert[]>(`/api/watcher/alerts/${symbol}`),
  watcherAll: () => get<WatcherAlert[]>('/api/watcher/alerts'),

  ragQuery: (question: string, symbol?: string) =>
    post<RagAnswer>('/api/rag/query', { question, symbol, top_k: 5 }),

  streamUrl: (symbol: string) => `${BASE}/api/agents/${symbol}/stream`,
};
