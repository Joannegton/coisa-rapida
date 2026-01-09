import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { FalhaNoBloqueioEvent } from '../../domain/events/falha-no-bloqueio.event';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';

/**
 * 🔄 HANDLER DE COMPENSAÇÃO - SAGA Coreografada
 *
 * Quando o bloqueio de datas falha no microsserviço de Item,
 * este handler COMPENSA a operação revertendo o aluguel para SOLICITADO.
 *
 * Isso mantém a consistência eventual entre os microsserviços.
 *
 * Fluxo:
 * 1. Aluguel confirmado → evento salvo na outbox
 * 2. Worker publica AluguelConfirmadoEvent
 * 3. Microsserviço Item tenta bloquear datas → FALHA
 * 4. Publica FalhaNoBloqueioEvent
 * 5. **Este handler** reverte aluguel para SOLICITADO
 * 6. Notifica usuário sobre a falha
 */
@EventsHandler(FalhaNoBloqueioEvent)
export class CompensarAluguelQuandoBloqueioFalharHandler
    implements IEventHandler<FalhaNoBloqueioEvent>
{
    private readonly logger = new Logger(
        CompensarAluguelQuandoBloqueioFalharHandler.name,
    );

    constructor(
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
    ) {}

    async handle(event: FalhaNoBloqueioEvent): Promise<void> {
        try {
            this.logger.warn(
                `🔄 [COMPENSAÇÃO] Revertendo aluguel ${event.aluguelId} para SOLICITADO. Motivo: ${event.motivo}`,
            );

            const aluguel = await this.aluguelRepository.buscar(
                event.aluguelId,
            );

            if (!aluguel) {
                this.logger.error(
                    `❌ [COMPENSAÇÃO] Aluguel ${event.aluguelId} não encontrado para compensação`,
                );
                return;
            }

            // Reverte para SOLICITADO
            aluguel.voltarParaSolicitado();

            await this.aluguelRepository.salvar(aluguel);

            this.logger.log(
                `✅ [COMPENSAÇÃO] Aluguel ${event.aluguelId} revertido para SOLICITADO com sucesso`,
            );

            // NOTA: Notificação será implementada em sprint futura
            // Sistema de notificações ainda não existe
        } catch (error) {
            this.logger.error(
                `❌ [COMPENSAÇÃO] Erro ao compensar aluguel ${event.aluguelId}: ${error.message}`,
            );
            // Em produção: adicionar à DLQ (Dead Letter Queue) para investigação manual
        }
    }
}
