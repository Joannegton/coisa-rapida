import {
    BadRequestException,
    Inject,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import { OutboxEvent } from '../../domain/outbox-event';
import type { UnitOfWork } from '../../domain/repositories/unit-of-work';

type ConfirmarAluguelUseCaseProps = {
    aluguelId: string;
    usuarioId: string;
};

/**
 * Padrão SAGA COREOGRAFADA - Microsserviços
 *
 * Usa Unit of Work + Outbox Pattern para garantir atomicidade.
 * O UseCase NÃO conhece detalhes de infraestrutura (DataSource, EntityManager).
 *
 * Fluxo:
 * 1. Buscar aluguel
 * 2. Confirmar (regra de negócio)
 * 3. UnitOfWork: Salvar aluguel + evento na outbox (mesma transação)
 * 4. Worker assíncrono publica evento
 * 5. Microsserviço Item bloqueia datas
 * 6. Se bloqueio falhar → CompensarAluguelHandler
 */
export class ConfirmarAluguelUseCase {
    private readonly logger = new Logger(ConfirmarAluguelUseCase.name);

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject('UnitOfWork')
        private readonly unitOfWork: UnitOfWork,
    ) {}

    async execute(props: ConfirmarAluguelUseCaseProps): Promise<void> {
        const aluguel = await this.aluguelRepository.buscar(props.aluguelId);

        if (!aluguel) {
            throw new NotFoundException(`Aluguel não encontrado`);
        }

        aluguel.confirmar(props.usuarioId);

        const evento = new AluguelConfirmadoEvent(
            props.aluguelId,
            aluguel.itemId,
            aluguel.dataInicio,
            aluguel.dataFim,
            aluguel.locador.id,
            aluguel.locatario.id,
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
                        locadorId: evento.locadorId,
                        locatarioId: evento.locatarioId,
                        occurredOn: evento.occurredOn.toISOString(),
                    },
                });

                await context.salvarEvento(outboxEvent);
            });
        } catch (error) {
            this.logger.error(
                `❌ Falha ao confirmar aluguel ${props.aluguelId}: ${error.message}`,
            );

            throw new BadRequestException(
                'Não foi possível confirmar o aluguel. Tente novamente.',
            );
        }
    }
}
