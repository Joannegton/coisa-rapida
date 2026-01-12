import { Inject, Logger, NotFoundException } from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelFinalizadoEvent } from '../../domain/events/aluguel-finalizado.event';
import { OutboxEvent } from '../../domain/outbox-event';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { DataUtils } from 'src/shared/utils';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';

type FinalizarAluguelUseCaseProps = {
    aluguelId: string;
    usuarioId: string;
};

/**
 *
 * Padrão SAGA COREOGRAFADA - Microsserviços
 * Usa Unit of Work + Outbox Pattern para garantir atomicidade.
 *
 * Fluxo:
 * 1. Buscar aluguel em ATIVO
 * 2. Domain finaliza (regra de negócio)
 * 3. UnitOfWork: Salvar aluguel + evento na outbox (mesma transação)
 * 4. Worker assíncrono publica evento
 * 5. Microsserviço Item desbloqueia datas
 * 6. Se desbloqueio falhar → CompensarAluguelHandler
 * 7. Auditoria registrada separadamente (não quebra operação)
 */
export class FinalizarAluguelUseCase {
    private readonly logger = new Logger(FinalizarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('UnitOfWork')
        private readonly unitOfWork: UnitOfWork,
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: FinalizarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.finalizar(props.usuarioId);

        const evento = new AluguelFinalizadoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
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
                    occurredOn: evento.occurredOn.toISOString(),
                },
            });

            await context.salvarEvento(outboxEvent);
        });

        try {
            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: DataUtils.agoraDate(),
                usuarioId: props.usuarioId,
                acao: AuditoriaAcao.FINALIZAR_ALUGUEL,
                recurso: 'aluguel',
                recursoId: props.aluguelId,
                descricao: `Finalização/devolução de aluguel - Item devolvido`,
                nivel: 'alto',
                estadoAntes: {
                    status: aluguel.status,
                    finalizado: false,
                },
                estadoDepois: {
                    status: 'concluido',
                    finalizado: true,
                },
            });
        } catch (error) {
            this.logger.warn(
                `⚠️ Falha ao agendar auditoria para finalização de aluguel ${props.aluguelId} (aluguel já finalizado): ${error.message}`,
                error.stack,
            );
            // Não relança o erro - o aluguel foi finalizado com sucesso
        }
    }
}
