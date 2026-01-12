import {
    BadRequestException,
    Inject,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelCanceladoEvent } from '../../domain/events/aluguel-cancelado.event';
import { OutboxEvent } from '../../domain/outbox-event';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils } from 'src/shared/utils';
import { CancelarAluguelDto } from '../dtos/cancelar-aluguel.dto';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';

type CancelarAluguelUseCaseProps = CancelarAluguelDto & {
    aluguelId: string;
    usuarioId: string;
};

/**
 * Cancela um aluguel solicitado pelo locatário (quem fez a solicitação).
 *
 * Regras de negócio:
 * - Só pode ser cancelado por quem solicitou (locatário)
 * - Status deve permitir cancelamento (não confirmado ou finalizado)
 * - Pode gerar penalidade dependendo da política
 * - Usa Unit of Work + Outbox Pattern para atomicidade
 */
export class CancelarAluguelUseCase {
    private readonly logger = new Logger(CancelarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('UnitOfWork')
        private readonly unitOfWork: UnitOfWork,
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: CancelarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.cancelar(props.usuarioId, props.motivo);

        const evento = new AluguelCanceladoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
            props.motivo || 'Cancelado pelo usuário',
        );

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
                    motivoCancelamento: evento.motivoCancelamento,
                    occurredOn: evento.occurredOn.toISOString(),
                },
            });

            await context.salvarEvento(outboxEvent);
        });

        try {
            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: DataUtils.agoraDate(),
                usuarioId: props.usuarioId,
                acao: AuditoriaAcao.CANCELAR_ALUGUEL,
                recurso: 'aluguel',
                recursoId: props.aluguelId,
                descricao: `Cancelamento de aluguel pelo locatário - Motivo: ${props.motivo || 'Não informado'}`,
                nivel: 'medio',
                estadoAntes: {
                    status: aluguel.status,
                    cancelado: false,
                },
                estadoDepois: {
                    status: 'cancelado',
                    cancelado: true,
                    motivo: props.motivo,
                },
            });
        } catch (error) {
            this.logger.warn(
                `⚠️ Falha ao agendar auditoria para cancelamento de aluguel ${props.aluguelId} (aluguel já cancelado): ${error.message}`,
                error.stack,
            );
            // Não relança o erro - o aluguel foi cancelado com sucesso
        }
    }
}
