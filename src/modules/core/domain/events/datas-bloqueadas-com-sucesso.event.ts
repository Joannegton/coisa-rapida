import { DomainEvent } from 'src/shared/utils/domian.event';
import { randomUUID } from 'node:crypto';

/**
 * Evento publicado quando datas são bloqueadas com sucesso
 * Opcional - usado para confirmação e auditoria
 */
export class DatasBloqueavasComSucessoEvent implements DomainEvent {
    readonly eventId: string;
    readonly eventType: string = 'DatasBloqueavasComSucesso';
    readonly aggregateId: string;
    readonly occurredOn: Date;
    readonly eventVersion: number = 1;

    constructor(
        public readonly aluguelId: string,
        public readonly itemId: string,
    ) {
        this.eventId = randomUUID();
        this.aggregateId = itemId;
        this.occurredOn = new Date();
    }
}
