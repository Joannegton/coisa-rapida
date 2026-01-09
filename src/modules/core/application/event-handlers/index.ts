import { AluguelCanceladoEventHandler } from './aluguel-cancelado.event-handler';
import { AluguelConfirmadoEventHandler } from './aluguel-confirmado.event-handler';
import { AluguelFinalizadoEventHandler } from './aluguel-finalizado.event-handler';
import { CompensarAluguelQuandoBloqueioFalharHandler } from './compensar-aluguel-quando-bloqueio-falhar.handler';

export const CoreEventHandlers = [
    AluguelConfirmadoEventHandler,
    AluguelCanceladoEventHandler,
    AluguelFinalizadoEventHandler,
    CompensarAluguelQuandoBloqueioFalharHandler,
];
