import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import type { CoreItemService } from '../../domain/services/item.service';

@EventsHandler(AluguelConfirmadoEvent)
export class AluguelConfirmadoEventHandler
    implements IEventHandler<AluguelConfirmadoEvent>
{
    private readonly logger = new Logger(AluguelConfirmadoEventHandler.name);

    constructor(
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
    ) {}

    /**
     * Quando aluguel é confirmado (locador aceita), bloqueia período no item
     * Usa pessimistic lock para evitar race conditions
     */
    async handle(event: AluguelConfirmadoEvent): Promise<void> {
        try {
            this.logger.log(
                `Bloqueando datas do item ${event.itemId} para aluguel ${event.aluguelId}`,
            );

            await this.itemService.adicionarBloqueio({
                itemId: event.itemId,
                bloqueio: {
                    dataInicio: event.dataInicio,
                    dataFim: event.dataFim,
                    motivo: `Aluguel #${event.aluguelId.substring(0, 8)}`,
                },
                useLock: true, // Pessimistic lock para evitar concorrência
            });

            this.logger.log(
                `Datas bloqueadas com sucesso para aluguel ${event.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ CRÍTICO: Falha ao bloquear datas para aluguel ${event.aluguelId}: ${error.message}`,
            );
            // ✅ PRODUÇÃO: Propaga erro para garantir consistência
            // Se falhar aqui, o UseCase saberá que o bloqueio não foi criado
            // e fará rollback da confirmação
            throw error;
        }
    }
}
