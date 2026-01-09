import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AluguelCanceladoEvent } from '../../domain/events/aluguel-cancelado.event';
import type { CoreItemService } from '../../domain/services/item.service';

@EventsHandler(AluguelCanceladoEvent)
export class AluguelCanceladoEventHandler
    implements IEventHandler<AluguelCanceladoEvent>
{
    private readonly logger = new Logger(AluguelCanceladoEventHandler.name);

    constructor(
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
    ) {}

    /**
     * Quando aluguel é cancelado, remove bloqueio do período
     */
    async handle(event: AluguelCanceladoEvent): Promise<void> {
        try {
            this.logger.log(
                `Desbloqueando datas do item ${event.itemId} - aluguel ${event.aluguelId} cancelado`,
            );

            await this.itemService.removerBloqueio({
                itemId: event.itemId,
                dataInicio: event.dataInicio,
                dataFim: event.dataFim,
                useLock: true,
            });

            this.logger.log(
                `Datas desbloqueadas com sucesso para aluguel ${event.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao desbloquear datas para aluguel ${event.aluguelId}: ${error.message}`,
            );
        }
    }
}
