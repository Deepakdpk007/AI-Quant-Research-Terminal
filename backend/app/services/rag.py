"""RAG pipeline — Chroma + sentence-transformers with deterministic fallback.

The pipeline supports four operations:
  * ingest_pdf(path) -> chunk + embed + persist
  * ingest_text(text) -> for tests / API uploads
  * query(question, symbol?) -> top-k chunks
  * answer(question, symbol?) -> grounded answer

When ChromaDB / sentence-transformers / Anthropic are unavailable, we fall
back to a tiny in-memory keyword retriever and template-based answer so the
endpoint stays functional in mock mode.
"""

from __future__ import annotations

import asyncio
import os
import re
import uuid
from collections import Counter
from dataclasses import dataclass
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..logging import logger
from ..models import RagDocument
from ..schemas import RagSource
from ..services.llm import llm

# ---- Optional dependencies (graceful import) ------------------------------
try:  # pragma: no cover
    import chromadb  # type: ignore
    from chromadb.config import Settings as ChromaSettings  # type: ignore
except Exception:  # pragma: no cover
    chromadb = None  # type: ignore[assignment]
    ChromaSettings = None  # type: ignore[assignment]

try:  # pragma: no cover
    from sentence_transformers import SentenceTransformer  # type: ignore
except Exception:  # pragma: no cover
    SentenceTransformer = None  # type: ignore[assignment]

try:  # pragma: no cover
    from pypdf import PdfReader  # type: ignore
except Exception:  # pragma: no cover
    PdfReader = None  # type: ignore[assignment]


@dataclass
class _Chunk:
    text: str
    metadata: dict[str, Any]


def _chunk_text(text: str, max_chars: int = 1200, overlap: int = 200) -> list[str]:
    text = re.sub(r"\s+", " ", text or "").strip()
    if not text:
        return []
    chunks: list[str] = []
    i = 0
    while i < len(text):
        chunks.append(text[i : i + max_chars])
        i += max_chars - overlap
    return chunks


_TOKEN = re.compile(r"\w+")


def _keyword_score(query: str, text: str) -> float:
    q_tokens = Counter(t.lower() for t in _TOKEN.findall(query))
    t_tokens = Counter(t.lower() for t in _TOKEN.findall(text))
    if not q_tokens or not t_tokens:
        return 0.0
    overlap = sum((q_tokens & t_tokens).values())
    return overlap / (len(q_tokens) ** 0.5)


class RagService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._chroma: Any | None = None
        self._collection: Any | None = None
        self._embedder: Any | None = None
        # In-memory fallback store: list of (id, text, metadata)
        self._mem: list[tuple[str, str, dict[str, Any]]] = []

    async def initialise(self) -> None:
        if chromadb is None or self.settings.is_mock:
            logger.info("RAG using in-memory fallback (chroma {})", "missing" if chromadb is None else "disabled")
            return
        try:
            os.makedirs(self.settings.chroma_persist_dir, exist_ok=True)
            self._chroma = chromadb.PersistentClient(
                path=self.settings.chroma_persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False) if ChromaSettings else None,
            )
            self._collection = self._chroma.get_or_create_collection(
                name=self.settings.chroma_collection
            )
            if SentenceTransformer is not None:
                # Lazy load embedder in a thread to avoid blocking startup
                loop = asyncio.get_event_loop()
                self._embedder = await loop.run_in_executor(
                    None, lambda: SentenceTransformer(self.settings.embedding_model)
                )
            logger.info("RAG initialised with collection={}", self.settings.chroma_collection)
        except Exception as exc:  # pragma: no cover
            logger.warning("RAG init fallback to in-memory: {}", exc)
            self._chroma = None
            self._collection = None

    # ------------------------------------------------------------------ #
    async def _embed(self, texts: list[str]) -> list[list[float]] | None:
        if self._embedder is None:
            return None
        loop = asyncio.get_event_loop()
        vectors = await loop.run_in_executor(None, lambda: self._embedder.encode(texts).tolist())
        return vectors

    async def ingest_text(
        self,
        *,
        session: AsyncSession,
        symbol: str | None,
        doc_type: str,
        title: str,
        text: str,
    ) -> RagDocument:
        chunks = _chunk_text(text)
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = [
            {"symbol": symbol or "", "doc_type": doc_type, "title": title, "chunk": i}
            for i in range(len(chunks))
        ]

        embeddings = await self._embed(chunks) if self._collection else None

        if self._collection is not None:
            try:
                self._collection.add(
                    ids=ids,
                    documents=chunks,
                    metadatas=metadatas,
                    embeddings=embeddings,
                )
            except Exception as exc:  # pragma: no cover
                logger.warning("Chroma add failed, fallback to memory: {}", exc)
                for cid, c, meta in zip(ids, chunks, metadatas, strict=True):
                    self._mem.append((cid, c, meta))
        else:
            for cid, c, meta in zip(ids, chunks, metadatas, strict=True):
                self._mem.append((cid, c, meta))

        record = RagDocument(
            symbol=symbol,
            doc_type=doc_type,
            title=title,
            source_path="(text upload)",
            chunk_count=len(chunks),
        )
        session.add(record)
        await session.commit()
        await session.refresh(record)
        return record

    async def ingest_pdf(
        self,
        *,
        session: AsyncSession,
        symbol: str | None,
        doc_type: str,
        title: str,
        path: str,
    ) -> RagDocument:
        if PdfReader is None:
            raise RuntimeError("pypdf not installed; install with `pip install -e .[rag]`")
        text_parts: list[str] = []
        reader = PdfReader(path)
        for page in reader.pages:
            try:
                text_parts.append(page.extract_text() or "")
            except Exception:
                continue
        return await self.ingest_text(
            session=session,
            symbol=symbol,
            doc_type=doc_type,
            title=title,
            text="\n".join(text_parts),
        )

    # ------------------------------------------------------------------ #
    async def query(self, question: str, symbol: str | None = None, k: int = 5) -> list[RagSource]:
        if self._collection is not None:
            try:
                emb = await self._embed([question])
                where = {"symbol": symbol} if symbol else None
                res = self._collection.query(
                    query_embeddings=emb,
                    query_texts=[question] if not emb else None,
                    n_results=k,
                    where=where,
                )
                ids = res.get("ids", [[]])[0]
                docs = res.get("documents", [[]])[0]
                metas = res.get("metadatas", [[]])[0]
                dists = res.get("distances", [[]])[0] or [0.0] * len(ids)
                sources: list[RagSource] = []
                for cid, doc, meta, dist in zip(ids, docs, metas, dists, strict=True):
                    sources.append(
                        RagSource(
                            chunk_id=cid,
                            score=round(float(1 - dist), 3),
                            text=doc,
                            metadata=meta or {},
                        )
                    )
                return sources
            except Exception as exc:  # pragma: no cover
                logger.warning("Chroma query failed, fallback to memory: {}", exc)
        # Fallback: keyword scoring
        scored = []
        for cid, text, meta in self._mem:
            if symbol and meta.get("symbol") and meta["symbol"] != symbol:
                continue
            scored.append((cid, text, meta, _keyword_score(question, text)))
        scored.sort(key=lambda x: -x[3])
        return [
            RagSource(chunk_id=cid, score=round(score, 3), text=text, metadata=meta)
            for cid, text, meta, score in scored[:k]
            if score > 0
        ]

    async def answer(self, question: str, symbol: str | None = None, k: int = 5) -> tuple[str, list[RagSource]]:
        sources = await self.query(question, symbol=symbol, k=k)
        if not sources:
            return (
                "No documents indexed yet. Upload an earnings transcript or report via "
                "POST /api/rag/ingest to enable grounded answers.",
                [],
            )

        # LLM-backed grounded answer when available
        if llm.is_real:
            try:
                context_block = "\n\n".join(f"[Source {i+1}] {s.text}" for i, s in enumerate(sources))
                system = (
                    "You are a buy-side research assistant. Answer the question using ONLY the "
                    "provided sources. If the answer is not in the sources, say so. Be concise."
                )
                user = f"Question: {question}\n\nSources:\n{context_block}\n\nAnswer:"
                text = await llm.complete_text(system=system, user=user)
                return text.strip(), sources
            except Exception as exc:  # pragma: no cover
                logger.warning("RAG LLM fallback: {}", exc)

        # Mock-mode synthesis: extractive snippet stitching
        snippets = " | ".join(s.text[:240] for s in sources[:3])
        text = (
            f"Based on the indexed documents, the most relevant context for your question is: "
            f"{snippets}"
        )
        return text, sources


rag_service = RagService()
