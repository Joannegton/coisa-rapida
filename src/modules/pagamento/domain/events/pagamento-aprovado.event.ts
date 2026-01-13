import { EVENT_CONFIG } from 'src/shared/configs/events.config';
import { DomainEvent } from 'src/shared/utils/domian.event';

export enum TipoServico {
    ALUGUEL = 'aluguel',
    VENDA = 'venda',
    CAUCAO = 'caucao',
}

type PagamentoAprovadoEventProps = {
    pagamentoId: string;
    aluguelId: string;
    usuarioId: string;
    tipoServico: TipoServico;
    aprovadoEm: Date;
};

export class PagamentoAprovadoEvent implements DomainEvent {
    readonly eventId: string;
    readonly aggregateId: string;
    readonly pagamentoId: string;
    readonly aluguelId: string;
    readonly usuarioId: string;
    readonly tipoServico: TipoServico;
    readonly occurredOn: Date;
    readonly eventVersion = 1;
    readonly eventType = EVENT_CONFIG.PAGAMENTO.APROVADO;

    constructor(props: PagamentoAprovadoEventProps) {
        this.eventId = crypto.randomUUID();
        this.aggregateId = props.pagamentoId;
        this.occurredOn = props.aprovadoEm;
        this.pagamentoId = props.pagamentoId;
        this.aluguelId = props.aluguelId;
        this.usuarioId = props.usuarioId;
        this.tipoServico = props.tipoServico;
    }
}
