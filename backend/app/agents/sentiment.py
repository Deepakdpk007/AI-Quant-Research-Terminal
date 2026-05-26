"""Sentiment agent — news, social, analyst flow."""

from __future__ import annotations

from statistics import mean

from .base import AgentContext, BaseAgent
from ..schemas import AgentResult
from ..utils.seeded import rng


class SentimentAgent(BaseAgent):
    name = "Sentiment"
    weight = 0.30
    domain = "narrative & momentum psychology"
    personality = (
        "You are a sentiment intelligence specialist. You read crowd psychology — "
        "headlines, analyst tone, retail flow, social momentum. Identify shifts before "
        "they show in price. Style: punchy, narrative-aware."
    )

    def mock_response(self, ctx: AgentContext) -> AgentResult:
        r = rng("sentiment", ctx.symbol)
        sentiments = [a.sentiment for a in ctx.snapshot.news if a.sentiment is not None]
        avg = mean(sentiments) if sentiments else 0.0
        # avg in [-1, 1] -> 0..100 with a gentle clamp
        base = 55 + avg * 30 + r.uniform(-4, 6)
        signals: list[str] = []
        if avg > 0.4:
            signals.extend(["earnings_sentiment_high", "analyst_upgrade"])
        elif avg > 0:
            signals.extend(["sentiment_constructive"])
        elif avg < -0.3:
            signals.extend(["sentiment_negative", "headline_risk"])
        else:
            signals.extend(["sentiment_mixed"])
        if ctx.snapshot.quote.change_pct > 1.5:
            signals.append("retail_momentum")

        reasoning = (
            f"Narrative tilt is {'positive' if avg >= 0 else 'negative'} with "
            f"average headline sentiment {avg:+.2f}. "
            f"{'Retail participation accelerating.' if ctx.snapshot.quote.change_pct > 1 else 'Flow neutral.'} "
            f"Analyst tone supportive given recent catalysts."
        )
        return self._build_result(ctx, base, reasoning, signals[:5] or ["sentiment_mixed"])
