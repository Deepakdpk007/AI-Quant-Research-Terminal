"""Valuation agent — fundamentals & relative pricing."""

from __future__ import annotations

from .base import AgentContext, BaseAgent
from ..schemas import AgentResult


_SECTOR_PE_MEDIAN = {
    "Auto": 14.0,
    "Banking": 16.5,
    "IT Services": 26.0,
    "Technology": 32.0,
    "Semiconductors": 35.0,
    "Conglomerate": 22.0,
    "Energy": 14.0,
    "Diversified": 22.0,
}


class ValuationAgent(BaseAgent):
    name = "Valuation"
    weight = 0.10
    domain = "fundamentals, relative valuation, growth-vs-price"
    personality = (
        "You are a value-oriented fundamental analyst. You are deliberately skeptical "
        "of momentum narratives. Your job is to price-check the thesis and call out "
        "stretched multiples. Style: dispassionate, comparative."
    )

    def mock_response(self, ctx: AgentContext) -> AgentResult:
        sector = ctx.snapshot.quote.sector or "Diversified"
        sector_pe = _SECTOR_PE_MEDIAN.get(sector, 22.0)
        pe = ctx.snapshot.quote.pe or sector_pe
        premium = (pe - sector_pe) / sector_pe if sector_pe else 0.0

        # Score in [0, 100]: 50 = fair, < 50 = expensive, > 50 = cheap
        score = 55 - premium * 60
        signals: list[str] = []
        if premium > 0.25:
            signals.append("pe_premium")
            signals.append("growth_priced_in")
        elif premium > 0.0:
            signals.append("fair_value")
        else:
            signals.append("relative_discount")
            signals.append("value_zone")

        if ctx.snapshot.quote.pb and ctx.snapshot.quote.pb > 8:
            score -= 4
            signals.append("pb_stretch")

        reasoning = (
            f"PE {pe:.1f} vs sector median {sector_pe:.1f} -> "
            f"{premium*100:+.1f}% premium. "
            f"{'Growth largely priced in.' if premium > 0.15 else 'Reasonably valued.'} "
            f"Long-term upside requires earnings re-rating, not multiple re-rating."
        )
        return self._build_result(ctx, score, reasoning, signals[:4])
