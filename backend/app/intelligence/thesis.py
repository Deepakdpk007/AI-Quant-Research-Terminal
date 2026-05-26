"""Thesis + invalidations + multi-horizon view + trade playbook (LLM-or-mock)."""

from __future__ import annotations

from ..config import get_settings
from ..logging import logger
from ..schemas import (
    AgentResult,
    HorizonView,
    MarketSnapshot,
    MultiHorizon,
    QuantBundle,
    TradePlaybook,
)
from ..services.llm import llm
from ..utils.seeded import rng


def _bias_from_score(s: float) -> str:
    if s >= 78:
        return "Strong Bullish"
    if s >= 60:
        return "Bullish"
    if s >= 45:
        return "Neutral"
    if s >= 30:
        return "Bearish"
    return "Strong Bearish"


def _mock_thesis(
    symbol: str,
    confidence: float,
    snapshot: MarketSnapshot,
    quant: QuantBundle,
    agent_results: list[AgentResult],
) -> tuple[str, list[str]]:
    sector = snapshot.quote.sector or "diversified"
    bullish_signals = [
        s for a in agent_results if a.bias.endswith("Bullish") for s in a.signals[:2]
    ][:4]
    bearish_signals = [
        s for a in agent_results if a.bias.endswith("Bearish") for s in a.signals[:2]
    ][:3]
    posture = "swing long" if confidence >= 60 else "neutral" if confidence >= 45 else "avoid"
    thesis = (
        f"{symbol}: {posture.capitalize()} setup at {confidence:.0f}% conviction. "
        f"{sector.title()} sector tailwinds combine with " 
        f"{', '.join(bullish_signals) or 'baseline'} to support the bull case. "
        f"Counter-arguments: {', '.join(bearish_signals) or 'limited'}. "
        f"Volatility regime {'elevated' if quant.risk.annualised_volatility > 0.32 else 'manageable'}; "
        f"sizing should reflect VaR{quant.risk.var_95*100:+.1f}% over 1d."
    )
    invalidations = [
        f"RSI breaks below 45 on daily close (currently {quant.indicators.rsi:.1f})",
        "Volume drops below 30-day average for 3 consecutive sessions",
        f"Price closes below 50-EMA at {quant.indicators.ema_50:.2f}",
        "Sector breadth narrows below 40%",
    ]
    if bearish_signals:
        invalidations.append(f"Confirmation of {bearish_signals[0]} via follow-through")
    return thesis, invalidations[:5]


async def build_thesis(
    symbol: str,
    confidence: float,
    snapshot: MarketSnapshot,
    quant: QuantBundle,
    agent_results: list[AgentResult],
) -> tuple[str, list[str]]:
    settings = get_settings()
    if not settings.use_real_llm or not llm.is_real:
        return _mock_thesis(symbol, confidence, snapshot, quant, agent_results)
    system = (
        "You are a senior buy-side strategist writing a one-paragraph trade thesis "
        "and a list of invalidation conditions. No hype. Output strict JSON only."
    )
    user = (
        f"Symbol: {symbol}\nConfidence: {confidence}\n"
        f"Agents: {[(a.agent, a.bias, a.score) for a in agent_results]}\n"
        f"Sector: {snapshot.quote.sector}\n"
        f"Indicators: RSI={quant.indicators.rsi}, MACD_h={quant.indicators.macd_hist}, "
        f"EMA20={quant.indicators.ema_20}, EMA50={quant.indicators.ema_50}\n"
        f"Vol={quant.risk.annualised_volatility} VaR95={quant.risk.var_95}\n\n"
        'Return JSON: {"thesis": str, "invalidations": [str, str, str, str, str]}'
    )
    try:
        data = await llm.complete_json(system=system, user=user)
        thesis = str(data.get("thesis") or "").strip()
        inv = [str(s) for s in (data.get("invalidations") or [])][:5]
        if not thesis or not inv:
            raise ValueError("LLM returned empty thesis")
        return thesis, inv
    except Exception as exc:
        logger.warning("Thesis LLM fallback for {}: {}", symbol, exc)
        return _mock_thesis(symbol, confidence, snapshot, quant, agent_results)


def multi_horizon(symbol: str, confidence: float, quant: QuantBundle) -> MultiHorizon:
    r = rng("horizon", symbol)
    intraday = max(35, min(85, confidence - 12 + r.uniform(-3, 3)))
    swing = confidence
    positional = max(30, min(95, confidence - 4 + r.uniform(-3, 3)))
    longterm = max(35, min(95, confidence + 6 + r.uniform(-3, 3)))
    return MultiHorizon(
        intraday=HorizonView(bias=_bias_from_score(intraday), confidence=round(intraday, 1)),
        swing=HorizonView(bias=_bias_from_score(swing), confidence=round(swing, 1)),
        positional=HorizonView(bias=_bias_from_score(positional), confidence=round(positional, 1)),
        longterm=HorizonView(bias=_bias_from_score(longterm), confidence=round(longterm, 1)),
    )


def build_playbook(
    symbol: str,
    confidence: float,
    snapshot: MarketSnapshot,
    quant: QuantBundle,
) -> TradePlaybook:
    price = snapshot.quote.price
    atr = max(quant.indicators.atr, price * 0.012)
    direction = 1 if confidence >= 50 else -1
    entry_low = round(price - atr * 0.5, 2)
    entry_high = round(price + atr * 0.5, 2)
    target_1 = round(price + direction * atr * 2.0, 2)
    target_2 = round(price + direction * atr * 4.0, 2)
    stop_loss = round(price - direction * atr * 1.4, 2)
    rr = abs((target_1 - price) / (price - stop_loss)) if price != stop_loss else 0
    catalysts = [
        "Sector momentum continuation",
        "Upcoming earnings catalyst",
        "Macro tailwind (rate cycle)",
    ]
    invalidations = [
        f"Daily close below {round(price - atr * 1.4, 2)}",
        "Volume drying up below 30-day average",
        "Sector breadth turning",
    ]
    stars = max(1, min(5, int(confidence // 20) + 1))
    return TradePlaybook(
        setup=("Bullish swing trade" if direction == 1 else "Defensive / avoid"),
        conviction_stars=stars,
        entry_low=entry_low,
        entry_high=entry_high,
        target_1=target_1,
        target_2=target_2,
        stop_loss=stop_loss,
        rr_ratio=round(rr, 2),
        position_size_pct=round(min(5.0, max(1.0, confidence / 20)), 1),
        catalysts=catalysts,
        invalidations=invalidations,
    )
