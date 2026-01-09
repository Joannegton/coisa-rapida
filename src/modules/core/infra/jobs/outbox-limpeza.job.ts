import { Cron } from '@nestjs/schedule';
import { OutboxRepository } from '../repositories/outbox.repository';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { LoggerService } from '@nestjs/common';

export class OutboxEventLimpezaJob {
    constructor(
        private readonly outboxRepository: OutboxRepository,
        private readonly auditoriaService: AuditoriaService,
        private readonly logger: LoggerService,
    ) {}

    @Cron('0 3 * * *')
    async limparEventosAntigos(): Promise<void> {
        try {
            await this.outboxRepository.limparEventosAntigos(30);
        } catch (error) {
            this.logger.error(
                `❌ Erro ao limpar eventos antigos: ${error.message}`,
            );

            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: 'core',
                acao: 'LIMPEZA_OUTBOX_FALHA',
                recurso: 'OutboxEvent',
                descricao: `Falha na limpeza automática de eventos antigos: ${error.message}`,
                nivel: 'medio',
                erro: error.message,
                timestamp: new Date(),
            });
        }
    }
}
