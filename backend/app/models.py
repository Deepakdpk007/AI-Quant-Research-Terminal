"""SQLAlchemy ORM models.

All persistence concerns for the terminal — analyses, AI memory, RAG metadata,
watcher alerts, regime history.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class StockAnalysis(Base):
    __tablename__ = "stock_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    consensus: Mapped[str] = mapped_column(String(20))
    confidence: Mapped[float] = mapped_column(Float)
    agent_data: Mapped[dict] = mapped_column(JSON, default=dict)
    attribution: Mapped[list] = mapped_column(JSON, default=list)
    reasoning: Mapped[list] = mapped_column(JSON, default=list)
    thesis: Mapped[str] = mapped_column(Text, default="")
    invalidations: Mapped[list] = mapped_column(JSON, default=list)
    multi_horizon: Mapped[dict] = mapped_column(JSON, default=dict)
    disagreement: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class AIMemory(Base):
    __tablename__ = "ai_memory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    confidence: Mapped[float] = mapped_column(Float)
    consensus: Mapped[str] = mapped_column(String(20))
    summary: Mapped[str] = mapped_column(Text, default="")
    delta_reason: Mapped[str] = mapped_column(Text, default="")
    prev_id: Mapped[int | None] = mapped_column(
        ForeignKey("ai_memory.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    previous: Mapped["AIMemory | None"] = relationship(
        "AIMemory", remote_side="AIMemory.id"
    )


class RagDocument(Base):
    __tablename__ = "rag_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str | None] = mapped_column(String(20), index=True, nullable=True)
    doc_type: Mapped[str] = mapped_column(String(50), default="other")
    title: Mapped[str] = mapped_column(Text, default="")
    source_path: Mapped[str] = mapped_column(Text, default="")
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class WatcherAlert(Base):
    __tablename__ = "watcher_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), index=True)
    alert_type: Mapped[str] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )


class RegimeHistory(Base):
    __tablename__ = "regime_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    regime: Mapped[str] = mapped_column(String(30))
    vix: Mapped[float] = mapped_column(Float, default=0.0)
    momentum: Mapped[str] = mapped_column(String(20), default="Neutral")
    liquidity: Mapped[str] = mapped_column(String(20), default="Normal")
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
