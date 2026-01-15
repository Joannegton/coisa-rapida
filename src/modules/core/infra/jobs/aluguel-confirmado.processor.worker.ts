import { Logger, Inject } from '@nestjs/common';
import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { EventBus } from '@nestjs/cqrs';
import type { CoreItemService } from 'src/modules/core/domain/services/item.service';
import type { AluguelRepository } from 'src/modules/core/domain/repositories/aluguel.repository';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';
import { DeadLetterQueueService } from 'src/shared/infra/services/dead-letter-queue.service';

export type AluguelConfirmadoJobData = {
    aluguelId: string;
    itemId: string;
    usuarioId: string;
    dataInicio: string;
    dataFim: string;
    locadorId: string;
    locatarioId: string;
};

/**
 * 🔄 Worker de Confirmação de Aluguel
 *
 * RESPONSABILIDADES (CRÍTICAS):
 * 1. Bloquear datas do item (saga coreografada)
 * 2. Publicar sucesso ou falha para compensação
 * 3. Auditoria
 * 4. DLQ se falhar após retries
 *
 * Com retry automático: 3 tentativas + backoff exponencial
 *
 * SAGA FLOW:
 * SUCESSO: Saga completa (auditoria registra sucesso)
 * FALHA: Compensação direta no @OnQueueFailed (sem evento intermediário)
 */
@Processor('aluguel')
export class AluguelConfirmadoProcessor {
    private readonly logger = new Logger(AluguelConfirmadoProcessor.name);

    constructor(
        @Inject('ItemService')
        private readonly itemService: CoreItemService,
        @Inject('AluguelRepository')
        private readonly aluguelRepository: AluguelRepository,
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
        @Inject(DeadLetterQueueService)
        private readonly deadLetterQueueService: DeadLetterQueueService,
        @Inject(EventBus)
        private readonly eventBus: EventBus,
    ) {}

    @Process('confirmar-aluguel')
    async process(job: Job<AluguelConfirmadoJobData>): Promise<void> {
        const { aluguelId, itemId, usuarioId, dataInicio, dataFim } = job.data;

        try {
            this.logger.log(
                `🔄 Confirmando aluguel ${aluguelId} - Tentativa ${job.attemptsMade + 1}/3`,
            );

            // ===== CRÍTICO: Bloquear datas do item =====
            await this.itemService.adicionarBloqueio({
                itemId: itemId,
                bloqueio: {
                    dataInicio: new Date(dataInicio),
                    dataFim: new Date(dataFim),
                    motivo: `Aluguel #${aluguelId.substring(0, 8)}`,
                },
                useLock: true, // Pessimistic lock
            });

            try {
                await this.auditoriaService.criar({
                    timestamp: new Date(),
                    usuarioId: usuarioId,
                    acao: AuditoriaAcao.CONFIRMAR_ALUGUEL,
                    recurso: 'aluguel',
                    recursoId: aluguelId,
                    descricao: `Aluguel confirmado - Datas bloqueadas do item ${itemId}`,
                    nivel: 'alto',
                    modulo: 'core',
                    estadoDepois: {
                        status: 'CONFIRMADO',
                        itemBloqueado: true,
                        dataInicio: new Date(dataInicio),
                        dataFim: new Date(dataFim),
                    },
                });
            } catch (auditoriaError: any) {
                this.logger.warn(
                    `⚠️ Auditoria falhou para aluguel ${aluguelId}, mas negócio prossegue: ${auditoriaError.message}`,
                );
            }

            this.logger.log(`✅ Aluguel ${aluguelId} confirmado com sucesso`);
        } catch (error: any) {
            this.logger.error(
                `❌ Falha ao confirmar aluguel ${aluguelId} (tentativa ${job.attemptsMade + 1}/3): ${error.message}`,
                error.stack,
            );

            // Bull vai fazer retry automaticamente
            throw error;
        }
    }

    /**
     * Chamado quando o job falha TODAS as tentativas
     */
    @OnQueueFailed()
    async onFailed(job: Job<AluguelConfirmadoJobData>, error: Error) {
        const { aluguelId, itemId, usuarioId } = job.data;

        const aluguel = await this.aluguelRepository.buscar(aluguelId);
        if (aluguel) {
            aluguel.voltarParaSolicitado();
            await this.aluguelRepository.salvar(aluguel);
            this.logger.log(
                `✅ [COMPENSAÇÃO] Aluguel ${aluguelId} revertido para SOLICITADO`,
            );
        } else {
            this.logger.error(
                `❌ Aluguel ${aluguelId} não encontrado para compensação`,
            );
        }

        // ===== Auditoria de FALHA (não-crítica) =====
        try {
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: usuarioId,
                acao: AuditoriaAcao.COMPENSACAO_FALHA,
                recurso: 'aluguel',
                recursoId: aluguelId,
                descricao: `Falha definitiva na confirmação de aluguel - Erro: ${error.message}`,
                nivel: 'critico',
                modulo: 'core',
                erro: error.message,
                estadoAntes: {
                    status: 'AGUARDANDO_CONFIRMACAO',
                },
                estadoDepois: {
                    status: 'FALHA_CONFIRMACAO',
                },
            });
        } catch (auditoriaError: any) {
            this.logger.warn(
                `⚠️ Auditoria de falha não foi registrada para aluguel ${aluguelId}: ${auditoriaError.message}`,
            );
        }

        // ===== Dead Letter Queue (não-crítico, mas importante) =====
        try {
            await this.deadLetterQueueService.enviar({
                modulo: 'core',
                recurso: 'aluguel',
                recursoId: aluguelId,
                evento: job.data,
                erro: error.message,
                rastreamentoErro: error.stack,
                tentativasRetorno: job.attemptsMade,
                contexto: {
                    usuarioId,
                    estadoAntes: {
                        status: 'AGUARDANDO_CONFIRMACAO',
                    },
                    estadoDepois: {
                        status: 'FALHA_CONFIRMACAO',
                    },
                    metadados: {
                        itemId,
                        tentativasExecucao: job.attemptsMade,
                        sagaStep: 'confirmar-aluguel',
                    },
                },
                idCorrelacao: `aluguel-${aluguelId}`,
                prioridade: 'alta',
            });
        } catch (dlqError: any) {
            this.logger.error(
                `🪦 DLQ falhou para aluguel ${aluguelId}: ${dlqError.message}`,
            );
        }
    }
}
