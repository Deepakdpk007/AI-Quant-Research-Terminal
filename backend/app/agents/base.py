"""Base agent abstractions.

Every specialist agent inherits :class:`BaseAgent` and implements
``mock_response`` (returns a deterministic AgentResult) plus the
``llm_prompt`` pair (system + user) that drives Claude when real mode is on.
"""

from __future__ import annotations

import abc
from dataclasses import dataclass
from typing import Any

from ..logging import logger
from ..schemas import AgentResult, MarketSnapshot, QuantBundle
from ..services.llm import llm
from ..utils.seeded import rng


@dataclass
class AgentContext:
    """Bundle of inputs every agent receives."""

    symbol: str
    snapshot: MarketSnapshot
    quant: QuantBundle
    rag_excerpts: list[str] | None = None


class BaseAgent(abc.ABC):
    name: str = "Agent"
    weight: float = 0.2  # contribution to consensus
    domain: str = "general"
    personality: str = ""

    # ------------------------------------------------------------------ #
    # Hooks                                                              #
    # ------------------------------------------------------------------ #
    @abc.abstractmethod
    def mock_response(self, ctx: AgentContext) -> AgentResult:
        """Return a deterministic stub used in mock mode and as a fallback."""

    def system_prompt(self) -> str:
        return self.personality

    def user_prompt(self, ctx: AgentContext) -> str:
        snap = ctx.snapshot
        ind = ctx.quant.indicators
        risk = ctx.quant.risk
        news_lines = "\n".join(
            f"- ({a.published_at.date()}) [{a.sentiment or '?'}] {a.headline}: {a.summary}"
            for a in snap.news[:6]
        ) or "- No recent news."
        return (
            f"Symbol: {ctx.symbol}\n"
            f"Sector: {snap.quote.sector} | Exchange: {snap.quote.exchange}\n"
            f"Price: {snap.quote.price} {snap.quote.currency}  ({snap.quote.change_pct:+.2f}%)\n"
            f"Market Cap: {snap.quote.market_cap}\n"
            f"PE/PB/EV-EBITDA: {snap.quote.pe} / {snap.quote.pb} / {snap.quote.ev_ebitda}\n"
            f"\nIndicators: RSI={ind.rsi} MACD={ind.macd}/{ind.macd_signal}/{ind.macd_hist} "
            f"BB%={ind.bb_pct} ATR={ind.atr} EMA20={ind.ema_20} EMA50={ind.ema_50} SMA200={ind.sma_200}\n"
            f"Risk: Sharpe={risk.sharpe} MDD={risk.max_drawdown} Vol={risk.annualised_volatility} "
            f"VaR95={risk.var_95} Beta={risk.beta}\n\nRecent news:\n{news_lines}\n\n"
            "Respond with strict JSON only:\n"
            "{\n"
            '  "score": 0-100 integer,\n'
            '  "bias": "Strong Bullish" | "Bullish" | "Neutral" | "Bearish" | "Strong Bearish",\n'
            '  "reasoning": "single concise paragraph (<=80 words) reflecting your domain personality",\n'
            '  "signals": ["short-tag", "short-tag", ...]\n'
            "}\n"
        )

    # ------------------------------------------------------------------ #
    # Execution                                                          #
    # ------------------------------------------------------------------ #
    async def analyze(self, ctx: AgentContext) -> AgentResult:
        if not llm.is_real:
            return self.mock_response(ctx)
        try:
            data: dict[str, Any] = await llm.complete_json(
                system=self.system_prompt(), user=self.user_prompt(ctx)
            )
            return AgentResult(
                agent=self.name,
                score=float(data.get("score", 50)),
                bias=str(data.get("bias", "Neutral")),  # type: ignore[arg-type]
                weight=self.weight,
                reasoning=str(data.get("reasoning", "")).strip(),
                signals=[str(s) for s in (data.get("signals") or [])][:6],
                personality=self.domain,
            )
        except Exception as exc:
            logger.warning("{} failed real call, using mock: {}", self.name, exc)
            return self.mock_response(ctx)

    # ------------------------------------------------------------------ #
    # Helpers shared by mock implementations                             #
    # ------------------------------------------------------------------ #
    def _build_result(
        self, ctx: AgentContext, score: float, reasoning: str, signals: list[str]
    ) -> AgentResult:
        bias = self._bias_from_score(score, ctx)
        return AgentResult(
            agent=self.name,
            score=round(max(0, min(100, score)), 1),
            bias=bias,
            weight=self.weight,
            reasoning=reasoning,
            signals=signals,
            personality=self.domain,
        )

    @staticmethod
    def _bias_from_score(score: float, ctx: AgentContext) -> str:
        # Slight per-symbol jitter so identical scores don't always map to the
        # same bias — this avoids stale-looking output.
        jitter = rng("bias", ctx.symbol).uniform(-1.5, 1.5)
        s = score + jitter
        if s >= 78:
            return "Strong Bullish"
        if s >= 60:
            return "Bullish"
        if s >= 45:
            return "Neutral"
        if s >= 30:
            return "Bearish"
        return "Strong Bearish"
