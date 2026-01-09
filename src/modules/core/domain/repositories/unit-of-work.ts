import { Aluguel } from '../aluguel';
import { OutboxEvent } from '../outbox-event';

/**
 * 🎯 Unit of Work - Padrão para gerenciar transações
 *
 * Responsável por coordenar a persistência de múltiplos agregados
 * em uma única transação atômica.
 *
 * Em DDD, o UseCase não deve conhecer detalhes de infraestrutura
 * como DataSource ou EntityManager.
 */
export interface UnitOfWork {
    /**
     * Executa operações dentro de uma transação
     * Se qualquer operação falhar, faz rollback automático
     */
    executarEmTransacao<T>(
        trabalho: (contexto: ContextoTransacional) => Promise<T>,
    ): Promise<T>;
}

export interface ContextoTransacional {
    salvarAluguel(aluguel: Aluguel): Promise<void>;
    salvarEvento(evento: OutboxEvent): Promise<void>;
}
