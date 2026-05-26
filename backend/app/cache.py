"""Redis cache with in-memory fallback.

The cache exposes a tiny, async-friendly interface (`get_json`, `set_json`,
`delete`). Whenever Redis is unreachable and ``REDIS_OPTIONAL`` is true, we
silently fall back to a TTL-aware in-process dictionary so the app continues
to function for development and demos.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import orjson

try:
    import redis.asyncio as aioredis  # type: ignore
except ImportError:  # pragma: no cover
    aioredis = None  # type: ignore[assignment]

from .config import get_settings
from .logging import logger


class _MemoryCache:
    """Simple async-safe TTL cache used when Redis is not available."""

    def __init__(self) -> None:
        self._data: dict[str, tuple[float, bytes]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> bytes | None:
        async with self._lock:
            entry = self._data.get(key)
            if not entry:
                return None
            expires_at, value = entry
            if expires_at and expires_at < time.time():
                self._data.pop(key, None)
                return None
            return value

    async def set(self, key: str, value: bytes, ttl: int | None = None) -> None:
        async with self._lock:
            expires_at = time.time() + ttl if ttl else 0
            self._data[key] = (expires_at, value)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._data.pop(key, None)


class Cache:
    """Unified cache interface."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._memory = _MemoryCache()
        self._redis: Any | None = None
        self._redis_ok = False

    async def connect(self) -> None:
        if aioredis is None:
            logger.info("redis package missing, using in-memory cache")
            return
        try:
            self._redis = aioredis.from_url(
                self._settings.redis_url, encoding="utf-8", decode_responses=False
            )
            await self._redis.ping()
            self._redis_ok = True
            logger.info("Redis cache connected: {}", self._settings.redis_url)
        except Exception as exc:  # pragma: no cover - depends on env
            self._redis_ok = False
            self._redis = None
            level = "warning" if self._settings.redis_optional else "error"
            getattr(logger, level)(
                "Redis unavailable ({}). Falling back to in-memory cache.", exc
            )

    async def close(self) -> None:
        if self._redis is not None:
            try:
                await self._redis.aclose()
            except Exception:  # pragma: no cover
                pass

    async def get_json(self, key: str) -> Any | None:
        raw = await self._get(key)
        if raw is None:
            return None
        try:
            return orjson.loads(raw)
        except Exception:  # pragma: no cover
            return None

    async def set_json(self, key: str, value: Any, ttl: int | None = None) -> None:
        await self._set(key, orjson.dumps(value), ttl)

    async def delete(self, key: str) -> None:
        if self._redis_ok and self._redis:
            try:
                await self._redis.delete(key)
                return
            except Exception:  # pragma: no cover
                pass
        await self._memory.delete(key)

    # ---- internal ---------------------------------------------------------
    async def _get(self, key: str) -> bytes | None:
        if self._redis_ok and self._redis:
            try:
                return await self._redis.get(key)
            except Exception:  # pragma: no cover
                self._redis_ok = False
        return await self._memory.get(key)

    async def _set(self, key: str, value: bytes, ttl: int | None = None) -> None:
        if self._redis_ok and self._redis:
            try:
                if ttl:
                    await self._redis.set(key, value, ex=ttl)
                else:
                    await self._redis.set(key, value)
                return
            except Exception:  # pragma: no cover
                self._redis_ok = False
        await self._memory.set(key, value, ttl)


cache = Cache()
