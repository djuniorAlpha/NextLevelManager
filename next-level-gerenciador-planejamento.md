# Planejamento — Next Level Gerenciador (Back-end + Painel Admin)

> Documento de planejamento para o novo projeto do **gerenciador** (back-end + dashboard web) da Next Level Gaming House. O cliente das máquinas Windows (`NextLevelAgentClient`, WinForms/.NET) já existe e define parte do contrato que esse back-end precisa atender. Este documento já contempla também a futura estação de **console via Smart TV**, mesmo que essa parte só seja construída depois.

Decisões já tomadas:

- **Back-end:** Node.js + NestJS
- **Painel admin:** dashboard web (navegador)
- **Escopo de negócio:** uma lan house só (não multi-tenant por enquanto)
- **Pagamento Pix:** Mercado Pago
- **Modelo de cobrança:** pré-pago em todos os casos (Pix avulso, saldo de conta e console)
- **PC:** vai ter **pacote fechado, tarifa por hora corrida e assinatura coexistindo ao mesmo tempo**, tudo configurável pelo admin no painel (não é "escolher um dos três" — os três ficam disponíveis)
- **Assinatura/fidelidade:** cobrança **só por cartão de crédito**
- **Saldo de conta (Login):** aceita **Pix, cartão de crédito/débito ou espécie**
- **Console via Smart TV:** o app da TV só **avisa que o tempo está acabando** e **desliga a própria TV** quando o tempo esgota (não mexe no console)
- **Preço por console:** configurável por modelo no painel (ex: PS5 → R$ 10,00, Switch2 → R$ 12,00)

---

## 1. Objetivo

Construir o sistema que fica "do outro lado" dos clientes instalados em cada estação da lan house (PCs Windows hoje, consoles via Smart TV amanhã): cadastra as estações, cobra pelo tempo de uso, controla sessões ativas, permite ações remotas básicas, e dá ao dono/atendente um painel pra acompanhar tudo em tempo real — no estilo do que sistemas como o SENET oferecem.

## 2. Escopo

**Dentro do escopo agora:**
- API para as estações (registro, heartbeat, pacotes de tempo, cobrança Pix)
- Webhook de confirmação de pagamento (Mercado Pago)
- Painel web para o dono/atendente (mapa de estações, sessões, financeiro básico)
- Autenticação de estação (API key) e autenticação de admin (login/senha)
- Ações remotas: **forçar bloqueio/desbloqueio** (PC) e **desligar** (PC de forma completa; TV de console apenas ao fim do tempo)
- Múltiplos métodos de pagamento pro saldo de conta: Pix, cartão de crédito, cartão de débito e espécie
- Preço configurável por modelo de console (PS5, Switch2, etc.)
- Três modelos de cobrança pra PC coexistindo: **pacote fechado**, **tarifa por hora corrida** e **assinatura**, todos gerenciados pelo admin
- Modelo de dados já preparado pra **assinaturas/fidelidade** e **múltiplos tipos de estação (PC / console+TV)** — mesmo que a implementação completa fique pra fases seguintes
- **PDV** — cadastro livre de produtos (bebidas, snacks, etc.) pelo admin, venda no balcão, sem controle de estoque por agora; desconto configurável por produto pra assinantes de um plano; produtos inclusos configuráveis em pacotes fechados

**Fora do escopo por agora** (decisão consciente, não é esquecimento):
- Multi-tenant (suportar várias lan houses isoladas) — arquitetura deve ser simples, sem essa complexidade extra
- App desktop para o admin (o painel é só web)
- Monitoramento de tela (screen share) — não faz parte do pedido: pra PC não foi pedido, e pra console **não é tecnicamente viável** (ver seção 10)
- Gerenciador de arquivos remoto, transferência de arquivo entre estações (existe em concorrentes como SENET, não faz parte do pedido atual)

## 3. Stack técnica sugerida

| Camada | Sugestão | Observação |
|---|---|---|
| Back-end | **NestJS** (TypeScript) | Módulos bem definidos (auth, machines, payments, subscriptions...), Guards para autenticação, Gateway nativo para WebSocket |
| Banco de dados | **PostgreSQL** | Robusto, gratuito, boa integração com os ORMs abaixo |
| ORM | **Prisma** (ou TypeORM) | Prisma tem DX melhor e migrations mais simples; TypeORM é mais "nativo" do Nest. Qualquer um resolve. |
| Autenticação | **JWT** (`@nestjs/jwt` + `passport-jwt`) | Um fluxo para admin, outro para cliente/membro, outro (mais simples, API key) para estação |
| Tempo real | **WebSocket** (`@nestjs/websockets`, Socket.IO) | Necessário para empurrar "pagamento confirmado" e ações remotas (bloquear/desbloquear/desligar) pra estação certa, e status ao vivo pro painel |
| Painel admin | **Next.js + TypeScript** | Mantém tudo em TS igual o back-end; pode usar Tailwind + alguma lib de gráfico (Recharts/Tremor) pro financeiro |
| Pagamento Pix/avulso | **SDK oficial do Mercado Pago** (`mercadopago` npm) | Pix via `Payment` API (criação de cobrança) + webhook de notificação |
| Pagamento assinatura | **Mercado Pago Preapproval** (cartão de crédito) | Único método aceito pra assinatura — ver seção 9 |
| Cartão/espécie (saldo e balcão) | Registro manual pelo atendente no painel | Ver seção 8 — nem todo pagamento presencial precisa passar pela API do Mercado Pago |

## 4. O que o cliente Windows (NextLevelAgentClient) já espera do back-end

Isso já está implementado no app das máquinas — o back-end precisa satisfazer esse contrato (hoje simulado por um mock local):

```csharp
public interface IComputerApiService
{
    Task<MachineRegistration?> GetRegistrationAsync(string macAddress);
    Task<MachineRegistration> RegisterComputerAsync(string macAddress, string hostname, string ipAddress);
    Task<bool> SendHeartbeatAsync(string computerUuid, string currentStatus);
}

public sealed record MachineRegistration(string ComputerUuid, int MachineNumber);
```

Outros pontos relevantes do cliente:
- Tem um `appsettings.json` com `Environment` (`DEV`/`PROD`) e `BackendBaseUrl` — já pronto pra apontar pra API real, só falta trocar o mock por chamadas HTTP de verdade.
- A tela tem 5 estados: **Bloqueada** → **Seleção de tempo** → **Aguardando Pix** → **Sessão ativa**, com um desvio possível por **Login** (usuário/senha).
- O botão "Simular: Pix pago" hoje confirma o pagamento **localmente**, sem back-end nenhum. Isso precisa mudar: quem confirma o pagamento de verdade é o webhook do Mercado Pago, e o back-end precisa **avisar a estação certa** (via WebSocket) que pode liberar a sessão.
- `SendHeartbeatAsync` já existe na interface, mas **ainda não é chamado periodicamente** pelo cliente — vai precisar de um timer lá pra bater de tempos em tempos (ex: a cada 30s) quando o back-end estiver pronto. Esse mesmo canal (ou o WebSocket) também vai ser usado pelo back-end pra mandar comandos de **forçar bloqueio/desligar** — o cliente Windows vai precisar de um handler novo pra isso (fora do escopo deste documento, mas fica registrado o requisito).
- As opções de tempo (hoje só "1 minuto - R$0,10", hardcoded no HTML do cliente) deveriam vir do back-end, pra o dono poder configurar preços/pacotes sem precisar recompilar o app do cliente.
- O número da estação (`MachineNumber`) hoje é sorteado pelo mock — no back-end real deve ser um contador sequencial (ou algo que o admin possa definir manualmente na hora do cadastro).

## 5. Modelo de dados (proposta)

```
Machine                          -- representa qualquer estação: PC ou console+TV
- id (uuid)                      -- == ComputerUuid que o cliente já usa
- machineNumber (int)            -- sequencial, único
- type (enum)                    -- pc | console_tv
- consoleModelId (fk, nullable)  -- preenchido quando type = console_tv
- macAddress (string)
- hostname (string)
- ipAddress (string)
- apiKey (string)                -- gerado no registro, usado pra autenticar as chamadas dessa estação
- status (enum)                  -- locked | time_selection | waiting_pix | active | offline
- lastHeartbeatAt (datetime, nullable)
- createdAt (datetime)

ConsoleModel                     -- catálogo de modelos de console e sua tarifa
- id
- name ("PS5", "Switch2", "Xbox Series X"...)
- hourlyRateCents                -- ex: PS5 = 1000 (R$10,00/h), Switch2 = 1200 (R$12,00/h)
- active (bool)

TimePackage                      -- pacotes de tempo fechados pra PC (ex: "1 hora - R$5,00")
- id
- label (string)                 -- "1 hora", "30 minutos"...
- minutes (int)
- priceCents (int)
- active (bool)
                                  -- produtos inclusos: ver TimePackageProduct (relação N:N, não um campo aqui)

HourlyRate                       -- tarifa por hora corrida pra PC (independente do pacote fechado)
- id
- label (string)                 -- "Tarifa padrão PC", ou por categoria se um dia tiver "PC Gamer" etc.
- ratePerHourCents
- active (bool)

Product                          -- PDV: bebidas, snacks ou qualquer item que o admin queira vender
- id
- name                           -- "Coca-Cola lata", "Salgadinho X"...
- priceCents (int)
- active (bool)                  -- sem controle de estoque/quantidade por agora, só ativa/inativa
- createdAt

ProductSale                      -- uma venda de PDV (pode ter vários produtos)
- id
- customerId (fk, nullable)      -- presente quando o comprador está logado (necessário pra aplicar desconto de assinatura)
- paymentId (fk)                 -- pagamento associado (pix/cartão/débito/espécie)
- registeredByAdminId (fk)       -- atendente que registrou a venda
- totalCents (int)               -- já com desconto de assinatura aplicado, se houver
- createdAt

ProductSaleItem                  -- item de uma venda de PDV
- id
- productSaleId (fk)
- productId (fk)
- quantity (int)
- unitPriceCents (int)           -- preço do produto no momento da venda (histórico; preço pode mudar depois)
- discountPercentApplied (int, nullable)   -- preenchido quando o desconto veio de SubscriptionPlanProductDiscount

SubscriptionPlanProductDiscount  -- quais produtos têm desconto pra assinantes de um plano específico
- id
- subscriptionPlanId (fk)
- productId (fk)
- discountPercent (int)

TimePackageProduct               -- quais produtos vêm inclusos num pacote fechado (ex: "2h + refrigerante")
- id
- timePackageId (fk)
- productId (fk)
- quantity (int)                 -- ex: 1 refrigerante por pacote

Payment
- id
- machineId (fk, nullable)       -- nulo quando for top-up de carteira ou venda de PDV feita fora de uma estação
- customerId (fk, nullable)      -- presente em top-up de carteira, assinaturas e venda de PDV pra cliente logado
- purpose (enum)                 -- package_purchase | hourly_purchase | wallet_topup | subscription | console_session | product_sale
- method (enum)                  -- pix | credit_card | debit_card | cash
- timePackageId (fk, nullable)   -- preenchido quando purpose = package_purchase
- hourlyRateId (fk, nullable)    -- preenchido quando purpose = hourly_purchase
- provider (enum)                -- mercado_pago | manual   (manual = espécie ou cartão registrado à parte pelo atendente)
- externalPaymentId (string, nullable)   -- id retornado pelo Mercado Pago (nulo quando provider = manual)
- qrCodeBase64 / qrCodeText (nullable)   -- só quando method = pix
- status (enum)                  -- pending | approved | expired | rejected
- amountCents (int)
- registeredByAdminId (fk, nullable)     -- quem confirmou o recebimento, quando provider = manual
- payerTaxDocument (string, nullable)    -- CPF/CNPJ do pagador, opcional; relevante sobretudo pra pix_guest (sem Customer associado), pra viabilizar nota fiscal futura
- createdAt / paidAt

Session
- id
- machineId (fk)
- customerId (fk, nullable)      -- null quando é sessão paga via Pix avulso (sem conta)
- paymentId (fk, nullable)
- source (enum)                  -- pix_guest | customer_balance | subscription | counter_sale | manual_free
- allocatedSeconds (int)         -- tempo comprado/reservado no início
- consumedSeconds (int)          -- tempo efetivamente usado (relevante pro carry-over de saldo e pra assinatura com minutos inclusos)
- startedAt / endedAt

Customer                         -- cliente cadastrado (fluxo de "Login" no cliente)
- id
- name
- username
- passwordHash
- taxDocument (string, nullable) -- CPF/CNPJ, opcional; capturado desde já pra viabilizar emissão de nota fiscal futura sem migração retroativa
- balanceMinutes (int)           -- saldo pré-pago; sessões via login descontam só o que foi usado
- loyaltyTier (enum, nullable)   -- bronze | prata | ouro (v1 simples de fidelidade)
- createdAt

SubscriptionPlan                 -- planos de assinatura/fidelidade (cartão de crédito apenas)
- id
- name                           -- "Plano Mensal Gold"
- priceCents
- billingInterval ("monthly")
- includedMinutes (int, nullable)    -- minutos inclusos por ciclo, se aplicável
- discountPercent (int, nullable)    -- desconto sobre pacotes avulsos, se aplicável
- active (bool)
                                  -- desconto em produtos do PDV: ver SubscriptionPlanProductDiscount (relação N:N, não um campo aqui)

CustomerSubscription
- id
- customerId (fk)
- planId (fk)
- status (enum)                  -- active | canceled | past_due
- mercadoPagoPreapprovalId (string)   -- sempre presente: única forma de cobrança é cartão via Preapproval
- includedMinutesRemaining (int, nullable)   -- saldo do plano no ciclo atual, se o plano tiver minutos inclusos
- currentPeriodStart / currentPeriodEnd

AdminUser                        -- quem acessa o painel
- id
- name
- username
- passwordHash
- role (enum)                    -- owner | attendant
```

### Regras de negócio importantes

- **PC tem três modelos de cobrança coexistindo, todos configuráveis pelo admin:**
  1. **Pacote fechado** (`TimePackage`) — bloco fixo de tempo/preço, ex: "1 hora - R$5,00".
  2. **Tarifa por hora corrida** (`HourlyRate`) — o cliente escolhe quantas horas quer, o preço é calculado (`horas × ratePerHourCents`), sem precisar de um pacote pré-cadastrado pra cada duração possível.
  3. **Assinatura** (`SubscriptionPlan`) — cliente com plano ativo consome minutos inclusos (`CustomerSubscription.includedMinutesRemaining`) ou tem acesso conforme as regras do plano.
  - Na tela de compra avulsa (sem login), o cliente escolhe entre pacote fechado ou tarifa por hora — os dois são "ficha": **não devolvem o que sobrar** se sair antes, pois não há conta pra guardar o resto.
- **Saldo via Login (com conta):** pré-pago, mas com **carência de tempo** — o back-end desconta do `balanceMinutes` só o tempo realmente consumido (`consumedSeconds`). Se reservar 2h e sair em 40min, o resto fica no saldo pra próxima visita. Sugestão: decrementar o saldo de forma incremental durante a sessão (ex: a cada minuto rodado), evitando lógica de estorno depois.
- **Cliente logado com assinatura ativa E saldo em carteira:** consumir primeiro os `includedMinutesRemaining` da assinatura (já pago e "perde" no fim do ciclo se não usar) e só depois cair pro `balanceMinutes` da carteira (que não expira). O endpoint de início de sessão pro cliente logado deve resolver essa prioridade automaticamente — o cliente não precisa escolher de qual "poço" o tempo vai sair.
- **Recarga de saldo aceita qualquer método:** Pix (via Mercado Pago, automático), ou cartão/espécie (registrado manualmente pelo atendente no painel, ver seção 8).
- **Console:** cobrado por tarifa/hora do `ConsoleModel` (ex: PS5 = R$10/h), tipicamente vendido no balcão pelo atendente (`Session.source = counter_sale`) já que o app da TV não tem uma interface de compra própria (ver seção 10).
- **Assinatura/fidelidade:** único método de pagamento é cartão de crédito (Preapproval) — nunca Pix nem débito.
- **PDV (produtos: bebidas, snacks, etc.):**
  - Cadastro livre pelo admin (`Product`), sem controle de estoque/quantidade por agora — só nome, preço e ativo/inativo.
  - Venda feita pelo atendente no balcão (`POST /pdv/sales`), podendo incluir vários produtos numa mesma venda (`ProductSaleItem`).
  - **Desconto por assinatura:** se a venda for associada a um `customerId` com assinatura ativa, o back-end verifica `SubscriptionPlanProductDiscount` pro plano daquele cliente e aplica o desconto automaticamente item a item — o atendente não precisa calcular manualmente. Sem `customerId` (venda avulsa, sem login), não há desconto de assinatura possível.
  - **Produto incluso em pacote fechado:** quando um `TimePackage` tem produtos configurados via `TimePackageProduct`, a compra desse pacote (Pix avulso ou balcão) gera automaticamente um `ProductSale` correspondente com preço zerado pros itens inclusos — isso mantém o registro de "o que foi entregue" pro relatório e pro atendente saber o que liberar, sem contar como receita duplicada (a receita já está no `Payment` do próprio pacote).

## 6. Endpoints da API (proposta)

### Estação → back-end (autenticado por API key da própria estação, exceto registro)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/machines/registration?mac=...` | Retorna `{ computerUuid, machineNumber }` ou 404 se não registrada |
| POST | `/machines` | Registra a estação (mac, hostname, ip, type) → retorna `{ computerUuid, machineNumber, apiKey }` |
| POST | `/machines/:uuid/heartbeat` | Recebe status atual, atualiza `lastHeartbeatAt` |
| GET | `/time-packages` | Lista pacotes de tempo fechados ativos (pra estação PC montar a tela de seleção) |
| GET | `/hourly-rates` | Lista tarifas por hora ativas (pra estação PC oferecer a opção de tempo livre) |
| POST | `/machines/:uuid/payments/pix` | Cria cobrança Pix avulsa no Mercado Pago — aceita `{ timePackageId }` OU `{ hourlyRateId, minutes }` — devolve QR Code + `paymentId` |
| GET | `/payments/:id` | Consulta status do pagamento (fallback caso o WebSocket falhe) |
| GET | `/machines/:uuid/session` | Estado da sessão atual (usado pela TV do console pra saber quanto tempo falta) |

### Cliente/membro (fluxo de "Login" e assinatura)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/customer/login` | `{ username, password }` → token + saldo disponível |
| POST | `/customers/:id/wallet/topup/pix` | Gera cobrança Pix pra recarregar o saldo (fluxo automático via Mercado Pago) |
| POST | `/machines/:uuid/sessions/start-for-customer` | Inicia sessão pro cliente logado; back-end decide sozinho se consome assinatura (`includedMinutesRemaining`) ou saldo (`balanceMinutes`), pela prioridade definida na seção 5 |
| GET | `/subscription-plans` | Lista planos de assinatura disponíveis |
| POST | `/customers/:id/subscriptions` | Assina um plano (integração com Preapproval/cartão do Mercado Pago) |

### Webhook

| Método | Rota | Descrição |
|---|---|---|
| POST | `/webhooks/mercado-pago` | Recebe notificação de pagamento (avulso, top-up Pix ou assinatura); valida, atualiza `Payment`/`CustomerSubscription`, dispara evento WebSocket quando relevante |

### Admin (autenticado por JWT de `AdminUser`)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/admin/login` | Login do painel |
| GET | `/machines` | Lista estações com status ao vivo |
| POST | `/machines/:id/force-unlock` | Libera a estação manualmente (sem pagamento) |
| POST | `/machines/:id/force-lock` | Bloqueia a estação remotamente (PC) |
| POST | `/machines/:id/force-shutdown` | Desliga a estação (PC completo; console apenas desliga a TV) |
| POST | `/machines/:id/sessions/counter-sale` | Atendente vende uma sessão no balcão (PC ou console), informando `minutes`, `method` (pix\|credit_card\|debit_card\|cash) e `amountCents` |
| POST | `/customers/:id/wallet/topup/manual` | Atendente registra recarga de saldo recebida em cartão ou espécie |
| GET | `/sessions` | Histórico de sessões (com filtros) |
| GET | `/reports/revenue` | Faturamento por período/estação/método de pagamento |
| CRUD | `/time-packages` | Gerenciar pacotes de tempo fechados/preços (PC) |
| CRUD | `/hourly-rates` | Gerenciar tarifas por hora corrida (PC) |
| CRUD | `/console-models` | Gerenciar modelos de console e tarifa/hora (PS5, Switch2...) |
| CRUD | `/customers` | Gerenciar clientes cadastrados e saldo |
| CRUD | `/subscription-plans` | Gerenciar planos de assinatura/fidelidade |
| CRUD | `/products` | Gerenciar produtos do PDV (bebidas, snacks, etc.) — nome, preço, ativo/inativo |
| POST | `/pdv/sales` | Atendente registra venda de PDV: lista de `{ productId, quantity }` + `method` (pix\|credit_card\|debit_card\|cash) + `customerId` opcional; back-end aplica desconto de assinatura automaticamente se o cliente informado tiver plano ativo com desconto pra algum dos produtos |
| PUT/DELETE | `/subscription-plans/:id/product-discounts` | Gerenciar quais produtos têm desconto (e qual percentual) pra assinantes daquele plano |
| PUT/DELETE | `/time-packages/:id/included-products` | Gerenciar quais produtos (e quantidade) vêm inclusos num pacote fechado |

### WebSocket (eventos)

- `machine.status.changed` → atualiza o mapa de estações no painel em tempo real
- `payment.confirmed` (direcionado pra estação específica) → cliente libera a sessão automaticamente
- `machine.force-action` (direcionado pra estação específica) → `lock` | `unlock` | `shutdown` vindos do painel
- `session.time-warning` (direcionado pra estação específica) → avisa que o tempo está acabando (usado pela TV do console, e opcionalmente pelo PC também)
- `session.ended` (direcionado pra estação específica) → sessão zerou; console usa isso pra desligar a TV

## 7. Fluxos principais

**Registro da estação** (primeira vez ligando):
1. Cliente manda `GET /machines/registration?mac=...`
2. Se 404 → cliente manda `POST /machines` → back-end cria registro, gera `machineNumber` sequencial e `apiKey` → devolve pro cliente
3. Cliente guarda `computerUuid` + `apiKey` localmente pra próximas chamadas

**Compra via Pix avulso (PC):**
1. Cliente seleciona um pacote → `POST /machines/:uuid/payments/pix`
2. Back-end cria cobrança no Mercado Pago → devolve QR Code
3. Cliente exibe QR Code e aguarda (hoje: countdown de 5 min)
4. Usuário paga → Mercado Pago manda webhook → `POST /webhooks/mercado-pago`
5. Back-end valida, marca `Payment` como `approved`, cria `Session` (`source = pix_guest`, `allocatedSeconds` fixo), e emite `payment.confirmed` via WebSocket pra aquela estação
6. Cliente recebe o evento e libera a sessão (isso troca o botão "Simular: Pix pago" por um fluxo de verdade)

**Login com saldo ou assinatura (carry-over de tempo):**
1. Cliente manda `POST /auth/customer/login`
2. Se ok, back-end devolve token + saldo (`balanceMinutes`) + status da assinatura, se tiver
3. Cliente chama `POST /machines/:uuid/sessions/start-for-customer`
4. Back-end decide a origem: se tiver assinatura ativa com `includedMinutesRemaining > 0`, cria `Session` (`source = subscription`) e desconta de lá primeiro; senão, cria `Session` (`source = customer_balance`) descontando do `balanceMinutes`
5. Em ambos os casos o desconto é incremental (`consumedSeconds`) — se a sessão terminar antes do previsto, o tempo não gasto permanece disponível pra próxima visita

**Recarga de saldo (qualquer método):**
1. Pix → `POST /customers/:id/wallet/topup/pix`, confirmado via webhook, credita `balanceMinutes` automaticamente
2. Cartão (crédito/débito) ou espécie → atendente recebe o pagamento fisicamente (na maquininha própria ou em dinheiro) e registra no painel via `POST /customers/:id/wallet/topup/manual`, que credita o saldo na hora (sem depender de gateway)

**Venda de produto no PDV (balcão):**
1. Atendente seleciona os produtos e quantidades no painel → `POST /pdv/sales` com `{ items: [{ productId, quantity }], method, customerId? }`
2. Se `customerId` informado e o cliente tiver assinatura ativa: back-end consulta `SubscriptionPlanProductDiscount` do plano dele, aplica o desconto item a item e calcula `totalCents` já descontado
3. Se não houver `customerId` (venda avulsa) ou não houver desconto configurado pro produto: cobra o preço cheio
4. Back-end cria `ProductSale` + `ProductSaleItem`(s) e o `Payment` correspondente (`purpose = product_sale`), já com `provider = manual` se o método for cartão-no-balcão ou espécie

**Produto incluso em pacote fechado (entrega automática):**
1. Cliente (ou atendente, no balcão) compra um `TimePackage` que tem `TimePackageProduct` configurado (ex: "2 horas + refrigerante")
2. No momento em que o `Payment` do pacote é aprovado, o back-end gera automaticamente um `ProductSale` com os itens inclusos a preço zerado, associado à mesma sessão
3. O atendente vê no painel (histórico de vendas / sessão do cliente) o que precisa entregar, sem gerar cobrança duplicada — a receita já foi contabilizada no pagamento do pacote

**Sessão de console (venda no balcão):**
1. Cliente escolhe o console (ex: PS5) e o tempo desejado no balcão
2. Atendente calcula o valor (`ConsoleModel.hourlyRateCents` × horas) e recebe o pagamento (Pix, cartão ou espécie)
3. Atendente registra a venda: `POST /machines/:id/sessions/counter-sale`
4. Back-end cria a `Session` (`source = counter_sale`) e o app da TV passa a exibir a contagem regressiva
5. Perto do fim, back-end emite `session.time-warning` → TV avisa o cliente
6. Ao zerar, back-end emite `session.ended` → TV desliga (só a TV, não o console)

**Ação remota do admin (lock/unlock/shutdown, PC):**
1. Admin clica na ação no painel → `POST /machines/:id/force-lock` (ou `force-unlock`/`force-shutdown`)
2. Back-end emite `machine.force-action` via WebSocket pra estação certa
3. Cliente Windows recebe e executa: bloquear tela, liberar, ou desligar o PC

**Heartbeat / status ao vivo:**
1. Cliente manda heartbeat periódico (a implementar no lado do cliente Windows; o app da TV também deve mandar o seu)
2. Back-end atualiza `lastHeartbeatAt` e emite `machine.status.changed`
3. Painel mostra "online/offline" com base em quanto tempo faz desde o último heartbeat (ex: sem heartbeat há > 60s = offline)

## 8. Pagamentos: quando passa pela API do Mercado Pago e quando é manual

Nem todo pagamento precisa de integração — isso simplifica bastante o MVP:

| Método | Como funciona | Envolve API do Mercado Pago? |
|---|---|---|
| Pix (avulso ou recarga) | QR Code gerado via API, confirmado por webhook | Sim |
| Assinatura | Cartão de crédito via Preapproval | Sim |
| Cartão (crédito/débito) no balcão | Cliente paga na maquininha física do estabelecimento; atendente só **registra no painel** que foi pago assim | Não (a menos que se decida futuramente usar o Mercado Pago Point, um leitor de cartão integrado — fica como possível evolução, não necessário agora) |
| Espécie | Atendente recebe o dinheiro e registra no painel | Não |

Isso significa que `Payment.provider = manual` é perfeitamente válido e esperado pra cartão-no-balcão e espécie — o sistema confia no atendente (por isso `registeredByAdminId` fica guardado, pra rastreabilidade).

## 9. Assinaturas e fidelidade (cartão de crédito apenas)

- Cobrança recorrente feita via **Mercado Pago Preapproval**, que funciona com cartão de crédito — método já confirmado como o único aceito pra esse caso, então não há necessidade de lidar com a complexidade de Pix recorrente ("Pix Automático") aqui.
- `CustomerSubscription.mercadoPagoPreapprovalId` sempre presente; o back-end escuta os webhooks de cobrança recorrente do Mercado Pago pra manter `status` (`active`/`past_due`/`canceled`) atualizado.
- **Fidelidade (v1 simples):** `loyaltyTier` no `Customer` (ex: Bronze/Prata/Ouro) calculado por gasto acumulado, dando desconto percentual ou bônus de minutos. Gamificação mais completa (XP, barra de progresso) fica pra uma fase futura.

## 10. Console via Smart TV — escopo simplificado

Com a decisão de que o app da TV **só avisa e desliga a própria TV**, o escopo fica bem mais simples e de baixo risco do que outras abordagens (não precisa lidar com CEC pro console, hardware auxiliar, nem tentar impedir troca de entrada HDMI):

- O app roda na Smart TV (Tizen/Samsung, webOS/LG ou Android TV/Google TV — a definir conforme a marca predominante) e tem só três responsabilidades:
  1. Mandar heartbeat pro back-end (mesmo contrato de `Machine`, com `type = console_tv`)
  2. Escutar `session.time-warning` e mostrar um aviso na tela ("Seu tempo está acabando")
  3. Escutar `session.ended` e desligar a própria TV (usando a API nativa de power-off da plataforma da TV)
- **Quem inicia a sessão é o atendente, pelo painel** (`counter-sale`), não o cliente pela TV — não existe fluxo de "comprar tempo" ou "login" na interface da TV. Isso remove a necessidade de teclado/controle numérico na TV e simplifica bastante o desenvolvimento desse cliente.
- Como o app da TV não faz nada além de mostrar um aviso e desligar a tela, o **reaproveitamento do front-end HTML/CSS/JS do cliente Windows é ainda mais direto** aqui do que se fosse replicar a tela de bloqueio inteira — é basicamente uma tela de "countdown + aviso".
- **Sobre monitoramento (por que não dá pra ver a tela do console):** o sinal de vídeo do console chega na TV via HDMI protegido por **HDCP**, e um app rodando na camada de aplicativos da própria TV não tem acesso a esse frame — é uma restrição de plataforma/DRM em praticamente todas as Smart TVs, não uma limitação de implementação. Isso não é um problema aqui, já que o escopo definido (avisar + desligar a TV) não depende de ver o conteúdo — só reforça por que não faria sentido prometer mais do que isso pro console.

## 11. Segurança

**Transporte:**
- **HTTPS (TLS) obrigatório** para toda a API REST e **WSS (WebSocket sobre TLS)** para o canal de tempo real — cobre interceptação/injeção de tráfego na rede local ou no caminho até o back-end (ex: alguém tentando forjar `machine.force-action` ou `payment.confirmed`). Certificado via Let's Encrypt é suficiente; não há necessidade de criptografia adicional de payload por cima do TLS.

**Estação → back-end (risco específico: acesso físico do cliente final à máquina):**
- API key emitida no registro (header tipo `X-Api-Key`), vinculada ao `computerUuid`. Simples e suficiente pra autenticação — o ponto de atenção real aqui não é o transporte, e sim o fato de o cliente final ter acesso físico (teclado/mouse) à estação. Se ele conseguir sair do modo kiosk, pode ler a `apiKey` do `appsettings.json` local e tentar usá-la fora do fluxo esperado. Isso é mitigado por:
  - **Escopo mínimo por API key**: a chave de uma estação só autentica as rotas que aquela estação legitimamente chama (`heartbeat`, `registration`, `payments/pix`, `session`) e apenas para o `machineId` dela — nunca deveria conseguir agir sobre outra estação ou criar registros arbitrários.
  - **Rotação de API key pelo admin**: botão "regenerar chave" no painel (seção 12), pra revogar rapidamente em caso de suspeita de vazamento.
  - **Rate limiting por API key**: limita o dano de heartbeats forjados ou tentativas de força bruta em rotas como `/payments/pix`.
  - O hardening do próprio kiosk mode (impedir sair da tela bloqueada) é responsabilidade do `NextLevelAgentClient`, fora do escopo deste back-end, mas é uma dependência que vale registrar.
- **Admin → back-end:** JWT padrão, com `role` (`owner`/`attendant`) pra diferenciar quem pode ver financeiro completo vs quem só opera o dia a dia. Ações de registrar pagamento manual (`topup/manual`, `counter-sale`) devem ficar auditadas (`registeredByAdminId`).
- **Cliente/membro → back-end:** JWT também, separado do de admin.
- **Webhook do Mercado Pago:** validar a assinatura (HMAC) enviada no header da notificação — nunca confiar cegamente no payload, já que é o único canal onde algo externo pode tentar simular uma confirmação de pagamento.
- Segredos (API keys do Mercado Pago, JWT secret) via variáveis de ambiente, nunca commitados.

## 12. Painel administrativo — telas sugeridas

1. **Login**
2. **Mapa de estações** (tela principal) — grid com status de cada estação (bloqueada/em uso/offline), tipo (PC/console + modelo), tempo restante, ações rápidas (forçar liberar/bloquear/desligar, vender sessão no balcão)
3. **Sessões** — histórico com filtros por estação/período/método de pagamento
4. **Financeiro** — faturamento por dia/semana/mês, por estação, por método de pagamento, ticket médio
5. **Cobrança PC** — CRUD de pacotes fechados e de tarifas por hora, lado a lado
6. **Modelos de console** — CRUD de modelo + tarifa/hora (PS5, Switch2, etc.)
7. **Clientes** — lista de clientes cadastrados, saldo, tier de fidelidade, histórico, recarga manual
8. **Assinaturas** — planos disponíveis, assinantes ativos
9. **Configurações** — dados da lan house, credenciais do Mercado Pago (ambiente atual)
10. **PDV** — CRUD de produtos (nome, preço, ativo/inativo) e tela de venda rápida no balcão (buscar produto, adicionar quantidade, escolher método de pagamento, associar cliente opcionalmente pra aplicar desconto de assinatura)

## 13. Roadmap sugerido

**Fase 1 — MVP funcional (PC apenas):**
- Cadastro de estação (`Machine.type = pc`) + heartbeat
- Pacotes de tempo fechados **e** tarifa por hora corrida (`TimePackage` + `HourlyRate`, ambos configuráveis via API, mesmo sem tela ainda)
- Pix avulso real via Mercado Pago pros dois modelos (criação + webhook)
- WebSocket pra liberar a estação automaticamente após pagamento
- Ações remotas: forçar bloqueio/desbloqueio/desligar (PC)
- Painel: login + mapa de estações básico

**Fase 2:**
- Conta de cliente com saldo (login real, carry-over de tempo)
- Recarga de saldo: Pix automático + registro manual (cartão/espécie) no painel
- Tela de cobrança PC no painel (CRUD completo de pacotes e tarifas)
- Relatório financeiro por método de pagamento
- **PDV:** cadastro de produtos (`Product`) e venda no balcão (`POST /pdv/sales`), sem desconto de assinatura ainda (depende da Fase 3)
- **Produto incluso em pacote fechado** (`TimePackageProduct`) — já é possível nessa fase, pois só depende de `TimePackage` (Fase 1) e `Product`

**Fase 3:**
- Modelos de console + tarifa por hora, venda de sessão no balcão (`counter-sale`)
- Cliente de console via Smart TV (heartbeat + aviso + desligar) — escopo simples, baixo risco
- Assinaturas via cartão (Preapproval) e fidelidade (tiers)
- **Desconto de produtos do PDV por assinatura** (`SubscriptionPlanProductDiscount`) — depende das assinaturas já existirem

## 14. Decisões resolvidas

- **Smart TV priorizada: Android TV / Google TV.** O app roda como uma WebView apontando pra uma página web, reaproveitando o mesmo HTML/CSS/JS do cliente Windows (seção 10) — sideload via APK sem certificado de fabricante, o que é o caminho de menor atrito de desenvolvimento entre as opções (Tizen e webOS exigem processo de certificação/SDK próprio do fabricante).
- **Nota fiscal: a lan house já emite / vai precisar emitir em breve.** A integração com um emissor de NF-e/NFS-e continua fora de escopo por agora (varia por município e não é trivial), mas o modelo de dados já foi ajustado pra capturar o dado necessário desde o início, evitando uma migração retroativa:
  - `Customer.taxDocument` (CPF/CNPJ, opcional) — ver seção 5.
  - `Payment.payerTaxDocument` (CPF/CNPJ, opcional) — cobre também o pagamento avulso (`pix_guest`), que não tem `Customer` associado.
  - A emissão de fato (escolha de provedor, regras por município) fica como item de fase futura, fora do roadmap das Fases 1–3.
