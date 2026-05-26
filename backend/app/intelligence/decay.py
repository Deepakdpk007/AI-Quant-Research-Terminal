"""Signal decay — exponentially fade signals older than their domain norm."""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone


_RATES = {
    "Sentiment": 0.15,
    "Technical": 0.08,
    "Macro": 0.02,
    "Valuation": 0.01,
    "Risk": 0.10,
}


def decay_factor(agent: str, days: float) -> float:
    rate = _RATES.get(agent, 0.05)
    return math.exp(-rate * days)


def synthetic_decay_table(agent_signals: list[tuple[str, str, float]], now: datetime | None = None) -> list[dict]:
    """Build a UI-friendly table given (agent, label, original_score) tuples.

    We synthesize a plausible event date for each signal so the UI has data
    to display in mock mode.
    """

    now = now or datetime.now(timezone.utc)
    table: list[dict] = []
    for i, (agent, label, score) in enumerate(agent_signals):
        days = (i + 1) * 1.5
        factor = decay_factor(agent, days)
        current = round(score * factor, 1)
        table.append(
            {
                "agent": agent,
                "label": label,
                "score_original": round(score, 1),
                "score_current": current,
                "decay_factor": round(factor, 3),
                "days_elapsed": days,
                "event_date": (now - timedelta(days=days)).date().isoformat(),
                "delta_pct": round((current / score - 1) * 100, 1) if score else 0,
            }
        )
    return table
