import { DomainEvent } from 'src/shared/utils/domian.event';
import { randomUUID } from 'node:crypto';

export class AluguelFinalizadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType: string = 'AluguelFinalizado';
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number = 1;

    constructor(
        public readonly aluguelId: string,
        public readonly itemId: string,
        public readonly dataInicio: Date,
        public readonly dataFim: Date,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = aluguelId;
        this.occurredOn = new Date();
    }
}
