"""Detect when agents directly contradict each other."""

from __future__ import annotations

from ..schemas import AgentResult, Disagreement


def _is_bull(bias: str) -> bool:
    return bias in {"Bullish", "Strong Bullish"}


def _is_bear(bias: str) -> bool:
    return bias in {"Bearish", "Strong Bearish"}


def detect(agent_results: list[AgentResult]) -> Disagreement:
    bull = [r for r in agent_results if _is_bull(r.bias)]
    bear = [r for r in agent_results if _is_bear(r.bias)]
    bull_w = sum(r.weight for r in bull)
    bear_w = sum(r.weight for r in bear)

    flagged = bull_w > 0.20 and bear_w > 0.20
    severity = "NONE"
    penalty = 0.0
    message = "No significant disagreement; agents broadly aligned."
    if flagged:
        if bear_w >= 0.30:
            severity = "HIGH"
            penalty = 0.10
        elif bear_w >= 0.20:
            severity = "MEDIUM"
            penalty = 0.07
        else:
            severity = "LOW"
            penalty = 0.04
        bull_names = ", ".join(r.agent for r in bull)
        bear_names = ", ".join(r.agent for r in bear)
        message = (
            f"Signal divergence detected — bull camp ({bull_names}) vs bear camp "
            f"({bear_names}). Confidence weighted down."
        )

    return Disagreement(
        flagged=flagged,
        severity=severity,
        bull_agents=[r.agent for r in bull],
        bear_agents=[r.agent for r in bear],
        message=message,
        confidence_penalty=penalty,
    )
