"""Master orchestrator — runs all agents in parallel and synthesises consensus.

Output is a fully-formed :class:`Consensus` containing the agent breakdown,
attribution, disagreement flag, thesis, multi-horizon view, narrative, regime,
playbook, and memory delta.
"""

from __future__ import annotations

import asyncio
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from ..intelligence import attribution as attribution_engine
from ..intelligence import disagreement as disagreement_engine
from ..intelligence import memory as memory_engine
from ..intelligence import narrative as narrative_engine
from ..intelligence import regime as regime_engine
from ..intelligence import thesis as thesis_engine
from ..logging import logger
from ..models import StockAnalysis
from ..schemas import (
    AgentResult,
    Consensus,
    MarketSnapshot,
    QuantBundle,
)
from ..utils.clock import utcnow
from .base import AgentContext, BaseAgent
from .macro import MacroAgent
from .risk import RiskAgent
from .sentiment import SentimentAgent
from .technical import TechnicalAgent
from .valuation import ValuationAgent


def _consensus_from_score(score: float) -> str:
    if score >= 78:
        return "Strong Bullish"
    if score >= 60:
        return "Bullish"
    if score >= 45:
        return "Neutral"
    if score >= 30:
        return "Bearish"
    return "Strong Bearish"


class Orchestrator:
    """Run agents, aggregate outputs, persist analysis + memory."""

    def __init__(self, agents: Sequence[BaseAgent] | None = None) -> None:
        self.agents: list[BaseAgent] = list(agents or [
            MacroAgent(),
            SentimentAgent(),
            TechnicalAgent(),
            ValuationAgent(),
            RiskAgent(),
        ])

    async def run_agents(self, ctx: AgentContext) -> list[AgentResult]:
        return await asyncio.gather(*(a.analyze(ctx) for a in self.agents))

    async def orchestrate(
        self,
        *,
        symbol: str,
        snapshot: MarketSnapshot,
        quant: QuantBundle,
        session: AsyncSession,
    ) -> Consensus:
        ctx = AgentContext(symbol=symbol, snapshot=snapshot, quant=quant)
        agent_results = await self.run_agents(ctx)

        # Weighted aggregation
        weighted = sum(r.score * r.weight for r in agent_results)
        # Normalise in case weights don't sum to 1 (configurable)
        total_weight = sum(r.weight for r in agent_results) or 1.0
        weighted /= total_weight
        weighted = max(0.0, min(100.0, weighted))

        disagreement = disagreement_engine.detect(agent_results)
        if disagreement.flagged:
            weighted *= 1 - disagreement.confidence_penalty

        confidence = round(weighted, 1)
        consensus_label = _consensus_from_score(confidence)
        attr = attribution_engine.attribute(agent_results)

        thesis_text, invalidations = await thesis_engine.build_thesis(
            symbol, confidence, snapshot, quant, agent_results
        )
        horizons = thesis_engine.multi_horizon(symbol, confidence, quant)
        playbook = thesis_engine.build_playbook(symbol, confidence, snapshot, quant)
        narrative = await narrative_engine.build_narrative(symbol, snapshot, agent_results)
        regime = regime_engine.current_regime().regime

        # Persist memory + analysis
        try:
            mem_entry, mem_delta = await memory_engine.record_memory(
                session,
                symbol=symbol,
                confidence=confidence,
                consensus=consensus_label,
                summary=thesis_text[:240],
            )
            analysis = StockAnalysis(
                symbol=symbol,
                consensus=consensus_label,
                confidence=confidence,
                agent_data={"results": [r.model_dump() for r in agent_results]},
                attribution=[a.model_dump() for a in attr],
                reasoning=[r.reasoning for r in agent_results],
                thesis=thesis_text,
                invalidations=invalidations,
                multi_horizon=horizons.model_dump(),
                disagreement=disagreement.model_dump(),
            )
            session.add(analysis)
            await session.commit()
        except Exception as exc:  # pragma: no cover
            logger.warning("Persistence skipped (continuing): {}", exc)
            await session.rollback()
            mem_delta = None

        return Consensus(
            symbol=symbol,
            timestamp=utcnow(),
            consensus=consensus_label,  # type: ignore[arg-type]
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


orchestrator = Orchestrator()
