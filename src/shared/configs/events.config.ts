export const EVENT_CONFIG = {
    // Topics/Events do módulo Usuario
    USUARIO: {
        REGISTRADO: 'UsuarioRegistrado',
        EMAIL_VERIFICADO: 'EmailVerificado',
    },

    // Configurações gerais
    GENERAL: {
        PUBLISH_TIMEOUT: 5000,

        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,

        // Dead letter queue (para futuro uso com Kafka)
        DEAD_LETTER_TOPIC: 'events.dead-letter',
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
