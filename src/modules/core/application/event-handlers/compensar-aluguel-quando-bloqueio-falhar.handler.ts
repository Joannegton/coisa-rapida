import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { FalhaNoBloqueioEvent } from '../../domain/events/falha-no-bloqueio.event';
import type { AluguelRepository } from '../../domain/repositories/aluguel.repository';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';

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
        private readonly auditoriaService: AuditoriaService,
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

            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: 'core',
                acao: AuditoriaAcao.COMPENSACAO_EXECUTADA,
                recurso: 'Aluguel',
                recursoId: event.aluguelId,
                descricao: `Compensação automática: Aluguel revertido para SOLICITADO devido a falha no bloqueio de datas do item ${event.itemId}`,
                nivel: 'critico',
                erro: event.motivo,
                estadoAntes: { status: 'CONFIRMADO' },
                estadoDepois: { status: 'SOLICITADO' },
                mudancas: [
                    {
                        campo: 'status',
                        valorAntes: 'CONFIRMADO',
                        valorDepois: 'SOLICITADO',
                    },
                ],
                timestamp: new Date(),
            });

            // TODO: Notificação ao usuário será implementada em sprint futura
            // Sistema de notificações ainda não existe
        } catch (error) {
            this.logger.error(
                `❌ [COMPENSAÇÃO] Erro ao compensar aluguel ${event.aluguelId}: ${error.message}`,
            );

            await this.auditoriaService.criar({
                usuarioId: 'sistema',
                modulo: 'core',
                acao: AuditoriaAcao.COMPENSACAO_FALHA,
                recurso: 'Aluguel',
                recursoId: event.aluguelId,
                descricao: `Falha crítica na compensação automática do aluguel: ${error.message}`,
                nivel: 'critico',
                erro: error.message,
                estadoAntes: { status: 'CONFIRMADO' },
                estadoDepois: { status: 'DESCONHECIDO' },
                timestamp: new Date(),
            });

            // Em produção: adicionar à DLQ (Dead Letter Queue) para investigação manual
        }
    }
}
