"""Mock news fixtures — deterministic, sentiment-tagged."""

from __future__ import annotations

from datetime import timedelta

from ..schemas import NewsArticle
from ..utils.clock import utcnow
from ..utils.seeded import rng

_HEADLINES: dict[str, list[tuple[str, str, float, list[str]]]] = {
    "TATAMOTORS": [
        (
            "Tata Motors Q4 PAT beats Street estimates; JLR margins surprise positively",
            "Standalone PAT exceeds consensus by ~46%; JLR EBIT margin guidance raised.",
            0.82,
            ["earnings", "JLR", "beat"],
        ),
        (
            "Goldman upgrades Tata Motors to Buy; raises target on EV roadmap clarity",
            "Citing improved CV cycle and clean energy capex pace.",
            0.74,
            ["upgrade", "EV", "analyst"],
        ),
        (
            "Auto sector rally extends as RBI signals end of hiking cycle",
            "Domestic OEMs in focus; auto loan demand recovery anticipated.",
            0.61,
            ["macro", "rates", "sector"],
        ),
        (
            "Global chip shortage risk re-emerges as ASEAN supplier flags constraint",
            "Could pressure near-term JLR production schedule.",
            -0.55,
            ["risk", "supply-chain"],
        ),
        (
            "EV policy boost: government expands FAME-III tax incentives",
            "Tata's Nexon EV among top beneficiaries of revised slab.",
            0.78,
            ["policy", "EV"],
        ),
    ],
    "RELIANCE": [
        (
            "Reliance Jio crosses 500M subscriber mark",
            "ARPU expansion drives FY24 telecom EBITDA to record.",
            0.71,
            ["jio", "telecom"],
        ),
        (
            "Reliance Retail launches new value commerce JV",
            "Targeting tier-3 cities with fast commerce play.",
            0.58,
            ["retail", "growth"],
        ),
        (
            "Brent above $90 lifts O2C earnings outlook",
            "Refining margins firm into next quarter.",
            0.62,
            ["o2c", "energy"],
        ),
    ],
    "INFY": [
        (
            "Infosys Q4 revenue guidance lighter than expected",
            "BFSI vertical softness continues into FY25.",
            -0.48,
            ["guidance", "BFSI"],
        ),
        (
            "Infy bags $1.5B AI-led transformation deal in Europe",
            "Multi-year program centred on Topaz AI platform.",
            0.69,
            ["deal", "AI"],
        ),
        (
            "Wage hike cycle to compress operating margin",
            "Management flags 50-70bps near-term headwind.",
            -0.30,
            ["margin", "wage"],
        ),
    ],
    "AAPL": [
        (
            "Apple unveils Apple Intelligence at WWDC; on-device LLM partnership rumours",
            "Investors weigh near-term capex vs long-term moat.",
            0.66,
            ["AI", "WWDC"],
        ),
        (
            "Services revenue hits new all-time high; gross margin > 75%",
            "Validates platform monetisation thesis.",
            0.73,
            ["services", "earnings"],
        ),
        (
            "China iPhone shipments slip y/y for second straight quarter",
            "Local OEMs gaining premium mindshare.",
            -0.42,
            ["china", "demand"],
        ),
    ],
    "NVDA": [
        (
            "NVIDIA DC revenue +154% y/y; Blackwell ramp on track",
            "Hyperscaler capex plans imply multi-quarter visibility.",
            0.88,
            ["AI", "datacenter"],
        ),
        (
            "Concentration risk: top-4 customers ~45% of DC revenue",
            "Risk desk highlights limited diversification.",
            -0.31,
            ["risk", "concentration"],
        ),
    ],
    "TSLA": [
        (
            "Robotaxi event scheduled; FSD v13 stack approaching geofenced rollout",
            "Bulls argue optionality value justifies premium.",
            0.55,
            ["robotaxi", "FSD"],
        ),
        (
            "China EV price war pressures Model 3/Y margins",
            "Near-term gross margin compression flagged.",
            -0.51,
            ["china", "margin"],
        ),
    ],
}


def mock_news(symbol: str, limit: int = 6) -> list[NewsArticle]:
    base = _HEADLINES.get(symbol, _HEADLINES["TATAMOTORS"])
    r = rng("news", symbol)
    articles: list[NewsArticle] = []
    now = utcnow()
    for i, (headline, summary, sentiment, tags) in enumerate(base[:limit]):
        articles.append(
            NewsArticle(
                headline=headline,
                summary=summary,
                source=r.choice(["Bloomberg", "Reuters", "Moneycontrol", "ET Markets", "CNBC"]),
                url=f"https://example.com/news/{symbol.lower()}/{i}",
                sentiment=round(sentiment, 2),
                published_at=now - timedelta(hours=i * 6 + r.randint(1, 5)),
                tags=tags,
            )
        )
    return articles
