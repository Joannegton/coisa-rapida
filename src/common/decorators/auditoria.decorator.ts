import { SetMetadata } from '@nestjs/common';
import { AuditoriaAcao } from '../../shared/constants/auditoria-actions';

export const AUDITORIA_KEY = 'auditoria';

export interface MetadadosAuditoria {
    acao: string; // Ex: 'criar_aluguel', 'confirmar_devolucao', 'aprovar_comprovante'
    recurso: string; // Ex: 'aluguel', 'usuario', 'comprovante'
    descricao?: string;
    nivel?: 'baixo' | 'medio' | 'alto' | 'critico';
}

/**
 * Decorator para auditar ações no sistema (logging técnico).
 *
 * ⚠️ DDD: Este decorator apenas REGISTRA que a ação foi executada.
 * Para rastrear mudanças de entidades, use Domain Events no Domain Layer.
 *
 * @example
 * ```typescript
 * @Auditar('criar_aluguel', 'aluguel', {
 *   descricao: 'Usuário criou novo aluguel',
 *   nivel: 'medio'
 * })
 * @Post()
 * criar(@UsuarioAtual() usuario: any, @Body() dto: CriarAluguelDto) {
 *   // Ação será auditada automaticamente
 * }
 * ```
 */
export const Auditar = (
    acao: string,
    recurso: string,
    opcoes?: Partial<Omit<MetadadosAuditoria, 'acao' | 'recurso'>>,
) =>
    SetMetadata(AUDITORIA_KEY, {
        acao,
        recurso,
        nivel: opcoes?.nivel || 'medio',
        descricao: opcoes?.descricao,
    } as MetadadosAuditoria);

export const AuditarEnvioSms = () =>
    Auditar(AuditoriaAcao.ENVIAR_CODIGO_SMS, 'verificacao_sms', {
        descricao: 'Envio de código SMS',
        nivel: 'medio',
    });

export const AuditarVerificacaoSms = () =>
    Auditar(AuditoriaAcao.VERIFICAR_CODIGO_SMS, 'verificacao_sms', {
        descricao: 'Verificação de código SMS',
        nivel: 'medio',
    });

export const AuditarAlteracaoEndereco = () =>
    Auditar(AuditoriaAcao.ALTERAR_ENDERECO, 'alteracao_endereco', {
        descricao:
            'Alterar endereço, revogar comprovante de residência e permissoes',
        nivel: 'medio',
    });

export const AuditarCriacaoItem = () =>
    Auditar(AuditoriaAcao.CRIAR_ITEM, 'item', {
        descricao: 'Criação de novo item',
        nivel: 'medio',
    });
