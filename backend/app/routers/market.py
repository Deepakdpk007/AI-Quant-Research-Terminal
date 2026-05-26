"""Market data endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..intelligence.regime import current_regime
from ..schemas import MarketSnapshot, NewsArticle, OhlcvPoint, Quote, RegimeSnapshot
from ..services.market_data import market_data_service

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/universe", response_model=list[str])
async def universe() -> list[str]:
    return await market_data_service.list_universe()


@router.get("/regime", response_model=RegimeSnapshot)
async def regime() -> RegimeSnapshot:
    return current_regime()


@router.get("/{symbol}", response_model=MarketSnapshot)
async def snapshot(symbol: str) -> MarketSnapshot:
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=400, detail="Invalid symbol")
    return await market_data_service.get_snapshot(symbol.upper())


@router.get("/{symbol}/quote", response_model=Quote)
async def quote(symbol: str) -> Quote:
    return await market_data_service.get_quote(symbol.upper())


@router.get("/{symbol}/news", response_model=list[NewsArticle])
async def news(symbol: str) -> list[NewsArticle]:
    return await market_data_service.get_news(symbol.upper())


@router.get("/{symbol}/candles", response_model=list[OhlcvPoint])
async def candles(symbol: str) -> list[OhlcvPoint]:
    return await market_data_service.get_candles(symbol.upper())
