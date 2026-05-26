#!/usr/bin/env bash
# Auto-start backend + frontend whenever the Codespace attaches.
# Idempotent — safe to run multiple times.
set -e

cd /workspaces/AI-Quant-Research-Terminal
mkdir -p logs

echo ""
echo "🚀 Starting AI Quant Research Terminal services..."
echo ""

# --- Kill any previous instances (so re-attach is clean) -----------------
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "next dev"       2>/dev/null || true
pkill -f "next-server"    2>/dev/null || true
sleep 1

# --- Backend -------------------------------------------------------------
echo "  • Backend  → http://localhost:8000  (logs: logs/backend.log)"
cd backend
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 \
  > ../logs/backend.log 2>&1 &
cd ..

# Wait up to 45s for /health to respond
for i in $(seq 1 45); do
  if curl -fsS http://localhost:8000/health > /dev/null 2>&1; then
    echo "             ✓ backend healthy"
    break
  fi
  sleep 1
  if [ "$i" -eq 45 ]; then
    echo "             ⚠ backend slow to start — check logs/backend.log"
  fi
done

# --- Frontend ------------------------------------------------------------
echo "  • Frontend → http://localhost:3000  (logs: logs/frontend.log)"
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
cd ..

# Wait up to 60s for Next to compile
for i in $(seq 1 60); do
  if curl -fsS http://localhost:3000 > /dev/null 2>&1; then
    echo "             ✓ frontend ready"
    break
  fi
  sleep 1
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  ✓ Both services running."
echo ""
echo "  Open the PORTS tab (bottom of VS Code) and click the 🌐 icon"
echo "  next to port 3000 to view the terminal in your browser."
echo ""
echo "  Live logs:    tail -f logs/backend.log logs/frontend.log"
echo "  Stop:         pkill -f 'uvicorn app.main'; pkill -f 'next dev'"
echo "  Restart:      bash .devcontainer/start.sh"
echo "════════════════════════════════════════════════════════════════"
echo ""
