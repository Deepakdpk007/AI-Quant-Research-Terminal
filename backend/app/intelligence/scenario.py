"""Causal scenario engine — propagates an event through curated impact maps."""

from __future__ import annotations

from typing import Any

from ..schemas import ScenarioEffect, ScenarioRequest, ScenarioResponse


SCENARIOS: dict[str, dict[str, Any]] = {
    "crude_oil_up_10": {
        "trigger": "Crude oil rises 10%",
        "narrative": (
            "Rising crude raises near-term auto manufacturing input costs. "
            "JLR diesel margins under pressure but EV adoption narrative strengthens."
        ),
        "confidence_delta": -5.0,
        "effects": [
            {"entity": "Input costs", "direction": "negative", "impact": "Auto manufacturing input costs rise 2-3%", "magnitude": 3},
            {"entity": "JLR diesel margins", "direction": "negative", "impact": "Margin compression risk", "magnitude": 3},
            {"entity": "EV demand", "direction": "positive", "impact": "Petrol alternative narrative strengthens", "magnitude": 2},
            {"entity": "Energy sector", "direction": "positive", "impact": "Refining margins firm", "magnitude": 4},
        ],
        "applies_to_sector": {"Auto": True, "Energy": True},
    },
    "rbi_rate_hike_50": {
        "trigger": "RBI hikes repo by 50bps",
        "narrative": (
            "Tighter financial conditions weigh on credit-sensitive sectors; "
            "auto loan demand and discretionary consumption pressured."
        ),
        "confidence_delta": -7.0,
        "effects": [
            {"entity": "Auto loans", "direction": "negative", "impact": "Demand softening", "magnitude": 3},
            {"entity": "Banking NIMs", "direction": "neutral", "impact": "Mixed - asset re-pricing slow", "magnitude": 2},
            {"entity": "Domestic consumption", "direction": "negative", "impact": "Discretionary spend cools", "magnitude": 3},
        ],
    },
    "fii_outflow_5000cr": {
        "trigger": "FII outflow of ₹5,000 Cr",
        "narrative": (
            "Liquidity withdrawal pressures large-caps; index-heavy names face "
            "mechanical selling regardless of fundamentals."
        ),
        "confidence_delta": -4.0,
        "effects": [
            {"entity": "Index large-caps", "direction": "negative", "impact": "Mechanical selling pressure", "magnitude": 3},
            {"entity": "Mid-cap breadth", "direction": "negative", "impact": "Risk-off contagion", "magnitude": 2},
            {"entity": "INR", "direction": "negative", "impact": "Currency weakness", "magnitude": 2},
        ],
    },
    "ev_policy_boost": {
        "trigger": "EV policy boost (FAME-III expansion)",
        "narrative": (
            "Government incentives accelerate EV adoption; local OEMs with "
            "strongest EV roadmaps benefit asymmetrically."
        ),
        "confidence_delta": +6.0,
        "effects": [
            {"entity": "EV-aligned OEMs", "direction": "positive", "impact": "Demand pull-through accelerates", "magnitude": 4},
            {"entity": "ICE legacy auto", "direction": "negative", "impact": "Relative pressure on legacy mix", "magnitude": 2},
            {"entity": "Battery supply chain", "direction": "positive", "impact": "Capex visibility", "magnitude": 3},
        ],
    },
}


def list_scenarios() -> list[dict[str, str]]:
    return [{"id": k, "trigger": v["trigger"]} for k, v in SCENARIOS.items()]


def run_scenario(req: ScenarioRequest, current_confidence: float) -> ScenarioResponse:
    scenario = SCENARIOS.get(req.scenario_id)
    if not scenario:
        raise ValueError(f"Unknown scenario: {req.scenario_id}")
    delta = float(scenario["confidence_delta"])
    new_conf = max(0.0, min(100.0, current_confidence + delta))
    effects = [ScenarioEffect(**e) for e in scenario["effects"]]
    return ScenarioResponse(
        scenario_id=req.scenario_id,
        trigger=str(scenario["trigger"]),
        symbol=req.symbol,
        effects=effects,
        confidence_before=round(current_confidence, 1),
        confidence_after=round(new_conf, 1),
        confidence_delta=round(delta, 1),
        narrative_update=str(scenario["narrative"]),
    )
