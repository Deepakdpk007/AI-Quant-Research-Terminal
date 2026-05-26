"""Signal attribution — explainable AI breakdown for the consensus.

Given the per-agent results, we expand each agent's signals into human
phrases with a contribution delta. The deltas are derived from the agent's
weighted, mean-centred score so the breakdown adds up to roughly the final
confidence score.
"""

from __future__ import annotations

from ..schemas import AgentResult, AttributionItem


_SIGNAL_LABELS: dict[str, str] = {
    # Sentiment
    "earnings_sentiment_high": "Earnings sentiment surge",
    "analyst_upgrade": "Analyst upgrade cycle",
    "sentiment_constructive": "Constructive narrative tone",
    "sentiment_negative": "Negative headline cluster",
    "headline_risk": "Elevated headline risk",
    "sentiment_mixed": "Mixed narrative, no edge",
    "retail_momentum": "Retail momentum building",
    # Technical
    "rsi_overbought": "RSI overbought / momentum stretched",
    "rsi_oversold_reversion": "Oversold reversion setup",
    "rsi_neutral": "RSI in balance zone",
    "macd_bullish_cross": "MACD positive cross",
    "macd_bearish_cross": "MACD negative cross",
    "ema_alignment_up": "Breakout above 20/50 EMAs",
    "ema_alignment_down": "Breakdown below 20/50 EMAs",
    "trend_above_200sma": "Long-term trend (200-SMA) intact",
    "bb_band_extension": "Upper Bollinger extension",
    "bb_band_capitulation": "Lower Bollinger capitulation",
    # Macro
    "rate_peak": "Rate cycle peaking",
    "consumption_recovery": "Domestic consumption recovery",
    "EV_tailwind": "EV adoption tailwind",
    "credit_growth": "Credit growth supportive",
    "NIM_stable": "Net interest margins stable",
    "BFSI_demand_soft": "Soft BFSI services demand",
    "wage_pressure": "Wage pressure on margins",
    "AI_capex_cycle": "AI capex cycle",
    "cloud_growth": "Cloud growth tailwind",
    "AI_demand": "Datacentre AI demand",
    "datacenter_capex": "Hyperscaler capex visibility",
    "diversified_buffer": "Conglomerate diversification buffer",
    "brent_firm": "Brent firm — energy supportive",
    "sector_neutral": "Sector backdrop neutral",
    # Valuation
    "pe_premium": "Trading at premium to sector PE",
    "growth_priced_in": "Growth largely priced in",
    "fair_value": "Valuation fair, not cheap",
    "relative_discount": "Relative discount to peers",
    "value_zone": "In valuation comfort zone",
    "pb_stretch": "Price-to-book stretched",
    # Risk
    "vol_elevated": "Elevated short-term vol",
    "vol_moderate": "Moderate volatility",
    "vol_contained": "Volatility contained",
    "var_high": "VaR (95%) elevated",
    "var_normal": "Tail risk within normal bounds",
    "drawdown_meaningful": "Recent drawdown meaningful",
    "sharpe_strong": "Strong risk-adjusted return profile",
    "sharpe_weak": "Weak risk-adjusted profile",
    "beta_high": "High beta (pro-cyclical)",
}


def attribute(agent_results: list[AgentResult], base_score: float = 50.0) -> list[AttributionItem]:
    """Convert agent signals into a list of contribution items.

    Each agent gets a "budget" equal to (score - 50) * weight * 1.6 so the
    bullish and bearish items together meaningfully shape the consensus.
    """

    items: list[AttributionItem] = []
    for agent in agent_results:
        budget = (agent.score - base_score) * agent.weight * 1.6
        if not agent.signals:
            continue
        per = budget / len(agent.signals)
        # Keep top 3 strongest signals from each agent
        for signal in agent.signals[:3]:
            label = _SIGNAL_LABELS.get(signal, signal.replace("_", " ").title())
            items.append(
                AttributionItem(
                    label=label,
                    delta=round(per, 1),
                    sign="+" if per >= 0 else "-",
                    agent=agent.agent,
                )
            )
    # Sort by absolute magnitude — most material first
    items.sort(key=lambda it: -abs(it.delta))
    return items[:9]
