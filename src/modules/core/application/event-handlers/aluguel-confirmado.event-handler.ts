import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import type { CoreItemService } from '../../domain/services/item.service';
import { FalhaNoBloqueioEvent } from '../../domain/events/falha-no-bloqueio.event';
import { DatasBloqueavasComSucessoEvent } from '../../domain/events/datas-bloqueadas-com-sucesso.event';

/**
 * 🎯 MICROSSERVIÇO DE ITEM (simulado)
 *
 * Este handler representa o que seria um microsserviço separado de Item.
 * Escuta eventos de Aluguel e reage bloqueando datas.
 *
 * Em produção com microsserviços reais:
 * - Este handler estaria em outro serviço/container
 * - Receberia eventos via RabbitMQ/Kafka
 * - Teria seu próprio banco de dados
 *
 * Fluxo SAGA Coreografada:
 * 1. Recebe AluguelConfirmadoEvent
 * 2. Tenta bloquear datas no item
 * 3. Se sucesso → publica DatasBloqueavasComSucessoEvent
 * 4. Se falha → publica FalhaNoBloqueioEvent (para compensação)
 */
@EventsHandler(AluguelConfirmadoEvent)
export class AluguelConfirmadoEventHandler
    implements IEventHandler<AluguelConfirmadoEvent>
{
    private readonly logger = new Logger(AluguelConfirmadoEventHandler.name);

    constructor(
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
        private readonly eventBus: EventBus,
    ) {}

    async handle(event: AluguelConfirmadoEvent): Promise<void> {
        try {
            this.logger.log(
                `📦 [MICROSSERVIÇO ITEM] Bloqueando datas do item ${event.itemId} para aluguel ${event.aluguelId}`,
            );

            await this.itemService.adicionarBloqueio({
                itemId: event.itemId,
                bloqueio: {
                    dataInicio: event.dataInicio,
                    dataFim: event.dataFim,
                    motivo: `Aluguel #${event.aluguelId.substring(0, 8)}`,
                },
                useLock: true, // Pessimistic lock
            });

            this.logger.log(
                `✅ [MICROSSERVIÇO ITEM] Datas bloqueadas com sucesso para aluguel ${event.aluguelId}`,
            );

            this.eventBus.publish(
                new DatasBloqueavasComSucessoEvent(
                    event.aluguelId,
                    event.itemId,
                ),
            );
        } catch (error) {
            this.logger.error(
                `❌ [MICROSSERVIÇO ITEM] Falha ao bloquear datas para aluguel ${event.aluguelId}: ${error.message}`,
            );

            // Publica evento de falha (para compensação)
            this.eventBus.publish(
                new FalhaNoBloqueioEvent(
                    event.aluguelId,
                    event.itemId,
                    error.message,
                ),
            );

            // NÃO re-lança erro - SAGA Coreografada usa eventos para comunicação
        }
    }
}
