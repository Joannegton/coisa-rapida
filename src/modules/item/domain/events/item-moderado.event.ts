import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from 'src/shared/utils/domian.event';

export class ItemModeradoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EVENT_CONFIG.ITEM.MODERADO;
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion = 1;

    constructor(
        readonly itemId: string,
        readonly status: string,
        readonly moderadoEm: Date,
        readonly motivos?: string[],
    ) {
        this.eventId = crypto.randomUUID();
        this.aggregateId = itemId;
        this.occurredOn = moderadoEm;
    }
}
