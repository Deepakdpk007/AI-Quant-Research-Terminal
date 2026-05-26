"""Macro agent — interest rates, inflation, GDP, sector tailwinds."""

from __future__ import annotations

from .base import AgentContext, BaseAgent
from ..schemas import AgentResult
from ..utils.seeded import rng


_SECTOR_BIAS = {
    "Auto": (+8, ["rate_peak", "consumption_recovery", "EV_tailwind"]),
    "Banking": (+6, ["credit_growth", "NIM_stable"]),
    "IT Services": (-4, ["BFSI_demand_soft", "wage_pressure"]),
    "Technology": (+5, ["AI_capex_cycle", "cloud_growth"]),
    "Semiconductors": (+12, ["AI_demand", "datacenter_capex"]),
    "Conglomerate": (+3, ["diversified_buffer"]),
    "Energy": (+4, ["brent_firm"]),
}


class MacroAgent(BaseAgent):
    name = "Macro"
    weight = 0.20
    domain = "macroeconomic & sectoral structural forces"
    personality = (
        "You are a senior macro analyst. Think in cycles, structural forces and "
        "sectoral capital flows. Ignore short-term noise; focus on policy, rates, "
        "inflation, FX, and sector capex cycles. Style: measured, top-down."
    )

    def mock_response(self, ctx: AgentContext) -> AgentResult:
        r = rng("macro", ctx.symbol)
        sector = ctx.snapshot.quote.sector or "Diversified"
        bias_adj, default_signals = _SECTOR_BIAS.get(sector, (0, ["sector_neutral"]))
        base = 60 + bias_adj + r.uniform(-6, 8)
        # If 200-SMA below price -> structural uptrend nudge
        if ctx.quant.indicators.sma_200 and ctx.snapshot.quote.price > ctx.quant.indicators.sma_200:
            base += 4
        reasoning = (
            f"Rate cycle dynamics turning supportive for {sector.lower()} demand. "
            f"Structural tailwinds intact; near-term volatility considered noise. "
            f"Capex visibility multi-quarter."
        )
        return self._build_result(ctx, base, reasoning, default_signals)
