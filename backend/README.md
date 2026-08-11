# Next Level Gerenciador — Back-end (Fase 1)

Back-end NestJS do gerenciador da Next Level Gaming House. Implementa a Fase 1 do roadmap
descrito em `../next-level-gerenciador-planejamento.md`: cadastro de estação (PC), heartbeat,
pacotes de tempo/tarifa por hora, Pix avulso via Mercado Pago, liberação automática via
WebSocket e ações remotas (bloquear/desbloquear/desligar).

## Requisitos

- Node.js 20+ (o repo já traz um `.nvmrc`; rode `nvm use` se tiver o nvm instalado)
- pnpm
- Docker (para o Postgres local via `docker-compose.yml`)

## Setup

```bash
cp .env.example .env      # ajuste os valores conforme necessário
docker compose up -d      # sobe o Postgres local
pnpm install
pnpm prisma migrate dev   # aplica as migrations
pnpm prisma db seed       # cria o AdminUser inicial (owner)
pnpm start:dev            # inicia a API em modo watch
```

O admin inicial usa as credenciais de `SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD` do `.env`
(padrão: `admin` / `troque-esta-senha` — troque antes de usar em produção).

## Variáveis de ambiente

Ver `.env.example` para a lista completa. As mais importantes:

- `DATABASE_URL` — connection string do Postgres (gerada a partir das variáveis `POSTGRES_*`)
- `JWT_SECRET` / `JWT_EXPIRES_IN` — usados no login de admin
- `MERCADOPAGO_ACCESS_TOKEN` — token da conta do Mercado Pago (sandbox ou produção); sem ele,
  a criação de cobrança Pix (`POST /machines/:uuid/payments/pix`) falha com erro de autenticação
  do SDK — comportamento esperado até configurar credenciais reais
- `MERCADOPAGO_WEBHOOK_SECRET` — secret usado para validar a assinatura HMAC do webhook; se
  vazio, a validação é pulada (aceitável em dev local, nunca em produção)
- `MERCADOPAGO_PAYER_EMAIL` — e-mail usado como payer nas cobranças Pix avulsas (sem cliente
  cadastrado)

## Estrutura

```
src/
  prisma/            PrismaService/PrismaModule (global)
  common/            guards e decorators compartilhados
  modules/
    auth/            login de admin (JWT)
    machines/        registro, heartbeat, listagem admin, ações remotas
    time-packages/    CRUD de pacotes de tempo fechados (PC)
    hourly-rates/     CRUD de tarifas por hora corrida (PC)
    payments/         criação de cobrança Pix + wrapper do SDK do Mercado Pago
    webhooks/         webhook de confirmação de pagamento do Mercado Pago
    realtime/         gateway WebSocket (Socket.IO)
prisma/
  schema.prisma       modelo de dados completo (inclui entidades das Fases 2/3, ainda sem
                       módulos de aplicação em cima)
  seed.ts              cria o AdminUser inicial
```

## Autenticação

- **Estação → API:** header `X-Api-Key` com a chave devolvida no registro (`POST /machines`).
- **Admin → API:** `POST /auth/admin/login` devolve um JWT; envie em
  `Authorization: Bearer <token>` nas rotas administrativas.
- **WebSocket** (`/realtime`): no handshake, envie `auth: { apiKey }` (estação) ou
  `auth: { token }` (admin JWT) para entrar na room correta.

## Testes

```bash
pnpm test        # unitários (services, guards, gateway — mocks, sem tocar no banco)
pnpm test:e2e    # e2e (sobe a API real contra um Postgres de teste isolado)
pnpm test:cov    # unitários com relatório de cobertura
```

O `test:e2e` roda automaticamente (via hook `pretest:e2e`) antes da suíte:

1. `scripts/ensure-test-db.sh` cria o banco `nextlevel_test` no Postgres do
   `docker-compose.yml` caso ele ainda não exista (o Postgres precisa estar de pé:
   `docker compose up -d`)
2. Aplica as migrations nesse banco (`prisma migrate deploy`, usando `.env.test`)
3. Um `globalSetup` (`test/global-setup.ts`) trunca todas as tabelas antes de rodar,
   garantindo estado limpo em toda execução

Os testes e2e usam `.env.test` (banco/segredos isolados dos de dev — nunca aponte para
o banco de desenvolvimento) e sobem a `AppModule` real via `@nestjs/testing`, mas
substituem `MercadoPagoService` e `RealtimeGateway` por mocks (`test/utils/create-test-app.ts`)
para não depender de rede externa nem de um client WebSocket conectado. Tudo o mais —
Prisma, guards, validação de DTO — roda de verdade contra o Postgres de teste.

## O que falta para a Fase 1 completa

- Painel web (Next.js) consumindo esses endpoints
