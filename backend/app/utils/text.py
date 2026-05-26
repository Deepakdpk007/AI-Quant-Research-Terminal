"""Tiny text helpers."""

from __future__ import annotations

import re


_WHITESPACE = re.compile(r"\s+")


def squeeze(text: str) -> str:
    return _WHITESPACE.sub(" ", text or "").strip()


def title_case(text: str) -> str:
    return " ".join(part.capitalize() for part in text.split())


def short_sym(symbol: str) -> str:
    """Strip exchange suffixes from symbols (TATAMOTORS.NS -> TATAMOTORS)."""

    return symbol.split(".", 1)[0].upper()
