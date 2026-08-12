# Next Level Manager

Back-end + painel administrativo para a **Next Level Gaming House** (lan house): cadastro e monitoramento de estações (PCs, e futuramente consoles), cobrança por tempo (pacotes fechados, tarifa por hora e saldo de cliente), cobrança via Pix (Mercado Pago) e ações remotas (bloquear/liberar/desligar estações).

O cliente instalado nas estações Windows (`NextLevelAgentClient`) é um repositório separado — este projeto é só o back-end + painel web.

Planejamento completo (modelo de dados, endpoints, regras de negócio, roadmap): [`next-level-gerenciador-planejamento.md`](./next-level-gerenciador-planejamento.md).

## Stack

- **Backend**: NestJS + TypeScript, PostgreSQL + Prisma, JWT (admin), Socket.IO (`/realtime`), Mercado Pago SDK (Pix).
- **Frontend**: Next.js + TypeScript, TanStack Query, Tailwind CSS v4 + shadcn/ui.
- **Gerenciador de pacotes**: pnpm (nos dois projetos).

## Estrutura

```
NextLevelManager/
├── backend/     # API NestJS (porta 3000)
├── frontend/    # Painel admin Next.js (porta 3001)
├── dev.sh       # Sobe backend + frontend juntos
└── next-level-gerenciador-planejamento.md
```

## Pré-requisitos

- Node 20+
- pnpm
- Docker (para o Postgres via `docker-compose`) — ou um Postgres já rodando localmente

## Configuração inicial

```bash
# 1. Banco de dados
cd backend
cp .env.example .env        # ajuste os valores se quiser (senhas, credenciais do Mercado Pago, etc.)
docker compose up -d        # sobe o Postgres definido em docker-compose.yml

# 2. Backend
pnpm install
pnpm exec prisma migrate deploy   # aplica as migrations
pnpm exec prisma db seed          # cria o AdminUser inicial (usuário/senha vêm do .env)

# 3. Frontend
cd ../frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL já vem apontando pra http://localhost:3000
pnpm install
```

## Rodando em desenvolvimento

Na raiz do projeto, suba os dois serviços com um único comando:

```bash
./dev.sh
```

- Backend: http://localhost:3000
- Frontend (painel): http://localhost:3001

`Ctrl+C` encerra os dois juntos. Login inicial: usuário/senha definidos em `backend/.env` (`SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD`, por padrão `admin` / `troque-esta-senha`).

Alternativa, subindo cada serviço manualmente em terminais separados:

```bash
cd backend && pnpm run start:dev
cd frontend && pnpm dev
```

## Testes

```bash
cd backend
pnpm test        # testes unitários
pnpm test:e2e     # testes e2e (precisa de um banco de teste — ver scripts/ensure-test-db.sh)
```

## Módulos do backend

`auth` (login admin), `machines` (registro/heartbeat/ações remotas das estações), `time-packages`, `hourly-rates`, `customers` (contas com saldo pré-pago), `payments` (Pix via Mercado Pago), `webhooks` (confirmação de pagamento), `realtime` (WebSocket).

## Telas do painel

Login, Estações (mapa com status e ações remotas), Cobrança PC (pacotes fechados + tarifas por hora), Clientes (contas, saldo, recarga manual).

## Roadmap

Ver seção 13 de [`next-level-gerenciador-planejamento.md`](./next-level-gerenciador-planejamento.md). Resumo do estado atual:

- **Fase 1 (MVP PC)**: backend e painel completos.
- **Fase 2 (em andamento)**: Cobrança PC e Clientes (CRUD + recarga manual de saldo) completos. Pendente: login do cliente na estação, recarga via Pix, relatórios financeiros, PDV.
- **Fase 3**: consoles, cliente Android TV, assinaturas, fidelidade — não iniciado.
