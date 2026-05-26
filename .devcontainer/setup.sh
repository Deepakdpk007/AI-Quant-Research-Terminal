#!/usr/bin/env bash
# One-time setup — runs when the Codespace is first created.
set -e

cd /workspaces/AI-Quant-Research-Terminal

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  AI Quant Research Terminal — first-time setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "🟢 [1/3] Creating .env from template..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "       .env created (mock mode — works without API keys)"
else
  echo "       .env already exists, skipping"
fi
echo ""

echo "🟢 [2/3] Installing backend dependencies (Python 3.11)..."
cd backend
pip install --quiet --upgrade pip
pip install --quiet -e ".[dev]"
echo "       ✓ backend ready"
cd ..
echo ""

echo "🟢 [3/3] Installing frontend dependencies (Node 20)..."
cd frontend
npm install --no-audit --no-fund --loglevel=error
echo "       ✓ frontend ready"
cd ..
echo ""

mkdir -p logs

echo "════════════════════════════════════════════════════════════════"
echo "  Setup complete!"
echo ""
echo "  Services will auto-start when this Codespace attaches."
echo "  When you see the toast 'Your application running on port 3000',"
echo "  click 'Open in Browser' to see the terminal."
echo "════════════════════════════════════════════════════════════════"
echo ""
