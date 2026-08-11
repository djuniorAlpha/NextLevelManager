#!/usr/bin/env bash
# Garante que o banco de testes (nextlevel_test) existe no Postgres do docker-compose.
# Idempotente: não faz nada se o banco já existir.
set -euo pipefail

cd "$(dirname "$0")/.."

POSTGRES_USER="${POSTGRES_USER:-nextlevel}"
TEST_DB="nextlevel_test"

exists=$(docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '$TEST_DB'")

if [ "$exists" != "1" ]; then
  echo "Criando banco de testes '$TEST_DB'..."
  docker compose exec -T postgres createdb -U "$POSTGRES_USER" "$TEST_DB"
else
  echo "Banco de testes '$TEST_DB' já existe."
fi
