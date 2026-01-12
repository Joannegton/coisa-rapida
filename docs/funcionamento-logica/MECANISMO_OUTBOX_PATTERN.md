# 📨 **Mecanismo de Outbox Pattern com PostgreSQL LISTEN/NOTIFY**

## 🎯 **Objetivo**

Garantir **entrega garantida** de eventos de domínio em caso de falhas da aplicação, mantendo **consistência eventual** entre agregados através de **Saga Coreografada**.

---

## 🏗️ **Arquitetura Atual**

### **1. Fluxo Normal de Criação e Execução**

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣  USE CASE (ex: RecusarAluguelUseCase)                    │
│                                                             │
│  ✅ Valida negócio                                          │
│  ✅ Modifica agregado (aluguel.recusar())                   │
│  ✅ Cria evento de domínio (AluguelRecusadoEvent)           │
└─────────────────────────────────────────────────────────────┘
                           ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 2️⃣  UNIT OF WORK - TRANSAÇÃO ATÔMICA                        │
│                                                             │
│  ✅ Salva Aluguel (UPDATE status=recusado)                  │
│  ✅ Salva OutboxEvent (INSERT com status=PENDENTE)          │
│  ✅ COMMIT (Tudo ou nada - ACID)                            │
└─────────────────────────────────────────────────────────────┘
                           ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 3️⃣  POSTGRESQL TRIGGER (automático)                         │
│                                                             │
│  ✅ Detecta INSERT em outbox_events                         │
│  ✅ Executa NOTIFY outbox_events                            │
│  ✅ Envia JSON com evento para listeners                    │
└─────────────────────────────────────────────────────────────┘
                           ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 4️⃣  OUTBOX PUBLISHER LISTENER (em tempo real)              │
│                                                             │
│  ✅ Recebe notificação PostgreSQL (~100-200ms)              │
│  ✅ Reconstrói evento de domínio do payload                 │
│  ✅ Publica no EventBus/NestJS CQRS                         │
│  ✅ Marca como PUBLICADO (status=publicado)                 │
└─────────────────────────────────────────────────────────────┘
                           ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 5️⃣  EVENT HANDLERS (saga coreografada)                      │
│                                                             │
│  @OnEvent('aluguel.recusado')                               │
│  ✅ Notifica locatário por email                            │
│  ✅ Cancela reservas relacionadas                           │
│  ✅ Emite eventos secundários                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💥 **Mecanismo de Recuperação de Falhas**

### **Cenário 1: Aplicação cai DURANTE transação**

```
❌ App CRASH (durante salvar aluguel)
   ↓
✅ Transação é REVERTIDA (nada foi salvo)
   ↓
✅ Usuário pode tentar novamente (idempotência)
```

### **Cenário 2: Aplicação cai APÓS transação, ANTES de publicar**

```
✅ Aluguel salvo com status=recusado
✅ OutboxEvent salvo com status=PENDENTE
❌ App CRASH (antes de publicar evento)
   ↓
🔄 Application restart
   ↓
📡 OutboxPublisherListener.onModuleInit()
   ↓
🔍 processarEventosPendentes() busca eventos PENDENTES
   ↓
📡 Publica eventos "presos" no startup
   ↓
✅ Handlers executam (notificações, etc.)
```

### **Cenário 3: Handler falha ao processar evento**

```
✅ Evento publicado no EventBus
❌ Handler falha (email service down)
   ↓
⚠️ Status do OutboxEvent = FALHADO
   ↓
📊 Auditoria registra falha (tipo: EVENTO_FALHA_PUBLICACAO)
   ↓
🔧 Admin pode invocar retry manual
```

---

## 🔄 **Estados do OutboxEvent**

```typescript
enum StatusOutboxEvent {
    PENDENTE = 'pendente', // ✅ Criado, aguardando publicação
    PUBLICADO = 'publicado', // ✅ Publicado com sucesso
    FALHADO = 'falhado', // ❌ Falhou após 5 tentativas
}
```

### **Transição de Estados**

```
┌──────────┐
│ PENDENTE │  (evento salvo na transação)
└────┬─────┘
     │
     ├─► ✅ PUBLICADO  (publicar() bem-sucedido)
     │
     ├─► ⚠️ PENDENTE  (retry automático, incrementa tentativas)
     │
     └─► ❌ FALHADO   (após 5 tentativas)
```

---

## 🛡️ **Garantias de Entrega**

### **Garantia: "At Least Once"**

```
✅ Evento SERÁ processado (mesmo em caso de crash)
✅ Pode ser processado MÚLTIPLAS VEZES (idempotência obrigatória)
❌ Não pode ser PERDIDO (exceto se houver falha permanente de BD)
```

### **Implementação na Aplicação**

| Componente                      | Garantia                           |
| ------------------------------- | ---------------------------------- |
| **Outbox Table**                | ✅ Persistência em BD (crash-safe) |
| **PostgreSQL LISTEN/NOTIFY**    | ✅ Notificação em tempo real       |
| **processarEventosPendentes()** | ✅ Recuperação de eventos "presos" |
| **Retry com tentativas**        | ✅ Até 5 tentativas com auditoria  |
| **EventBus + Handlers**         | ⚠️ Devem ser idempotentes          |

---

## 📋 **Schema do Banco**

### **Tabela: core.outbox_events**

```sql
CREATE TABLE core.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Evento
    tipo_evento VARCHAR(255) NOT NULL,           -- 'AluguelRecusado', 'AluguelCancelado', etc
    tipo_agregado VARCHAR(255) NOT NULL,         -- 'Aluguel', 'Item', etc
    id_agregado UUID NOT NULL,                   -- ID do aluguel/item

    -- Payload
    payload JSONB NOT NULL,                      -- Dados completos do evento

    -- Status de Publicação
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',  -- PENDENTE, PUBLICADO, FALHADO
    quantidade_tentativas INT DEFAULT 0,        -- Contador de retries
    mensagem_erro TEXT,                         -- Última mensagem de erro

    -- Timestamps
    criado_em TIMESTAMP DEFAULT NOW(),
    publicado_em TIMESTAMP,

    INDEX idx_status_criado (status, criado_em)
);
```

### **Trigger: Notificação ao inserir**

```sql
CREATE TRIGGER outbox_events_notify_trigger
AFTER INSERT ON core.outbox_events
FOR EACH ROW
EXECUTE FUNCTION notify_outbox_events();

CREATE FUNCTION notify_outbox_events() RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'outbox_events',
        json_build_object(
            'id', NEW.id,
            'tipo_evento', NEW.tipo_evento,
            'id_agregado', NEW.id_agregado
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔍 **Fluxo Completo: Exemplo Real**

### **Cenário: Recusar Aluguel com Crash**

```typescript
// 1️⃣ Controller recebe request
@Post('aluguel/:id/recusar')
async recusarAluguel(@Body() dto: RecusarAluguelDto, @Param('id') id: string) {
    return await this.recusarAluguelUseCase.execute({
        ...dto,
        aluguelId: id,
        usuarioId: 'user-123',
        request: req
    });
}

// 2️⃣ Use case executa
async execute(props) {
    // ✅ Busca aluguel
    const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

    // ✅ Valida regra (pode recusar?)
    aluguel.recusar(props.motivo, props.usuarioId);

    // ✅ Cria evento de domínio
    const evento = new AluguelRecusadoEvent(...);

    // 3️⃣ TRANSAÇÃO ATÔMICA
    await this.unitOfWork.executarEmTransacao(async (context) => {
        // Operação 1: Salva aluguel com novo status
        await context.salvarAluguel(aluguel);
        // UPDATE core.aluguel SET status='recusado' WHERE id='...'

        // Operação 2: Salva evento na outbox
        const outboxEvent = OutboxEvent.criar({
            tipoEvento: 'AluguelRecusado',
            idAgregado: aluguel.id,
            payload: evento
        });
        await context.salvarEvento(outboxEvent);
        // INSERT INTO core.outbox_events (tipo_evento, payload, status)
        // VALUES ('AluguelRecusado', {...}, 'pendente')
    });
    // COMMIT (tudo é salvo ou tudo falha)

    // ❌ APP CRASH AQUI (ex: 3 segundos depois)
}

// 4️⃣ PostgreSQL Trigger (automático)
// TRIGGER detecta INSERT em outbox_events
// EXECUTE: pg_notify('outbox_events', {...})

// 5️⃣ APP REINICIA (3 horas depois)
// OutboxPublisherListener.onModuleInit():
//    ✅ await this.processarEventosPendentes()
//    ✅ Busca eventos com status='pendente'
//    ✅ Encontra o evento de recusa que estava "preso"
//    ✅ Publica no EventBus

// 6️⃣ Handlers executam
@OnEvent('aluguel.recusado')
async notificarLocatario(event: AluguelRecusadoEvent) {
    await this.emailService.enviar({
        para: event.locatarioEmail,
        assunto: 'Sua solicitação foi recusada',
        motivo: event.motivoRecusa
    });
}

@OnEvent('aluguel.recusado')
async liberarIndisponibilidadeItem(event: AluguelRecusadoEvent) {
    await this.itemService.liberarPeriodo(
        event.itemId,
        event.dataInicio,
        event.dataFim
    );
}

// 7️⃣ OutboxEvent marcado como PUBLICADO
// UPDATE core.outbox_events SET status='publicado', publicado_em=NOW()
// WHERE id='...'
```

---

## ⚙️ **Configuração do Listener**

### **OutboxPublisherListener - Responsabilidades**

```typescript
export class OutboxPublisherListener implements OnModuleInit, OnModuleDestroy {
    // 1️⃣ onModuleInit()
    // Inicia LISTEN/NOTIFY PostgreSQL
    // Processa eventos pendentes ("recovery")
    // 2️⃣ healthCheckInteligente()
    // CRON a cada minuto
    // Verifica conexão a cada 5 minutos
    // Circuit breaker após 3 falhas (30min de backoff)
    // 3️⃣ pgClient.on('notification')
    // Listener de notificações PostgreSQL
    // Chama publicarEvento() em tempo real
    // 4️⃣ processarEventosPendentes()
    // ✅ NOVO - Busca eventos PENDENTES no startup
    // Garante recuperação após crashes
}
```

---

## 📊 **Monitoramento e Auditoria**

### **Eventos de Auditoria Registrados**

```typescript
// Quando evento é publicado
AuditoriaAcao.EVENTO_PUBLICADO;
// {"tipoEvento": "AluguelRecusado", "status": "publicado"}

// Quando evento falha
AuditoriaAcao.EVENTO_FALHA_PUBLICACAO;
// {"tipoEvento": "AluguelRecusado", "tentativa": 2, "erro": "..."}

// Quando evento falha permanentemente (5 tentativas)
AuditoriaAcao.EVENTO_FALHA_DEFINITIVA;
// {"tipoEvento": "AluguelRecusado", "tentativas": 5, "status": "falhado"}

// Quando conexão LISTEN/NOTIFY cai
AuditoriaAcao.CONEXAO_PERDIDA;
// {"status": "DESCONECTADO", "circuitBreaker": true}
```

### **Queries para Monitoramento**

```sql
-- Ver eventos pendentes (possível backlog)
SELECT id, tipo_evento, id_agregado, criado_em
FROM core.outbox_events
WHERE status = 'pendente'
ORDER BY criado_em ASC;

-- Ver eventos que falharam
SELECT id, tipo_evento, quantidade_tentativas, mensagem_erro, criado_em
FROM core.outbox_events
WHERE status = 'falhado'
ORDER BY criado_em DESC
LIMIT 10;

-- Ver taxa de sucesso
SELECT
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM core.outbox_events) * 100, 2) as percentual
FROM core.outbox_events
WHERE criado_em > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Ver eventos que demoraram mais tempo
SELECT
    id,
    tipo_evento,
    EXTRACT(EPOCH FROM (publicado_em - criado_em))::INT as segundos_ate_publicacao,
    criado_em
FROM core.outbox_events
WHERE status = 'publicado'
  AND publicado_em > NOW() - INTERVAL '24 hours'
ORDER BY publicado_em - criado_em DESC
LIMIT 10;
```

---

## 🎯 **Vantagens da Arquitetura Atual**

| Aspecto             | Benefício                                     |
| ------------------- | --------------------------------------------- |
| **Consistência**    | ✅ Dados + Eventos sempre salvos atomicamente |
| **Resiliência**     | ✅ Recupera eventos após restart              |
| **Latência**        | ✅ ~100-200ms (tempo real com LISTEN/NOTIFY)  |
| **Observabilidade** | ✅ Auditoria completa de cada evento          |
| **Simplicidade**    | ✅ Sem dependência de Kafka/RabbitMQ          |
| **Rastreabilidade** | ✅ Cada evento salvo permanentemente          |

---

## ❌ **Limitações Conhecidas**

| Limitação                    | Impacto                        | Solução                      |
| ---------------------------- | ------------------------------ | ---------------------------- |
| **PostgreSQL dependency**    | ⚠️ Requer PG                   | Upgrade DB quando necessário |
| **Single database**          | ⚠️ BD é ponto único de falha   | Usar replicação/backup       |
| **Máx 5 tentativas**         | ⚠️ Eventos podem ficar presos  | Implementar retry manual     |
| **Processamento sequencial** | ⚠️ Eventos processados 1 por 1 | OK para volume atual         |

---

## 🔧 **Troubleshooting**

### **Problema: Evento fica em PENDENTE**

```sql
-- 1. Ver evento
SELECT * FROM core.outbox_events WHERE status = 'pendente' LIMIT 1;

-- 2. Ver logs da auditoria
SELECT * FROM shared.auditoria
WHERE acao = 'EVENTO_FALHA_PUBLICACAO'
ORDER BY criado_em DESC LIMIT 5;

-- 3. Reprocessar manualmente
-- Marcar como pendente novamente para ser processado
UPDATE core.outbox_events
SET status = 'pendente', quantidade_tentativas = 0
WHERE id = '...' AND status = 'falhado';
```

### **Problema: LISTEN/NOTIFY não funciona**

```sql
-- Testar LISTEN/NOTIFY
LISTEN outbox_events;

-- Em outra conexão, gerar evento
INSERT INTO core.outbox_events (tipo_evento, id_agregado, tipo_agregado, payload, status)
VALUES ('TestEvent', gen_random_uuid(), 'Test', '{}', 'pendente');

-- Primeira conexão deve receber notificação
```

---

## 📚 **Referências**

- [PostgreSQL LISTEN/NOTIFY](https://www.postgresql.org/docs/current/sql-listen.html)
- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Saga Coreografada](./SAGA_ALUGUEL_FLUXO_COMPLETO.md)
- [Event-Driven Architecture](https://www.youtube.com/watch?v=STKCRSUsyP0)

---

**Última atualização:** Janeiro 2026  
**Responsável:** Backend Team  
**Status:** ✅ Em Produção
