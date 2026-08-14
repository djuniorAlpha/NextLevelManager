#!/usr/bin/env bash
# Sobe o backend (NestJS, :3000) e o frontend (Next.js, :3001) juntos.
#
# Uso:
#   ./dev.sh          Sobe os dois em foreground (Ctrl+C para parar).
#   ./dev.sh up       Sobe os dois em background (detached) e volta o terminal.
#   ./dev.sh down     Derruba o que foi subido com "up".
#   ./dev.sh status   Mostra se os processos do "up" ainda estão rodando.
set -m

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.dev.pids"
BACKEND_LOG="$ROOT_DIR/.dev-backend.log"
FRONTEND_LOG="$ROOT_DIR/.dev-frontend.log"

cleanup() {
  echo ""
  echo "Parando backend e frontend..."
  [[ -n "${BACKEND_PID:-}" ]] && kill -TERM "-$BACKEND_PID" 2>/dev/null
  [[ -n "${FRONTEND_PID:-}" ]] && kill -TERM "-$FRONTEND_PID" 2>/dev/null
}

run_foreground() {
  trap cleanup EXIT INT TERM

  (cd "$ROOT_DIR/backend" && exec pnpm run start:dev) &
  BACKEND_PID=$!

  (cd "$ROOT_DIR/frontend" && exec pnpm dev) &
  FRONTEND_PID=$!

  echo "Backend  (pid $BACKEND_PID)  -> http://localhost:3000"
  echo "Frontend (pid $FRONTEND_PID) -> http://localhost:3001"
  echo "Ctrl+C para parar os dois."

  wait
}

is_alive() {
  kill -0 "$1" 2>/dev/null
}

run_up() {
  if [[ -f "$PID_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$PID_FILE"
    if is_alive "${BACKEND_PID:-}" || is_alive "${FRONTEND_PID:-}"; then
      echo "Já tem processos rodando (veja: ./dev.sh status). Rode ./dev.sh down primeiro."
      exit 1
    fi
  fi

  (cd "$ROOT_DIR/backend" && setsid pnpm run start:dev >"$BACKEND_LOG" 2>&1 &)
  sleep 0.3
  BACKEND_PID=$(pgrep -f "pnpm run start:dev" | head -1)

  (cd "$ROOT_DIR/frontend" && setsid pnpm dev >"$FRONTEND_LOG" 2>&1 &)
  sleep 0.3
  FRONTEND_PID=$(pgrep -f "pnpm.*dev -p 3001|next dev -p 3001" | head -1)

  {
    echo "BACKEND_PID=$BACKEND_PID"
    echo "FRONTEND_PID=$FRONTEND_PID"
  } > "$PID_FILE"

  echo "Backend  (pid $BACKEND_PID)  -> http://localhost:3000  (log: $BACKEND_LOG)"
  echo "Frontend (pid $FRONTEND_PID) -> http://localhost:3001  (log: $FRONTEND_LOG)"
  echo "Rodando em background. Use ./dev.sh down para parar."
}

run_down() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "Nenhum processo de ./dev.sh up registrado (arquivo $PID_FILE não existe)."
    exit 0
  fi

  # shellcheck disable=SC1090
  source "$PID_FILE"

  local stopped=0
  if [[ -n "${BACKEND_PID:-}" ]] && is_alive "$BACKEND_PID"; then
    kill -TERM "-$BACKEND_PID" 2>/dev/null || kill -TERM "$BACKEND_PID" 2>/dev/null
    stopped=1
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && is_alive "$FRONTEND_PID"; then
    kill -TERM "-$FRONTEND_PID" 2>/dev/null || kill -TERM "$FRONTEND_PID" 2>/dev/null
    stopped=1
  fi

  # O "next dev" (Turbopack) solta o server dev num processo/grupo próprio, que
  # escapa do kill de grupo acima — varre por padrão de comando como rede de
  # segurança, senão sobra processo pendurado depois do down.
  sleep 1
  if pkill -f "nest start --watch" 2>/dev/null; then stopped=1; fi
  if pkill -f "next dev -p 3001" 2>/dev/null; then stopped=1; fi
  if pkill -f "next-server \(v" 2>/dev/null; then stopped=1; fi

  rm -f "$PID_FILE"

  if [[ "$stopped" -eq 1 ]]; then
    echo "Backend e frontend parados."
  else
    echo "Processos registrados já não estavam mais rodando."
  fi
}

run_status() {
  if [[ ! -f "$PID_FILE" ]]; then
    echo "Nenhum processo de ./dev.sh up registrado."
    exit 0
  fi

  # shellcheck disable=SC1090
  source "$PID_FILE"

  if [[ -n "${BACKEND_PID:-}" ]] && is_alive "$BACKEND_PID"; then
    echo "Backend  (pid $BACKEND_PID)  RODANDO -> http://localhost:3000"
  else
    echo "Backend  NÃO está rodando"
  fi

  if [[ -n "${FRONTEND_PID:-}" ]] && is_alive "$FRONTEND_PID"; then
    echo "Frontend (pid $FRONTEND_PID) RODANDO -> http://localhost:3001"
  else
    echo "Frontend NÃO está rodando"
  fi
}

case "${1:-}" in
  up)
    run_up
    ;;
  down)
    run_down
    ;;
  status)
    run_status
    ;;
  start|"")
    run_foreground
    ;;
  *)
    echo "Uso: $0 [up|down|status|start]"
    exit 1
    ;;
esac
