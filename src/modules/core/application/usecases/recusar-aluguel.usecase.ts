import {
    BadRequestException,
    Inject,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelRecusadoEvent } from '../../domain/events/aluguel-recusado.event';
import { OutboxEvent } from '../../domain/outbox-event';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils } from 'src/shared/utils';
import { Request } from 'express';
import { RecusarAluguelDto } from '../dtos/recusar-aluguel.dto';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';

type RecusarAluguelUseCaseProps = RecusarAluguelDto & {
    aluguelId: string;
    usuarioId: string;
    request: Request;
};

/**
 * Recusa uma solicitação de aluguel pelo proprietário/anunciante.
 *
 * Regras de negócio:
 * - Só pode ser recusado pelo dono do item (locador)
 * - Status deve ser PENDENTE/SOLICITADO
 * - Motivo é obrigatório
 */
export class RecusarAluguelUseCase {
    private readonly logger = new Logger(RecusarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('UnitOfWork')
        private readonly unitOfWork: UnitOfWork,
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: RecusarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.recusar(props.motivo, props.usuarioId);

        const evento = new AluguelRecusadoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
            props.motivo,
        );

        try {
            await this.unitOfWork.executarEmTransacao(async (context) => {
                await context.salvarAluguel(aluguel);

                const outboxEvent = OutboxEvent.criar({
                    tipoEvento: evento.eventType,
                    idAgregado: evento.aggregateId,
                    tipoAgregado: 'Aluguel',
                    payload: {
                        eventId: evento.eventId,
                        aluguelId: evento.aluguelId,
                        itemId: evento.itemId,
                        dataInicio: evento.dataInicio.toISOString(),
                        dataFim: evento.dataFim.toISOString(),
                        motivoRecusa: evento.motivoRecusa,
                        occurredOn: evento.occurredOn.toISOString(),
                    },
                });

                await context.salvarEvento(outboxEvent);
            });
        } catch (error) {
            this.logger.error(
                `❌ Falha crítica ao recusar aluguel ${props.aluguelId}: ${error.message}`,
                error.stack,
            );
            throw new BadRequestException(
                'Não foi possível recusar a solicitação. Tente novamente.',
            );
        }

        try {
            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: DataUtils.agoraDate(),
                usuarioId: props.usuarioId,
                acao: AuditoriaAcao.RECUSAR_ALUGUEL,
                recurso: 'aluguel',
                recursoId: props.aluguelId,
                descricao: `Recusa de solicitação de aluguel pelo proprietário - Motivo: ${props.motivo}`,
                nivel: 'medio',
                estadoAntes: {
                    status: aluguel.status,
                    recusado: false,
                },
                estadoDepois: {
                    status: 'recusado',
                    recusado: true,
                    motivo: props.motivo,
                },
            });
        } catch (error) {
            this.logger.warn(
                `⚠️ Falha ao agendar auditoria para recusa de aluguel ${props.aluguelId} (aluguel já recusado): ${error.message}`,
                error.stack,
            );
            // Não relança o erro - o aluguel foi recusado com sucesso
        }
    }
}
