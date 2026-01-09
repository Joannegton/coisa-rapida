import { DomainEvent } from 'src/shared/utils/domian.event';
import { randomUUID } from 'node:crypto';

/**
 * Evento publicado quando o bloqueio de datas FALHA
 * Usado para compensação (reverter aluguel para SOLICITADO)
 */
export class FalhaNoBloqueioEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType: string = 'FalhaNoBloqueio';
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number = 1;

    constructor(
        public readonly aluguelId: string,
        public readonly itemId: string,
        public readonly motivo: string,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = aluguelId;
        this.occurredOn = new Date();
    }
}
