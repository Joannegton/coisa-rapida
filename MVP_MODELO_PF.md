# 💰 Sistema de Caução - Modelo MVP para Conta PF

## 🎯 Solução Implementada

Sistema adaptado para **Mercado Pago Pessoa Física**, ideal para MVP sem necessidade de conta empresarial.

### Por que esse modelo?

- ✅ **Conta PF** não tem acesso à API de transferências automáticas
- ✅ **Viável para MVP** - Sem burocracias ou taxas empresariais
- ✅ **Reembolso automático** funciona perfeitamente em contas PF
- ✅ **Pix manual** é rápido, gratuito e instantâneo
- ✅ **Escalável** - Migra fácil para automação quando virar PJ

---

## 🔄 Como Funciona

### Exemplo Prático: Caução R$ 200 | Aluguel R$ 100

#### 1️⃣ Locatário Paga a Caução
```
💳 Locatário paga R$ 200 via Mercado Pago
✅ Valor fica retido até finalizar o aluguel
```

#### 2️⃣ Sistema Finaliza o Aluguel
```http
POST /aluguel/finalizar
{
  "aluguelId": "abc-123",
  "houveDano": false
}
```

**Response:**
```json
{
  "sucesso": true,
  "dados": {
    "mensagem": "Aluguel finalizado sem danos",
    "detalhes": {
      "taxaApp": 10.00,
      "valorLiquidoLocador": 90.00,
      "retornoLocatario": 100.00
    },
    "transferencias": {
      "reembolsoLocatarioId": 987654321,
      "status": "aguardando_transferencia_manual"
    }
  }
}
```

#### 3️⃣ Distribuição Automática

**O que o sistema faz AUTOMATICAMENTE:**

✅ **Reembolsa R$ 100 ao locatário** via API do Mercado Pago
```
💳 Locatário recebe R$ 100 de volta (em até 48h)
```

✅ **Retém R$ 10 de taxa** na sua conta
```
💰 Sua plataforma fica com R$ 10 (10% do aluguel)
```

✅ **Gera instruções Pix para você**
```
📤 Sistema gera: "Transferir R$ 90 via Pix para Maria Santos (Chave: maria@email.com)"
```

#### 4️⃣ Você Faz o Pix Manual

**No seu app bancário:**
```
1. Abra o Pix
2. Cole a chave: maria@email.com (ou CPF/telefone)
3. Valor: R$ 90,00
4. Confirma
```

⚡ **Pix cai na hora!**

#### 5️⃣ Confirma no Sistema

```http
PATCH /aluguel/transferencia/confirmar
{
  "transferenciaId": "uuid-da-transferencia",
  "comprovante": "pix-123456" // Opcional
}
```

✅ **Pronto! Todos receberam:**
- Locador: R$ 90 ✅
- Locatário: R$ 100 ✅
- Você: R$ 10 ✅

---

## 📊 Fluxo Completo Visualizado

```
┌──────────────────────────────────────────────────────────────┐
│  ETAPA 1: LOCATÁRIO PAGA CAUÇÃO                             │
└──────────────────────────────────────────────────────────────┘
                            │
                    💳 R$ 200 (Mercado Pago)
                            │
                            ▼
                   🔒 CAUÇÃO RETIDA
                            │
┌──────────────────────────────────────────────────────────────┐
│  ETAPA 2: ALUGUEL É FINALIZADO (Sistema distribui)          │
└──────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   💰 R$ 10           💳 R$ 100            📤 R$ 90
   (TAXA APP)      (REEMBOLSO AUTO)   (PIX MANUAL)
        │                   │                   │
        ▼                   ▼                   ▼
  Fica na sua         Volta para o         Você faz Pix
   conta MP           locatário            para locador
     ✅                  ✅                      ⏳
                                                │
                                                ▼
                                          📱 Confirma
                                          no sistema
                                                ✅
```

---

## 🚀 Endpoints da API

### 1. Criar Caução

```http
POST /aluguel/criar-caucao
```

**Body:**
```json
{
  "item": {
    "id": "item-123",
    "nome": "Furadeira Makita"
  },
  "locatario": {
    "id": "user-456",
    "nome": "João Silva",
    "email": "joao@email.com"
  },
  "locador": {
    "id": "user-789",
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "chavePix": "maria@email.com"  // ← IMPORTANTE!
  },
  "valorCaucao": 200.00,
  "valorAluguel": 100.00,
  "taxaAppPercentual": 0.1
}
```

### 2. Finalizar Aluguel

```http
POST /aluguel/finalizar
```

**Body:**
```json
{
  "aluguelId": "abc-123",
  "houveDano": false,
  "valorIndenizacao": 0  // Opcional, se houver dano
}
```

**Response:**
```json
{
  "sucesso": true,
  "dados": {
    "aluguelId": "abc-123",
    "mensagem": "Aluguel finalizado sem danos",
    "detalhes": {
      "taxaApp": 10.00,
      "valorLiquidoLocador": 90.00,
      "retornoLocatario": 100.00
    },
    "transferencias": {
      "reembolsoLocatarioId": 987654321,
      "status": "aguardando_transferencia_manual"
    }
  }
}
```

### 3. Consultar Transferências Pendentes

```http
GET /aluguel/{aluguelId}/transferencias
```

**Response:**
```json
{
  "sucesso": true,
  "dados": {
    "transferencias": [
      {
        "id": "uuid-transfer-1",
        "tipo": "pagamento_locador",
        "valor": 90.00,
        "destinatario": "Maria Santos",
        "chavePix": "maria@email.com",
        "status": "aguardando_transferencia_manual",
        "instrucoesTransferencia": "Transferir R$ 90.00 via Pix para Maria Santos (Chave: maria@email.com)",
        "descricao": "Aluguel - Furadeira Makita"
      },
      {
        "id": "uuid-transfer-2",
        "tipo": "reembolso_locatario",
        "valor": 100.00,
        "status": "concluida",
        "mpRefundId": 987654321
      }
    ]
  }
}
```

### 4. Confirmar Transferência Manual

```http
PATCH /aluguel/transferencia/confirmar
```

**Body:**
```json
{
  "transferenciaId": "uuid-transfer-1",
  "comprovante": "pix-123456"  // Opcional
}
```

---

## 💡 Exemplo com Dano

### Caução R$ 200 | Aluguel R$ 100 | Indenização R$ 50

```http
POST /aluguel/finalizar
{
  "aluguelId": "abc-123",
  "houveDano": true,
  "valorIndenizacao": 50.00
}
```

**Distribuição:**
- 📤 **Locador recebe:** R$ 140 via Pix manual (R$ 90 + R$ 50 indenização)
- 💳 **Locatário recebe:** R$ 50 via reembolso automático
- 💰 **Você retém:** R$ 10 de taxa

**Total:** R$ 200 ✅

---

## 🛠️ Configuração

### 1. Variáveis de Ambiente

```env
# Mercado Pago (CONTA PF FUNCIONA!)
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
```

### 2. Cadastrar Chave Pix dos Locadores

Ao cadastrar locador, pedir:
- Nome completo
- Email
- **Chave Pix** (pode ser CPF, email, telefone ou aleatória)

```typescript
{
  "locador": {
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "chavePix": "12345678900"  // CPF
    // OU
    "chavePix": "maria@email.com"  // Email
    // OU
    "chavePix": "(11) 98888-7777"  // Telefone
  }
}
```

---

## 📱 Interface Recomendada

### Tela Admin: Transferências Pendentes

```
╔════════════════════════════════════════════════════╗
║  🔔 TRANSFERÊNCIAS PENDENTES (2)                   ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📤 Aluguel #ABC-123 - Furadeira Makita           ║
║  ────────────────────────────────────────────      ║
║  💰 Valor: R$ 90,00                               ║
║  👤 Para: Maria Santos                            ║
║  🔑 Chave Pix: maria@email.com                    ║
║                                                    ║
║  [📋 Copiar Chave]  [✅ Já Transferi]            ║
║                                                    ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📤 Aluguel #DEF-456 - Martelo                    ║
║  ────────────────────────────────────────────      ║
║  💰 Valor: R$ 45,00                               ║
║  👤 Para: João Pereira                            ║
║  🔑 Chave Pix: (11) 98765-4321                    ║
║                                                    ║
║  [📋 Copiar Chave]  [✅ Já Transferi]            ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## 🎯 Vantagens do Modelo MVP

| Aspecto | Modelo MVP | Modelo Empresarial |
|---------|------------|-------------------|
| **Tipo de conta** | PF (Pessoa Física) | PJ (Pessoa Jurídica) |
| **Burocracia** | ✅ Zero | ⚠️ Alta |
| **Custo mensal** | ✅ Gratuito | 💰 R$ 50-200/mês |
| **Setup** | ✅ Imediato | ⏱️ Dias/semanas |
| **Pix manual** | ⏱️ 2 min/operação | ✅ Automático |
| **Ideal para** | ✅ MVP/Testes | Escala |

---

## 🚀 Quando Migrar para Automação?

Migre quando:
- ✅ Tiver +50 aluguéis/mês (Pix manual fica cansativo)
- ✅ Virar Pessoa Jurídica
- ✅ Tiver time para gerenciar
- ✅ Quiser Split automático na fonte

---

## ✅ Checklist de Implementação

- [x] Sistema registra caução
- [x] Webhook processa pagamento
- [x] Cálculo automático de valores
- [x] Reembolso automático ao locatário
- [x] Geração de instruções Pix
- [x] Endpoint de confirmação manual
- [x] Auditoria completa no banco
- [ ] Notificações por email/SMS
- [ ] Dashboard de transferências pendentes
- [ ] Integração com app mobile

---

## 📞 Fluxo de Comunicação

### Email para Admin (Você)

```
🔔 Nova Transferência Pendente

Aluguel finalizado: #ABC-123
Locador: Maria Santos
Valor a transferir: R$ 90,00

Chave Pix: maria@email.com

👉 Acesse o painel para confirmar após transferir
```

### Email para Locador

```
✅ Aluguel Finalizado!

Olá Maria,

Seu aluguel da Furadeira Makita foi finalizado com sucesso!

💰 Você receberá R$ 90,00 via Pix
📱 Chave cadastrada: maria@email.com

O pagamento será processado em até 2 dias úteis.

Qualquer dúvida, entre em contato.
```

### Email para Locatário

```
💳 Reembolso Processado

Olá João,

O aluguel foi finalizado e seu reembolso foi processado!

💰 Valor: R$ 100,00
📅 Prazo: até 48 horas úteis

O valor será creditado na mesma forma de pagamento utilizada.

Obrigado por usar nossa plataforma!
```

---

## 🔧 Troubleshooting

### Problema: Chave Pix inválida

**Solução:** Validar formato da chave no cadastro
```typescript
if (chavePix.includes('@')) {
  // Validar email
} else if (chavePix.length === 11) {
  // Validar CPF
} // etc
```

### Problema: Esqueci de fazer o Pix

**Solução:** Lista de pendentes no admin
```http
GET /aluguel/transferencias/pendentes
```

### Problema: Fiz Pix errado

**Solução:** Cancelar e refazer
```typescript
// Marcar como falhou e criar nova
transferencia.marcarComoFalhou('Pix enviado para chave errada');
// Criar nova transferência correta
```

---

**Status:** ✅ **Implementado e Pronto para MVP**

**Ideal para:** Startups, MVPs, Contas PF, Testes

**Quando escalar:** Migrar para API de Split quando virar PJ
