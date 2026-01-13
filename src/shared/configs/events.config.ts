export const EVENT_CONFIG = {
    // Topics/Events do módulo Usuario
    USUARIO: {
        REGISTRADO: 'UsuarioRegistrado',
        EMAIL_VERIFICADO: 'EmailVerificado',
    },

    ITEM: {
        CRIADO: 'ItemCriado',
        MODERADO: 'ItemModerado',
    },

    PAGAMENTO: {
        APROVADO: 'PagamentoAprovado',
        RECUSADO: 'PagamentoRecusado',
        PENDING: 'PagamentoPending',
        CANCELADO: 'PagamentoCancelado',
    },

    // Configurações gerais
    GENERAL: {
        PUBLISH_TIMEOUT: 5000,

        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,

        // Dead Letter Queue
        DEAD_LETTER_QUEUE: {
            ENABLED: true,
            MAX_RETRIES_BEFORE_DLQ: 3,
            RETENTION_DAYS: 30,
            ALERT_CHANNELS: ['slack', 'email'],
            AUTO_RETRY_ENABLED: false, // Para futuro
        },
    },
} as const;

/**
 * Tipos de eventos suportados
 * Facilita validação e autocomplete
 */
export type TipoEvento =
    (typeof EVENT_CONFIG.USUARIO)[keyof typeof EVENT_CONFIG.USUARIO];

/**
 * Valida se um tipo de evento é suportado
 */
export function isTipoEventoValido(eventType: string): eventType is TipoEvento {
    return Object.values(EVENT_CONFIG.USUARIO).includes(
        eventType as TipoEvento,
    );
}
