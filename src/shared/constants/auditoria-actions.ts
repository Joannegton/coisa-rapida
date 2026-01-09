/**
 * Enumeração de ações de auditoria para padronização
 * Centraliza todas as ações possíveis para evitar erros de digitação
 * e facilitar manutenção (mudanças em um lugar só)
 */
export enum AuditoriaAcao {
    // Autenticação e Registro
    REGISTRAR_USUARIO = 'registrar_usuario',
    LOGIN = 'login',
    RESETAR_SENHA = 'resetar_senha',
    SOLICITAR_RECUPERACAO_SENHA = 'solicitar_recuperacao_senha',
    VALIDAR_CODIGO_RECUPERACAO = 'validar_codigo_recuperacao',

    // Verificação
    ENVIAR_CODIGO_SMS = 'enviar_codigo_sms',
    VERIFICAR_CODIGO_SMS = 'verificar_codigo_sms',
    VERIFICAR_LINK_EMAIL = 'verificar_link_email',

    // Itens
    CRIAR_ITEM = 'criar_item',
    ATUALIZAR_ITEM = 'atualizar_item',
    DELETAR_ITEM = 'deletar_item',
    MODERAR_ITEM = 'moderar_item',

    // Segurança
    LIMITE_EXCEDIDO = 'limite_excedido',
    ARQUIVO_INFECTADO_DETECTADO = 'arquivo_infectado_detectado',

    // Usuário
    ALTERAR_ENDERECO = 'alterar_endereco',

    // Aluguéis
    SOLICITAR_ALUGUEL = 'solicitar_aluguel',

    // SAGA (Coreografada)
    EVENTO_FALHA_PUBLICACAO = 'evento_falha_publicacao',
    EVENTO_FALHA_DEFINITIVA = 'evento_falha_definitiva',
    COMPENSACAO_EXECUTADA = 'compensacao_executada',
    COMPENSACAO_FALHA = 'compensacao_falha',

    // Dead Letter Queue
    DDEAD_LETTER_QUEUE_ENVIADA = 'dead_letter_queue_enviada',
}

/**
 * Ações consideradas de compliance (não podem ser deletadas automaticamente)
 * Referenciam o enum para manter consistência
 */
export const ACOES_COMPLIANCE = [
    AuditoriaAcao.REGISTRAR_USUARIO,
    AuditoriaAcao.LOGIN,
    AuditoriaAcao.RESETAR_SENHA,
    AuditoriaAcao.SOLICITAR_RECUPERACAO_SENHA,
    AuditoriaAcao.VALIDAR_CODIGO_RECUPERACAO,
    AuditoriaAcao.ALTERAR_ENDERECO,
] as const;
