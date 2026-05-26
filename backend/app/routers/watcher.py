"""Autonomous watcher endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..intelligence import watcher
from ..schemas import WatcherAlertOut

router = APIRouter(prefix="/api/watcher", tags=["watcher"])


@router.get("/alerts", response_model=list[WatcherAlertOut])
async def alerts_all(
    session: AsyncSession = Depends(get_session),
) -> list[WatcherAlertOut]:
    rows = await watcher.list_alerts(session)
    return [WatcherAlertOut.model_validate(r, from_attributes=True) for r in rows]


@router.get("/alerts/{symbol}", response_model=list[WatcherAlertOut])
async def alerts_for(
    symbol: str, session: AsyncSession = Depends(get_session)
) -> list[WatcherAlertOut]:
    symbol = symbol.upper()
    rows = await watcher.list_alerts(session, symbol=symbol)
    if not rows:
        # Synthesise some alerts on demand so the UI is populated in mock mode
        await watcher.synthesise_alerts(session, symbol)
        await session.commit()
        rows = await watcher.list_alerts(session, symbol=symbol)
    return [WatcherAlertOut.model_validate(r, from_attributes=True) for r in rows]
