"""Async SQLAlchemy engine + session factory.

We default to SQLite (zero setup) and switch to Postgres in Docker. Tables are
created on startup for the dev profile; production should use Alembic.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings
from .logging import logger


class Base(DeclarativeBase):
    """Common declarative base."""


def _ensure_sqlite_dir(url: str) -> None:
    if url.startswith("sqlite"):
        # sqlite+aiosqlite:///./data/terminal.db -> ./data
        path = url.split(":///", 1)[-1]
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)


_settings = get_settings()
_ensure_sqlite_dir(_settings.database_url)

engine = create_async_engine(
    _settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    """Create all tables on startup (dev convenience)."""

    # Import models so SQLAlchemy registers them
    from . import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified ({})", _settings.database_url.split("@")[-1])


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Context manager for one-off sessions."""

    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency."""

    async with SessionLocal() as session:
        yield session
