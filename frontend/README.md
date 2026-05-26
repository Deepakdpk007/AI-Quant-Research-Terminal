# AI Quant Research Terminal — Frontend

Next.js 14 (App Router) terminal UI. Bloomberg-inspired dense dark theme,
custom SVG charts, SSE-driven agent streaming, command palette (`⌘K`).

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

The frontend talks to the backend at `NEXT_PUBLIC_API_BASE_URL`
(defaults to `http://localhost:8000`).

## Structure

```
src/
  app/                 App Router entry points
  components/
    layout/            RegimeStrip, TopBar, Sidebar, StatusBar
    panels/            AgentStream, MarketNarrative, ResearchChat
    tabs/              Overview, Consensus, Thesis, Scenarios, Playbook, Watcher
    charts/            Custom SVG: Radar, Sparkline, ConfidenceBar, MemoryTrajectory, SignalDecay
    shared/            CommandPalette, AgentBadge, Pill, MetricCard, DisagreementAlert
  hooks/               useAnalysis, useAgentStream, useMarket
  lib/                 api client, types, utils
```

> Educational use only. Not financial advice.
