# 🚀 Arquitetura de Microsserviços - Roteiro de Evolução

## 📋 Estado Atual (Monolito DDD + Saga Coreografada)

```
┌─────────────────────────────────────────────────────┐
│          COISA RÁPIDA (Monolito)                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ├─ Core Module (Aluguel)                          │
│  │  ├─ UnitOfWork + Outbox                         │
│  │  ├─ Event Handlers (aluguel-*)                  │
│  │  └─ PostgreSQL LISTEN/NOTIFY (TRIGGER)         │
│  │                                                 │
│  ├─ Pagamento Module (NEW)                         │
│  │  ├─ TypeOrmPagamentoUnitOfWork                 │
│  │  ├─ Outbox Compartilhado (core schema)         │
│  │  ├─ Event Handlers (pagamento-*)               │
│  │  └─ Saga Coreografada                          │
│  │                                                 │
│  ├─ Item Module                                    │
│  ├─ Usuario Module                                 │
│  ├─ Auth Module                                    │
│  │                                                 │
│  └─ Shared Module (Auditoria, Templates, Utils)   │
│                                                     │
│  📊 Database: PostgreSQL (único)                   │
│  📡 Event Bus: NestJS EventEmitter (em memória)   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Por que esta arquitetura é PREPARADA para microsserviços?

### ✅ 1. **UnitOfWork Segregado por Módulo**

```typescript
// Core: Seu próprio UnitOfWork (apenas Aluguel)
export interface UnitOfWork {
    executarEmTransacao(trabalho: (ctx: ContextoTransacional) => Promise<T>);
}

// Pagamento: Seu próprio UnitOfWork (Pagamento + Transferencia + Outbox)
export interface PagamentoUnitOfWork {
    executarEmTransacao(
        trabalho: (ctx: PagamentoContextoTransacional) => Promise<T>,
    );
}
```

**Benefício**: Quando extrair Pagamento como serviço, o UnitOfWork já está isolado.
Troca-se apenas a implementação (TypeOrmPagamentoUnitOfWork → RabbitMqPagamentoUnitOfWork).

### ✅ 2. **Outbox Centralizado em Schema Compartilhado**

```sql
-- Todos os módulos salvam eventos aqui
CREATE TABLE core.outbox_events (
    id UUID PRIMARY KEY,
    tipo_evento VARCHAR(255),         -- 'aluguel.recusado', 'pagamento.aprovado'
    tipo_agregado VARCHAR(255),       -- 'Aluguel', 'Pagamento'
    id_agregado UUID,
    payload JSONB,
    status VARCHAR(50),               -- PENDENTE, PUBLICADO, FALHADO
    criado_em TIMESTAMP,
    ...
);
```

**Benefício**: Facilita transição para:

- **Cada serviço com seu banco**: Outbox próprio, mesma estrutura
- **Event Broker (RabbitMQ/Kafka)**: Listeners externos leem o Outbox

### ✅ 3. **Saga Coreografada (Desacoplada)**

```
Monolito:
Core    ─── (evento no EventEmitter) ───> Pagamento
Pagamento ─ (evento no EventEmitter) ──> Core

Microsserviços:
Aluguel Service ──→ RabbitMQ ──→ Pagamento Service
Pagamento Service ─→ RabbitMQ ─→ Aluguel Service
```

Mesmo fluxo, apenas o transport muda (EventEmitter → Message Broker).

---

## 🗺️ Roteiro de Migração: Monolito → Microsserviços

### **FASE 1: Preparação (Agora) ✅**

**Objetivo**: Estruturar monolito para extrair módulos.

```typescript
// ✅ FEITO
✅ Core com UnitOfWork + Outbox próprio
✅ Pagamento com UnitOfWork segregado
✅ Saga Coreografada com EventEmitter
✅ Todos salvam eventos no Outbox centralizado
✅ Event Handlers independentes por módulo
```

**Arquivos-chave**:

- `src/modules/core/domain/repositories/unit-of-work.ts` (interface)
- `src/modules/core/infra/repositories/unit-of-work.impl.ts` (impl)
- `src/modules/pagamento/domain/repositories/pagamento-unit-of-work.ts` (interface)
- `src/modules/pagamento/infra/repositories/pagamento-unit-of-work.impl.ts` (impl)
- `src/modules/core/infra/repositories/outbox.repository.ts` (compartilhado)

---

### **FASE 2: Preparar Extração (6-8 semanas depois)**

**Objetivo**: Estruturar pastas e separar dependências.

```diff
  src/modules/pagamento/
  ├─ domain/                  # Zero dependência de NestJS
  │  ├─ pagamento.ts         # Entidade
  │  ├─ transferencia.ts      # Entidade
  │  ├─ events/
  │  ├─ exceptions/
  │  ├─ repositories/
  │  │  └─ pagamento-unit-of-work.ts  # Interface (portável!)
  │  └─ services/            # Abstrações
  │
  ├─ application/             # UseCases (zero infraestrutura)
  │  ├─ usecases/
  │  ├─ event-handlers/
  │  ├─ dtos/
  │  └─ services/
  │
  ├─ infra/                   # Implementação TypeORM (específica)
  │  ├─ repositories/
  │  │  ├─ pagamento.repository.ts     # SERÁ impl de BD
  │  │  ├─ transferencia.repository.ts
  │  │  └─ pagamento-unit-of-work.impl.ts  # TypeORM (será RabbitMQ)
  │  ├─ models/
  │  ├─ mappers/
  │  └─ services/             # HTTP clients, etc
  │
  ├─ presentation/             # Controllers (será REST)
  │  └─ pagamento.controller.ts
  │
  └─ pagamento.module.ts

# Quando virar serviço:
# - domain/ + application/ = Package transportável
# - infra/ = nova implementação (RabbitMQ, gRPC, Redis, etc)
# - presentation/ = REST API (se necessário)
```

**Ações**:

1. Organizar pastas conforme estrutura acima
2. Auditar dependências (nenhum domain → infra)
3. Criar abstrações para serviços externos (email, SMS, etc)

---

### **FASE 3: Extrair Pagamento (Microsserviço)**

**Objetivo**: Pagamento como serviço independente.

#### **3.1 Criar novo projeto Node.js**

```bash
nest new pagamento-service
# Copiar:
# - src/modules/pagamento/domain/
# - src/modules/pagamento/application/
```

#### **3.2 Nova implementação do UnitOfWork**

```typescript
// pagamento-service/src/infra/unit-of-work/rabbitmq-pagamento-unit-of-work.ts

@Injectable()
export class RabbitMqPagamentoUnitOfWork implements PagamentoUnitOfWork {
    constructor(
        private readonly amqpConnection: AmqpConnection,
        private readonly pagamentoDb: TypeOrmDataSource,
        private readonly outboxPublisher: OutboxPublisher,
    ) {}

    async executarEmTransacao<T>(
        trabalho: (ctx: PagamentoContextoTransacional) => Promise<T>,
    ): Promise<T> {
        // 1. Inicia transação local (banco do serviço)
        // 2. Cria contexto que salva em BD local
        // 3. Publica eventos em RabbitMQ
        // 4. Commit or Rollback
    }
}
```

**Mudança de Interface**: Mesma interface (`PagamentoUnitOfWork`), implementação diferente.

#### **3.3 Database próprio para Pagamento**

```sql
-- pagamento-service/migrations/
-- Outbox local (replicado de core schema)
CREATE TABLE pagamento.outbox_events (...);

-- Tabelas de negócio
CREATE TABLE pagamento.pagamento (...);
CREATE TABLE pagamento.transferencia (...);
```

#### **3.4 Comunicação via RabbitMQ**

```typescript
// Antes (EventEmitter):
this.eventEmitter.emit('aluguel.recusado', evento);

// Depois (RabbitMQ):
await this.amqpConnection.publish({
    exchange: 'eventos',
    routingKey: 'aluguel.recusado',
    payload: evento,
});
```

---

### **FASE 4: Deploy em Separado**

```bash
# Serviço Aluguel (Core)
docker run -p 3001:3000 aluguel-service

# Serviço Pagamento
docker run -p 3002:3000 pagamento-service

# Serviço Usuário
docker run -p 3003:3000 usuario-service

# RabbitMQ (message broker)
docker run -p 5672:5672 -p 15672:15672 rabbitmq

# PostgreSQL 1 (Aluguel)
docker run -p 5432:5432 postgres:aluguel-db

# PostgreSQL 2 (Pagamento)
docker run -p 5433:5432 postgres:pagamento-db
```

---

## 📊 Comparação: Antes × Depois

| Aspecto            | ANTES (Agora)                   | DEPOIS (Microsserviços)          |
| ------------------ | ------------------------------- | -------------------------------- |
| **Database**       | 1 PostgreSQL compartilhado      | 1 PostgreSQL por serviço         |
| **Event Bus**      | NestJS EventEmitter (memória)   | RabbitMQ / Kafka                 |
| **Deploy**         | 1 Container (monolito)          | N Containers (cada serviço)      |
| **Escalabilidade** | Vertical (mais RAM/CPU)         | Horizontal (mais instâncias)     |
| **Isolamento**     | Módulos (em memória)            | Serviços (rede)                  |
| **UnitOfWork**     | TypeOrmUnitOfWork (cada módulo) | Específico (RabbitMQ, gRPC, etc) |
| **Outbox**         | `core.outbox_events`            | Replicado em cada BD             |
| **Redundância**    | Nenhuma                         | Cada serviço com replicas        |

---

## 🔄 Fluxo de Evento: Atual vs Futuro

### **Atual (Monolito)**

```
1. ProcessarWebhookPagamento.execute()
   ├─ pagamento.aprovar()
   ├─ ctx.salvarPagamento(pagamento)           [transação local]
   ├─ ctx.salvarEvento(outboxEvent)            [transação local]
   └─ COMMIT ambos (ACID)

2. PostgreSQL TRIGGER
   └─ NOTIFY outbox_events

3. OutboxPublisherListener.onApplicationBootstrap()
   ├─ Detecta novo evento
   ├─ Reconstrói domínio
   └─ eventEmitter.emit('pagamento.aprovado')

4. Handlers reagem
   ├─ PagamentoAprovadoEventHandler (em memória)
   ├─ Tudo rápido (~10-50ms)
   └─ Falha = log + continua
```

### **Futuro (Microsserviços)**

```
1. Pagamento Service: ProcessarWebhookPagamento.execute()
   ├─ BD local inicia transação
   ├─ pagamento.aprovar()
   ├─ salvar em BD local
   ├─ serializar evento
   └─ COMMIT local

2. Local Outbox Publisher
   ├─ Detecta eventos pendentes
   ├─ Publica em RabbitMQ
   ├─ RabbitMQ persiste mensagem
   └─ ACK local (marca como enviado)

3. RabbitMQ Distribuído
   ├─ Mensagem routed para subscribers
   ├─ Garantia: at-least-once
   └─ Dead Letter Queue (retry)

4. Subscribers (Outros Serviços)
   ├─ Aluguel Service escuta 'pagamento.aprovado'
   ├─ Executa handler (pode demorar mais)
   └─ ACK RabbitMQ quando terminar

Benefício: Desacoplamento temporal + escalabilidade
```

---

## 🛠️ Próximos Passos (Quando Chegar a Hora)

### **Mês 1-2: Preparação**

- [ ] Verificar departação de código (domain isolado)
- [ ] Adicionar mais event handlers para Pagamento
- [ ] Testar saga coreografada em produção
- [ ] Auditar dependências circulares

### **Mês 3-4: Refatoração**

- [ ] Organizar pastas conforme PHASE 2
- [ ] Criar abstrações para gRPC / RPC
- [ ] Preparar CI/CD para múltiplos serviços
- [ ] Documentar deployment

### **Mês 5-6: Extração**

- [ ] Criar repository para `pagamento-service`
- [ ] Implementar `RabbitMqPagamentoUnitOfWork`
- [ ] Migrar BD (dump/restore com Outbox)
- [ ] Testes integrados com RabbitMQ

### **Mês 7+: Deploy**

- [ ] Deploy Pagamento Service isolado
- [ ] Deactivar PagamentoModule do Core
- [ ] Monitor e rollback plan
- [ ] Repetir para próximo módulo (Item, Usuario, etc)

---

## 💡 Decisões de Design (Por que esta arquitetura?)

### **1. Por que UnitOfWork segregado por módulo?**

- ✅ Cada módulo tem contrato claro
- ✅ Facilita testes (mock específico)
- ✅ Prepara extração de microsserviços
- ❌ Não mistura Aluguel com Pagamento

### **2. Por que Outbox centralizado (core schema)?**

- ✅ Saga coreografada entre módulos
- ✅ Fácil de replicar em múltiplos bancos
- ✅ PostgreSQL TRIGGER funciona em qualquer lugar
- ❌ Não gera acoplamento (Outbox é compartilhado)

### **3. Por que EventEmitter (não Kafka agora)?**

- ✅ Mais simples (menos deps)
- ✅ OK para monolito (latência <100ms)
- ✅ Fácil evoluir para RabbitMQ depois
- ⚠️ Será substituído quando for microsserviços

### **4. Por que Saga Coreografada (não Orquestrada)?**

- ✅ Menos acoplamento (eventos, não orquestrador)
- ✅ Cada módulo independente
- ✅ Fácil de estender (novo handler = novo comportamento)
- ❌ Mais complexo de debugar (fluxo distribuído)

---

## 🎓 Referências

- **DDD + Microsserviços**: "Building Microservices" - Sam Newman
- **Saga Pattern**: https://microservices.io/patterns/data/saga.html
- **Outbox Pattern**: https://microservices.io/patterns/data/transactional-outbox.html
- **Event Sourcing**: https://martinfowler.com/eaaDev/EventSourcing.html

---

## 📝 Notas

- **Segurança**: Adicionar autenticação entre serviços (OAuth2, mTLS)
- **Observabilidade**: Implementar distributed tracing (Jaeger, DataDog)
- **Performance**: Considerar cache distribuído (Redis) para estado
- **Resiliência**: Circuit breakers, retry policies, timeouts
