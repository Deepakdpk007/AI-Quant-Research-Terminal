"""Market narrative generator (LLM-or-mock)."""

from __future__ import annotations

from ..config import get_settings
from ..logging import logger
from ..schemas import AgentResult, MarketSnapshot, Narrative
from ..services.llm import llm
from ..utils.seeded import rng


def _mock_narrative(symbol: str, snapshot: MarketSnapshot, agent_results: list[AgentResult]) -> Narrative:
    r = rng("narrative", symbol)
    sector = snapshot.quote.sector or "diversified"
    bullish_count = sum(1 for a in agent_results if a.bias.endswith("Bullish"))
    bearish_count = sum(1 for a in agent_results if a.bias.endswith("Bearish"))
    tilt = "constructive" if bullish_count > bearish_count else "cautious" if bearish_count > bullish_count else "balanced"
    text = (
        f"{sector} narrative {tilt}: "
        f"{bullish_count} bullish vs {bearish_count} bearish specialist agents. "
        f"Recent flow shows {snapshot.quote.change_pct:+.2f}% session move with "
        f"news cluster around {', '.join(set(t for a in snapshot.news for t in a.tags[:1]))[:60] or 'mixed catalysts'}."
    )
    strength = round(50 + (bullish_count - bearish_count) * 12 + r.uniform(-4, 4), 1)
    age_days = r.randint(2, 8)
    decay_rate = round(r.uniform(1.0, 3.5), 1)
    conflicting = None
    if bearish_count >= 1 and bullish_count >= 2:
        conflicting = "Risk desk flags volatility clusters that could break the trend."
    return Narrative(
        text=text,
        strength=max(15, min(95, strength)),
        age_days=age_days,
        decay_rate=decay_rate,
        conflicting_signal=conflicting,
    )


async def build_narrative(
    symbol: str, snapshot: MarketSnapshot, agent_results: list[AgentResult]
) -> Narrative:
    settings = get_settings()
    if not settings.use_real_llm or not llm.is_real:
        return _mock_narrative(symbol, snapshot, agent_results)
    system = (
        "You are a senior buy-side analyst writing a 2-sentence market narrative. "
        "Structured, dispassionate, no hype. Output strict JSON only."
    )
    bull = [a.agent for a in agent_results if a.bias.endswith("Bullish")]
    bear = [a.agent for a in agent_results if a.bias.endswith("Bearish")]
    user = (
        f"Symbol: {symbol} ({snapshot.quote.sector})\n"
        f"Bull camp agents: {bull}\nBear camp agents: {bear}\n"
        f"Session move: {snapshot.quote.change_pct:+.2f}%\n"
        f"Top headline: {snapshot.news[0].headline if snapshot.news else 'N/A'}\n\n"
        "Return JSON: {\"text\": str, \"strength\": 0-100 int, \"age_days\": int, "
        "\"decay_rate\": float, \"conflicting_signal\": str|null}"
    )
    try:
        data = await llm.complete_json(system=system, user=user)
        return Narrative(**data)
    except Exception as exc:
        logger.warning("Narrative LLM fallback for {}: {}", symbol, exc)
        return _mock_narrative(symbol, snapshot, agent_results)
