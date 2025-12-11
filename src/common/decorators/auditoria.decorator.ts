import { SetMetadata } from '@nestjs/common';

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

/**
 * Decorator específico para auditar ações críticas
 */
export const AuditarCritico = (
    acao: string,
    recurso: string,
    descricao?: string,
) =>
    Auditar(acao, recurso, {
        nivel: 'critico',
        descricao,
    });

/**
 * Decorator para ações financeiras (sempre críticas)
 */
export const AuditarFinanceiro = (acao: string, descricao?: string) =>
    AuditarCritico(acao, 'financeiro', descricao || 'Transação financeira');

/**
 * Decorator para ações de moderação
 */
export const AuditarModeracao = (acao: string, descricao?: string) =>
    Auditar(acao, 'moderacao', {
        nivel: 'alto',
        descricao: descricao || 'Ação de moderação',
    });
