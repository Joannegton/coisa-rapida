# Sistema de Caução em Escrow - Coisa Rápida

## 📋 Visão Geral

Sistema de gerenciamento de caução (escrow) para aluguéis, implementado seguindo **Domain-Driven Design (DDD)** e as melhores práticas de NestJS. O locatário paga uma caução que fica retida até a finalização do aluguel, quando os valores são distribuídos automaticamente.

## 🔄 Fluxo do Sistema

### 1. Criação da Caução
```
POST /aluguel/criar-caucao
```

O locatário inicia o processo pagando o valor da caução que fica retido em custódia.

**Fluxo:**
- Cria registro do aluguel no banco de dados
- Gera preferência de pagamento no Mercado Pago
- Cria registro da caução vinculada ao aluguel
- Retorna URL de checkout para pagamento

**Status:** `AGUARDANDO_CAUCAO` → `AGUARDANDO_PAGAMENTO`

### 2. Webhook do Mercado Pago
```
POST /aluguel/webhook-caucao
```

Recebe notificações automáticas do Mercado Pago sobre mudanças no status do pagamento.

**Fluxo:**
- Processa notificação do pagamento
- Busca caução e aluguel relacionados
- Atualiza status conforme resultado do pagamento

**Status:** `AGUARDANDO_PAGAMENTO` → `PAGA` (se aprovado)

### 3. Finalização do Aluguel
```
POST /aluguel/finalizar
```

Após devolução do item, distribui os valores da caução.

**Cálculos realizados:**
- Taxa da plataforma (ex: 10% do aluguel)
- Valor líquido do locador (aluguel - taxa)
- Indenização (se houver dano)
- Retorno ao locatário (caução - aluguel - indenização)

**Status:** `CAUCAO_PAGA` → `FINALIZADO_SEM_DANOS` ou `FINALIZADO_COM_DANOS`

## 💰 Exemplo Prático

| Descrição | Valor |
|-----------|-------|
| Caução paga | R$ 200,00 |
| Valor do aluguel | R$ 100,00 |
| Taxa do app (10%) | R$ 10,00 |
| **Locador recebe** | **R$ 90,00** |
| **Locatário recebe de volta** | **R$ 100,00** |
| **Total reconciliado** | ✅ R$ 200,00 |

### Com Dano

| Descrição | Valor |
|-----------|-------|
| Caução paga | R$ 200,00 |
| Valor do aluguel | R$ 100,00 |
| Taxa do app (10%) | R$ 10,00 |
| Indenização | R$ 50,00 |
| **Locador recebe** | **R$ 140,00** (aluguel líquido + indenização) |
| **Locatário recebe de volta** | **R$ 50,00** |
| **Total reconciliado** | ✅ R$ 200,00 |

## 🏗️ Arquitetura DDD

### Domain (Entidades de Negócio)
```
domain/
├── Aluguel.ts       # Entidade principal com regras de negócio
└── Caucao.ts        # Entidade de caução/escrow
```

**Aluguel** - Entidade rica com métodos:
- `calcularTaxaApp()` - Calcula taxa da plataforma
- `calcularValorLiquidoLocador()` - Valor do locador após taxas
- `calcularRetornoLocatario()` - Valor devolvido ao locatário
- `podeSerFinalizado()` - Validação de status
- `marcarComoFinalizado()` - Transição de estado

**Caucao** - Gerencia o escrow:
- `atualizarStatus()` - Controla estados
- `estaPaga()` - Validação de pagamento
- `podeSerProcessada()` - Verificação de processamento

### Application (Casos de Uso)

```
application/
├── usecases/
│   ├── CriarCaucaoAluguel.usecase.ts       # Inicia processo
│   ├── ProcessarWebhookCaucao.usecase.ts   # Processa webhooks
│   └── FinalizarAluguel.usecase.ts         # Distribui valores
└── dtos/
    ├── CriarCaucao.dto.ts                  # Validação de entrada
    └── FinalizarAluguel.dto.ts             # Validação de finalização
```

### Infrastructure (Persistência e Serviços)

```
infra/
├── models/
│   ├── Aluguel.model.ts                    # TypeORM Entity
│   └── Caucao.model.ts                     # TypeORM Entity
├── repositories/
│   ├── Aluguel.repository.ts               # Acesso a dados
│   └── Caucao.repository.ts                # Acesso a dados
└── services/
    └── mercado-pago-checkout.service.ts    # Integração MP
```

### Interface (Controllers)

```
Aluguel.controller.ts                       # Endpoints REST
```

## 🔐 Endpoints da API

### 1. Criar Caução

```http
POST /aluguel/criar-caucao
Content-Type: application/json

{
  "item": {
    "id": "item-123",
    "nome": "Furadeira Makita",
    "descricao": "Furadeira de impacto 500W"
  },
  "locatario": {
    "id": "user-456",
    "nome": "João Silva",
    "email": "joao@email.com",
    "contaMPId": "mp-account-123"
  },
  "locador": {
    "id": "user-789",
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "contaMPId": "mp-account-456"
  },
  "valorCaucao": 200.00,
  "valorAluguel": 100.00,
  "taxaAppPercentual": 0.1
}
```

**Response:**
```json
{
  "sucesso": true,
  "dados": {
    "aluguelId": "uuid-do-aluguel",
    "paymentId": "preference-id-mp",
    "checkoutUrl": "https://www.mercadopago.com.br/checkout/...",
    "message": "Caução criada com sucesso. Realize o pagamento via checkout."
  }
}
```

### 2. Webhook Mercado Pago

```http
POST /aluguel/webhook-caucao
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "123456789"
  }
}
```

### 3. Finalizar Aluguel

```http
POST /aluguel/finalizar
Content-Type: application/json

{
  "aluguelId": "uuid-do-aluguel",
  "houveDano": false
}
```

**Response (sem dano):**
```json
{
  "sucesso": true,
  "dados": {
    "aluguelId": "uuid-do-aluguel",
    "mensagem": "Aluguel finalizado sem danos",
    "detalhes": {
      "taxaApp": 10.00,
      "valorLiquidoLocador": 90.00,
      "retornoLocatario": 100.00
    }
  }
}
```

**Response (com dano):**
```json
{
  "sucesso": true,
  "dados": {
    "aluguelId": "uuid-do-aluguel",
    "mensagem": "Aluguel finalizado com danos",
    "detalhes": {
      "taxaApp": 10.00,
      "valorLiquidoLocador": 90.00,
      "retornoLocatario": 50.00,
      "indenizacao": 50.00
    }
  }
}
```

## 📊 Estados do Sistema

### Status do Aluguel
- `AGUARDANDO_CAUCAO` - Aguardando criação da caução
- `CAUCAO_PAGA` - Caução foi paga, aluguel ativo
- `EM_ANDAMENTO` - Aluguel em curso
- `FINALIZADO_SEM_DANOS` - Concluído sem problemas
- `FINALIZADO_COM_DANOS` - Concluído com indenização
- `CANCELADO` - Cancelado

### Status da Caução
- `CRIADA` - Caução criada
- `AGUARDANDO_PAGAMENTO` - Aguardando pagamento
- `PAGA` - Pagamento aprovado
- `PROCESSANDO` - Em processamento
- `DEVOLVIDA` - Valores devolvidos
- `CANCELADA` - Cancelada

## 🗄️ Modelo de Dados (PostgreSQL)

### Tabela: alugueis
```sql
id                  UUID PRIMARY KEY
item                JSONB
locatario           JSONB
locador             JSONB
valor_caucao        DECIMAL(10,2)
valor_aluguel       DECIMAL(10,2)
taxa_app_percentual DECIMAL(5,4)
status              ENUM
mp_payment_id       VARCHAR
indenizacao         DECIMAL(10,2)
created_at          TIMESTAMP
updated_at          TIMESTAMP
finalizado_at       TIMESTAMP
```

### Tabela: caucoes
```sql
id            UUID PRIMARY KEY
aluguel_id    UUID FOREIGN KEY
payment_id    VARCHAR UNIQUE
valor         DECIMAL(10,2)
status        ENUM
checkout_url  TEXT
mp_response   JSONB
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token

# Webhook URL (use ngrok para testes locais)
WEBHOOK_PUBLIC_URL=https://seu-dominio.com
```

### Registrar Models no TypeORM

As entidades já estão registradas em `seguranca.module.ts`:
```typescript
TypeOrmModule.forFeature([
  AluguelModel,
  CaucaoModel,
  // ... outras entidades
])
```

## 🚀 Próximos Passos (TODOs)

### 1. Integração com API de Transferências
Implementar transferências reais usando Mercado Pago Split ou API de transferências:

```typescript
// Em FinalizarAluguel.usecase.ts
// TODO: Substituir simulação por transferências reais
await this.mercadoPagoService.transferirParaLocador({
  contaId: aluguel.locador.contaMPId,
  valor: valorLiquidoLocador + indenizacao
});

await this.mercadoPagoService.reembolsarLocatario({
  contaId: aluguel.locatario.contaMPId,
  valor: retornoLocatario
});
```

### 2. Sistema de Notificações
Enviar notificações em cada etapa:
- Caução criada
- Pagamento confirmado
- Aluguel iniciado
- Aluguel finalizado
- Valores transferidos

### 3. Tratamento de Disputas
Implementar fluxo para disputas entre locador/locatário sobre danos.

### 4. Migração do Banco de Dados
Criar migration para as novas tabelas:

```bash
npm run typeorm migration:create src/migrations/CreateAluguelCaucaoTables
```

## ✅ Validações Implementadas

- ✅ Validação de dados de entrada com class-validator
- ✅ Verificação de reconciliação de valores
- ✅ Validação de status antes de finalizar
- ✅ Validação de caução paga
- ✅ Cálculos automáticos com regras de negócio no domain
- ✅ Logging completo de todas as operações

## 📚 Conceitos Aplicados

- **DDD (Domain-Driven Design)** - Entidades ricas com lógica de negócio
- **SOLID** - Princípios de responsabilidade única e inversão de dependência
- **Repository Pattern** - Abstração de acesso a dados
- **Use Cases** - Lógica de aplicação isolada
- **DTOs** - Validação de entrada de dados
- **TypeORM** - ORM para PostgreSQL
- **Dependency Injection** - Gerenciado pelo NestJS

## 🧪 Testando o Sistema

1. **Criar caução**: Use Postman/Insomnia para chamar o endpoint
2. **Pagar no checkout**: Acesse a URL retornada e faça o pagamento
3. **Webhook automático**: Mercado Pago notifica automaticamente
4. **Finalizar aluguel**: Chame o endpoint de finalização

## 📝 Observações

- Sistema usa PostgreSQL com JSONB para flexibilidade nos dados de participantes
- Valores são armazenados como DECIMAL para precisão financeira
- Índices criados em campos de busca frequente (status, paymentId, aluguelId)
- Logs detalhados para auditoria e debugging
- Padrão de resposta consistente: `{ sucesso, dados }` ou `{ sucesso, mensagem }`
