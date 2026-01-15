import { Injectable, Logger } from '@nestjs/common';
import { AuditoriaRepository } from '../repositories/auditoria.repository';

export interface LogAuditoria {
    id?: number;
    timestamp: Date;
    usuarioId: string;
    usuarioEmail?: string;
    modulo?: string;
    acao: string;
    recurso: string;
    recursoId?: string;
    descricao?: string;
    nivel: 'baixo' | 'medio' | 'alto' | 'critico';
    metodo?: string;
    rota?: string;
    ip?: string;
    userAgent?: string;
    statusCode?: number;
    duracaoMs?: number;
    erro?: string;
    estadoAntes?: any;
    estadoDepois?: any;
    mudancas?: Array<{
        campo: string;
        valorAntes: any;
        valorDepois: any;
    }>;
}

@Injectable()
export class AuditoriaService {
    private readonly logger = new Logger(AuditoriaService.name);

    constructor(private readonly auditoriaRepo: AuditoriaRepository) {}

    /**
     * Cria um novo log de auditoria
     */
    async criar(log: LogAuditoria): Promise<void> {
        try {
            await this.auditoriaRepo.criar(log);

            if (log.nivel === 'critico') {
                await this.notificarLogCritico(log);
            }
        } catch (error_) {
            this.logger.error(
                `Erro ao criar log de auditoria: ${error_.message}`,
                error_.stack,
            );
        }
    }

    /**
     * Obtém estatísticas de auditoria
     */
    async obterEstatisticas(filtros?: {
        usuarioId?: string;
        dataInicio?: Date;
        dataFim?: Date;
    }): Promise<{
        totalLogs: number;
        porNivel: Record<string, number>;
        porAcao: Record<string, number>;
        porRecurso: Record<string, number>;
    }> {
        // TODO: Implementar estatísticas
        return {
            totalLogs: 0,
            porNivel: {},
            porAcao: {},
            porRecurso: {},
        };
    }

    /**
     * Notifica sobre log crítico (email, Slack, etc)
     */
    private async notificarLogCritico(log: LogAuditoria): Promise<void> {
        // TODO: Implementar notificação
        // - Email para admins
        // - Mensagem no Slack
        // - Push notification

        this.logger.warn(`🚨 LOG CRÍTICO: ${log.acao} por ${log.usuarioEmail}`);
    }

    /**
     * Exporta logs para arquivo (compliance, backup)
     */
    async exportar(filtros: {
        dataInicio: Date;
        dataFim: Date;
        formato?: 'json' | 'csv';
    }): Promise<string> {
        // TODO: Implementar exportação
        return '';
    }
}
