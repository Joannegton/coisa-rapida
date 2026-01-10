import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import type { LogAuditoria } from './auditoria.service';

export interface AuditoriaFilaJob extends LogAuditoria {
    tentativa?: number;
}

@Injectable()
export class AuditoriaFilaService {
    private readonly logger = new Logger(AuditoriaFilaService.name);

    constructor(
        @InjectQueue('auditoria')
        private readonly auditoriaQueue: Queue<AuditoriaFilaJob>,
    ) {}

    async agendarAuditoria(log: LogAuditoria): Promise<void> {
        try {
            await this.auditoriaQueue.add(
                'registrar-auditoria',
                {
                    ...log,
                    tentativa: 0,
                },
                {
                    priority: log.nivel === 'critico' ? 1 : 3,
                    attempts: 10,
                    backoff: {
                        type: 'exponential',
                        delay: 3000,
                    },
                    removeOnComplete: true,
                    removeOnFail: false,
                },
            );

            this.logger.log(
                `✅ Auditoria agendada: ${log.acao} (Recurso: ${log.recurso}/${log.recursoId})`,
            );
        } catch (error) {
            this.logger.error(
                `❌ Erro ao agendar auditoria: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }
}
