# 🔄 SAGA Simplificada - Bull Queues com Compensação Direta

> **Arquitetura**: Bull Queues + Compensação Direta + PostgreSQL  
> **Objetivo**: Garantir consistência eventual entre módulos de forma simples e confiável  
> **Status**: Produção-ready (otimizado para simplicidade e performance)

## 🎯 Visão Geral

O sistema gerencia aluguéis de itens com **consistência eventual** entre dois contextos:

- **Contexto Aluguel**: Gerencia reservas, confirmações, cancelamentos
- **Contexto Item**: Gerencia bloqueios de datas para disponibilidade

A comunicação entre contextos usa **Bull Queues** para operações críticas e **Event Handlers** para operações não-críticas, garantindo máxima confiabilidade.

---

## 💡 Problema de Negócio

Quando um aluguel é confirmado, **duas operações críticas** devem ocorrer:

1. **Aluguel**: Status muda de `SOLICITADO` → `CONFIRMADO`
2. **Item**: Datas bloqueadas no período do aluguel

**Desafio**: Garantir que ambas aconteçam ou nenhuma (atomicidade), mesmo em contextos separados.

**Restrições**:

- Não pode confirmar aluguel sem bloquear datas
- Não pode deixar datas bloqueadas se confirmação falhar
- Preparado para contextos rodarem em processos/servidores separados

---

## 🏗️ Solução Arquitetural

### Padrões Implementados

#### 1️⃣ **Bull Queues para Operações Críticas**

Jobs assíncronos com retry automático e compensação:

- Retry automático (3 tentativas + backoff exponencial)
- Compensação direta quando todas as tentativas falham
- Dead Letter Queue para falhas definitivas

#### 2️⃣ **Event Handlers para Operações Não-Críticas**

Eventos simples para operações que podem falhar sem quebrar o negócio:

- Cancelamento de aluguel
- Finalização de aluguel
- Notificações e auditoria

---

## ✅ Fluxo de Confirmação (Cenário Sucesso)

### Sequência Temporal

```
T=0ms     Cliente HTTP → POST /aluguel/:id/confirmar
           ↓
T=50ms    UseCase busca aluguel e valida regras de negócio
           ↓
T=80ms    Aluguel.confirmar() → status = CONFIRMADO
          ├─ Salva aluguel atualizado
          └─ COMMIT transação
           ↓
T=100ms   Enfileira job 'confirmar-aluguel' na fila Bull
           ↓
T=120ms   AluguelConfirmadoProcessor recebe job
          ├─ Bloqueia datas do item com pessimistic lock
          ├─ Auditoria de sucesso (não-crítica)
          └─ Job completo
           ↓
T=200ms   ✅ SUCESSO COMPLETO
          - Aluguel: CONFIRMADO
          - Item: Datas bloqueadas
```

### Componentes Envolvidos

**1. ConfirmarAluguelUseCase** (Aplicação)

- Orquestra o caso de uso
- Valida regras de negócio
- Confirma aluguel e salva no banco
- Enfileira job Bull para bloqueio

**2. AluguelConfirmadoProcessor** (Worker Bull)

- Processa job de confirmação
- Bloqueia datas do item
- Retry automático (3 tentativas)
- Auditoria não-crítica

**3. ItemService** (Contexto Item)

- Adiciona bloqueio de datas
- Operação idempotente
- Pessimistic lock para consistência

---

## ❌ Fluxo de Compensação (Cenário Falha)

### Quando Ocorre

Bloqueio de datas falha por:

- Item já tem bloqueio conflitante
- Erro de conexão com banco de dados
- Validação de negócio (ex: item inativo)

### Sequência de Compensação

```
T=0-120ms  [Igual ao fluxo de sucesso até job ser processado]
            ↓
T=120ms    AluguelConfirmadoProcessor tenta bloquear datas
           Tentativa 1 → FALHA
            ↓
T=140ms    Bull retry automático (backoff exponencial)
           Tentativa 2 → FALHA
            ↓
T=200ms    Bull retry automático
           Tentativa 3 → FALHA
            ↓
T=220ms    @OnQueueFailed acionado
           ├─ Busca aluguel
           ├─ Aluguel.voltarParaSolicitado()
           ├─ Salva estado compensado
           ├─ Auditoria de falha (não-crítica)
           └─ Dead Letter Queue (não-crítico)
            ↓
T=300ms    ✅ COMPENSAÇÃO COMPLETA
           - Aluguel: SOLICITADO (revertido)
           - Item: Sem bloqueios
           - Sistema: Consistente novamente
```

### Componentes Envolvidos

**1. AluguelConfirmadoProcessor**

- Tenta bloquear datas (3 tentativas)
- Cada falha é logada
- Não publica eventos de falha

**2. @OnQueueFailed do Processor**

- Acionado após falha definitiva
- Compensação direta e síncrona
- Reverte aluguel para estado anterior
- Garante consistência eventual

---

## 🚫 Fluxo de Cancelamento

### Quando Ocorre

- Usuário cancela antes de iniciar aluguel
- Admin força cancelamento
- Regras de negócio (ex: item removido)

### Sequência

```
Cliente → POST /aluguel/:id/cancelar
  ↓
UseCase valida: status deve ser SOLICITADO ou CONFIRMADO
  ↓
Aluguel.cancelar(motivo) → status = CANCELADO
  ↓
Persiste cancelamento
  ↓
Se estava CONFIRMADO → publica AluguelCanceladoEvent
  ↓
EventHandler desbloqueia datas do item
  ↓
✅ Cancelamento completo
```

### Características

- **Idempotente**: Pode ser chamado múltiplas vezes
- **Eventos condicionais**: Só publica se havia bloqueio
- **Não reversível**: Cancelamento é definitivo

---

## 🏁 Fluxo de Finalização

### Quando Ocorre

- Período de aluguel termina
- Devolução do item confirmada
- Transição para estado final

### Sequência

```
Cliente → POST /aluguel/:id/finalizar
  ↓
UseCase valida: status deve ser ATIVO
  ↓
Aluguel.finalizar() → status = CONCLUIDO
  ↓
Persiste finalização
  ↓
Publica AluguelFinalizadoEvent
  ↓
EventHandler desbloqueia datas do item
  ↓
✅ Finalização completa
```

### Características

- **Estado terminal**: Não permite mais transições
- **Libera recursos**: Remove bloqueios de datas
- **Auditoria completa**: Preserva histórico

---

## 🔔 Arquitetura de Jobs e Eventos

### Bull Queues (Operações Críticas)

**Queue**: `aluguel`

**Jobs**:

- `confirmar-aluguel`: Bloqueia datas do item
    - Retry: 3 tentativas + backoff exponencial
    - Compensação: @OnQueueFailed reverte aluguel
    - DLQ: Falhas definitivas vão para Dead Letter Queue

**Configuração**:

- Redis como storage
- Retry automático
- Processamento assíncrono
- Auditoria não-crítica (não quebra se falhar)

### Event Handlers (Operações Não-Críticas)

**Eventos**:

- `AluguelCanceladoEvent`: Desbloqueia datas quando aluguel é cancelado
- `AluguelFinalizadoEvent`: Desbloqueia datas quando aluguel é finalizado

**Características**:

- Sem retry automático
- Podem falhar sem afetar consistência
- Usados para limpeza e notificações

### Auditoria

**Centralizada** via `AuditoriaService`:

- Sucesso de confirmação
- Falhas e compensações
- Todas as transições de estado
- Não-crítica (não quebra negócio se falhar)

---

## 🚀 Evolução para Microsserviços

### Estado Atual (Modular Monolith)

```
┌─────────────────────────────────────┐
│        Aplicação NestJS              │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ Módulo Core  │  │ Módulo Item  │ │
│  │  (Aluguel)   │  │  (Bloqueios) │ │
│  └──────────────┘  └──────────────┘ │
│          ↓              ↑            │
│    ┌──────────────────────────┐     │
│    │   Redis (Bull Queues)    │     │
│    │  - aluguel               │     │
│    └──────────────────────────┘     │
│          ↓                           │
│    ┌──────────────────────────┐     │
│    │   PostgreSQL (core)      │     │
│    │  - aluguel               │     │
│    │  - item_bloqueios        │     │
│    └──────────────────────────┘     │
└─────────────────────────────────────┘
```

### Futuro (Microsserviços)

```
┌──────────────────────┐      ┌──────────────────────┐
│  Serviço Aluguel     │      │  Serviço Item        │
│  ┌────────────────┐  │      │  ┌────────────────┐  │
│  │  API (NestJS)  │  │      │  │  API (NestJS)  │  │
│  └────────────────┘  │      │  └────────────────┘  │
│         ↓            │      │         ↑            │
│  ┌────────────────┐  │      │  ┌────────────────┐  │
│  │  PostgreSQL    │  │      │  │  PostgreSQL    │  │
│  │  - aluguel     │  │      │  │  - item        │  │
│  └────────────────┘  │      │  │  - bloqueios   │  │
└──────────────────────┘      │  └────────────────┘  │
           ↓                  │                     │
     ┌─────────────┐          │                     │
     │   Redis     │          │                     │
     │ Bull Queues │ ─────────┼──────────────────────┘
     └─────────────┘          │
                             │
    ┌─────────────────────────┼─────────────────┐
    │      Message Broker     │                 │
    │    (Redis Streams ou    │                 │
    │     Kafka/RabbitMQ)     │                 │
    └─────────────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Monitoring &   │
                    │   Observability │
                    │ (Logs, Metrics, │
                    │    Tracing)     │
                    └─────────────────┘
```

### Mudanças Necessárias

**Infraestrutura**:

- ✅ Bull Queues já implementadas (prontas para distribuir)
- ✅ Jobs com retry e compensação já funcionais
- 🔄 Comunicação entre serviços: HTTP/gRPC para jobs
- 🔄 Bancos de dados separados
- 🔄 Deploy independente por serviço

**Código**:

- ✅ Workers já desacoplados (podem rodar em serviços separados)
- ✅ Compensação já implementada
- 🔄 Configuração de roteamento de jobs entre serviços
- 🔄 Service discovery para comunicação

**Observabilidade**:

- 🔄 Distributed tracing (OpenTelemetry)
- 🔄 Logs centralizados (ELK/Loki)
- 🔄 Métricas de latência entre serviços
- ✅ Bull dashboards para monitoring de filas

### Custo Estimado (Fase 2)

Quando migrar para microsserviços:

- **Redis Cluster**: ~USD 200-800/mês (high availability)
- **Message Broker**: ~USD 100-500/mês (Kafka/RabbitMQ managed)
- **Infraestrutura adicional**: ~USD 500-1k/mês (mais instâncias)
- **Complexidade operacional**: Maior (deploy, monitoring, debug)

**Recomendação**: Manter modular monolith até escala justificar custos.

---

## 📊 Vantagens da Arquitetura Atual

| Aspecto             | Benefício                                    |
| ------------------- | -------------------------------------------- |
| **Simplicidade**    | ✅ Bull Queues são mais simples que eventos  |
| **Consistência**    | ✅ Compensação direta no mesmo processo      |
| **Performance**     | ✅ Sem overhead de outbox/eventos            |
| **Observabilidade** | ✅ Bull dashboard nativo                     |
| **Confiabilidade**  | ✅ Retry automático + Dead Letter Queue      |
| **Desenvolvimento** | ✅ Debug mais fácil (tudo no mesmo processo) |

---

## ❌ Limitações Conhecidas

| Limitação            | Impacto                         | Solução                    |
| -------------------- | ------------------------------- | -------------------------- |
| **Redis dependency** | ⚠️ Requer Redis                 | Usar Redis managed/cluster |
| **Single process**   | ⚠️ Jobs rodam no mesmo processo | OK para volume atual       |
| **Memory usage**     | ⚠️ Jobs consomem RAM            | Monitorar uso de memória   |
| **No event replay**  | ⚠️ Não há histórico de eventos  | Bull jobs têm auditoria    |

---

## 📚 Referências Técnicas

- **Bull Queues**: [Bull Documentation](https://optimalbits.github.io/bull/)
- **NestJS Bull**: [NestJS Bull Integration](https://docs.nestjs.com/techniques/queues)
- **Redis**: [Redis Documentation](https://redis.io/documentation)
- **Padrão SAGA**: [Microsoft - SAGA Pattern](https://docs.microsoft.com/azure/architecture/patterns/saga)
- **Job Processing Patterns**: [Background Jobs Best Practices](https://blog.heroku.com/background-jobs-queueing)

---

**Última Atualização**: 13 de Janeiro de 2026  
**Versão**: 3.0 (Bull Queues Simplificada)
