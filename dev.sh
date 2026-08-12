#!/usr/bin/env bash
# Sobe o backend (NestJS, :3000) e o frontend (Next.js, :3001) juntos.
set -m

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
  echo ""
  echo "Parando backend e frontend..."
  [[ -n "${BACKEND_PID:-}" ]] && kill -TERM "-$BACKEND_PID" 2>/dev/null
  [[ -n "${FRONTEND_PID:-}" ]] && kill -TERM "-$FRONTEND_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

(cd "$ROOT_DIR/backend" && exec pnpm run start:dev) &
BACKEND_PID=$!

(cd "$ROOT_DIR/frontend" && exec pnpm dev) &
FRONTEND_PID=$!

echo "Backend  (pid $BACKEND_PID)  -> http://localhost:3000"
echo "Frontend (pid $FRONTEND_PID) -> http://localhost:3001"
echo "Ctrl+C para parar os dois."

wait
