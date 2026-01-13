import { PagamentoAprovadoEventHandler } from './pagamento-aprovado.event-handler';
import { PagamentoRecusadoEventHandler } from './pagamento-recusado.event-handler';
import { PagamentoPendingEventHandler } from './pagamento-pending.event-handler';
import { PagamentoCanceladoEventHandler } from './pagamento-cancelado.event-handler';

export const PagamentoEventHandlers = [
    PagamentoAprovadoEventHandler,
    PagamentoRecusadoEventHandler,
    PagamentoPendingEventHandler,
    PagamentoCanceladoEventHandler,
];
