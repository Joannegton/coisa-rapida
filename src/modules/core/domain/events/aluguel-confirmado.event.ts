import { DomainEvent } from 'src/shared/utils/domian.event';
import { randomUUID } from 'node:crypto';

export class AluguelConfirmadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType: string = 'AluguelConfirmado';
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number = 1;

    constructor(
        public readonly aluguelId: string,
        public readonly itemId: string,
        public readonly dataInicio: Date,
        public readonly dataFim: Date,
        public readonly locadorId: string,
        public readonly locatarioId: string,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = aluguelId;
        this.occurredOn = new Date();
    }
}
