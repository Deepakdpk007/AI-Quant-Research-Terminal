"""Application configuration via pydantic-settings.

The app supports three runtime modes — mock, hybrid, real — selected via
``APP_MODE``. The settings object is a singleton and should be imported
through :func:`get_settings` so we can swap it in tests.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppMode = Literal["mock", "hybrid", "real"]
AppEnv = Literal["development", "staging", "production"]


class Settings(BaseSettings):
    """Strongly-typed configuration loaded from environment / .env files."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- Runtime ----------------------------------------------------------
    app_mode: AppMode = Field(default="mock", alias="APP_MODE")
    app_env: AppEnv = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    educational_disclaimer_ack: bool = Field(default=True, alias="EDUCATIONAL_DISCLAIMER_ACK")

    # ---- Anthropic --------------------------------------------------------
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(default="claude-sonnet-4-20250514", alias="ANTHROPIC_MODEL")
    anthropic_max_tokens: int = Field(default=1024, alias="ANTHROPIC_MAX_TOKENS")
    anthropic_temperature: float = Field(default=0.4, alias="ANTHROPIC_TEMPERATURE")

    # ---- Market data ------------------------------------------------------
    finnhub_api_key: str = Field(default="", alias="FINNHUB_API_KEY")
    alpha_vantage_api_key: str = Field(default="", alias="ALPHA_VANTAGE_API_KEY")
    polygon_api_key: str = Field(default="", alias="POLYGON_API_KEY")

    # ---- NLP / embeddings -------------------------------------------------
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    embedding_model: str = Field(default="all-MiniLM-L6-v2", alias="EMBEDDING_MODEL")

    # ---- Database ---------------------------------------------------------
    database_url: str = Field(
        default="sqlite+aiosqlite:///./data/terminal.db", alias="DATABASE_URL"
    )

    # ---- Redis ------------------------------------------------------------
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    redis_optional: bool = Field(default=True, alias="REDIS_OPTIONAL")

    # ---- Vector store -----------------------------------------------------
    chroma_persist_dir: str = Field(default="./data/chroma", alias="CHROMA_PERSIST_DIR")
    chroma_collection: str = Field(default="quant_terminal", alias="CHROMA_COLLECTION")

    # ---- Cors / API -------------------------------------------------------
    allowed_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000",
        alias="ALLOWED_ORIGINS",
    )

    # ---- Observability ----------------------------------------------------
    sentry_dsn: str = Field(default="", alias="SENTRY_DSN")
    enable_request_log: bool = Field(default=True, alias="ENABLE_REQUEST_LOG")

    # ---- Derived helpers --------------------------------------------------
    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def use_real_llm(self) -> bool:
        return self.app_mode == "real" and bool(self.anthropic_api_key)

    @property
    def use_real_market(self) -> bool:
        return self.app_mode in {"real", "hybrid"}

    @property
    def is_mock(self) -> bool:
        return self.app_mode == "mock"

    @field_validator("log_level")
    @classmethod
    def _normalise_log_level(cls, v: str) -> str:
        v = v.upper().strip()
        if v not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
            return "INFO"
        return v


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the cached settings singleton."""

    return Settings()
