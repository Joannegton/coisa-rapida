import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ItemModeradoEvent } from '../../domain/events/item-moderado.event';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';

@EventsHandler(ItemModeradoEvent)
export class ItemModeradoEventHandler
    implements IEventHandler<ItemModeradoEvent>
{
    private readonly logger = new Logger(ItemModeradoEventHandler.name);

    constructor(
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
    ) {}

    async handle(event: ItemModeradoEvent) {
        this.logger.log(`✅ [EVENT HANDLER] Item ${event.itemId} moderado:`, {
            itemId: event.itemId,
            status: event.status,
            moderadoEm: event.moderadoEm,
        });

        await this.auditoriaService.criar({
            timestamp: new Date(),
            usuarioId: event.aggregateId,
            acao: 'ITEM_MODERADO',
            recurso: 'item',
            recursoId: event.itemId,
            descricao: `Item moderado com status: ${event.status}${
                event.motivos && event.motivos.length > 0
                    ? `. Motivos: ${event.motivos.join(', ')}`
                    : ''
            }`,
            nivel: 'medio',
            modulo: 'item',
            estadoDepois: {
                status: event.status,
                moderadoEm: event.moderadoEm,
                motivos: event.motivos,
            },
        });

        // 2️⃣ TODO: Notificar usuário
        // if (event.status === 'APROVADO') {
        //     await this.notificacaoService.enviar({
        //         usuarioId: event.aggregateId,
        //         titulo: 'Item Aprovado!',
        //         mensagem: 'Seu item foi aprovado e agora está visível',
        //     });
        // } else if (event.status === 'PENDENTE_ANALISE') {
        //     await this.notificacaoService.enviar({
        //         usuarioId: event.aggregateId,
        //         titulo: 'Item em Análise',
        //         mensagem: `Seu item está sob análise. Motivos: ${event.motivos.join(', ')}`,
        //     });
        // }

        // 3️⃣ TODO: Alertar moderadores
        // if (event.requerAprovacaoManual) {
        //     await this.moderadorService.alertar({
        //         itemId: event.itemId,
        //         motivos: event.motivos,
        //         prioridade: 'alta',
        //     });
        // }

        // 4️⃣ TODO: Update cache
        // await this.cacheService.invalidar(`item:${event.itemId}`);

        // 5️⃣ TODO: Analytics
        // await this.analyticsService.track({
        //     evento: 'item_moderado',
        //     itemId: event.itemId,
        //     status: event.status,
        // });
    }
}
