"""Pydantic schemas — request/response shapes shared between API and UI."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Bias = Literal["Strong Bullish", "Bullish", "Neutral", "Bearish", "Strong Bearish"]
Regime = Literal["RISK-ON", "NEUTRAL", "RISK-OFF", "PANIC"]


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    mode: str
    version: str
    services: dict[str, str]
    disclaimer: str


# ---------------------------------------------------------------------------
# Market data
# ---------------------------------------------------------------------------
class OhlcvPoint(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class Quote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_pct: float
    volume: float
    market_cap: float | None = None
    sector: str | None = None
    currency: str = "INR"
    exchange: str = "NSE"
    pe: float | None = None
    pb: float | None = None
    ev_ebitda: float | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None
    updated_at: datetime


class NewsArticle(BaseModel):
    headline: str
    summary: str = ""
    source: str = ""
    url: str = ""
    sentiment: float | None = None
    published_at: datetime
    tags: list[str] = []


class MarketSnapshot(BaseModel):
    quote: Quote
    candles: list[OhlcvPoint]
    news: list[NewsArticle]


class IndicatorBundle(BaseModel):
    rsi: float
    macd: float
    macd_signal: float
    macd_hist: float
    bb_upper: float
    bb_lower: float
    bb_pct: float
    atr: float
    ema_20: float
    ema_50: float
    sma_200: float
    vwap: float


class RiskBundle(BaseModel):
    sharpe: float
    max_drawdown: float
    annualised_volatility: float
    var_95: float
    beta: float


class QuantBundle(BaseModel):
    indicators: IndicatorBundle
    risk: RiskBundle
    notes: list[str] = []


# ---------------------------------------------------------------------------
# Agent + Consensus
# ---------------------------------------------------------------------------
class AgentResult(BaseModel):
    agent: str
    score: float = Field(ge=0, le=100)
    bias: Bias
    weight: float = Field(ge=0, le=1)
    reasoning: str
    signals: list[str]
    personality: str | None = None


class AttributionItem(BaseModel):
    label: str
    delta: float
    sign: Literal["+", "-"]
    agent: str


class Disagreement(BaseModel):
    flagged: bool
    severity: Literal["NONE", "LOW", "MEDIUM", "HIGH"]
    bull_agents: list[str] = []
    bear_agents: list[str] = []
    message: str = ""
    confidence_penalty: float = 0.0


class HorizonView(BaseModel):
    bias: Bias
    confidence: float


class MultiHorizon(BaseModel):
    intraday: HorizonView
    swing: HorizonView
    positional: HorizonView
    longterm: HorizonView


class MemoryDelta(BaseModel):
    previous_confidence: float | None
    current_confidence: float
    delta: float
    reason: str


class Narrative(BaseModel):
    text: str
    strength: float
    age_days: int
    decay_rate: float
    conflicting_signal: str | None = None


class Consensus(BaseModel):
    symbol: str
    timestamp: datetime
    consensus: Bias
    confidence: float
    disagreement: Disagreement
    agent_results: list[AgentResult]
    attribution: list[AttributionItem]
    thesis: str
    invalidations: list[str]
    multi_horizon: MultiHorizon
    memory_delta: MemoryDelta | None
    narrative: Narrative
    regime: Regime
    playbook: "TradePlaybook"


class TradePlaybook(BaseModel):
    setup: str
    conviction_stars: int = Field(ge=1, le=5)
    entry_low: float
    entry_high: float
    target_1: float
    target_2: float
    stop_loss: float
    rr_ratio: float
    position_size_pct: float
    catalysts: list[str]
    invalidations: list[str]


Consensus.model_rebuild()


# ---------------------------------------------------------------------------
# RAG
# ---------------------------------------------------------------------------
class RagIngestResponse(BaseModel):
    document_id: int
    chunks: int
    title: str
    doc_type: str


class RagQueryRequest(BaseModel):
    question: str
    symbol: str | None = None
    top_k: int = 5


class RagSource(BaseModel):
    chunk_id: str
    score: float
    text: str
    metadata: dict[str, Any] = {}


class RagQueryResponse(BaseModel):
    answer: str
    sources: list[RagSource]


# ---------------------------------------------------------------------------
# Watcher / Scenario
# ---------------------------------------------------------------------------
class WatcherAlertOut(BaseModel):
    id: int
    symbol: str
    alert_type: str
    message: str
    severity: Literal["low", "medium", "high", "critical"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ScenarioRequest(BaseModel):
    scenario_id: str
    symbol: str


class ScenarioEffect(BaseModel):
    entity: str
    direction: Literal["positive", "negative", "neutral"]
    impact: str
    magnitude: int


class ScenarioResponse(BaseModel):
    scenario_id: str
    trigger: str
    symbol: str
    effects: list[ScenarioEffect]
    confidence_before: float
    confidence_after: float
    confidence_delta: float
    narrative_update: str


# ---------------------------------------------------------------------------
# Memory trajectory
# ---------------------------------------------------------------------------
class MemoryPoint(BaseModel):
    id: int
    symbol: str
    confidence: float
    consensus: str
    summary: str
    delta_reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MemoryTrajectory(BaseModel):
    symbol: str
    points: list[MemoryPoint]


# ---------------------------------------------------------------------------
# Regime
# ---------------------------------------------------------------------------
class RegimeSnapshot(BaseModel):
    regime: Regime
    vix: float
    momentum: Literal["Strong", "Positive", "Neutral", "Negative", "Weak"]
    liquidity: Literal["High", "Normal", "Tight"]
    breadth: float
    description: str
    updated_at: datetime
