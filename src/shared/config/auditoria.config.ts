import { ACOES_COMPLIANCE } from '../constants/auditoria-actions';
export const AuditoriaConfig = {
    /**
     * Período de retenção de logs (em meses)
     * Após este período, os logs serão arquivados ou deletados
     */
    retencao: {
        // Logs operacionais (baixo/médio)
        operacional: 12, // 1 ano

        // Logs críticos (alto/crítico)
        critico: 24, // 2 anos

        // Logs de compliance (sempre manter ou apenas arquivar)
        compliance: 84, // 7 anos (LGPD, SOX)
    },

    /**
     * Ações consideradas de compliance (não podem ser deletadas)
     */
    acoesCompliance: ACOES_COMPLIANCE,

    /**
     * Configuração do job de limpeza
     */
    job: {
        // Executar no 1º dia de cada mês às 2h da manhã
        cronExpression: '0 2 1 * *',

        // Processar em lotes para evitar lock
        batchSize: 1000,

        // Habilitado por padrão
        enabled: true,
    },

    /**
     * Configuração de arquivamento
     */
    arquivamento: {
        // Habilitar arquivamento antes de deletar
        enabled: true,

        // Diretório local (ou configurar S3/Azure Blob)
        localPath: './arquivos/auditoria',

        // Formato de arquivamento
        formato: 'jsonl', // JSON Lines (um JSON por linha)

        // Comprimir arquivos
        compressao: true, // gzip
    },

    /**
     * Notificações
     */
    notificacoes: {
        // Email para logs críticos
        emailAdmin: process.env.ADMIN_EMAIL,

        // Slack webhook (opcional)
        slackWebhook: process.env.SLACK_WEBHOOK_URL,
    },

    /**
     * Performance
     */
    performance: {
        // Usar processamento assíncrono
        async: true,

        // Tamanho do batch para inserções
        insertBatchSize: 100,

        // Timeout para queries (ms)
        queryTimeout: 5000,
    },
};
