/**
 * API client with smart base URL resolution.
 *
 * Priority order:
 * 1. NEXT_PUBLIC_API_BASE_URL (explicit override)
 * 2. Codespaces auto-detection — if we're on `*.app.github.dev`, swap the
 *    "-3000" port suffix for "-8000" so the frontend talks to the correct
 *    forwarded backend without any manual config.
 * 3. Same-origin /api/proxy/* (handled by next.config.mjs rewrite)
 * 4. Localhost fallback
 */
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

function resolveBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && explicit.length > 0) return explicit;

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // GitHub Codespaces: <name>-3000.app.github.dev → <name>-8000.app.github.dev
    if (hostname.endsWith('.app.github.dev') || hostname.endsWith('.github.dev')) {
      const swapped = hostname.replace(/-3000\./, '-8000.');
      return `${protocol}//${swapped}`;
    }
    // Gitpod: 3000-* → 8000-*
    if (hostname.match(/^3000-/) && hostname.endsWith('.gitpod.io')) {
      return `${protocol}//${hostname.replace(/^3000-/, '8000-')}`;
    }
  }
  return 'http://localhost:8000';
}

const BASE = resolveBase();

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} → ${path} ${detail.slice(0, 120)}`);
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
