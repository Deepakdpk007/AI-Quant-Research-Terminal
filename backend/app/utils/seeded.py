"""Deterministic random helpers — same symbol always seeds the same numbers.

This is critical for mock mode: a recruiter cloning the repo should see the
exact same demo every time, so the analysis is reproducible.
"""

from __future__ import annotations

import hashlib
import random


def seed_from(*parts: object) -> int:
    """Return a 64-bit integer seed derived from string parts."""

    payload = "|".join(str(p) for p in parts).encode("utf-8")
    digest = hashlib.sha256(payload).digest()
    return int.from_bytes(digest[:8], "big", signed=False)


def rng(*parts: object) -> random.Random:
    """A `random.Random` instance seeded from the given parts."""

    return random.Random(seed_from(*parts))
