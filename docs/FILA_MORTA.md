# 🪦 Fila Morta (Dead Letter Queue) - Guia de Implementação

## 📋 Visão Geral

A **Fila Morta** é um mecanismo de segurança para capturar e armazenar mensagens que falharam em serem processadas automaticamente. No contexto do sistema "Coisa Rápida", ela é usada para lidar com falhas críticas nas transações SAGA que requerem intervenção manual.

A implementação utiliza o **Redis já existente** configurado no `BullModule` para persistência, evitando duplicação de infraestrutura.

## 🎯 Quando Usar Fila Morta

A Fila Morta deve ser usada quando:
- Falhas críticas em compensações SAGA não podem ser resolvidas automaticamente
- Operações que afetam consistência de dados requerem análise manual
- Eventos importantes falham persistentemente após múltiplas tentativas
- É necessário manter histórico de falhas para auditoria e debugging

## 🏗️ Arquitetura

### Componentes Principais

1. **ServicoFilaMortaService** (`src/shared/infra/services/servico-fila-morta.service.ts`)
   - Responsável por armazenar mensagens na Fila Morta
   - Integra com Redis existente do BullModule
   - Dispara notificações automáticas
   - Métodos: `enviar()`, `obterMensagens()`, `removerMensagem()`, `reprocessarMensagem()`, `obterEstatisticas()`

2. **NotificationService** (`src/shared/infra/services/notification.service.ts`)
   - Envia alertas para equipe de desenvolvimento
   - Métodos: `enviarAlerta()`, `notificarEventoCritico()`
   - Suporte para Slack, email e SMS (extensível)

3. **ControladorAdminFilaMortaController** (`src/shared/controllers/dead-letter-queue-admin.controller.ts`)
   - API administrativa para gerenciamento manual
   - Endpoints para visualizar, remover e reprocessar mensagens

### Interface de Dados

```typescript
interface MensagemFilaMorta {
    id?: string;                            // Gerado automaticamente se não fornecido
    modulo: string;                          // Módulo que gerou a falha
    recurso: string;                         // Tipo de recurso (ex: Aluguel)
    recursoId: string;                       // ID do recurso
    evento: any;                             // Evento original que falhou
    erro: string;                            // Descrição do erro
    rastreamentoErro?: string;               // Stack trace completo
    tentativasRetorno: number;               // Tentativas de retorno
    contexto?: {
        estadoAntes?: any;                   // Estado antes da falha
        estadoDepois?: any;                  // Estado esperado após falha
        usuarioId?: string;                  // Usuário relacionado
        metadados?: Record<string, any>;     // Dados contextuais
    };
    timestamp?: Date;                        // Momento da falha (preenchido automaticamente)
    idCorrelacao?: string;                   // ID para rastreamento distribuído
    prioridade?: 'baixa' | 'media' | 'alta'; // Nível de prioridade
}
```

### Fluxo de Funcionamento

```
Falha Crítica Detectada
        ↓
    Auditoria Criada
        ↓
   ServicoFilaMorta.enviar() Chamado
        ↓
  Mensagem Armazenada no Redis
        ↓
  Estatísticas Atualizadas
        ↓
  Notificação Enviada para Equipe
        ↓
  Investigação Manual via Admin API
        ↓
  Resolução Manual + Remoção da Fila
```

## 🔧 Configuração

### Redis Existente

A Fila Morta utiliza o Redis já configurado no BullModule:

```typescript
// src/shared/shared.module.ts
BullModule.forRoot({
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
    },
    // ... outras opções
})
```

### Injeção de Dependência

```typescript
// No serviço
constructor(
    @Inject('default') private readonly redis: Redis,
    private readonly auditoriaService: AuditoriaService,
    private readonly notificationService: NotificationService,
) {}
```

## 📡 API Administrativa

### Endpoints Disponíveis

```
GET    /admin/fila-morta/mensagens              # Lista todas as mensagens
GET    /admin/fila-morta/estatisticas           # Estatísticas da Fila Morta
GET    /admin/fila-morta/mensagens/:idMensagem  # Detalhes de uma mensagem
DELETE /admin/fila-morta/mensagens/:idMensagem  # Remove mensagem (após resolução)
POST   /admin/fila-morta/mensagens/:idMensagem/reprocessar  # Reprocessa mensagem
```

### Exemplo de Uso

```bash
# Listar mensagens na Fila Morta
curl -H "Authorization: Bearer <token-admin>" \
     http://localhost:3000/admin/fila-morta/mensagens

# Ver estatísticas
curl -H "Authorization: Bearer <token-admin>" \
     http://localhost:3000/admin/fila-morta/estatisticas

# Remover mensagem resolvida
curl -X DELETE \
     -H "Authorization: Bearer <token-admin>" \
     http://localhost:3000/admin/fila-morta/mensagens/123-abc-456
```

### Respostas

**Listar Mensagens:**
```json
{
  "sucesso": true,
  "dados": [
    {
      "id": "uuid-123",
      "modulo": "core",
      "recurso": "Aluguel",
      "recursoId": "aluguel-456",
      "erro": "Erro ao reverter aluguel",
      "prioridade": "alta",
      "timestamp": "2026-01-09T10:30:00Z"
    }
  ],
  "quantidade": 1
}
```

**Estatísticas:**
```json
{
  "sucesso": true,
  "dados": {
    "totalMensagens": 5,
    "mensagensProcessadas": 2,
    "mensagensPorModulo": {
      "core": 3,
      "item": 2
    },
    "mensagensPorPrioridade": {
      "alta": 4,
      "media": 1,
      "baixa": 0
    }
  }
}
```

## 🔍 Integração com Handlers

### Exemplo de Uso em Handler

```typescript
import { ServicoFilaMortaService } from 'src/shared/infra/services/servico-fila-morta.service';

@EventsHandler(FalhaNoBloqueioEvent)
export class CompensarAluguelQuandoBloqueioFalharHandler {
    constructor(
        private readonly servicoFilaMortaService: ServicoFilaMortaService,
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async handle(event: FalhaNoBloqueioEvent): Promise<void> {
        try {
            // Lógica de compensação
        } catch (error) {
            // Auditoria
            await this.auditoriaService.criar({
                // ...
            });

            // Enviar para Fila Morta (id e timestamp gerados automaticamente)
            await this.servicoFilaMortaService.enviar({
                modulo: 'core',
                recurso: 'Aluguel',
                recursoId: event.aluguelId,
                evento: event,
                erro: error.message,
                rastreamentoErro: error.stack,
                tentativasRetorno: 0,
                contexto: {
                    estadoAntes: { status: 'CONFIRMADO' },
                    estadoDepois: { status: 'DESCONHECIDO' },
                    metadados: {
                        sagaType: 'aluguel-bloqueio',
                        itemId: event.itemId,
                    },
                },
                idCorrelacao: `compensacao-${event.aluguelId}`,
                prioridade: 'alta',
            });
        }
    }
}
```

## 📊 Monitoramento e Alertas

### Armazenamento Redis

**Chaves utilizadas:**
- `fila-morta:mensagens` - Lista (LIFO) de mensagens na fila
- `fila-morta:processadas` - Lista de mensagens já processadas
- `fila-morta:stats` - Hash com estatísticas

### Métodos Disponíveis

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `enviar()` | `MensagemFilaMorta` | `Promise<string>` | Envia mensagem para fila e retorna ID |
| `obterMensagens()` | `limite?: number` | `Promise<MensagemFilaMorta[]>` | Recupera mensagens da fila |
| `removerMensagem()` | `idMensagem: string` | `Promise<boolean>` | Remove mensagem e move para processadas |
| `reprocessarMensagem()` | `idMensagem: string` | `Promise<boolean>` | Tenta reprocessar mensagem |
| `obterEstatisticas()` | - | `Promise<Stats>` | Retorna estatísticas da fila |

### Métricas Disponíveis

- **Total de mensagens**: Quantidade atual na Fila Morta
- **Mensagens processadas**: Quantidade resolvida/removida
- **Mensagens por módulo**: Distribuição por tipo de operação
- **Mensagens por prioridade**: Agrupamento por nível de criticidade

### Alertas Automáticos

Quando uma mensagem entra na Fila Morta:
1. Auditoria crítica é criada automaticamente
2. Notificação é enviada para equipe via `NotificationService`
3. Estatísticas são atualizadas no Redis
4. ID de correlação permite rastreamento distribuído

## 🔒 Segurança

- Acesso restrito apenas para usuários com role `admin`
- Logs detalhados de todas as operações
- Auditoria completa integrada
- Rastreamento via `idCorrelacao`

## 🚀 Próximos Passos

### Funcionalidades Planejadas

1. **Reprocessamento Inteligente**
   - Implementar retry automático com backoff exponencial
   - Configuração de máximo de tentativas por tipo de falha

2. **Dashboard Web**
   - Interface gráfica para gerenciamento
   - Filtros avançados e busca
   - Gráficos de tendências

3. **Integração com Ferramentas**
   - Webhooks Slack para notificações
   - Email para alertas críticos
   - Integração com sistemas de monitoramento (DataDog, New Relic)

4. **Análise de Padrões**
   - Detecção automática de falhas recorrentes
   - Sugestões de melhorias no código

5. **Limpeza Automática**
   - Implementar policy de retenção configurável
   - TTL automático para mensagens antigas

## 📝 Boas Práticas

1. **Sempre incluir `idCorrelacao`** para rastreamento distribuído
2. **Usar `metadados` ricos** para facilitar debugging
3. **Definir `prioridade` adequada** baseada no impacto
4. **Documentar procedimentos** de resolução para cada tipo de falha
5. **Monitorar regularmente** o tamanho da Fila Morta
6. **Resolver mensagens rapidamente** para manter consistência
7. **Incluir contexto completo** (estadoAntes, estadoDepois)

## 🐛 Troubleshooting

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| Redis indisponível | Conexão perdida | Verificar conexão e configuração do Redis |
| Mensagens não aparecem | Serviço não injetado | Verificar injeção de dependência no módulo |
| Notificações não chegam | Canal não configurado | Verificar configuração dos canais de alerta |
| Erro de permissões | Usuário sem role admin | Confirmar role `admin` do usuário |

### Logs Importantes

```
[ServicoFilaMorta] 🪦 Enviando mensagem para Fila Morta: core.Aluguel#123
[ServicoFilaMorta] ✅ Mensagem abc-123 enviada para Fila Morta com sucesso
[ServicoFilaMorta] ✅ Mensagem abc-123 removida da Fila Morta
[Notification] 🚨 ALERTA CRITICA: Fila Morta - Falha Crítica
[Auditoria] Ação: FILA_MORTA_ENFILEIRADA | Nível: CRITICO
```

## 📚 Referências

- **Redis Documentation**: https://redis.io/docs
- **NestJS Bull Module**: https://docs.nestjs.com/techniques/queues
- **SAGA Pattern**: https://microservices.io/patterns/data/saga.html
- **Dead Letter Queue Pattern**: https://www.enterpriseintegrationpatterns.com/patterns/messaging/DeadLetterChannel.html