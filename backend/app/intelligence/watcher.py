"""Autonomous watcher — periodic, deterministic alert synthesis.

In real mode this becomes a scheduled job that scans live data; here we
synthesise alerts deterministically per symbol so the UI is populated.
"""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import WatcherAlert
from ..utils.clock import utcnow
from ..utils.seeded import rng


_ALERT_TEMPLATES = [
    ("volume_spike", "Abnormal volume cluster ({mult:.1f}x average)", "high"),
    ("news", "Positive analyst upgrade detected from {analyst}", "medium"),
    ("regime", "Volatility stabilising; risk-on conditions improving", "low"),
    ("sentiment", "Social sentiment spike in last 2 hours", "medium"),
    ("technical", "Price approaching key resistance at {level}", "high"),
    ("flow", "Institutional flow detected via block trade", "high"),
    ("macro", "Sector rotation evidence emerging", "low"),
]


async def synthesise_alerts(session: AsyncSession, symbol: str, count: int = 5) -> list[WatcherAlert]:
    r = rng("watcher", symbol)
    now = utcnow()
    created: list[WatcherAlert] = []
    for i in range(count):
        kind, template, severity = r.choice(_ALERT_TEMPLATES)
        msg = template.format(
            mult=r.uniform(2, 4.5),
            analyst=r.choice(["Goldman", "Morgan Stanley", "Jefferies", "JPM"]),
            level=round(r.uniform(900, 1100), 2),
        )
        ts = now - timedelta(minutes=i * 11 + r.randint(1, 10))
        # We can't override server_default, but we can set a Python-side value
        alert = WatcherAlert(
            symbol=symbol,
            alert_type=kind,
            message=msg,
            severity=severity,
            created_at=ts,
        )
        session.add(alert)
        created.append(alert)
    await session.flush()
    return created


async def list_alerts(
    session: AsyncSession, symbol: str | None = None, limit: int = 25
) -> list[WatcherAlert]:
    q = select(WatcherAlert).order_by(desc(WatcherAlert.created_at)).limit(limit)
    if symbol:
        q = q.where(WatcherAlert.symbol == symbol)
    res = await session.execute(q)
    return list(res.scalars().all())
