"""AI memory store — confidence trajectory across analyses."""

from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import AIMemory
from ..schemas import MemoryDelta


async def record_memory(
    session: AsyncSession,
    *,
    symbol: str,
    confidence: float,
    consensus: str,
    summary: str,
) -> tuple[AIMemory, MemoryDelta]:
    """Persist a new memory point and compute a delta vs the previous entry."""

    prev_q = (
        select(AIMemory)
        .where(AIMemory.symbol == symbol)
        .order_by(desc(AIMemory.created_at))
        .limit(1)
    )
    prev = (await session.execute(prev_q)).scalar_one_or_none()
    delta_reason = ""
    delta = 0.0
    prev_conf: float | None = None
    if prev:
        prev_conf = prev.confidence
        delta = round(confidence - prev_conf, 1)
        if delta > 4:
            delta_reason = "Confidence rose: positive catalysts dominate vs prior cycle."
        elif delta < -4:
            delta_reason = "Confidence dropped: risk signals or thesis erosion noted."
        else:
            delta_reason = "Confidence broadly stable; thesis unchanged."

    entry = AIMemory(
        symbol=symbol,
        confidence=confidence,
        consensus=consensus,
        summary=summary,
        delta_reason=delta_reason,
        prev_id=prev.id if prev else None,
    )
    session.add(entry)
    await session.flush()

    return entry, MemoryDelta(
        previous_confidence=prev_conf,
        current_confidence=round(confidence, 1),
        delta=delta,
        reason=delta_reason or "Initial scan — no prior memory.",
    )


async def trajectory(session: AsyncSession, symbol: str, limit: int = 25) -> list[AIMemory]:
    q = (
        select(AIMemory)
        .where(AIMemory.symbol == symbol)
        .order_by(AIMemory.created_at)
        .limit(limit)
    )
    res = await session.execute(q)
    return list(res.scalars().all())
