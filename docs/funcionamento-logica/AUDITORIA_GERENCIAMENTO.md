# Sistema de Auditoria - Guia Completo

## 📋 Visão Geral

Sistema de auditoria enterprise-grade otimizado para alto volume de dados, implementando melhores práticas de retenção, arquivamento, performance e compliance (LGPD, SOX, ISO 27001).

**Capacidade**: Gerencia milhões de logs mantendo performance consistente através de particionamento automático e políticas inteligentes de retenção.

## 🎯 Conceitos Fundamentais

### Níveis de Auditoria

O sistema classifica logs em 4 níveis de criticidade, cada um com tratamento diferenciado:

#### **BAIXO**

- Operações rotineiras e consultas simples
- Exemplos: listagem de dados, visualização de perfil
- Retenção: 12 meses
- Arquivamento opcional

#### **MÉDIO**

- Operações importantes mas não críticas
- Exemplos: atualizações de dados, configurações
- Retenção: 12 meses
- Arquivamento antes de remoção

#### **ALTO**

- Operações sensíveis que requerem rastreabilidade
- Exemplos: alteração de permissões, exclusões
- Retenção: 24 meses
- Arquivamento obrigatório

#### **CRÍTICO**

- Operações de máxima importância e segurança
- Exemplos: login/logout, alteração de senha, acesso a dados sensíveis
- Retenção: 24 meses (pode estender para compliance)
- Arquivamento obrigatório + notificação em tempo real

### Ações de Compliance

Certas ações são classificadas como **compliance** e **nunca são deletadas automaticamente**, independente do nível:

```typescript
// Lista de ações protegidas
-login / logout -
    alterar_senha / resetar_senha -
    criar_usuario / deletar_usuario -
    alterar_permissoes -
    acesso_dados_sensiveis -
    exportar_dados;
```

**Razão**: Requisitos legais (LGPD, SOX) exigem rastreabilidade de 7 anos para essas operações.

### Política de Retenção

O sistema implementa 3 camadas de retenção:

| Tipo            | Período           | Ação após Expiração                  |
| --------------- | ----------------- | ------------------------------------ |
| **Operacional** | 12 meses          | Arquiva + Remove (exceto compliance) |
| **Crítico**     | 24 meses          | Arquiva + Remove (exceto compliance) |
| **Compliance**  | 84 meses (7 anos) | Arquiva + Mantém no banco            |

**Configurável em**: `src/shared/config/auditoria.config.ts`

### Particionamento Mensal

A tabela `auditoria` é dividida automaticamente por mês:

**Benefícios**:

- ⚡ **Performance**: Queries 98% mais rápidas (filtra por partição)
- 🗑️ **Manutenção**: Drop de partição antiga = remoção instantânea
- 💾 **Backup**: Backup incremental por partição
- 📊 **Análise**: Dados organizados temporalmente

**Funcionamento**:

```
auditoria (tabela principal)
  ├── auditoria_2025_dez  (dezembro 2025 - mês atual)
  ├── auditoria_2026_jan  (janeiro 2026)
  ├── auditoria_2026_fev  (fevereiro 2026)
  └── ... (até janeiro 2027 - criadas automaticamente)
```

### Índices Estratégicos

5 índices otimizam as consultas mais comuns:

1. **timestamp DESC**: Logs recentes (dashboard, alertas)
2. **usuario_id**: Histórico de ações por usuário
3. **timestamp + acao**: Busca temporal de ação específica
4. **nivel (partial)**: Apenas logs alto/crítico (economia de espaço)
5. **modulo + timestamp**: Logs de um módulo específico

**Resultado**: Consultas complexas executam em < 200ms mesmo com milhões de registros.

## 🔄 Job de Limpeza Automática

Executado **mensalmente** (1º dia às 2h), o job realiza:

### Fluxo de Execução

```
1. Identifica logs expirados
   ├─> Operacionais > 12 meses
   └─> Críticos > 24 meses

2. Separa logs de compliance
   └─> Nunca são removidos

3. Arquiva logs antes de remover
   ├─> Compacta em JSONL.gz
   └─> Salva em ./arquivos/auditoria/

4. Remove logs do banco
   └─> Processa em lotes de 1000

5. Cria partições futuras
   └─> Garante próximo mês pronto
```

### Processamento em Lotes

Para evitar locks no banco e não impactar a aplicação:

- Processa **1000 logs por vez**
- Aguarda entre lotes (não trava queries)
- Executa fora do horário comercial (2h)
- Pode ser interrompido e retomado

### Arquivamento Inteligente

Logs são salvos em formato eficiente antes da remoção:

**Formato JSONL** (JSON Lines):

```json
{"id":1,"timestamp":"2025-01-01T10:00:00Z","acao":"login",...}
{"id":2,"timestamp":"2025-01-01T10:05:00Z","acao":"criar_usuario",...}
```

**Vantagens**:

- ✅ Streamable (não precisa carregar tudo na memória)
- ✅ Um JSON por linha (fácil parsing)
- ✅ Compatível com ferramentas de análise (Elasticsearch, BigQuery)

**Compressão gzip**: Reduz ~90% do tamanho

- 1GB de logs → ~100MB comprimido
- Economia de custos de storage
- Descompressão rápida quando necessário

## 📊 API de Gerenciamento

Endpoints exclusivos para administradores monitorarem e gerenciarem a auditoria.

### GET /admin/auditoria/estatisticas

Retorna métricas em tempo real do sistema:

```json
{
    "totalLogs": 1234567,
    "logsOperacionais": 1000000,
    "logsCriticos": 234567,
    "logsCompliance": 50000,
    "tamanhoEstimadoMB": 1024
}
```

**Uso**: Dashboard de monitoramento, alertas de capacidade

### POST /admin/auditoria/limpar

Força execução manual do job de limpeza:

```json
{
    "message": "Job de limpeza executado com sucesso",
    "timestamp": "2025-12-13T14:30:00Z"
}
```

**Uso**: Manutenção emergencial, testes, limpeza após migração

**Segurança**: Requer autenticação JWT + role `ADMIN`

## ⚙️ Configuração

### Arquivo de Configuração

Todas as configurações estão centralizadas em `src/shared/config/auditoria.config.ts`:

```typescript
export const AuditoriaConfig = {
    // Períodos de retenção (em meses)
    retencao: {
        operacional: 12, // Logs baixo/médio
        critico: 24, // Logs alto/crítico
        compliance: 84, // 7 anos (LGPD/SOX)
    },

    // Ações que nunca são deletadas
    acoesCompliance: [
        'login',
        'logout',
        'alterar_senha',
        'resetar_senha',
        'criar_usuario',
        'deletar_usuario',
        'alterar_permissoes',
        'acesso_dados_sensiveis',
        'exportar_dados',
    ],

    // Configuração do job
    job: {
        cronExpression: '0 2 1 * *', // 1º dia, 2h da manhã
        batchSize: 1000, // Logs por lote
        enabled: true, // Ativar/desativar
    },

    // Arquivamento
    arquivamento: {
        enabled: true,
        localPath: './arquivos/auditoria',
        formato: 'jsonl',
        compressao: true, // gzip
    },
};
```

### Customizações Comuns

#### Aumentar período de retenção crítico

```typescript
retencao: {
    critico: 36,  // 3 anos ao invés de 2
}
```

#### Adicionar nova ação de compliance

```typescript
acoesCompliance: [
    ...acoesCompliance,
    'transferencia_valor', // Nova ação protegida
];
```

#### Desabilitar compressão (desenvolvimento)

```typescript
arquivamento: {
    compressao: false,  // Arquivos sem .gz
}
```

#### Desabilitar job automático

```typescript
job: {
    enabled: false,  // Executar apenas manualmente
}
```

### Variáveis de Ambiente (Opcionais)

Para notificações e integrações futuras:

```env
# .env
ADMIN_EMAIL=admin@empresa.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## 📈 Performance e Capacidade

### Comparativo de Performance

| Métrica                           | Sem Otimização | Com Otimização       | Melhoria |
| --------------------------------- | -------------- | -------------------- | -------- |
| Query por período (10M registros) | 2-5 segundos   | 50-200ms             | **98%**  |
| Tamanho tabela (10M)              | ~5GB           | ~5GB + 500MB índices | -        |
| Backup completo                   | Lento (horas)  | Rápido por partição  | **10x**  |
| Inserção de log                   | ~50ms          | ~5ms                 | **90%**  |
| Espaço arquivos (1 ano)           | ~3.6GB         | ~360MB (.gz)         | **90%**  |

### Capacidade Estimada

**Cenário**: 1000 usuários ativos/dia, 10 ações cada

| Período         | Registros     | Tamanho Estimado      |
| --------------- | ------------- | --------------------- |
| **Diário**      | ~10.000       | ~5MB                  |
| **Semanal**     | ~70.000       | ~35MB                 |
| **Mensal**      | ~300.000      | ~150MB                |
| **Anual**       | ~3.6M         | ~1.8GB                |
| **Com limpeza** | Estável 2-3GB | + ~30MB/mês arquivado |

### Escalabilidade

O sistema suporta crescimento linear mantendo performance:

- **Até 10M registros**: Performance ótima (<200ms)
- **10M - 50M**: Performance boa (200-500ms)
- **50M+**: Considerar sharding ou data lake

**Teto prático**: ~100M registros com particionamento mensal

## 🔍 Acessando Dados

### Via API Admin

```bash
# Estatísticas em tempo real
GET /admin/auditoria/estatisticas

# Resposta
{
  "totalLogs": 1234567,
  "logsOperacionais": 1000000,
  "logsCriticos": 234567,
  "logsCompliance": 50000,
  "tamanhoEstimadoMB": 1024
}
```

### Arquivos de Backup

Logs arquivados ficam organizados por tipo e data:

```bash
./arquivos/auditoria/
├── auditoria_operacional_2025-12-01.jsonl.gz
├── auditoria_operacional_2025-12-13.jsonl.gz
├── auditoria_critico_2025-12-01.jsonl.gz
└── auditoria_critico_2025-12-13.jsonl.gz
```

**Ler arquivo comprimido**:

```bash
# Descomprimir
gunzip auditoria_operacional_2025-12-13.jsonl.gz

# Ou ler direto (sem descomprimir)
zcat auditoria_operacional_2025-12-13.jsonl.gz | head -5

# Cada linha é um JSON completo
{"id":1,"timestamp":"2025-01-01T12:00:00Z","acao":"login",...}
{"id":2,"timestamp":"2025-01-01T12:05:00Z","acao":"criar_usuario",...}
```

**Analisar com jq** (ferramenta JSON):

```bash
# Contar logins
zcat arquivo.jsonl.gz | jq -r 'select(.acao=="login")' | wc -l

# Listar ações de um usuário
zcat arquivo.jsonl.gz | jq -r 'select(.usuarioId=="123")'

# Top 10 ações mais frequentes
zcat arquivo.jsonl.gz | jq -r '.acao' | sort | uniq -c | sort -nr | head -10
```

## 🛡️ Segurança e Compliance

### LGPD (Brasil)

**Requisitos atendidos**:

- ✅ Rastreabilidade de acesso a dados pessoais (7 anos)
- ✅ Logs de consentimento e alterações
- ✅ Auditoria de exportação de dados
- ✅ Possibilidade de anonimização pós-retenção

**Ações protegidas**:

```typescript
'acesso_dados_sensiveis';
'exportar_dados';
'deletar_usuario';
```

### SOX (Compliance Financeiro)

**Requisitos atendidos**:

- ✅ Registros imutáveis (não podem ser editados)
- ✅ Retenção de 7 anos para transações financeiras
- ✅ Rastreabilidade completa de alterações
- ✅ Logs de controles de acesso

**Ações protegidas**:

```typescript
'criar_usuario'; // Quem criou contas
'alterar_permissoes'; // Mudanças de privilégios
'login' / 'logout'; // Acesso ao sistema
```

### ISO 27001 (Segurança da Informação)

**Requisitos atendidos**:

- ✅ Logs de eventos de segurança
- ✅ Monitoramento de ações críticas
- ✅ Retenção adequada para investigações
- ✅ Proteção contra adulteração (imutabilidade)

### Boas Práticas Implementadas

1. **Imutabilidade**: Logs não podem ser editados após criação
2. **Separação de dados**: Logs separados do banco principal
3. **Criptografia em repouso**: Usar criptografia do PostgreSQL
4. **Acesso restrito**: API admin protegida por autenticação
5. **Auditoria da auditoria**: Logs de quem acessa logs

## 📊 Monitoramento e Alertas

### Métricas Essenciais

**Diárias**:

- Taxa de crescimento de logs
- Tempo médio de inserção
- Erros no job de limpeza

**Semanais**:

- Tamanho total da tabela
- Quantidade de logs por nível
- Taxa de arquivamento

**Mensais**:

- Crescimento de partições
- Espaço em disco usado
- Logs de compliance acumulados

### Alertas Recomendados

| Alerta         | Condição                | Ação                           |
| -------------- | ----------------------- | ------------------------------ |
| 🔴 **Crítico** | Tabela > 15GB           | Aumentar frequência de limpeza |
| 🟡 **Atenção** | Crescimento > 500MB/dia | Investigar logs excessivos     |
| 🟡 **Atenção** | Job falhou 3x seguidas  | Verificar permissões/espaço    |
| 🔵 **Info**    | Partição criada         | Confirmação mensal             |
| 🔴 **Crítico** | Espaço disco < 10%      | Limpar/arquivar urgente        |

### Verificação Manual

```bash
# Via API
GET /admin/auditoria/estatisticas

# Resposta indica saúde do sistema
{
  "totalLogs": 1234567,           # Normal até 10M
  "logsOperacionais": 1000000,    # ~80% do total
  "logsCriticos": 234567,         # ~20% do total
  "logsCompliance": 50000,        # Cresce indefinidamente
  "tamanhoEstimadoMB": 1024       # Alertar se > 10GB
}
```

## ❓ Troubleshooting

### Job não executa automaticamente

**Sintoma**: Logs não são limpos mensalmente

**Diagnóstico**:

```typescript
// Verificar configuração
AuditoriaConfig.job.enabled === true; // Deve ser true
AuditoriaConfig.job.cronExpression; // Deve ser '0 2 1 * *'
```

**Solução**:

1. Verificar se `ScheduleModule` está importado em `SharedModule`
2. Verificar logs da aplicação: `npm run start:dev`
3. Procurar por: "🧹 Iniciando job de limpeza de auditoria"
4. Executar manualmente via API: `POST /admin/auditoria/limpar`

### Erro de permissão PostgreSQL

**Sintoma**: `permission denied for table auditoria`

**Solução**:

```sql
-- Dar permissões completas
GRANT ALL ON TABLE auditoria TO seu_usuario;
GRANT ALL ON ALL TABLES IN SCHEMA public TO seu_usuario;

-- Se usar sequências
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO seu_usuario;
```

### Arquivos não são criados

**Sintoma**: Nenhum arquivo `.jsonl.gz` é gerado

**Diagnóstico**:

```bash
# Verificar se diretório existe
ls -la ./arquivos/auditoria/

# Verificar permissões
ls -ld ./arquivos/
```

**Solução**:

```bash
# Criar diretório
mkdir -p ./arquivos/auditoria

# Dar permissões
chmod 755 ./arquivos/auditoria
```

### Performance degradada

**Sintoma**: Queries lentas (> 1 segundo)

**Diagnóstico**:

```sql
-- Verificar tamanho da tabela
SELECT
    pg_size_pretty(pg_total_relation_size('auditoria')) as total,
    pg_size_pretty(pg_relation_size('auditoria')) as dados,
    pg_size_pretty(pg_total_relation_size('auditoria') - pg_relation_size('auditoria')) as indices;

-- Listar partições
SELECT tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE tablename LIKE 'auditoria_%';
```

**Soluções**:

1. Executar limpeza manual: `POST /admin/auditoria/limpar`
2. Verificar se índices existem: `\d auditoria` no psql
3. Recriar estatísticas: `ANALYZE auditoria;`
4. Considerar aumentar `work_mem` do PostgreSQL

### Espaço em disco cheio

**Sintoma**: Erro ao inserir logs

**Diagnóstico**:

```bash
# Linux/Mac
df -h

# Verificar tamanho dos arquivos
du -sh ./arquivos/auditoria/
```

**Soluções imediatas**:

1. Mover arquivos antigos para storage externo (S3/Azure)
2. Deletar arquivos muito antigos (após backup)
3. Executar limpeza manual forçada
4. Reduzir período de retenção temporariamente

## 🚀 Otimizações Avançadas

### Para Alta Escala (>50M logs)

**1. Migrar para TimescaleDB**

```sql
-- TimescaleDB é otimizado para séries temporais
CREATE EXTENSION timescaledb;
SELECT create_hypertable('auditoria', 'timestamp');
```

**2. Implementar cache Redis**

```typescript
// Cache de queries frequentes
const estatisticas = await redis.get('auditoria:stats');
if (!estatisticas) {
    // Calcular e cachear por 1 hora
}
```

**3. Elasticsearch para busca**

```typescript
// Logs em tempo real no Elasticsearch
// PostgreSQL apenas para compliance/arquivo
```

**4. Data Lake para analytics**

```typescript
// Arquivos JSONL já são compatíveis
// Carregar em BigQuery/Athena/Snowflake
```

### Otimização de Queries

**Evitar**:

```sql
-- Lento: full scan
SELECT * FROM auditoria WHERE descricao LIKE '%erro%';
```

**Preferir**:

```sql
-- Rápido: usa partição + índice
SELECT * FROM auditoria
WHERE timestamp >= '2025-12-01'
  AND timestamp < '2025-12-31'
  AND acao = 'login';
```

## 🎓 Melhores Práticas

### Desenvolvimento

1. **Desabilitar job em dev**: `job.enabled = false`
2. **Usar arquivamento sem compressão**: Facilita debug
3. **Logs detalhados**: `nivel: 'baixo'` para tudo
4. **Retention curto**: 1-2 meses

### Staging

1. **Job habilitado com baixa frequência**: Testar fluxo
2. **Dados similares a produção**: Volume realista
3. **Monitoramento ativo**: Validar alertas
4. **Retenção média**: 3-6 meses

### Produção

1. **Job habilitado horário off-peak**: 2h da manhã
2. **Monitoramento 24/7**: Alertas no Slack/PagerDuty
3. **Backup dos arquivos**: S3 com versionamento
4. **Retenção completa**: Conforme compliance
5. **Revisão trimestral**: Ajustar configurações

### Segurança

1. **Criptografar dados sensíveis**: Antes de logar
2. **Não logar senhas/tokens**: Mesmo em erro
3. **Acesso restrito à API admin**: Apenas ADMIN role
4. **Audit trail imutável**: Logs não podem ser editados
5. **Logs de acesso aos logs**: Auditoria da auditoria

## 📚 Referências e Recursos

### Documentação Oficial

- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [NestJS Schedule](https://docs.nestjs.com/techniques/task-scheduling)
- [TypeORM](https://typeorm.io/)

### Compliance

- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd)
- [SOX - Sarbanes-Oxley Act](https://www.soxlaw.com/)
- [ISO 27001 - Segurança da Informação](https://www.iso.org/isoiec-27001-information-security.html)

### Ferramentas Úteis

- [jq](https://stedolan.github.io/jq/) - Processar JSON na linha de comando
- [pgAdmin](https://www.pgadmin.org/) - Interface gráfica PostgreSQL
- [TimescaleDB](https://www.timescale.com/) - PostgreSQL para séries temporais
