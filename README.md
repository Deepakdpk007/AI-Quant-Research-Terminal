# AI Quant Research Terminal

> Bloomberg Terminal × ChatGPT × Quant Research Lab — built as one cohesive,
> production-grade reference architecture for **multi-agent financial reasoning,
> explainable AI, and real-time intelligence**.
>
> ⚠️ **Educational use only — not financial advice.** Outputs are illustrative
> and may be derived from synthetic data when running in mock mode.

---

## Why this exists

Most "AI finance" projects are dashboards or single-prompt chatbots. This is
something different: an **AI-native financial operating system** where five
specialist agents reason in parallel, a master orchestrator synthesises a
weighted consensus, every conclusion is decomposed into attributable signals,
and the system tracks how its own confidence has evolved over time.

### What ships in the box

| Capability                       | What it actually means                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Multi-agent orchestration**    | 5 agents (Macro · Sentiment · Technical · Valuation · Risk) run in parallel with weighted consensus    |
| **Explainable AI attribution**   | Every confidence score is decomposed into ±contributions per signal, per agent                         |
| **Disagreement detection**       | When agents disagree the system flags the divergence and applies a confidence penalty                  |
| **Signal decay**                 | Each signal fades on a domain-specific half-life (sentiment fast, valuation slow)                      |
| **AI memory**                    | Every analysis is stored; trajectory of confidence over time is plotted with delta reasons             |
| **Causal scenario engine**       | Simulate "Crude +10%" / "RBI +50bps" / "FII outflow" and watch the cascade through the thesis         |
| **Multi-horizon analysis**       | Intraday / Swing / Positional / Long-term with separate confidence per horizon                         |
| **Trade playbook**               | AI-generated entry/target/stop/RR/size with catalysts and invalidations                                |
| **RAG pipeline**                 | Upload PDFs (earnings calls, annual reports), ask grounded questions with chunk-level citations        |
| **Live agent stream (SSE)**      | Watch each agent's reasoning land in real time                                                         |
| **Watcher agents**               | Background anomaly + event scanner pushing alerts                                                      |
| **Quant engine**                 | RSI · MACD · Bollinger · ATR · EMA · VWAP · Sharpe · Max Drawdown · Vol · VaR · Beta                   |
| **Market regime detection**      | Rule-based regime classifier (RISK-ON / NEUTRAL / RISK-OFF / PANIC) over VIX + breadth + momentum      |
| **Bloomberg-style terminal UI**  | Dense dark theme, ⌘K command palette, custom SVG charts, six-tab navigation                            |

---

## Architecture

```
                         ┌──────────────────────────────┐
                         │   React / Next.js 14 (UI)    │
                         │  Terminal · Charts · Chat    │
                         └──────────────┬───────────────┘
                                  HTTPS / SSE / WS
                                ┌──────▼──────┐
                                │  FastAPI    │
                                │  Gateway    │
                                └──┬─┬─┬─┬─┬─┘
        ┌──────────┬──────────────┘ │ │ │ └──────────────┐
        ▼          ▼                ▼ ▼ ▼                ▼
 ┌────────────┐┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
 │  Market    ││ AI Agent   │ │  Quant     │ │   RAG      │ │  Watcher   │
 │  Service   ││ Orchestr.  │ │  Engine    │ │ Pipeline   │ │  Engine    │
 └─────┬──────┘└────┬───────┘ └────┬───────┘ └─────┬──────┘ └─────┬──────┘
       ▼            ▼              ▼               ▼              ▼
 ┌────────────┐┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
 │ yfinance   ││  Claude    │ │  pandas    │ │  ChromaDB  │ │  Postgres  │
 │ Finnhub    ││  Sonnet 4  │ │  numpy/ta  │ │  + ST embd │ │  + Redis   │
 │ Mock fxts  ││  + Mock    │ │            │ │  + Mock    │ │            │
 └────────────┘└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

### Single-request data flow

```
Client → GET /api/agents/TATAMOTORS/analyze
            ↓
       MarketDataService
       Quant engine
            ↓
   ┌── Macro    ─┐
   ├── Sentiment ┤
   ├── Technical │  Parallel via asyncio.gather
   ├── Valuation │
   └── Risk     ─┘
            ↓
   Orchestrator
    · weighted consensus
    · disagreement detection (penalty)
    · signal attribution (explainable)
    · thesis + invalidations + multi-horizon + playbook
    · narrative + regime
    · memory write + delta vs prior analysis
            ↓
       Consensus JSON  →  client
```

---

## Quick start (local — no API keys required)

The terminal runs **end-to-end in mock mode** out of the box. No external
services, no internet, no paid keys.

### Prerequisites

- Python 3.11+ and Node 20+
- (Optional) Docker for the one-command path

### Option A — Bare metal

```bash
# 1. Clone and configure
git clone https://github.com/Deepakdpk007/AI-Quant-Research-Terminal.git
cd AI-Quant-Research-Terminal
cp .env.example .env       # leave APP_MODE=mock to start without keys

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev,rag]"
uvicorn app.main:app --reload --port 8000

# 3. Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Option B — Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

| Service          | URL                            |
| ---------------- | ------------------------------ |
| Frontend         | <http://localhost:3000>        |
| Backend API      | <http://localhost:8000>        |
| Interactive docs | <http://localhost:8000/docs>   |
| Health           | <http://localhost:8000/health> |

---

## Run modes

Set `APP_MODE` in `.env`:

| Mode     | LLM       | Market data | News        | Vector DB  | Use case                               |
| -------- | --------- | ----------- | ----------- | ---------- | -------------------------------------- |
| `mock`   | stubbed   | synthetic   | synthetic   | in-memory  | demo / offline / first-run             |
| `hybrid` | stubbed   | yfinance    | synthetic   | Chroma     | dev with real prices, no LLM cost      |
| `real`   | Claude 4  | yfinance    | Finnhub     | Chroma     | full production behaviour              |

Switch modes by editing `.env` and restarting. **Every feature is functional in
mock mode** — radar charts, attribution, scenarios, narrative, decay, etc.

---

## Real-mode setup

To enable real-mode features, drop API keys into `.env`:

```bash
APP_MODE=real
ANTHROPIC_API_KEY=sk-ant-...
FINNHUB_API_KEY=...
# Optional
ALPHA_VANTAGE_API_KEY=
POLYGON_API_KEY=
OPENAI_API_KEY=
```

| Provider     | What it powers                       | Free tier        |
| ------------ | ------------------------------------ | ---------------- |
| Anthropic    | Claude Sonnet 4 — agents + thesis    | $5 trial credit  |
| Finnhub      | Real-time news + earnings calendar   | 60 req/min       |
| yfinance     | OHLCV + fundamentals                 | unlimited (free) |
| Alpha Vantage / Polygon | Optional fundamentals fallback | free tier   |

When the LLM call fails (network / quota / parse error) every agent falls back
to its deterministic mock — the system **never fails closed**, it degrades
gracefully.

---

## API surface

Full OpenAPI: `http://localhost:8000/docs`

```
GET   /health                                   service status + run mode
GET   /                                         meta + disclaimer

GET   /api/market/universe                      curated symbol list
GET   /api/market/regime                        macro regime snapshot
GET   /api/market/{symbol}                      quote + candles + news
GET   /api/market/{symbol}/quote                quote only
GET   /api/market/{symbol}/news                 news only
GET   /api/market/{symbol}/candles              OHLCV only

GET   /api/quant/{symbol}                       indicators + risk metrics
GET   /api/quant/{symbol}/indicators            indicators only
GET   /api/quant/{symbol}/risk                  risk metrics only

GET   /api/agents/{symbol}/analyze              full multi-agent consensus
GET   /api/agents/{symbol}/stream               SSE — live agent reasoning
GET   /api/agents/{symbol}/memory               confidence trajectory
GET   /api/agents/{symbol}/decay                signal decay table
GET   /api/agents/scenarios                     catalogue of scenarios
POST  /api/agents/scenario                      run causal scenario

POST  /api/rag/ingest                           upload & embed (PDF/text)
POST  /api/rag/query                            grounded answer + sources

GET   /api/watcher/alerts                       all autonomous alerts
GET   /api/watcher/alerts/{symbol}              alerts for a symbol

WS    /ws/prices/{symbol}                       live tick stream
WS    /ws/alerts                                live alert stream
```

---

## Repository layout

```
AI-Quant-Research-Terminal/
├── backend/
│   ├── app/
│   │   ├── agents/         5 specialist agents + orchestrator
│   │   ├── intelligence/   thesis · narrative · scenario · decay · memory · regime · watcher · attribution · disagreement
│   │   ├── routers/        REST + SSE + WebSocket
│   │   ├── services/       market data · quant · llm · rag
│   │   ├── fixtures/       deterministic mock-mode data
│   │   ├── utils/          clock · text · seeded RNG
│   │   ├── config.py       pydantic-settings
│   │   ├── db.py           async SQLAlchemy
│   │   ├── cache.py        Redis + in-memory fallback
│   │   ├── models.py       ORM models
│   │   ├── schemas.py      Pydantic request/response
│   │   └── main.py         FastAPI factory + lifespan
│   ├── tests/              pytest smoke suite
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            Next.js 14 App Router entry
│   │   ├── components/
│   │   │   ├── layout/     RegimeStrip · TopBar · Sidebar · StatusBar
│   │   │   ├── tabs/       Overview · Consensus · Thesis · Scenarios · Playbook · Watcher
│   │   │   ├── panels/     AgentStream · MarketNarrative · ResearchChat
│   │   │   ├── charts/     custom SVG: Radar · Sparkline · ConfidenceBar · Decay · Memory · Attribution
│   │   │   ├── shared/     CommandPalette · AgentBadge · Pill · MetricCard · DisagreementAlert
│   │   │   └── Terminal.tsx
│   │   ├── hooks/          useAnalysis · useAgentStream
│   │   └── lib/            api · types · utils
│   ├── tailwind.config.ts
│   ├── next.config.mjs
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
├── Makefile
├── .env.example
├── LICENSE                MIT (with educational disclaimer)
└── README.md              you are here
```

---

## The five agents

| Agent      | Weight | Personality                                                                  |
| ---------- | ------ | ---------------------------------------------------------------------------- |
| Macro      | 20%    | Top-down, cycle-aware, ignores noise                                         |
| Sentiment  | 30%    | Crowd psychology, narrative momentum, analyst flow                           |
| Technical  | 25%    | Pattern-driven, evidence-bound, no narrative weighting                       |
| Valuation  | 10%    | Skeptical of momentum, price-checks the thesis vs sector medians             |
| Risk       | 15%    | Conservative dissenter, tail-risk aware, unconvinced by momentum             |

Each agent ships with both a **mock implementation** (deterministic, derived
from quant inputs) and an **LLM prompt pair** that drives Claude when real
mode is enabled. Mock outputs are never random — they reproduce identically
for the same inputs so demos and tests stay stable.

---

## Try these flows

1. **Live consensus stream** — open the Consensus tab → watch the right rail
   stream each agent's reasoning, then the final consensus.
2. **Explainable attribution** — Consensus tab → see exactly which signals
   pushed the score up and which pulled it down.
3. **Causal scenario** — Scenarios tab → run *Crude oil +10%* on TATAMOTORS
   → see the cascade and confidence delta.
4. **AI memory trajectory** — analyse the same symbol multiple times → Thesis
   tab plots how the system's conviction has moved with delta reasons.
5. **RAG chat** — `POST /api/rag/ingest` an earnings transcript, then ask
   questions in the Research Chat panel and see chunk-level citations.
6. **Command palette** — `⌘K` (or `Ctrl+K`) to jump between symbols.

---

## Educational disclaimer

This project is a software-engineering and AI-architecture portfolio piece. It
is **not** intended to be used to make trading decisions. Outputs are
illustrative, may be derived from synthetic data, and the orchestrator is not
calibrated against real market outcomes. Use at your own risk and consult a
licensed financial professional for investment decisions.

The disclaimer is reflected in:
- The repository [LICENSE](./LICENSE)
- The API root response (`GET /`) and `/health` payload
- The terminal sidebar and footer

---

## License

MIT — see [LICENSE](./LICENSE). Educational use only; no financial advice.
