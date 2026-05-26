"""Market data service.

Resolves quotes, OHLCV history, and news for a symbol. Modes:

* ``mock``   - fully synthetic, deterministic per symbol
* ``hybrid`` - real prices via yfinance, synthetic news (no Finnhub key needed)
* ``real``   - real prices via yfinance + real news via Finnhub

All public methods return Pydantic schemas so downstream callers stay strict.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any

import httpx

from ..cache import cache
from ..config import get_settings
from ..fixtures.news import mock_news
from ..fixtures.ohlcv import synthetic_ohlcv
from ..fixtures.symbols import get_symbol_meta, list_known_symbols
from ..logging import logger
from ..schemas import MarketSnapshot, NewsArticle, OhlcvPoint, Quote
from ..utils.clock import utcnow
from ..utils.seeded import rng
from ..utils.text import short_sym

QUOTE_TTL = 30
OHLCV_TTL = 60
NEWS_TTL = 300


class MarketDataService:
    """Single source of truth for all market data the system consumes."""

    def __init__(self) -> None:
        self.settings = get_settings()

    # ------------------------------------------------------------------ #
    # Public API                                                         #
    # ------------------------------------------------------------------ #
    async def list_universe(self) -> list[str]:
        return list_known_symbols()

    async def get_snapshot(self, symbol: str) -> MarketSnapshot:
        symbol = short_sym(symbol)
        quote, candles, news = await self._gather(symbol)
        return MarketSnapshot(quote=quote, candles=candles, news=news)

    async def get_quote(self, symbol: str) -> Quote:
        symbol = short_sym(symbol)
        cached = await cache.get_json(f"market:{symbol}:quote")
        if cached:
            return Quote(**cached)
        quote = await self._build_quote(symbol)
        await cache.set_json(f"market:{symbol}:quote", quote.model_dump(mode="json"), ttl=QUOTE_TTL)
        return quote

    async def get_candles(self, symbol: str) -> list[OhlcvPoint]:
        symbol = short_sym(symbol)
        cached = await cache.get_json(f"market:{symbol}:ohlcv")
        if cached:
            return [OhlcvPoint(**p) for p in cached]
        candles = await self._build_candles(symbol)
        await cache.set_json(
            f"market:{symbol}:ohlcv",
            [c.model_dump(mode="json") for c in candles],
            ttl=OHLCV_TTL,
        )
        return candles

    async def get_news(self, symbol: str) -> list[NewsArticle]:
        symbol = short_sym(symbol)
        cached = await cache.get_json(f"market:{symbol}:news")
        if cached:
            return [NewsArticle(**n) for n in cached]
        news = await self._build_news(symbol)
        await cache.set_json(
            f"market:{symbol}:news",
            [n.model_dump(mode="json") for n in news],
            ttl=NEWS_TTL,
        )
        return news

    # ------------------------------------------------------------------ #
    # Internals                                                          #
    # ------------------------------------------------------------------ #
    async def _gather(self, symbol: str) -> tuple[Quote, list[OhlcvPoint], list[NewsArticle]]:
        quote = await self.get_quote(symbol)
        candles = await self.get_candles(symbol)
        news = await self.get_news(symbol)
        return quote, candles, news

    async def _build_quote(self, symbol: str) -> Quote:
        meta = get_symbol_meta(symbol)
        if self.settings.use_real_market:
            yf_quote = await self._yf_quote(symbol)
            if yf_quote:
                return yf_quote
        # Mock path
        r = rng("quote", symbol)
        change_pct = round(r.uniform(-2.5, 3.0), 2)
        price = round(meta.seed_price * (1 + change_pct / 100), 2)
        change = round(price - meta.seed_price, 2)
        return Quote(
            symbol=symbol,
            name=meta.name,
            price=price,
            change=change,
            change_pct=change_pct,
            volume=int(r.uniform(2_000_000, 12_000_000)),
            market_cap=meta.market_cap * 1e9,
            sector=meta.sector,
            currency=meta.currency,
            exchange=meta.exchange,
            pe=meta.pe,
            pb=meta.pb,
            ev_ebitda=meta.ev_ebitda,
            fifty_two_week_high=meta.fifty_two_week_high,
            fifty_two_week_low=meta.fifty_two_week_low,
            updated_at=utcnow(),
        )

    async def _build_candles(self, symbol: str) -> list[OhlcvPoint]:
        meta = get_symbol_meta(symbol)
        if self.settings.use_real_market:
            yf_candles = await self._yf_candles(symbol)
            if yf_candles:
                return yf_candles
        return synthetic_ohlcv(symbol, meta.seed_price)

    async def _build_news(self, symbol: str) -> list[NewsArticle]:
        if self.settings.app_mode == "real" and self.settings.finnhub_api_key:
            try:
                articles = await self._finnhub_news(symbol)
                if articles:
                    return articles
            except Exception as exc:  # pragma: no cover
                logger.warning("Finnhub fallback to mock for {}: {}", symbol, exc)
        return mock_news(symbol)

    # ---- yfinance (best-effort, isolated) ---------------------------- #
    async def _yf_quote(self, symbol: str) -> Quote | None:  # pragma: no cover - network
        try:
            import yfinance as yf  # type: ignore
        except ImportError:
            return None

        def _resolve_symbol(s: str) -> str:
            meta = get_symbol_meta(s)
            return s if meta.exchange in {"NASDAQ", "NYSE"} else f"{s}.NS"

        try:
            import asyncio

            ticker_sym = _resolve_symbol(symbol)
            loop = asyncio.get_event_loop()
            tk = await loop.run_in_executor(None, yf.Ticker, ticker_sym)
            info: dict[str, Any] = await loop.run_in_executor(None, lambda: tk.fast_info or {})
            price = float(info.get("last_price") or 0)
            if not price:
                return None
            prev = float(info.get("previous_close") or price)
            change = price - prev
            change_pct = (change / prev) * 100 if prev else 0
            meta = get_symbol_meta(symbol)
            return Quote(
                symbol=symbol,
                name=meta.name,
                price=round(price, 2),
                change=round(change, 2),
                change_pct=round(change_pct, 2),
                volume=int(info.get("last_volume") or 0),
                market_cap=float(info.get("market_cap") or meta.market_cap * 1e9),
                sector=meta.sector,
                currency=info.get("currency", meta.currency),
                exchange=meta.exchange,
                pe=meta.pe,
                pb=meta.pb,
                ev_ebitda=meta.ev_ebitda,
                fifty_two_week_high=info.get("year_high", meta.fifty_two_week_high),
                fifty_two_week_low=info.get("year_low", meta.fifty_two_week_low),
                updated_at=utcnow(),
            )
        except Exception as exc:  # pragma: no cover
            logger.warning("yfinance quote fallback for {}: {}", symbol, exc)
            return None

    async def _yf_candles(self, symbol: str) -> list[OhlcvPoint] | None:  # pragma: no cover
        try:
            import asyncio

            import yfinance as yf  # type: ignore

            meta = get_symbol_meta(symbol)
            ticker_sym = symbol if meta.exchange in {"NASDAQ", "NYSE"} else f"{symbol}.NS"
            loop = asyncio.get_event_loop()
            tk = await loop.run_in_executor(None, yf.Ticker, ticker_sym)
            df = await loop.run_in_executor(None, lambda: tk.history(period="1y", interval="1d"))
            if df is None or df.empty:
                return None
            points: list[OhlcvPoint] = []
            for ts, row in df.iterrows():
                points.append(
                    OhlcvPoint(
                        timestamp=ts.to_pydatetime(),
                        open=float(row["Open"]),
                        high=float(row["High"]),
                        low=float(row["Low"]),
                        close=float(row["Close"]),
                        volume=float(row["Volume"]),
                    )
                )
            return points[-240:]
        except Exception as exc:  # pragma: no cover
            logger.warning("yfinance candles fallback for {}: {}", symbol, exc)
            return None

    # ---- Finnhub news ------------------------------------------------- #
    async def _finnhub_news(self, symbol: str) -> list[NewsArticle]:  # pragma: no cover
        url = "https://finnhub.io/api/v1/company-news"
        from_date = (utcnow() - timedelta(days=14)).date().isoformat()
        to_date = utcnow().date().isoformat()
        params = {
            "symbol": symbol,
            "from": from_date,
            "to": to_date,
            "token": self.settings.finnhub_api_key,
        }
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()
        articles: list[NewsArticle] = []
        for item in data[:8]:
            articles.append(
                NewsArticle(
                    headline=item.get("headline", ""),
                    summary=item.get("summary", ""),
                    source=item.get("source", "Finnhub"),
                    url=item.get("url", ""),
                    published_at=utcnow(),  # Finnhub returns epoch; simplified
                    tags=[item.get("category", "general")],
                )
            )
        return articles


market_data_service = MarketDataService()
