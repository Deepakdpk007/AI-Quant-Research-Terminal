"""Curated symbol metadata used in mock mode and as a friendly directory.

We support a small but expressive watchlist that covers Indian equities
(headline NSE names) plus a handful of US tickers for international demos.
Each entry is enough to power the dashboards even without external data.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SymbolMeta:
    symbol: str
    name: str
    exchange: str
    currency: str
    sector: str
    seed_price: float
    market_cap: float  # USD or INR market cap proxy in billions
    pe: float
    pb: float
    ev_ebitda: float
    fifty_two_week_high: float
    fifty_two_week_low: float
    description: str


_SYMBOLS: dict[str, SymbolMeta] = {
    "TATAMOTORS": SymbolMeta(
        "TATAMOTORS", "Tata Motors Ltd", "NSE", "INR", "Auto",
        seed_price=948.50, market_cap=314.0, pe=12.4, pb=2.8, ev_ebitda=6.7,
        fifty_two_week_high=1185.0, fifty_two_week_low=605.0,
        description="Indian multinational automaker; JLR parent; EV pivot.",
    ),
    "RELIANCE": SymbolMeta(
        "RELIANCE", "Reliance Industries Ltd", "NSE", "INR", "Conglomerate",
        seed_price=2840.10, market_cap=1920.0, pe=27.5, pb=2.1, ev_ebitda=11.2,
        fifty_two_week_high=3025.0, fifty_two_week_low=2225.0,
        description="Energy, retail, telecom (Jio) conglomerate.",
    ),
    "INFY": SymbolMeta(
        "INFY", "Infosys Ltd", "NSE", "INR", "IT Services",
        seed_price=1610.45, market_cap=668.0, pe=24.8, pb=7.5, ev_ebitda=16.5,
        fifty_two_week_high=1953.0, fifty_two_week_low=1350.0,
        description="Global IT consulting and services.",
    ),
    "HDFCBANK": SymbolMeta(
        "HDFCBANK", "HDFC Bank Ltd", "NSE", "INR", "Banking",
        seed_price=1485.20, market_cap=1130.0, pe=18.6, pb=2.5, ev_ebitda=0.0,
        fifty_two_week_high=1791.0, fifty_two_week_low=1363.0,
        description="India's largest private sector bank.",
    ),
    "TCS": SymbolMeta(
        "TCS", "Tata Consultancy Services Ltd", "NSE", "INR", "IT Services",
        seed_price=3920.0, market_cap=1418.0, pe=31.0, pb=15.4, ev_ebitda=22.1,
        fifty_two_week_high=4254.0, fifty_two_week_low=3060.0,
        description="World's second largest IT services firm.",
    ),
    "ICICIBANK": SymbolMeta(
        "ICICIBANK", "ICICI Bank Ltd", "NSE", "INR", "Banking",
        seed_price=1086.10, market_cap=763.0, pe=18.0, pb=3.1, ev_ebitda=0.0,
        fifty_two_week_high=1255.0, fifty_two_week_low=899.0,
        description="Leading private sector universal bank.",
    ),
    "AAPL": SymbolMeta(
        "AAPL", "Apple Inc.", "NASDAQ", "USD", "Technology",
        seed_price=195.30, market_cap=3010.0, pe=29.5, pb=44.0, ev_ebitda=22.7,
        fifty_two_week_high=237.5, fifty_two_week_low=164.0,
        description="Consumer electronics & services.",
    ),
    "NVDA": SymbolMeta(
        "NVDA", "NVIDIA Corporation", "NASDAQ", "USD", "Semiconductors",
        seed_price=128.45, market_cap=3160.0, pe=55.0, pb=49.5, ev_ebitda=43.0,
        fifty_two_week_high=153.0, fifty_two_week_low=66.0,
        description="GPU and AI accelerator leader.",
    ),
    "TSLA": SymbolMeta(
        "TSLA", "Tesla, Inc.", "NASDAQ", "USD", "Auto",
        seed_price=242.10, market_cap=773.0, pe=66.0, pb=10.5, ev_ebitda=42.0,
        fifty_two_week_high=414.0, fifty_two_week_low=138.0,
        description="EV & energy storage manufacturer.",
    ),
    "MSFT": SymbolMeta(
        "MSFT", "Microsoft Corporation", "NASDAQ", "USD", "Technology",
        seed_price=421.85, market_cap=3140.0, pe=37.0, pb=11.8, ev_ebitda=24.5,
        fifty_two_week_high=468.0, fifty_two_week_low=362.0,
        description="Cloud, productivity, and AI platforms.",
    ),
}


def get_symbol_meta(symbol: str) -> SymbolMeta:
    key = symbol.split(".", 1)[0].upper()
    if key in _SYMBOLS:
        return _SYMBOLS[key]
    # Fallback synthetic
    return SymbolMeta(
        key, key.title(), "NSE", "INR", "Diversified",
        seed_price=500.0, market_cap=50.0, pe=20.0, pb=3.0, ev_ebitda=10.0,
        fifty_two_week_high=750.0, fifty_two_week_low=350.0,
        description="Auto-generated entry for unknown symbol.",
    )


def list_known_symbols() -> list[str]:
    return list(_SYMBOLS.keys())
