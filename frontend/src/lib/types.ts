// Mirror of backend Pydantic schemas. Kept lean — only what the UI consumes.

export type Bias = 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
export type Regime = 'RISK-ON' | 'NEUTRAL' | 'RISK-OFF' | 'PANIC';
export type AgentName = 'Macro' | 'Sentiment' | 'Technical' | 'Valuation' | 'Risk';

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  market_cap: number | null;
  sector: string | null;
  currency: string;
  exchange: string;
  pe: number | null;
  pb: number | null;
  ev_ebitda: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  updated_at: string;
}

export interface OhlcvPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  sentiment: number | null;
  published_at: string;
  tags: string[];
}

export interface MarketSnapshot {
  quote: Quote;
  candles: OhlcvPoint[];
  news: NewsArticle[];
}

export interface IndicatorBundle {
  rsi: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  bb_upper: number;
  bb_lower: number;
  bb_pct: number;
  atr: number;
  ema_20: number;
  ema_50: number;
  sma_200: number;
  vwap: number;
}

export interface RiskBundle {
  sharpe: number;
  max_drawdown: number;
  annualised_volatility: number;
  var_95: number;
  beta: number;
}

export interface QuantBundle {
  indicators: IndicatorBundle;
  risk: RiskBundle;
  notes: string[];
}

export interface AgentResult {
  agent: AgentName | string;
  score: number;
  bias: Bias;
  weight: number;
  reasoning: string;
  signals: string[];
  personality?: string | null;
}

export interface AttributionItem {
  label: string;
  delta: number;
  sign: '+' | '-';
  agent: string;
}

export interface Disagreement {
  flagged: boolean;
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  bull_agents: string[];
  bear_agents: string[];
  message: string;
  confidence_penalty: number;
}

export interface HorizonView {
  bias: Bias;
  confidence: number;
}

export interface MultiHorizon {
  intraday: HorizonView;
  swing: HorizonView;
  positional: HorizonView;
  longterm: HorizonView;
}

export interface MemoryDelta {
  previous_confidence: number | null;
  current_confidence: number;
  delta: number;
  reason: string;
}

export interface Narrative {
  text: string;
  strength: number;
  age_days: number;
  decay_rate: number;
  conflicting_signal: string | null;
}

export interface TradePlaybook {
  setup: string;
  conviction_stars: number;
  entry_low: number;
  entry_high: number;
  target_1: number;
  target_2: number;
  stop_loss: number;
  rr_ratio: number;
  position_size_pct: number;
  catalysts: string[];
  invalidations: string[];
}

export interface Consensus {
  symbol: string;
  timestamp: string;
  consensus: Bias;
  confidence: number;
  disagreement: Disagreement;
  agent_results: AgentResult[];
  attribution: AttributionItem[];
  thesis: string;
  invalidations: string[];
  multi_horizon: MultiHorizon;
  memory_delta: MemoryDelta | null;
  narrative: Narrative;
  regime: Regime;
  playbook: TradePlaybook;
}

export interface RegimeSnapshot {
  regime: Regime;
  vix: number;
  momentum: 'Strong' | 'Positive' | 'Neutral' | 'Negative' | 'Weak';
  liquidity: 'High' | 'Normal' | 'Tight';
  breadth: number;
  description: string;
  updated_at: string;
}

export interface MemoryPoint {
  id: number;
  symbol: string;
  confidence: number;
  consensus: string;
  summary: string;
  delta_reason: string;
  created_at: string;
}

export interface MemoryTrajectory {
  symbol: string;
  points: MemoryPoint[];
}

export interface WatcherAlert {
  id: number;
  symbol: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

export interface ScenarioEffect {
  entity: string;
  direction: 'positive' | 'negative' | 'neutral';
  impact: string;
  magnitude: number;
}

export interface ScenarioResult {
  scenario_id: string;
  trigger: string;
  symbol: string;
  effects: ScenarioEffect[];
  confidence_before: number;
  confidence_after: number;
  confidence_delta: number;
  narrative_update: string;
}

export interface DecayRow {
  agent: string;
  label: string;
  score_original: number;
  score_current: number;
  decay_factor: number;
  days_elapsed: number;
  event_date: string;
  delta_pct: number;
}

export interface RagSource {
  chunk_id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

export interface RagAnswer {
  answer: string;
  sources: RagSource[];
}

export interface StreamEvent {
  type: 'agent_result' | 'consensus' | 'heartbeat';
  data?: AgentResult | Consensus;
  timestamp?: string;
}
