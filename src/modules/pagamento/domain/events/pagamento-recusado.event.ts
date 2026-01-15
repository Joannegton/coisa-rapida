import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from 'src/shared/utils/domian.event';
import * as crypto from 'node:crypto';

type PagamentoRecusadoEventProps = {
    pagamentoId: string;
    aluguelId: string;
    usuarioId: string;
    recusadoEm: Date;
    motivo?: string;
};

export class PagamentoRecusadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly aggregateId: string;
    readonly pagamentoId: string;
    readonly aluguelId: string;
    readonly usuarioId: string;
    readonly motivo?: string;
    readonly occurredOn: Date;
    readonly eventVersion = 1;
    readonly eventType = EVENT_CONFIG.PAGAMENTO.RECUSADO;

    constructor(props: PagamentoRecusadoEventProps) {
        this.eventId = crypto.randomUUID();
        this.aggregateId = props.pagamentoId;
        this.occurredOn = props.recusadoEm;
        this.pagamentoId = props.pagamentoId;
        this.aluguelId = props.aluguelId;
        this.usuarioId = props.usuarioId;
        this.motivo = props.motivo;
    }
}
