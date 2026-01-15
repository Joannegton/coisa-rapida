import { DomainEvent } from 'src/shared/utils/domian.event';
import { randomUUID } from 'node:crypto';

export class AluguelRecusadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType: string = 'AluguelRecusado';
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number = 1;

    constructor(
        public readonly aluguelId: string,
        public readonly itemId: string,
        public readonly dataInicio: Date,
        public readonly dataFim: Date,
        public readonly motivoRecusa: string,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = aluguelId;
        this.occurredOn = new Date();
    }
}