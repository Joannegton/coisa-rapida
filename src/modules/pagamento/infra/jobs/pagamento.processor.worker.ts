import { Logger, Inject } from '@nestjs/common';
import type { Job } from 'bull';
import type { AluguelService } from 'src/modules/pagamento/domain/services/aluguel.service';
import { AluguelPagamentoStatusModel } from 'src/modules/core/infra/models/aluguel-pagamento.value-object';
import { StatusCaucao } from 'src/modules/core/infra/models/caucao.value-object';
import { AuditoriaService } from '../../../../shared/infra/services/auditoria.service';
import { DeadLetterQueueService } from '../../../../shared/infra/services/dead-letter-queue.service';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { EventBus } from '@nestjs/cqrs';
import {
    PagamentoAprovadoEvent,
    TipoServico,
} from 'src/modules/pagamento/domain/events/pagamento-aprovado.event';
import { PagamentoRecusadoEvent } from 'src/modules/pagamento/domain/events/pagamento-recusado.event';
import { PagamentoPendingEvent } from 'src/modules/pagamento/domain/events/pagamento-pending.event';
import { PagamentoCanceladoEvent } from 'src/modules/pagamento/domain/events/pagamento-cancelado.event';
import { Processor, OnQueueFailed } from '@nestjs/bull';

export type PagamentoJobData = {
    aluguelId: string;
    pagamentoId: string;
    usuarioId: string;
    tipoServico: TipoServico;
    status: 'approved' | 'rejected' | 'pending' | 'cancelled';
    motivo?: string;
    aprovadoEm?: Date;
};

@Processor('pagamento')
export class PagamentoProcessor {
    private readonly logger = new Logger(PagamentoProcessor.name);

    constructor(
        @Inject('AluguelService')
        private readonly aluguelService: AluguelService,
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
        @Inject(DeadLetterQueueService)
        private readonly deadLetterQueueService: DeadLetterQueueService,
        @Inject(EventBus)
        private readonly eventBus: EventBus,
    ) {}

    /**
     * Processa job de pagamento com retry automático
     */
    async process(job: Job<PagamentoJobData>): Promise<void> {
        const {
            aluguelId,
            pagamentoId,
            usuarioId,
            tipoServico,
            status,
            aprovadoEm,
        } = job.data;

        try {
            this.logger.log(
                `🔄 Processando pagamento ${pagamentoId} [${status}] - Tentativa ${job.attemptsMade + 1}/3`,
            );

            // ===== 1️⃣ CRÍTICO: Atualizar status do aluguel =====
            if (status === 'approved') {
                if (tipoServico === TipoServico.ALUGUEL) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: AluguelPagamentoStatusModel.PAGO,
                        eCaucao: false,
                        dataPagamento: aprovadoEm,
                    });
                } else if (tipoServico === TipoServico.CAUCAO) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: StatusCaucao.PAGA,
                        eCaucao: true,
                        dataPagamento: aprovadoEm,
                    });
                }
            } else if (status === 'rejected') {
                if (tipoServico === TipoServico.ALUGUEL) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: AluguelPagamentoStatusModel.RECUSADO,
                        eCaucao: false,
                    });
                } else if (tipoServico === TipoServico.CAUCAO) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: StatusCaucao.CANCELADA,
                        eCaucao: true,
                    });
                }
            } else if (status === 'pending') {
                if (tipoServico === TipoServico.ALUGUEL) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: AluguelPagamentoStatusModel.PROCESSANDO,
                        eCaucao: false,
                    });
                } else if (tipoServico === TipoServico.CAUCAO) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: StatusCaucao.PROCESSANDO,
                        eCaucao: true,
                    });
                }
            } else if (status === 'cancelled') {
                if (tipoServico === TipoServico.ALUGUEL) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: AluguelPagamentoStatusModel.CANCELADO,
                        eCaucao: false,
                    });
                } else if (tipoServico === TipoServico.CAUCAO) {
                    await this.aluguelService.atualizarPagamento({
                        aluguelId: aluguelId,
                        status: StatusCaucao.CANCELADA,
                        eCaucao: true,
                    });
                }
            }

            // ===== 2️⃣ Registrar sucesso na auditoria =====
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: usuarioId,
                acao: this.mapearAcaoAuditoria(status),
                recurso: 'pagamento',
                recursoId: pagamentoId,
                descricao: `Pagamento processado com sucesso - Status: ${status}. Aluguel: ${aluguelId}`,
                nivel: 'alto',
                modulo: 'pagamento',
                estadoDepois: {
                    status,
                    pagamentoId,
                    aluguelId,
                },
            });

            // ===== 3️⃣ Publicar evento para handlers secundários =====
            // (auditoria adicional, cache, notificações, etc)
            await this.publicarEventoSecundario(job.data);

            this.logger.log(
                `✅ Pagamento ${pagamentoId} processado com sucesso`,
            );
        } catch (error: any) {
            // ❌ Erro: Bull vai fazer retry automaticamente
            this.logger.error(
                `❌ Erro ao processar pagamento ${pagamentoId} (tentativa ${job.attemptsMade + 1}/3): ${error.message}`,
                error.stack,
            );

            // Se for última tentativa, vai pro DLQ via handler onFailed()
            throw error;
        }
    }

    /**
     * Chamado quando o job falha TODAS as tentativas
     */
    @OnQueueFailed()
    async onFailed(job: Job<PagamentoJobData>, error: Error) {
        const { aluguelId, pagamentoId, usuarioId, tipoServico, status } =
            job.data;

        this.logger.error(
            `🚫 FALHA DEFINITIVA: Pagamento ${pagamentoId} falhou após 3 tentativas: ${error.message}`,
        );

        try {
            // ===== Auditoria de FALHA crítica =====
            await this.auditoriaService.criar({
                timestamp: new Date(),
                usuarioId: usuarioId,
                acao: AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA,
                recurso: 'pagamento',
                recursoId: pagamentoId,
                descricao: `Falha definitiva no processamento - Status: ${status}. Aluguel: ${aluguelId}. Erro: ${error.message}`,
                nivel: 'critico',
                modulo: 'pagamento',
                erro: error.message,
                estadoAntes: {
                    status: 'PENDENTE',
                    pagamentoId,
                    aluguelId,
                },
                estadoDepois: {
                    status: 'FALHA_DEFINITIVA',
                },
            });

            // ===== Dead Letter Queue para intervenção manual =====
            await this.deadLetterQueueService.enviar({
                modulo: 'pagamento',
                recurso: 'pagamento',
                recursoId: pagamentoId,
                evento: job.data,
                erro: error.message,
                rastreamentoErro: error.stack,
                tentativasRetorno: job.attemptsMade,
                contexto: {
                    usuarioId,
                    estadoAntes: {
                        status: 'PENDENTE',
                    },
                    estadoDepois: {
                        status: 'FALHA_DEFINITIVA',
                    },
                    metadados: {
                        aluguelId,
                        tipoServico,
                        statusMercadoPago: status,
                        tentativasExecucao: job.attemptsMade,
                    },
                },
                idCorrelacao: `pagamento-${pagamentoId}`,
                prioridade: 'alta',
            });
        } catch (dlqError: any) {
            this.logger.error(
                `🪦 Erro ao enviar para DLQ: ${dlqError.message}`,
                dlqError.stack,
            );
        }
    }

    /**
     * Mapeia status para ação de auditoria
     */
    private mapearAcaoAuditoria(status: string): AuditoriaAcao {
        switch (status) {
            case 'approved':
                return AuditoriaAcao.PAGAMENTO_APROVADO;
            case 'rejected':
                return AuditoriaAcao.PAGAMENTO_RECUSADO;
            case 'pending':
                return AuditoriaAcao.PAGAMENTO_PENDING;
            case 'cancelled':
                return AuditoriaAcao.PAGAMENTO_CANCELADO;
            default:
                return AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA;
        }
    }

    /**
     * Publica evento para handlers secundários (não-críticos)
     * Auditoria adicional, cache, notificações, analytics
     */
    private async publicarEventoSecundario(
        data: PagamentoJobData,
    ): Promise<void> {
        try {
            if (data.status === 'approved') {
                const evento = new PagamentoAprovadoEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    aprovadoEm: data.aprovadoEm || new Date(),
                    usuarioId: data.usuarioId,
                    tipoServico: data.tipoServico,
                });
                await this.eventBus.publish(evento);
            } else if (data.status === 'rejected') {
                const evento = new PagamentoRecusadoEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    recusadoEm: new Date(),
                    usuarioId: data.usuarioId,
                    motivo: data.motivo,
                });
                await this.eventBus.publish(evento);
            } else if (data.status === 'pending') {
                const evento = new PagamentoPendingEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    pendingEm: new Date(),
                    usuarioId: data.usuarioId,
                });
                await this.eventBus.publish(evento);
            } else if (data.status === 'cancelled') {
                const evento = new PagamentoCanceladoEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    canceladoEm: new Date(),
                    usuarioId: data.usuarioId,
                    motivo: data.motivo,
                });
                await this.eventBus.publish(evento);
            }
        } catch (error: any) {
            // Eventos secundários não devem falhar o job
            this.logger.warn(
                `⚠️ Erro ao publicar evento secundário: ${error.message}`,
            );
        }
    }
}
