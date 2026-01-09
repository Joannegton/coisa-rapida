import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AluguelFinalizadoEvent } from '../../domain/events/aluguel-finalizado.event';
import type { CoreItemService } from '../../domain/services/item.service';

@EventsHandler(AluguelFinalizadoEvent)
export class AluguelFinalizadoEventHandler
    implements IEventHandler<AluguelFinalizadoEvent>
{
    private readonly logger = new Logger(AluguelFinalizadoEventHandler.name);

    constructor(
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
    ) {}

    /**
     * Quando aluguel é finalizado (devolvido), remove bloqueio
     */
    async handle(event: AluguelFinalizadoEvent): Promise<void> {
        try {
            this.logger.log(
                `Desbloqueando datas do item ${event.itemId} - aluguel ${event.aluguelId} finalizado`,
            );

            await this.itemService.removerBloqueio({
                itemId: event.itemId,
                dataInicio: event.dataInicio,
                dataFim: event.dataFim,
                useLock: true,
            });

            this.logger.log(
                `Datas desbloqueadas com sucesso após finalização do aluguel ${event.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao desbloquear datas após finalização do aluguel ${event.aluguelId}: ${error.message}`,
            );
        }
    }
}
