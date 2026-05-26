"""Quant endpoints — pure-math indicators / risk."""

from __future__ import annotations

from fastapi import APIRouter

from ..schemas import IndicatorBundle, QuantBundle, RiskBundle
from ..services.market_data import market_data_service
from ..services.quant import compute

router = APIRouter(prefix="/api/quant", tags=["quant"])


@router.get("/{symbol}", response_model=QuantBundle)
async def quant(symbol: str) -> QuantBundle:
    candles = await market_data_service.get_candles(symbol.upper())
    return compute(candles)


@router.get("/{symbol}/indicators", response_model=IndicatorBundle)
async def indicators(symbol: str) -> IndicatorBundle:
    candles = await market_data_service.get_candles(symbol.upper())
    return compute(candles).indicators


@router.get("/{symbol}/risk", response_model=RiskBundle)
async def risk(symbol: str) -> RiskBundle:
    candles = await market_data_service.get_candles(symbol.upper())
    return compute(candles).risk
