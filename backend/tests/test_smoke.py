"""Smoke tests for the backend. Run with: pytest -q."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert body["mode"] in {"mock", "hybrid", "real"}


@pytest.mark.asyncio
async def test_market_snapshot() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/market/TATAMOTORS")
        assert r.status_code == 200
        data = r.json()
        assert data["quote"]["symbol"] == "TATAMOTORS"
        assert isinstance(data["candles"], list) and len(data["candles"]) > 50
        assert isinstance(data["news"], list)


@pytest.mark.asyncio
async def test_analyze_returns_consensus() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test", timeout=30) as client:
        r = await client.get("/api/agents/RELIANCE/analyze")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["symbol"] == "RELIANCE"
        assert 0 <= data["confidence"] <= 100
        assert len(data["agent_results"]) == 5
        assert data["thesis"]
        assert data["multi_horizon"]
        assert data["playbook"]


@pytest.mark.asyncio
async def test_quant_metrics() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/quant/INFY")
        assert r.status_code == 200
        data = r.json()
        assert "indicators" in data and "risk" in data
        assert "rsi" in data["indicators"]


@pytest.mark.asyncio
async def test_scenario_engine() -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post(
            "/api/agents/scenario",
            json={"scenario_id": "crude_oil_up_10", "symbol": "TATAMOTORS"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["scenario_id"] == "crude_oil_up_10"
        assert "effects" in data and len(data["effects"]) >= 2
