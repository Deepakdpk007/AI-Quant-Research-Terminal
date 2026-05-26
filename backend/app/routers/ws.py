"""WebSocket endpoints for live prices and alert streaming."""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..logging import logger
from ..services.market_data import market_data_service
from ..utils.clock import utcnow
from ..utils.seeded import rng

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/prices/{symbol}")
async def ws_prices(websocket: WebSocket, symbol: str) -> None:
    await websocket.accept()
    symbol = symbol.upper()
    try:
        quote = await market_data_service.get_quote(symbol)
        await websocket.send_text(quote.model_dump_json())
        # Generate small synthetic ticks every 1.5s so the UI feels alive
        r = rng("ticks", symbol)
        price = quote.price
        for _ in range(600):  # ~15min cap
            move = r.uniform(-0.0015, 0.0015) * price
            price = round(max(0.01, price + move), 2)
            tick = {
                "symbol": symbol,
                "price": price,
                "ts": utcnow().isoformat(),
            }
            await websocket.send_text(json.dumps(tick))
            await asyncio.sleep(1.5)
    except WebSocketDisconnect:  # pragma: no cover
        return
    except Exception as exc:  # pragma: no cover
        logger.warning("ws_prices error for {}: {}", symbol, exc)
        await websocket.close(code=1011)


@router.websocket("/alerts")
async def ws_alerts(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        # Heartbeat / dummy alert pump
        while True:
            await asyncio.sleep(20)
            await websocket.send_json(
                {"type": "heartbeat", "ts": utcnow().isoformat()}
            )
    except WebSocketDisconnect:  # pragma: no cover
        return
