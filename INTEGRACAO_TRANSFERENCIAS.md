# 💸 Integração com Transferências do Mercado Pago

## ✅ Implementação Completa

A integração com a API de transferências do Mercado Pago foi implementada com sucesso para distribuir automaticamente os valores da caução ao finalizar um aluguel.

## 🏗️ Arquitetura Implementada

### 1. Serviço de Transferências (`MercadoPagoTransferService`)

Localização: `src/modules/seguranca/infra/services/mercado-pago-transfer.service.ts`

**Funcionalidades:**
- ✅ `transferir()` - Transfere valores para conta do locador
- ✅ `reembolsar()` - Reembolsa caução para o locatário
- ✅ `criarPagamentoComSplit()` - Split de pagamento entre múltiplos recebedores
- ✅ `consultarTransferencia()` - Consulta status de transferência
- ✅ `consultarReembolso()` - Consulta status de reembolso

**APIs utilizadas:**
- `/v1/advanced_payments` - Para transferências e splits
- `/v1/payments/{id}/refunds` - Para reembolsos

### 2. Entidade de Domínio (`Transferencia`)

Localização: `src/modules/seguranca/domain/Transferencia.ts`

**Tipos de Transferência:**
- `PAGAMENTO_LOCADOR` - Pagamento do aluguel ao locador
- `REEMBOLSO_LOCATARIO` - Devolução da caução ao locatário
- `INDENIZACAO` - Pagamento de indenização ao locador

**Estados:**
- `PENDENTE` - Transferência criada, aguardando processamento
- `PROCESSANDO` - Em processamento no Mercado Pago
- `CONCLUIDA` - Transferência realizada com sucesso
- `FALHOU` - Erro na transferência (pode ser retentada)

### 3. Persistência e Auditoria

**Model TypeORM:** `TransferenciaModel`
- Registra todas as tentativas de transferência
- Armazena IDs do Mercado Pago para rastreamento
- Mantém histórico completo de erros

**Repository:** `TransferenciaRepository`
- CRUD completo de transferências
- Busca por aluguel, status e tipo
- Lista falhas para retentativa

### 4. Use Case Atualizado (`FinalizarAluguelUseCase`)

**Fluxo Implementado:**

```typescript
1. Valida aluguel e caução
2. Calcula valores (taxa, locador, locatário, indenização)
3. Valida reconciliação dos valores
4. Atualiza status do aluguel e caução
5. EXECUTA TRANSFERÊNCIAS REAIS:
   a) Transfere para locador (aluguel líquido + indenização)
   b) Reembolsa locatário (caução restante)
6. Registra todas as transferências no banco
7. Retorna resultado com IDs das transferências
```

## 📊 Exemplo de Uso

### Request: Finalizar Aluguel

```http
POST /aluguel/finalizar
Content-Type: application/json

{
  "aluguelId": "uuid-do-aluguel",
  "houveDano": false
}
```

### Response: Sucesso

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
    },
    "transferencias": {
      "transferLocadorId": 123456789,
      "reembolsoLocatarioId": 987654321,
      "status": "sucesso"
    }
  }
}
```

### Consultar Histórico de Transferências

```http
GET /aluguel/{aluguelId}/transferencias
```

**Response:**
```json
{
  "sucesso": true,
  "dados": {
    "aluguelId": "uuid-do-aluguel",
    "total": 2,
    "transferencias": [
      {
        "id": "uuid-transferencia-1",
        "tipo": "pagamento_locador",
        "valor": 90.00,
        "destinatario": "Maria Santos",
        "status": "concluida",
        "descricao": "Aluguel - Furadeira Makita",
        "mpTransferenciaId": 123456789,
        "createdAt": "2025-11-07T10:00:00Z",
        "completedAt": "2025-11-07T10:00:05Z"
      },
      {
        "id": "uuid-transferencia-2",
        "tipo": "reembolso_locatario",
        "valor": 100.00,
        "destinatario": "João Silva",
        "status": "concluida",
        "descricao": "Devolução da caução - Furadeira Makita",
        "mpRefundId": 987654321,
        "createdAt": "2025-11-07T10:00:06Z",
        "completedAt": "2025-11-07T10:00:11Z"
      }
    ]
  }
}
```

## 🔐 Variáveis de Ambiente Necessárias

```env
# Mercado Pago - Obrigatórias
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_de_producao
MERCADO_PAGO_APP_ID=sua_app_id_do_mercado_pago

# Webhook URL
WEBHOOK_PUBLIC_URL=https://seu-dominio.com
```

## 🎯 Como Funciona a Distribuição

### Sem Danos (Exemplo: Caução R$ 200, Aluguel R$ 100)

1. **Locador recebe:** R$ 90,00 (R$ 100 - 10% taxa)
2. **Locatário recebe:** R$ 100,00 (caução - aluguel)
3. **Plataforma retém:** R$ 10,00 (taxa de 10%)
4. **Total reconciliado:** R$ 200,00 ✅

### Com Danos (Indenização R$ 50)

1. **Locador recebe:** R$ 140,00 (R$ 90 aluguel + R$ 50 indenização)
2. **Locatário recebe:** R$ 50,00 (caução - aluguel - indenização)
3. **Plataforma retém:** R$ 10,00 (taxa)
4. **Total reconciliado:** R$ 200,00 ✅

## 📝 Logs Detalhados

O sistema gera logs completos para auditoria:

```
[FinalizarAluguelUseCase] Iniciando finalização do aluguel abc-123
[FinalizarAluguelUseCase] Aluguel abc-123 finalizado com sucesso
[FinalizarAluguelUseCase] ========== INICIANDO TRANSFERÊNCIAS ==========
[FinalizarAluguelUseCase] Taxa da plataforma retida: R$ 10.00
[FinalizarAluguelUseCase] Transferindo R$ 90.00 para locador Maria Santos
[MercadoPagoTransferService] Iniciando transferência de R$ 90.00 para mp-account-456
[MercadoPagoTransferService] Transferência realizada com sucesso: 123456789
[FinalizarAluguelUseCase] ✅ Transferência para locador realizada: ID 123456789
[FinalizarAluguelUseCase] Reembolsando R$ 100.00 para locatário João Silva
[MercadoPagoTransferService] Iniciando reembolso do pagamento pref-123
[MercadoPagoTransferService] Reembolso realizado com sucesso: 987654321
[FinalizarAluguelUseCase] ✅ Reembolso para locatário realizado: ID 987654321
[FinalizarAluguelUseCase] ========== RESUMO DAS TRANSFERÊNCIAS ==========
[FinalizarAluguelUseCase] Locador recebeu: R$ 90.00 ✅
[FinalizarAluguelUseCase] Locatário recebeu: R$ 100.00 ✅
[FinalizarAluguelUseCase] Taxa retida: R$ 10.00 ✅
[FinalizarAluguelUseCase] ================================================
```

## 🛡️ Tratamento de Erros

### Transferência Falhou
- ✅ Erro é registrado na entidade `Transferencia`
- ✅ Status marcado como `FALHOU`
- ✅ Mensagem de erro armazenada
- ✅ Aluguel é finalizado mesmo assim (evita bloqueios)
- ✅ Transferência pode ser retentada manualmente

### Reconciliação Falhou
```typescript
if (diferencaValor > 0.01) {
  throw new BadRequestException('Erro na reconciliação dos valores');
}
```
❌ Aluguel **NÃO** é finalizado se os valores não batem

## 🔄 Retentativa de Transferências

Para transferências que falharam, você pode implementar:

```typescript
// Buscar transferências com falha
const falhas = await transferenciaRepository.buscarFalhasParaRetentar();

for (const transferencia of falhas) {
  if (transferencia.podeSerRetentada()) {
    // Retentar transferência...
  }
}
```

## 📊 Tabela no Banco de Dados

```sql
CREATE TABLE transferencias (
  id UUID PRIMARY KEY,
  aluguel_id UUID REFERENCES alugueis(id),
  tipo VARCHAR NOT NULL, -- 'pagamento_locador', 'reembolso_locatario', 'indenizacao'
  valor DECIMAL(10,2) NOT NULL,
  conta_destino_id VARCHAR NOT NULL,
  nome_destino VARCHAR NOT NULL,
  status VARCHAR NOT NULL, -- 'pendente', 'processando', 'concluida', 'falhou'
  mp_transferencia_id BIGINT,
  mp_refund_id BIGINT,
  descricao TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP
);

CREATE INDEX idx_transferencias_aluguel ON transferencias(aluguel_id);
CREATE INDEX idx_transferencias_status ON transferencias(status);
```

## 🚀 Próximos Passos Recomendados

1. **Webhook para Transferências**
   - Receber notificações do MP sobre status das transferências
   - Atualizar automaticamente o status no banco

2. **Dashboard de Finanças**
   - Visualizar todas as transferências
   - Relatórios de receita (taxas retidas)
   - Gráficos de movimentação financeira

3. **Retentativa Automática**
   - Job agendado para retentar transferências falhas
   - Sistema de circuit breaker para falhas recorrentes

4. **Notificações aos Usuários**
   - Email/SMS quando receber transferência
   - Alerta em caso de falha na transferência

5. **Split Antecipado**
   - Implementar split direto na preferência de pagamento
   - Valores já são distribuídos automaticamente ao pagar a caução

## ⚠️ Requisitos do Mercado Pago

Para usar a API de transferências, você precisa:

1. **Conta Mercado Pago Empresarial**
2. **Aplicação Mercado Pago criada**
3. **Access Token de Produção**
4. **Contas dos usuários devem estar vinculadas** (contaMPId)
5. **Saldo disponível para transferências**

## 🧪 Testando

### Ambiente de Sandbox
```env
MERCADO_PAGO_ACCESS_TOKEN=seu_token_de_sandbox
```

### Casos de Teste

1. ✅ Finalizar aluguel sem danos
2. ✅ Finalizar aluguel com danos e indenização
3. ✅ Finalizar com caução consumida totalmente
4. ✅ Transferência com erro (testar retry)
5. ✅ Consultar histórico de transferências

## 📞 Suporte

Em caso de problemas com transferências:

1. Verificar logs do sistema
2. Consultar histórico no endpoint `/aluguel/:id/transferencias`
3. Validar configuração do Mercado Pago
4. Verificar saldo disponível nas contas
5. Consultar documentação: https://www.mercadopago.com.br/developers/pt/reference

---

**Status:** ✅ **Implementado e Funcional**

**Data:** 07/11/2025

**Versão:** 1.0.0
