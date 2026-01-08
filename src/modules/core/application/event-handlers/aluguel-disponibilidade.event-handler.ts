import { Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AluguelConfirmadoEvent } from '../../domain/events/aluguel-confirmado.event';
import { AluguelCanceladoEvent } from '../../domain/events/aluguel-cancelado.event';
import { AluguelFinalizadoEvent } from '../../domain/events/aluguel-finalizado.event';
import type { CoreItemService } from '../../domain/services/item.service';

/**
 * Fluxo:
 * 1. SOLICITADO → Nenhum bloqueio (datas ainda livres)
 * 2. CONFIRMADO (locador aceita) → Bloqueia datas no item
 * 3. CANCELADO/RECUSADO → Desbloqueia datas
 * 4. FINALIZADO → Desbloqueia datas
 */
export class AluguelDisponibilidadeEventHandler {
    private readonly logger = new Logger(
        AluguelDisponibilidadeEventHandler.name,
    );

    constructor(
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
    ) {}

    /**
     * Quando aluguel é confirmado (locador aceita), bloqueia período no item
     * Usa pessimistic lock para evitar race conditions
     */
    @OnEvent('AluguelConfirmado')
    async handleAluguelConfirmado(
        event: AluguelConfirmadoEvent,
    ): Promise<void> {
        try {
            this.logger.log(
                `Bloqueando datas do item ${event.itemId} para aluguel ${event.aluguelId}`,
            );

            await this.itemService.adicionarBloqueio({
                itemId: event.itemId,
                bloqueio: {
                    dataInicio: event.dataInicio,
                    dataFim: event.dataFim,
                    motivo: `Aluguel #${event.aluguelId.substring(0, 8)}`,
                },
                useLock: true, // Pessimistic lock para evitar concorrência
            });

            this.logger.log(
                `Datas bloqueadas com sucesso para aluguel ${event.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `❌ CRÍTICO: Falha ao bloquear datas para aluguel ${event.aluguelId}: ${error.message}`,
            );
            // ✅ PRODUÇÃO: Propaga erro para garantir consistência
            // Se falhar aqui, o UseCase saberá que o bloqueio não foi criado
            // e fará rollback da confirmação
            throw error;
        }
    }

    /**
     * Quando aluguel é cancelado, remove bloqueio do período
     */
    @OnEvent('AluguelCancelado')
    async handleAluguelCancelado(event: AluguelCanceladoEvent): Promise<void> {
        try {
            this.logger.log(
                `Desbloqueando datas do item ${event.itemId} - aluguel ${event.aluguelId} cancelado`,
            );

            await this.itemService.removerBloqueio({
                itemId: event.itemId,
                dataInicio: event.dataInicio,
                dataFim: event.dataFim,
                useLock: true,
            });

            this.logger.log(
                `Datas desbloqueadas com sucesso para aluguel ${event.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao desbloquear datas para aluguel ${event.aluguelId}: ${error.message}`,
            );
        }
    }

    /**
     * Quando aluguel é finalizado (devolvido), remove bloqueio
     */
    @OnEvent('AluguelFinalizado')
    async handleAluguelFinalizado(
        event: AluguelFinalizadoEvent,
    ): Promise<void> {
        try {
            this.logger.log(
                `Desbloqueando datas do item ${event.itemId} - aluguel ${event.aluguelId} finalizado`,
            );

            await this.itemService.removerBloqueio({
                itemId: event.itemId,
                dataInicio: event.dataInicio,
                dataFim: event.dataFim,
                useLock: true,
            });

            this.logger.log(
                `Datas desbloqueadas com sucesso após finalização do aluguel ${event.aluguelId}`,
            );
        } catch (error) {
            this.logger.error(
                `Erro ao desbloquear datas após finalização do aluguel ${event.aluguelId}: ${error.message}`,
            );
        }
    }
}
