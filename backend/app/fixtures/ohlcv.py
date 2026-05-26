"""Synthetic OHLCV generator producing realistic-ish price paths."""

from __future__ import annotations

import math
from datetime import timedelta

import numpy as np

from ..schemas import OhlcvPoint
from ..utils.clock import utcnow
from ..utils.seeded import seed_from


def synthetic_ohlcv(symbol: str, start_price: float, points: int = 240) -> list[OhlcvPoint]:
    """Geometric Brownian motion with regime switching for realism."""

    rs = np.random.default_rng(seed_from("ohlcv", symbol))
    drift = rs.uniform(0.00015, 0.00045)
    base_vol = rs.uniform(0.012, 0.024)
    candles: list[OhlcvPoint] = []

    price = start_price
    now = utcnow().replace(hour=15, minute=30, second=0, microsecond=0)
    # Regime: every ~40 candles switch between calm / volatile
    for i in range(points):
        regime = "vol" if (i // 40) % 2 == 1 else "calm"
        sigma = base_vol if regime == "calm" else base_vol * 1.7
        ret = rs.normal(drift, sigma)
        # Add a mild mean reversion tug
        ret += -0.02 * (math.log(price / start_price))
        new_price = price * math.exp(ret)

        intraday_range = sigma * price * 1.4
        high = max(price, new_price) + abs(rs.normal(0, intraday_range * 0.4))
        low = min(price, new_price) - abs(rs.normal(0, intraday_range * 0.4))
        volume = float(max(1e5, rs.normal(2.5e6, 8e5)))
        if regime == "vol":
            volume *= 1.6

        candles.append(
            OhlcvPoint(
                timestamp=now - timedelta(days=points - i - 1),
                open=round(price, 2),
                high=round(high, 2),
                low=round(low, 2),
                close=round(new_price, 2),
                volume=round(volume),
            )
        )
        price = new_price

    return candles
