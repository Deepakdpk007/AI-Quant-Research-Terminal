# =============================================================================
# AI Quant Research Terminal — Make targets
# =============================================================================

.PHONY: help install dev backend frontend test lint format docker docker-down clean

help:
	@echo "AI Quant Research Terminal — common targets"
	@echo ""
	@echo "  make install        Install backend + frontend dependencies"
	@echo "  make dev            Start backend (8000) and frontend (3000)"
	@echo "  make backend        Start FastAPI backend only"
	@echo "  make frontend       Start Next.js frontend only"
	@echo "  make test           Run backend tests"
	@echo "  make lint           Lint backend + frontend"
	@echo "  make format         Format backend + frontend"
	@echo "  make docker         docker compose up --build"
	@echo "  make docker-down    docker compose down -v"
	@echo "  make clean          Remove caches and build artifacts"

install:
	cd backend && pip install -e ".[dev]"
	cd frontend && npm install

dev:
	@echo "Backend: http://localhost:8000  Frontend: http://localhost:3000"
	@(cd backend && uvicorn app.main:app --reload --port 8000) & \
	 (cd frontend && npm run dev) & wait

backend:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest -q

lint:
	cd backend && ruff check app
	cd frontend && npm run lint

format:
	cd backend && ruff check --fix app && ruff format app
	cd frontend && npm run format

docker:
	docker compose up --build

docker-down:
	docker compose down -v

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/dist backend/build backend/*.egg-info
	rm -rf frontend/.next frontend/out frontend/node_modules/.cache
