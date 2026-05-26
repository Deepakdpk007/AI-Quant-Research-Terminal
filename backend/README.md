# AI Quant Research Terminal — Backend

FastAPI service implementing the multi-agent reasoning core, quant engine,
RAG pipeline, streaming, and persistence layer for the terminal.

## Quick start

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev,rag]"
uvicorn app.main:app --reload --port 8000
```

Browse `http://localhost:8000/docs` for the interactive API.

## Layout

```
app/
  main.py            FastAPI factory, lifespan, middleware
  config.py          Pydantic settings, mode flags
  logging.py         Loguru sink + request middleware
  db.py              Async SQLAlchemy engine + session
  models/            ORM models
  schemas/           Pydantic request / response models
  cache.py           Redis with in-memory fallback
  routers/           HTTP routers (market, agents, quant, rag, watcher, ws)
  services/          Market data, quant, RAG, streaming
  agents/            5 specialist agents + orchestrator
  intelligence/      Thesis, narrative, scenario, decay, memory, regime, watcher
  utils/             Helpers, datetime, attribution math
  fixtures/          Mock-mode deterministic data
```

## Run modes

| Mode    | Behavior                                                          |
|---------|-------------------------------------------------------------------|
| mock    | Everything stubbed, no external services required                  |
| hybrid  | Real market data via yfinance, mock LLM outputs                    |
| real    | Anthropic Claude + Finnhub + yfinance + ChromaDB + Redis           |

Switch via `APP_MODE` in `.env` (see `../.env.example`).

> Educational use only. Not financial advice.
