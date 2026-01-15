import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import {
    AuditoriaService,
    type LogAuditoria,
} from '../services/auditoria.service';
import { DeadLetterQueueService } from '../services/dead-letter-queue.service';

export interface AuditoriaFilaJob extends LogAuditoria {
    tentativa?: number;
}

@Processor('auditoria')
@Injectable()
export class AuditoriaFilaProcessor {
    private readonly logger = new Logger(AuditoriaFilaProcessor.name);

    constructor(
        private readonly auditoriaService: AuditoriaService,
        private readonly deadLetterQueueService: DeadLetterQueueService,
    ) {}

    @Process('registrar-auditoria')
    async processarAuditoria(job: Job<AuditoriaFilaJob>): Promise<void> {
        const { tentativa = 0, ...logAuditoria } = job.data;

        try {
            this.logger.debug(
                `🔄 Processando auditoria: ${logAuditoria.acao} (Tentativa: ${tentativa + 1}/${job.attemptsMade})`,
            );

            // Cria a auditoria diretamente no repositório, não dispara a fila novamente
            await this.auditoriaService.criar(logAuditoria);

            this.logger.log(
                `✅ Auditoria registrada com sucesso: ${logAuditoria.acao}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao processar auditoria (tentativa ${tentativa + 1}): ${error.message}`,
                error.stack,
            );

            // Se foi a última tentativa, envia para Dead Letter Queue
            if (job.attemptsMade >= job.opts.attempts!) {
                await this.deadLetterQueueService.enviar({
                    modulo: 'auditoria',
                    recurso: logAuditoria.recurso,
                    recursoId: logAuditoria.recursoId || '',
                    evento: job.data,
                    erro: error.message,
                    rastreamentoErro: error.stack,
                    tentativasRetorno: job.attemptsMade,
                    contexto: {
                        usuarioId: logAuditoria.usuarioId,
                        metadados: {
                            acao: logAuditoria.acao,
                            nivel: logAuditoria.nivel,
                        },
                    },
                    prioridade: 'alta',
                });

                this.logger.error(
                    `🚨 Auditoria enviada para Dead Letter Queue após ${job.attemptsMade} tentativas: ${logAuditoria.acao}`,
                );
            }

            throw error;
        }
    }
}
