import { AluguelCanceladoEventHandler } from './aluguel-cancelado.event-handler';
import { AluguelConfirmadoEventHandler } from './aluguel-confirmado.event-handler';
import { AluguelFinalizadoEventHandler } from './aluguel-finalizado.event-handler';

export const CoreEventHandlers = [
    AluguelConfirmadoEventHandler,
    AluguelCanceladoEventHandler,
    AluguelFinalizadoEventHandler,
];
