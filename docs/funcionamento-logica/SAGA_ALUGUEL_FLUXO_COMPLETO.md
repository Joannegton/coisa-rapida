# 🔄 SAGA Coreografada - Fluxo Completo de Aluguel

> **Arquitetura**: SAGA Coreografada + Outbox Pattern + PostgreSQL LISTEN/NOTIFY  
> **Objetivo**: Garantir consistência eventual entre módulos/microsserviços  
> **Status**: Produção-ready (preparado para migração para microsserviços)

## 🎯 Visão Geral

O sistema gerencia aluguéis de itens com **consistência eventual** entre dois contextos:

- **Contexto Aluguel**: Gerencia reservas, confirmações, cancelamentos
- **Contexto Item**: Gerencia bloqueios de datas para disponibilidade

A comunicação entre contextos é **assíncrona** via eventos, permitindo evolução futura para microsserviços independentes.

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

#### 1️⃣ **SAGA Coreografada**

Coordenação distribuída via eventos (sem orquestrador central):

- Cada serviço escuta eventos e publica novos eventos
- Compensação automática em caso de falha
- Desacoplamento entre contextos

#### 2️⃣ **Outbox Pattern**

Publicação garantida de eventos usando tabela transacional:

- Eventos salvos na mesma transação que o agregado
- Worker assíncrono publica eventos pendentes
- Zero perda de eventos (durabilidade)

#### 3️⃣ **PostgreSQL LISTEN/NOTIFY**

Notificação reativa em tempo real:

- Trigger dispara notificação quando evento é inserido
- Latência ~100-200ms (vs 5 segundos de polling)
- Zero overhead de consultas desnecessárias

#### 4️⃣ **Unit of Work**

Gerenciamento transacional encapsulado:

- UseCase não conhece detalhes de infraestrutura
- Transação atômica para múltiplas operações
- Separação clara de responsabilidades (DDD)

---

## ✅ Fluxo de Confirmação (Cenário Sucesso)

### Sequência Temporal

```
T=0ms     Cliente HTTP → POST /aluguel/:id/confirmar
           ↓
T=50ms    UseCase busca aluguel e valida regras de negócio
           ↓
T=80ms    UnitOfWork inicia transação
          ├─ Aluguel.confirmar() → status = CONFIRMADO
          ├─ Salva aluguel atualizado
          └─ Salva OutboxEvent (AluguelConfirmado)
           ↓
T=100ms   COMMIT → Trigger PostgreSQL dispara
          pg_notify('outbox_events', {...})
           ↓
T=120ms   OutboxPublisherListener recebe notificação
          ├─ Busca evento completo do banco
          ├─ Reconstrói AluguelConfirmadoEvent
          └─ Publica no EventBus
           ↓
T=140ms   OutboxEvent marcado como PUBLICADO
           ↓
T=150ms   AluguelConfirmadoEventHandler recebe evento
          ├─ Chama ItemService.adicionarBloqueio()
          ├─ Bloqueia datas com pessimistic lock
          └─ Publica DatasBloqueavasComSucessoEvent
           ↓
T=200ms   ✅ SUCESSO COMPLETO
          - Aluguel: CONFIRMADO
          - Item: Datas bloqueadas
```

### Componentes Envolvidos

**1. ConfirmarAluguelUseCase** (Aplicação)

- Orquestra o caso de uso
- Valida regras de negócio
- Usa UnitOfWork para coordenar transação

**2. UnitOfWork** (Infraestrutura)

- Encapsula transação do banco
- Salva aluguel + evento atomicamente
- Commit ou rollback automático

**3. OutboxPublisherListener** (Infraestrutura)

- Escuta notificações PostgreSQL
- Publica eventos no EventBus em tempo real
- Marca eventos como publicados

**4. AluguelConfirmadoEventHandler** (Microsserviço Item - simulado)

- Representa contexto separado de Item
- Bloqueia datas do item
- Publica evento de sucesso

---

## ❌ Fluxo de Compensação (Cenário Falha)

### Quando Ocorre

Bloqueio de datas falha por:

- Item já tem bloqueio conflitante
- Erro de conexão com banco de dados
- Validação de negócio (ex: item inativo)

### Sequência de Compensação

```
T=0-150ms  [Igual ao fluxo de sucesso até publicação do evento]
            ↓
T=150ms    AluguelConfirmadoEventHandler tenta bloquear datas
            ↓
T=180ms    ❌ FALHA no bloqueio
           ├─ Log de erro detalhado
           ├─ NÃO lança exceção (comunicação via eventos)
           └─ Publica FalhaNoBloqueioEvent
            ↓
T=200ms    CompensarAluguelQuandoBloqueioFalharHandler
           ├─ Busca aluguel
           ├─ Aluguel.voltarParaSolicitado()
           ├─ Salva estado compensado
           └─ Log de compensação executada
            ↓
T=250ms    ✅ COMPENSAÇÃO COMPLETA
           - Aluguel: SOLICITADO (revertido)
           - Item: Sem bloqueios
           - Sistema: Consistente novamente
```

### Componentes Envolvidos

**1. AluguelConfirmadoEventHandler**

- Tenta bloquear datas
- Captura exceções (não propaga)
- Publica evento de falha

**2. CompensarAluguelQuandoBloqueioFalharHandler**

- Escuta eventos de falha
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

## 🔔 Arquitetura de Eventos

### Tabela Outbox

**Schema**: `core.outbox_events`

**Estrutura**:

- `id`: UUID único do evento
- `tipo_evento`: Nome do evento (AluguelConfirmado, etc)
- `id_agregado`: ID do aluguel (rastreabilidade)
- `tipo_agregado`: "Aluguel" (contexto)
- `payload`: JSONB com dados completos do evento
- `status`: PENDENTE | PUBLICADO | FALHADO
- `quantidade_tentativas`: Contador de retries
- `mensagem_erro`: Última mensagem de erro
- `criado_em`: Timestamp de criação
- `publicado_em`: Timestamp de publicação

### Trigger PostgreSQL

Quando novo evento é inserido:

```sql
CREATE TRIGGER trigger_notificar_outbox_events
AFTER INSERT ON core.outbox_events
FOR EACH ROW
EXECUTE FUNCTION core.notificar_novo_evento_outbox();
```

A função envia notificação:

```sql
PERFORM pg_notify('outbox_events', json_build_object(
    'id', NEW.id,
    'tipo_evento', NEW.tipo_evento,
    'id_agregado', NEW.id_agregado
));
```

### Listener Reativo

**OutboxPublisherListener**:

- Conecta no canal `outbox_events`
- Recebe notificações em tempo real
- Publica no EventBus do NestJS
- Marca como publicado após sucesso

### Jobs de Manutenção

**Único job**: Limpeza diária (3h da manhã)

- Remove eventos publicados > 30 dias
- Mantém outbox limpa
- Zero overhead de processamento

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
│          ↓              ↓            │
│    ┌──────────────────────────┐     │
│    │   PostgreSQL (core)      │     │
│    │  - aluguel               │     │
│    │  - outbox_events         │     │
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
│         ↓            │      │         ↓            │
│  ┌────────────────┐  │      │  ┌────────────────┐  │
│  │  PostgreSQL    │  │      │  │  PostgreSQL    │  │
│  │  - aluguel     │  │      │  │  - item        │  │
│  │  - outbox      │  │      │  │  - bloqueios   │  │
│  └────────────────┘  │      │  └────────────────┘  │
└──────────────────────┘      └──────────────────────┘
           ↓                            ↑
           └─────────→ Kafka ←──────────┘
                   (Message Broker)
```

### Mudanças Necessárias

**Infraestrutura**:

- ✅ SAGA já implementada (pronta para distribuir)
- ✅ Outbox Pattern já funcional
- 🔄 EventBus: NestJS → Kafka/RabbitMQ
- 🔄 Bancos de dados separados
- 🔄 Deploy independente por serviço

**Código**:

- ✅ Handlers já desacoplados (comunicação via eventos)
- ✅ Unit of Work abstrai infraestrutura
- 🔄 Configuração de message broker
- 🔄 Schema registry para eventos (opcional)

**Observabilidade**:

- 🔄 Distributed tracing (OpenTelemetry)
- 🔄 Logs centralizados (ELK/Loki)
- 🔄 Métricas de latência entre serviços

### Custo Estimado (Fase 2)

Quando migrar para microsserviços:

- **Kafka Managed**: ~USD 100-500/mês (dependendo do provedor)
- **Infraestrutura adicional**: ~USD 500-1k/mês (mais instâncias)
- **Complexidade operacional**: Maior (deploy, monitoring, debug)

**Recomendação**: Manter modular monolith até escala justificar custos.

---

## 📚 Referências Técnicas

- **Padrão SAGA**: [Microsoft - SAGA Pattern](https://docs.microsoft.com/azure/architecture/patterns/saga)
- **Outbox Pattern**: [Microservices.io - Transactional Outbox](https://microservices.io/patterns/data/transactional-outbox.html)
- **PostgreSQL LISTEN/NOTIFY**: [PostgreSQL Docs](https://www.postgresql.org/docs/current/sql-notify.html)
- **DDD Unit of Work**: [Martin Fowler - UoW](https://martinfowler.com/eaaCatalog/unitOfWork.html)

---

**Última Atualização**: 09 de Janeiro de 2026  
**Versão**: 2.0 (Consolidada)
