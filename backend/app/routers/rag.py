"""RAG endpoints — ingest documents and ask grounded questions."""

from __future__ import annotations

import os
import tempfile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..schemas import RagIngestResponse, RagQueryRequest, RagQueryResponse
from ..services.rag import rag_service

router = APIRouter(prefix="/api/rag", tags=["rag"])


@router.post("/ingest", response_model=RagIngestResponse)
async def ingest(
    file: UploadFile = File(...),
    symbol: str | None = Form(None),
    doc_type: str = Form("other"),
    title: str | None = Form(None),
    session: AsyncSession = Depends(get_session),
) -> RagIngestResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")
    suffix = os.path.splitext(file.filename)[1].lower() or ".bin"
    title = title or file.filename
    contents = await file.read()
    if suffix == ".pdf":
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            doc = await rag_service.ingest_pdf(
                session=session,
                symbol=symbol,
                doc_type=doc_type,
                title=title,
                path=tmp_path,
            )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
    else:
        doc = await rag_service.ingest_text(
            session=session,
            symbol=symbol,
            doc_type=doc_type,
            title=title,
            text=contents.decode("utf-8", errors="ignore"),
        )

    return RagIngestResponse(
        document_id=doc.id, chunks=doc.chunk_count, title=doc.title, doc_type=doc.doc_type
    )


@router.post("/query", response_model=RagQueryResponse)
async def query(req: RagQueryRequest) -> RagQueryResponse:
    answer, sources = await rag_service.answer(req.question, symbol=req.symbol, k=req.top_k)
    return RagQueryResponse(answer=answer, sources=sources)
