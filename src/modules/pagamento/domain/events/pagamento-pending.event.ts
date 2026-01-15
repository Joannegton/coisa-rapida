import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from 'src/shared/utils/domian.event';
import * as crypto from 'node:crypto';

type PagamentoPendingEventProps = {
    pagamentoId: string;
    aluguelId: string;
    usuarioId: string;
    pendingEm: Date;
};

export class PagamentoPendingEvent implements DomainEvent {
    readonly eventId: string;
    readonly aggregateId: string;
    readonly pagamentoId: string;
    readonly aluguelId: string;
    readonly usuarioId: string;
    readonly occurredOn: Date;
    readonly eventVersion = 1;
    readonly eventType = EVENT_CONFIG.PAGAMENTO.PENDING;

    constructor(props: PagamentoPendingEventProps) {
        this.eventId = crypto.randomUUID();
        this.aggregateId = props.pagamentoId;
        this.occurredOn = props.pendingEm;
        this.pagamentoId = props.pagamentoId;
        this.aluguelId = props.aluguelId;
        this.usuarioId = props.usuarioId;
    }
}
