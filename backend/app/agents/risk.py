"""Risk agent — voice of caution. Penalises elevated vol / VaR / beta."""

from __future__ import annotations

from .base import AgentContext, BaseAgent
from ..schemas import AgentResult


class RiskAgent(BaseAgent):
    name = "Risk"
    weight = 0.15
    domain = "volatility, drawdown, tail risk"
    personality = (
        "You are the risk desk — the voice of caution. You are never persuaded by "
        "momentum, only by risk-adjusted outcomes. Highlight tail risk, volatility "
        "clusters, and drawdown exposure. Style: conservative, dissent when warranted."
    )

    def mock_response(self, ctx: AgentContext) -> AgentResult:
        risk = ctx.quant.risk
        score = 60.0
        signals: list[str] = []

        if risk.annualised_volatility > 0.45:
            score -= 18
            signals.append("vol_elevated")
        elif risk.annualised_volatility > 0.32:
            score -= 8
            signals.append("vol_moderate")
        else:
            score += 4
            signals.append("vol_contained")

        if risk.var_95 < -0.04:
            score -= 12
            signals.append("var_high")
        else:
            signals.append("var_normal")

        if risk.max_drawdown < -0.25:
            score -= 8
            signals.append("drawdown_meaningful")

        if risk.sharpe > 1.5:
            score += 10
            signals.append("sharpe_strong")
        elif risk.sharpe < 0.3:
            score -= 6
            signals.append("sharpe_weak")

        if risk.beta > 1.3:
            score -= 4
            signals.append("beta_high")

        reasoning = (
            f"Vol {risk.annualised_volatility*100:.1f}% / VaR95 {risk.var_95*100:.2f}% "
            f"/ Sharpe {risk.sharpe:.2f}. "
            f"{'Tail risk non-trivial — size with caution.' if risk.var_95 < -0.04 else 'Risk profile manageable.'} "
            f"Beta {risk.beta:.2f} implies "
            f"{'pro-cyclical' if risk.beta > 1.1 else 'defensive'} exposure."
        )
        return self._build_result(ctx, score, reasoning, signals[:5])
