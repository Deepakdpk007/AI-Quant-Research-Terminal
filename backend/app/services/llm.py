"""Anthropic Claude client wrapper with mock fallback.

Every agent and intelligence engine talks to Claude through this module. When
real mode is off (or the SDK / key is missing) we return deterministic stub
responses sourced from the agent's own ``mock_response`` method. This keeps
the entire pipeline runnable without an internet connection or paid keys.
"""

from __future__ import annotations

import json
from typing import Any

from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import get_settings
from ..logging import logger

try:  # pragma: no cover - optional dep
    from anthropic import AsyncAnthropic
except Exception:  # pragma: no cover
    AsyncAnthropic = None  # type: ignore[assignment]


class LLMClient:
    """Thin async wrapper that returns parsed JSON or raw text."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: Any | None = None
        if self.settings.use_real_llm and AsyncAnthropic is not None:
            try:
                self._client = AsyncAnthropic(api_key=self.settings.anthropic_api_key)
                logger.info("Anthropic client ready (model={})", self.settings.anthropic_model)
            except Exception as exc:  # pragma: no cover
                logger.warning("Anthropic init failed, falling back to mock: {}", exc)
                self._client = None
        else:
            logger.info(
                "LLM running in mock mode (real LLM disabled or key missing)"
            )

    @property
    def is_real(self) -> bool:
        return self._client is not None

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.3, min=0.3, max=2),
        reraise=True,
    )
    async def complete_json(
        self,
        *,
        system: str,
        user: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> dict[str, Any]:
        """Call Claude and parse its JSON response.

        Raises if the model returns malformed JSON. Caller is expected to use
        ``mock=`` fallback before calling this in mock-mode paths.
        """

        if self._client is None:
            raise RuntimeError("LLM client is not in real mode")

        msg = await self._client.messages.create(  # type: ignore[union-attr]
            model=self.settings.anthropic_model,
            max_tokens=max_tokens or self.settings.anthropic_max_tokens,
            temperature=temperature if temperature is not None else self.settings.anthropic_temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        text = "\n".join(block.text for block in msg.content if getattr(block, "text", None))
        # Some prompts wrap JSON in fenced blocks — strip them
        cleaned = text.strip().strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.warning("LLM returned non-JSON (using fallback). text={!r}", text[:200])
            raise exc

    async def complete_text(self, *, system: str, user: str, max_tokens: int | None = None) -> str:
        if self._client is None:
            raise RuntimeError("LLM client is not in real mode")
        msg = await self._client.messages.create(  # type: ignore[union-attr]
            model=self.settings.anthropic_model,
            max_tokens=max_tokens or self.settings.anthropic_max_tokens,
            temperature=self.settings.anthropic_temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return "\n".join(block.text for block in msg.content if getattr(block, "text", None))


llm = LLMClient()
