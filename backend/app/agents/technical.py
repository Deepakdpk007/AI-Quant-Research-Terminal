"""Technical agent — pure price/volume pattern reasoning."""

from __future__ import annotations

from .base import AgentContext, BaseAgent
from ..schemas import AgentResult


class TechnicalAgent(BaseAgent):
    name = "Technical"
    weight = 0.25
    domain = "price action, indicators, structure"
    personality = (
        "You are a classical technical analyst. Your evidence is price, volume and "
        "mathematical indicators only. You do not consider news, narratives, or valuation. "
        "Style: pattern-driven, evidence-bound, terse."
    )

    def mock_response(self, ctx: AgentContext) -> AgentResult:
        ind = ctx.quant.indicators
        price = ctx.snapshot.quote.price
        score = 50.0
        signals: list[str] = []

        if ind.rsi >= 70:
            score -= 6
            signals.append("rsi_overbought")
        elif ind.rsi <= 30:
            score += 6
            signals.append("rsi_oversold_reversion")
        else:
            signals.append("rsi_neutral")

        if ind.macd_hist > 0 and ind.macd > ind.macd_signal:
            score += 8
            signals.append("macd_bullish_cross")
        elif ind.macd_hist < 0:
            score -= 6
            signals.append("macd_bearish_cross")

        if price > ind.ema_20 > ind.ema_50:
            score += 10
            signals.append("ema_alignment_up")
        elif price < ind.ema_20 < ind.ema_50:
            score -= 10
            signals.append("ema_alignment_down")

        if ind.bb_pct > 0.95:
            score -= 4
            signals.append("bb_band_extension")
        elif ind.bb_pct < 0.05:
            score += 4
            signals.append("bb_band_capitulation")

        if ind.sma_200 and price > ind.sma_200:
            score += 5
            signals.append("trend_above_200sma")

        reasoning = (
            f"RSI {ind.rsi:.1f}, MACD hist {ind.macd_hist:+.2f}, price "
            f"{'above' if price > ind.ema_20 else 'below'} 20-EMA. "
            f"{'Trend structure intact.' if price > ind.sma_200 else 'Trend below 200-SMA.'} "
            f"Bollinger %B {ind.bb_pct:.2f}."
        )
        return self._build_result(ctx, score, reasoning, signals[:5])
