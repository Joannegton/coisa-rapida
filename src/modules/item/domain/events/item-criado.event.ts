import { randomUUID } from 'node:crypto';
import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from 'src/shared/utils/domian.event';

export class ItemCriadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType = EVENT_CONFIG.ITEM.CRIADO;
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion = 1;

    constructor(
        readonly itemId: string,
        readonly usuarioId: string,
        readonly nome: string,
        readonly descricao: string,
        readonly criadoEm: Date,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = itemId;
        this.occurredOn = criadoEm;
    }
}
