# 🎯 Filas vs Eventos vs Subscribers - Guia Prático do Coisa Rápida

**GOLDEN RULE:** Se perder = ruim → Use **FILA**. Se perder = "tá bom" → Use **EVENTO**. Se precisa validar/pre-processar síncrono → Use **SUBSCRIBER**.

## 🚀 **FILA** → Garantia de Execução

- 🔄 Retry automático (3 tentativas + backoff)
- 💾 Persistente (Redis)
- ⚡ Não bloqueia request
- 📍 Dead Letter Queue
- **Use para:** Emails críticos, webhooks, disputas, transferências

## 📢 **EVENTO** → Comunicação Entre Serviços

- 🚀 Síncrono + múltiplos listeners
- ❌ Sem retry (falha = problema)
- 🔄 Observável (vários escutam)
- **Use para:** Auditoria, cache, analytics, notificações não-críticas

## 🔧 **SUBSCRIBER** → Hooks no ORM (TypeORM)

- 🛡️ Validações síncronas antes/depois de salvar
- ⚡ Executa na transação (rollback se falhar)
- 📝 Para lógica transversal (auditoria leve, moderação)
- **Use para:** Moderação automática, cálculos financeiros, validações de estado

## 📝 **Checklist de Decisão**

1. **É crítico para o negócio?** SIM → FILA
2. **Precisa de garantia?** SIM → FILA
3. **Pode ser lento?** SIM → FILA
4. **Múltiplos listeners?** SIM → EVENTO
5. **Validação síncrona no BD?** SIM → SUBSCRIBER

## 📊 **Comparação Final**

| Aspecto             | Fila        | Evento      | Subscriber  |
| ------------------- | ----------- | ----------- | ----------- |
| Retry               | ✅ Auto     | ❌ Manual   | ❌ N/A      |
| Speed               | ⚡ Deferred | 🚀 Imediato | 🚀 Imediato |
| Persistence         | 💾 Redis    | ❌ Memory   | ❌ N/A      |
| Atomicidade         | ❌ Não      | ❌ Não      | ✅ Sim      |
| Múltiplos Listeners | ❌ Não      | ✅ Sim      | ❌ Não      |
| Overhead            | ⬆️ Médio    | ⬇️ Baixo    | ⬇️ Baixo    |
| Use Case            | Crítico     | Secundário  | Validação   |

## 🎓 **Resumo Final**

```
┌────────────────────────────────────────┐
│  EMAIL CRÍTICO (Verificação, Reset)    │
│           → USE FILA ✅                 │
├────────────────────────────────────────┤
│  AUDITORIA, LOGGING, CACHE              │
│           → USE EVENTO ✅               │
├────────────────────────────────────────┤
│  MODERAÇÃO, VALIDAÇÕES BD               │
│           → USE SUBSCRIBER ✅           │
└────────────────────────────────────────┘
```

## 📈 **Próximos Cenários**

### **FILAS (Críticos)**

- [x] Email verificação/reset
- [ ] Webhooks MP
- [ ] Disputas/indenizações
- [ ] Transferências Pix

### **EVENTOS (Não-Crítcos)**

- [ ] Auditoria
- [ ] Cache invalidation
- [ ] Analytics
- [ ] Notificações push

### **SUBSCRIBERS (Validações)**

- [ ] Moderação automática de itens
- [ ] Validações de transição de aluguel
- [ ] Cálculos financeiros automáticos

## ⚠️ **Pontos de Atenção**

### **FILAS:**

- Redis persistente em prod
- DLQ para falhas
- Monitor com Bull Dashboard

### **EVENTOS:**

- Não use para críticos
- Nomes descritivos (ex: `usuario.cadastrado`)

### **SUBSCRIBERS:**

- Leves (não façam I/O pesado)
- Testáveis isoladamente
- Acoplados ao TypeORM

## 📚 **Recursos**

- [Bull.js](https://docs.bullmq.io/)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
- [TypeORM Subscribers](https://typeorm.io/listeners-and-subscribers)

---
