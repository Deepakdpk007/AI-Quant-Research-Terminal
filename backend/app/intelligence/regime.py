"""Market regime engine — rule-based with synthetic VIX/momentum proxies."""

from __future__ import annotations

import math

from ..schemas import RegimeSnapshot
from ..utils.clock import utcnow
from ..utils.seeded import rng


def current_regime() -> RegimeSnapshot:
    r = rng("regime", utcnow().date().isoformat())
    vix = round(15 + r.uniform(-3, 8), 2)
    breadth = round(0.4 + r.uniform(0, 0.5), 2)
    momentum_score = r.uniform(-1, 1)

    if vix >= 30:
        regime = "PANIC"
        liquidity = "Tight"
    elif vix >= 22:
        regime = "RISK-OFF"
        liquidity = "Tight"
    elif vix >= 16:
        regime = "NEUTRAL"
        liquidity = "Normal"
    else:
        regime = "RISK-ON"
        liquidity = "High"

    if momentum_score > 0.5:
        momentum = "Strong"
    elif momentum_score > 0.2:
        momentum = "Positive"
    elif momentum_score > -0.2:
        momentum = "Neutral"
    elif momentum_score > -0.5:
        momentum = "Negative"
    else:
        momentum = "Weak"

    description = {
        "RISK-ON": "Liquidity strong, breadth healthy, momentum supportive — risk assets favored.",
        "NEUTRAL": "Mixed signals — range-bound conditions; selectivity is paramount.",
        "RISK-OFF": "Volatility rising, breadth narrowing — defensive posture warranted.",
        "PANIC": "Volatility extreme, liquidity collapsing — capital preservation only.",
    }[regime]

    # Smooth, deterministic-feeling decimals
    return RegimeSnapshot(
        regime=regime,  # type: ignore[arg-type]
        vix=vix,
        momentum=momentum,  # type: ignore[arg-type]
        liquidity=liquidity,  # type: ignore[arg-type]
        breadth=round(math.tanh(breadth) * 100, 1) / 100,
        description=description,
        updated_at=utcnow(),
    )
