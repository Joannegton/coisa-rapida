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
import { Processor, OnQueueFailed, Process } from '@nestjs/bull';

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
    @Process()
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

            await this.atualizarStatusAluguel(
                aluguelId,
                status,
                tipoServico,
                aprovadoEm,
            );

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

            // evento para handlers secundarios
            // (auditoria adicional, cache, notificações, etc)
            // pesquisar se é mais interessante fazer as diferentes coisas para cada evento aqui na queue, ou passar como evento mesmo
            await this.publicarEventoSecundario(job.data);

            this.logger.log(
                `✅ Pagamento ${pagamentoId} processado com sucesso`,
            );
        } catch (error: any) {
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
     * Atualiza status do aluguel de acordo com o pagamento
     */
    private async atualizarStatusAluguel(
        aluguelId: string,
        status: string,
        tipoServico: TipoServico,
        aprovadoEm?: Date,
    ): Promise<void> {
        const statusMap = this.obterMapaStatusAluguel(status, tipoServico);
        if (!statusMap) return;

        await this.aluguelService.atualizarPagamento({
            aluguelId,
            status: statusMap.status,
            eCaucao: statusMap.eCaucao,
            dataPagamento: statusMap.dataPagamento,
        });
    }

    /**
     * Mapeia status do pagamento para status do aluguel
     */
    private obterMapaStatusAluguel(
        status: string,
        tipoServico: TipoServico,
    ): {
        status: AluguelPagamentoStatusModel | StatusCaucao;
        eCaucao: boolean;
        dataPagamento?: Date;
    } | null {
        const mapaStatus: Record<
            string,
            Record<
                string,
                {
                    status: AluguelPagamentoStatusModel | StatusCaucao;
                    eCaucao: boolean;
                    dataPagamento?: Date;
                }
            >
        > = {
            approved: {
                [TipoServico.ALUGUEL]: {
                    status: AluguelPagamentoStatusModel.PAGO,
                    eCaucao: false,
                    dataPagamento: new Date(),
                },
                [TipoServico.CAUCAO]: {
                    status: StatusCaucao.PAGA,
                    eCaucao: true,
                    dataPagamento: new Date(),
                },
            },
            rejected: {
                [TipoServico.ALUGUEL]: {
                    status: AluguelPagamentoStatusModel.RECUSADO,
                    eCaucao: false,
                },
                [TipoServico.CAUCAO]: {
                    status: StatusCaucao.CANCELADA,
                    eCaucao: true,
                },
            },
            pending: {
                [TipoServico.ALUGUEL]: {
                    status: AluguelPagamentoStatusModel.PROCESSANDO,
                    eCaucao: false,
                },
                [TipoServico.CAUCAO]: {
                    status: StatusCaucao.PROCESSANDO,
                    eCaucao: true,
                },
            },
            cancelled: {
                [TipoServico.ALUGUEL]: {
                    status: AluguelPagamentoStatusModel.CANCELADO,
                    eCaucao: false,
                },
                [TipoServico.CAUCAO]: {
                    status: StatusCaucao.CANCELADA,
                    eCaucao: true,
                },
            },
        };

        return mapaStatus[status]?.[tipoServico] || null;
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
            const evento = this.criarEventoSecundario(data);
            if (evento) {
                await this.eventBus.publish(evento);
            }
        } catch (error: any) {
            // Eventos secundários não devem falhar o job
            this.logger.warn(
                `⚠️ Erro ao publicar evento secundário: ${error.message}`,
            );
        }
    }

    /**
     * Cria evento apropriado baseado no status
     */
    private criarEventoSecundario(data: PagamentoJobData): any {
        switch (data.status) {
            case 'approved':
                return new PagamentoAprovadoEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    aprovadoEm: data.aprovadoEm || new Date(),
                    usuarioId: data.usuarioId,
                    tipoServico: data.tipoServico,
                });
            case 'rejected':
                return new PagamentoRecusadoEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    recusadoEm: new Date(),
                    usuarioId: data.usuarioId,
                    motivo: data.motivo,
                });
            case 'pending':
                return new PagamentoPendingEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    pendingEm: new Date(),
                    usuarioId: data.usuarioId,
                });
            case 'cancelled':
                return new PagamentoCanceladoEvent({
                    aluguelId: data.aluguelId,
                    pagamentoId: data.pagamentoId,
                    canceladoEm: new Date(),
                    usuarioId: data.usuarioId,
                    motivo: data.motivo,
                });
            default:
                return null;
        }
    }
}
