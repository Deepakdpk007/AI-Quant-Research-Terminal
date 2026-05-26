"""FastAPI application factory + lifespan + middleware."""

from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse

from . import __version__
from .cache import cache
from .config import get_settings
from .db import init_db
from .logging import logger, setup_logging
from .routers import agents as agents_router
from .routers import market as market_router
from .routers import quant as quant_router
from .routers import rag as rag_router
from .routers import watcher as watcher_router
from .routers import ws as ws_router
from .schemas import HealthResponse
from .services.rag import rag_service

DISCLAIMER = (
    "Educational use only. Not financial advice. Outputs are illustrative and may "
    "be derived from synthetic data when in mock mode."
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    setup_logging()
    settings = get_settings()
    logger.info("Starting AI Quant Research Terminal v{} (mode={})", __version__, settings.app_mode)

    await init_db()
    await cache.connect()
    await rag_service.initialise()
    logger.info("Lifespan init complete")
    try:
        yield
    finally:
        await cache.close()
        logger.info("Lifespan shutdown complete")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="AI Quant Research Terminal",
        version=__version__,
        description=(
            "Multi-agent financial research backend. Educational use only — "
            "not financial advice. Switch APP_MODE in .env to toggle mock / hybrid / real."
        ),
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def request_log_middleware(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        if settings.enable_request_log:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.info(
                "{} {} -> {} ({:.1f}ms)",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
            )
        return response

    @app.get("/", tags=["meta"])
    async def root() -> dict:
        return {
            "service": "AI Quant Research Terminal",
            "version": __version__,
            "mode": settings.app_mode,
            "disclaimer": DISCLAIMER,
            "docs": "/docs",
            "health": "/health",
        }

    @app.get("/health", response_model=HealthResponse, tags=["meta"])
    async def health() -> HealthResponse:
        return HealthResponse(
            mode=settings.app_mode,
            version=__version__,
            services={
                "database": "connected",
                "redis": "connected" if cache._redis_ok else "fallback",  # type: ignore[attr-defined]
                "llm": "real" if settings.use_real_llm else "mock",
                "market": "real" if settings.use_real_market else "mock",
                "rag": "ready",
            },
            disclaimer=DISCLAIMER,
        )

    app.include_router(market_router.router)
    app.include_router(quant_router.router)
    app.include_router(agents_router.router)
    app.include_router(rag_router.router)
    app.include_router(watcher_router.router)
    app.include_router(ws_router.router)

    @app.exception_handler(Exception)
    async def unhandled_exception(request: Request, exc: Exception):  # pragma: no cover
        logger.exception("Unhandled error on {}: {}", request.url.path, exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": exc.__class__.__name__},
        )

    return app


app = create_app()
