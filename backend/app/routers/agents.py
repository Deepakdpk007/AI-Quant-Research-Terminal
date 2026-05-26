"""Agent / orchestrator endpoints (REST + SSE)."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from ..agents import AgentContext, orchestrator
from ..agents.base import BaseAgent
from ..db import get_session
from ..intelligence import attribution as attribution_engine
from ..intelligence import disagreement as disagreement_engine
from ..intelligence import memory as memory_engine
from ..intelligence import narrative as narrative_engine
from ..intelligence import regime as regime_engine
from ..intelligence import scenario as scenario_engine
from ..intelligence import thesis as thesis_engine
from ..intelligence.decay import synthetic_decay_table
from ..models import StockAnalysis
from ..schemas import (
    Consensus,
    MemoryTrajectory,
    ScenarioRequest,
    ScenarioResponse,
)
from ..services.market_data import market_data_service
from ..services.quant import compute
from ..utils.clock import utcnow

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("/{symbol}/analyze", response_model=Consensus)
async def analyze(
    symbol: str, session: AsyncSession = Depends(get_session)
) -> Consensus:
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=400, detail="Invalid symbol")
    symbol = symbol.upper()
    snapshot = await market_data_service.get_snapshot(symbol)
    quant = compute(snapshot.candles)
    return await orchestrator.orchestrate(
        symbol=symbol, snapshot=snapshot, quant=quant, session=session
    )


@router.get("/{symbol}/stream")
async def stream_agents(
    symbol: str, request: Request, session: AsyncSession = Depends(get_session)
) -> EventSourceResponse:
    """Stream agent reasoning live via Server-Sent Events.

    The endpoint emits one event per agent (`agent_result`) followed by
    one final `consensus` event.
    """

    symbol = symbol.upper()
    snapshot = await market_data_service.get_snapshot(symbol)
    quant = compute(snapshot.candles)

    async def event_stream() -> AsyncIterator[dict]:
        ctx = AgentContext(symbol=symbol, snapshot=snapshot, quant=quant)
        agents: list[BaseAgent] = orchestrator.agents

        # Schedule each agent independently so faster ones surface first
        agent_results = []

        async def _run_one(agent: BaseAgent) -> None:
            res = await agent.analyze(ctx)
            agent_results.append(res)
            payload = {
                "type": "agent_result",
                "data": json.loads(res.model_dump_json()),
                "timestamp": utcnow().isoformat(),
            }
            await queue.put(payload)

        queue: asyncio.Queue = asyncio.Queue()

        async def _producer() -> None:
            await asyncio.gather(*(_run_one(a) for a in agents))
            await queue.put(None)  # sentinel

        producer = asyncio.create_task(_producer())

        emitted = 0
        try:
            while True:
                if await request.is_disconnected():
                    break
                item = await queue.get()
                if item is None:
                    break
                yield {"event": "agent_result", "data": json.dumps(item)}
                emitted += 1
        finally:
            await producer

        # After all agents -> final consensus event
        attr = attribution_engine.attribute(agent_results)
        disagreement = disagreement_engine.detect(agent_results)
        weighted = sum(r.score * r.weight for r in agent_results)
        total_w = sum(r.weight for r in agent_results) or 1
        weighted /= total_w
        if disagreement.flagged:
            weighted *= 1 - disagreement.confidence_penalty
        confidence = round(max(0, min(100, weighted)), 1)

        thesis_text, invalidations = await thesis_engine.build_thesis(
            symbol, confidence, snapshot, quant, agent_results
        )
        horizons = thesis_engine.multi_horizon(symbol, confidence, quant)
        playbook = thesis_engine.build_playbook(symbol, confidence, snapshot, quant)
        narrative = await narrative_engine.build_narrative(symbol, snapshot, agent_results)
        regime = regime_engine.current_regime().regime

        try:
            mem_entry, mem_delta = await memory_engine.record_memory(
                session,
                symbol=symbol,
                confidence=confidence,
                consensus="Bullish" if confidence >= 60 else "Bearish" if confidence < 45 else "Neutral",
                summary=thesis_text[:240],
            )
            session.add(
                StockAnalysis(
                    symbol=symbol,
                    consensus=str(mem_entry.consensus),
                    confidence=confidence,
                    agent_data={"results": [r.model_dump() for r in agent_results]},
                    attribution=[a.model_dump() for a in attr],
                    reasoning=[r.reasoning for r in agent_results],
                    thesis=thesis_text,
                    invalidations=invalidations,
                    multi_horizon=horizons.model_dump(),
                    disagreement=disagreement.model_dump(),
                )
            )
            await session.commit()
        except Exception:
            await session.rollback()
            mem_delta = None

        consensus = Consensus(
            symbol=symbol,
            timestamp=utcnow(),
            consensus="Strong Bullish" if confidence >= 78 else "Bullish" if confidence >= 60 else "Neutral" if confidence >= 45 else "Bearish" if confidence >= 30 else "Strong Bearish",  # type: ignore[arg-type]
            confidence=confidence,
            disagreement=disagreement,
            agent_results=agent_results,
            attribution=attr,
            thesis=thesis_text,
            invalidations=invalidations,
            multi_horizon=horizons,
            memory_delta=mem_delta,
            narrative=narrative,
            regime=regime,
            playbook=playbook,
        )
        yield {"event": "consensus", "data": consensus.model_dump_json()}

    return EventSourceResponse(event_stream())


@router.get("/{symbol}/memory", response_model=MemoryTrajectory)
async def memory(
    symbol: str, session: AsyncSession = Depends(get_session)
) -> MemoryTrajectory:
    points = await memory_engine.trajectory(session, symbol.upper())
    return MemoryTrajectory(symbol=symbol.upper(), points=[p.__dict__ for p in points])  # type: ignore[arg-type]


@router.post("/scenario", response_model=ScenarioResponse)
async def scenario(req: ScenarioRequest) -> ScenarioResponse:
    snapshot = await market_data_service.get_snapshot(req.symbol.upper())
    quant = compute(snapshot.candles)
    # Use a quick mock-orchestrator pass to get a baseline confidence
    base_conf = 55 + (snapshot.quote.change_pct * 3)
    base_conf = max(30, min(85, base_conf))
    return scenario_engine.run_scenario(req, base_conf)


@router.get("/scenarios")
async def scenarios_catalog() -> list[dict]:
    return scenario_engine.list_scenarios()


@router.get("/{symbol}/decay")
async def decay(symbol: str) -> list[dict]:
    """Synthetic signal decay table for the UI."""

    snapshot = await market_data_service.get_snapshot(symbol.upper())
    quant = compute(snapshot.candles)
    ctx_signals = [
        ("Sentiment", "Earnings sentiment surge", 84.0),
        ("Technical", "Breakout above 20-EMA", 78.0),
        ("Macro", "Rate cycle peaking", 72.0),
        ("Risk", "Volatility regime shift", 65.0),
        ("Valuation", "PE in fair zone", 58.0),
    ]
    _ = (snapshot, quant)  # reserved for real-mode deltas
    return synthetic_decay_table(ctx_signals)
