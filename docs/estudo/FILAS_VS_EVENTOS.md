# 🎯 Filas vs Eventos - Guia Prático do Coisa Rápida

**GOLDEN RULE:** Se perder = ruim → Use **FILA**. Se perder = "tá bom" → Use **EVENTO**.

## 🚀 **FILA** → Use quando PRECISA GARANTIR

### ✅ **Características:**

- 🔄 **Retry automático** (3 tentativas com backoff)
- 💾 **Persistência** (dados salvos em Redis)
- ⏱️ **Backoff exponencial** (1s → 2s → 4s)
- 📍 **Dead Letter Queue** (falhas permanentes)
- 🔌 **Desacoplado** (adiciona à fila e retorna)
- ⚡ **Rápido** (request não fica aguardando)

---

## 📢 **EVENTO** → Use quando NÃO PRECISA GARANTIR OU SINCRONIZAR

### ✅ **Características:**

- 🚀 **Instantâneo** (síncrono por padrão)
- 📣 **Comunicação entre agregados** (UserRegisteredEvent → múltiplos listeners)
- 🔄 **Observável** (vários services escutam o mesmo evento)
- ❌ **Sem retry automático**
- ⚠️ **Se falhar = problema** (não vai tentar de novo)

---

## 📝 **Checklist de Decisão**

Quando um novo job aparecer, faça estas perguntas:

### ❓ **Pergunta 1: É crítico para o negócio?**

- **SIM** → Use FILA
- **NÃO** → Vá para pergunta 2

### ❓ **Pergunta 2: Precisa de garantia de execução?**

- **SIM** → Use FILA
- **NÃO** → Vá para pergunta 3

### ❓ **Pergunta 3: Pode ser muito lento?**

- **SIM** → Use FILA (não bloqueia request)
- **NÃO** → Vá para pergunta 4

### ❓ **Pergunta 4: Precisa sincronizar múltiplos listeners?**

- **SIM** → Use EVENTO
- **NÃO** → Use FILA (ou direto síncrono)

---

## 🔧 **Implementação Prática**

### **FILA - Email de Verificação:**

```typescript
// Seu código dispara assim:
await this.emailService.enviarEmail({
    to: usuario.email,
    subject: 'Verifique seu email',
    htmlBody: htmlBody,
});

// O que acontece internamente:
// 1. EmailService adiciona job à fila
// 2. Retorna IMEDIATAMENTE (não aguarda)
// 3. EmailProcessor pega o job
// 4. Tenta enviar → sucesso/falha
// 5. Se falhar: retry automático
// 6. Usuário recebe mesmo se SMTP tiver problema
```

### **EVENTO - Auditoria:**

```typescript
// Seu código dispara assim:
this.eventEmitter.emit('usuario.registrado', {
    usuarioId,
    email,
    timestamp,
});

// O que acontece:
// 1. Múltiplos listeners recebem
// 2. AuditoriaService registra em BD
// 3. CacheService invalida cache
// 4. Se algo falhar = não quebra
```

---

## ⚠️ **Erros Comuns**

### ❌ **Erro 1: Usar Evento para Email Crítico**

```typescript
// ERRADO ❌
this.eventEmitter.emit('usuario.registrado', event);
// Se o listener de email falhar = email não é enviado
```

### ✅ **Correto:**

```typescript
// CERTO ✅
await this.emailService.enviarEmail({...});
// Fila garante retry
```

---

### ❌ **Erro 2: Usar Fila para Tudo**

```typescript
// ERRADO ❌ (overkill)
await this.auditoriaQueue.add('registrar-auditoria', {...});
```

### ✅ **Correto:**

```typescript
// CERTO ✅
this.eventEmitter.emit('usuario.registrado', event);
// Auditoria falhar é aceitável
```

---

## 📊 **Comparação Final**

| Aspecto             | Fila          | Evento      |
| ------------------- | ------------- | ----------- |
| Retry               | ✅ Automático | ❌ Manual   |
| Speed               | ⚡ Deferred   | 🚀 Imediato |
| Persistence         | 💾 Em Redis   | ❌ Memory   |
| DLQ                 | ✅ Sim        | ❌ Não      |
| Múltiplos Listeners | ❌ Não        | ✅ Sim      |
| Overhead            | ⬆️ Médio      | ⬇️ Baixo    |
| Use Case            | Crítico       | Secundário  |

---

## 🎓 **Resumo Final**

```
┌────────────────────────────────────────┐
│  EMAIL CRÍTICO (Verificação, Reset)    │
│           → USE FILA ✅                 │
├────────────────────────────────────────┤
│  AUDITORIA, LOGGING, CACHE              │
│           → USE EVENTO ✅               │
├────────────────────────────────────────┤
│  NOTIFICAÇÃO NÃO-CRÍTICA               │
│           → USE EVENTO ✅               │
└────────────────────────────────────────┘
```

---

### **EVENTO - Auditoria (Não Implementado Ainda)**

```typescript
// Exemplo de como seria
@EventsHandler(UsuarioRegistradoEvent)
export class AuditoriaHandler implements IEventHandler<UsuarioRegistradoEvent> {
    async handle(event: UsuarioRegistradoEvent): Promise<void> {
        // 📝 Registra auditoria (se falhar, não quebra cadastro)
        await this.auditoriaService.registrar({
            acao: 'USUARIO_CADASTRADO',
            usuarioId: event.usuarioId,
            dados: { email: event.email },
        });
    }
}
```

---

## 📈 **Próximos Cenários a Implementar**

### **FILAS (Críticos - Implementar Logo)**

1. **Webhooks Mercado Pago** - Processar pagamentos
2. **Disputas** - Calcular indenizações
3. **Transferências Pix** - Pagamentos manuais
4. **Lembretes de Devolução** - Avisos automáticos

### **EVENTOS (Não-Crítcos - Implementar Depois)**

1. **Auditoria** - Logs de ações
2. **Cache Invalidation** - Limpeza de cache
3. **Analytics** - Métricas Google Analytics
4. **Notificações Push** - Real-time updates

---

## 🎯 **Checklist de Implementação**

- [x] **FILA**: Email de verificação
- [x] **FILA**: Email de reset senha
- [ ] **FILA**: Webhooks MP
- [ ] **FILA**: Processamento de disputas
- [ ] **EVENTO**: Sistema de auditoria
- [ ] **EVENTO**: Cache invalidation
- [ ] **EVENTO**: Analytics tracking

---

## ⚠️ **Pontos de Atenção**

### **FILAS:**

- ✅ Sempre use com Redis persistente em produção
- ✅ Configure DLQ para jobs falhados
- ✅ Monitore fila com Bull Dashboard
- ✅ Defina limites de concurrency

### **EVENTOS:**

- ✅ Não use para operações críticas
- ✅ Sempre faça async/await se necessário
- ✅ Use nomes descritivos (ex: `usuario.cadastrado`)
- ✅ Documente todos os eventos disparados

---

## 📚 **Recursos Adicionais**

- [Bull.js Documentation](https://docs.bullmq.io/)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
- [Redis Persistence](https://redis.io/docs/management/persistence/)
- [Message Queue Patterns](https://www.enterpriseintegrationpatterns.com/)

---
