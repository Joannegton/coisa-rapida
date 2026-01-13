import { Pagamento } from '../pagamento';
import { Transferencia } from '../transferencia';
import { OutboxEvent } from 'src/modules/core/domain/outbox-event';

export interface PagamentoContextoTransacional {
    salvarPagamento(pagamento: Pagamento): Promise<void>;
    salvarTransferencia(transferencia: Transferencia): Promise<void>;
    salvarEvento(evento: OutboxEvent): Promise<void>;
}

export interface PagamentoUnitOfWork {
    executarEmTransacao<T>(
        trabalho: (contexto: PagamentoContextoTransacional) => Promise<T>,
    ): Promise<T>;
}
