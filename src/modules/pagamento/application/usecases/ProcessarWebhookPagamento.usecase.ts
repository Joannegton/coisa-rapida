import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import * as crypto from 'node:crypto';
import type { MercadoPagoService } from '../../domain/services/mercado-pago.service';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { AuditoriaFilaService } from 'src/shared/infra/services/auditoria.fila.service';
import { PagamentoJobData } from 'src/modules/pagamento/infra/jobs/pagamento.processor.worker';
import { TipoServico } from '../../domain/events/pagamento-aprovado.event';
import { AuditoriaAcao } from 'src/shared/constants/auditoria-actions';
import { AuditoriaService } from 'src/shared/infra/services/auditoria.service';

type ProcessarWebhookProps = {
    signature?: string;
    requestId?: string;
    dataId?: string;
    body: any;
    query?: any;
};

@Injectable()
export class ProcessarWebhookPagamentoUsecase {
    private readonly logger = new Logger(ProcessarWebhookPagamentoUsecase.name);

    constructor(
        @Inject('MercadoPagoService')
        private readonly mercadoPagoService: MercadoPagoService,
        @Inject('PagamentoRepository')
        private readonly pagamentoRepository: PagamentoRepository,
        @InjectQueue('pagamento')
        private readonly pagamentoQueue: Queue<PagamentoJobData>,
        @Inject(AuditoriaService)
        private readonly auditoriaService: AuditoriaService,
        @Inject(AuditoriaFilaService)
        private readonly auditoriaFilaService: AuditoriaFilaService,
    ) {}

    async execute(props: ProcessarWebhookProps): Promise<void> {
        try {
            const type = props.body.type;

            if (props.signature && props.requestId && props.dataId) {
                this.processarWebhook(props);
            }

            if (type === 'payment' && props.dataId) {
                const paymentResult =
                    await this.mercadoPagoService.obterStatusPagamento(
                        props.dataId,
                    );

                const [aluguelId, tipoServico] =
                    paymentResult.external_reference
                        .split(',')
                        .map((s: string) => s.trim());

                const pagamento =
                    await this.pagamentoRepository.buscarUltimoPorAluguelId(
                        aluguelId,
                    );

                if (!pagamento) {
                    this.logger.error(
                        `Pagamento não encontrado para o aluguel ${aluguelId}`,
                    );
                    await this.auditoriaFilaService.agendarAuditoria({
                        timestamp: new Date(),
                        usuarioId: 'sistema',
                        modulo: 'pagamento',
                        acao: AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA,
                        recurso: 'webhook_pagamento',
                        recursoId: props.dataId,
                        descricao: `Pagamento não encontrado para aluguel ${aluguelId}`,
                        nivel: 'alto',
                        erro: `Pagamento não encontrado para aluguel ${aluguelId}`,
                        estadoAntes: { aluguelId, dataId: props.dataId },
                    });
                    return;
                }

                const status = paymentResult.status;

                if (status === 'approved') {
                    pagamento.aprovar(paymentResult.id.toString());
                    await this.pagamentoRepository.salvar(pagamento);
                    this.logger.log(
                        `✅ Pagamento ${pagamento.id} aprovado e persistido`,
                    );
                } else if (status === 'rejected') {
                    pagamento.rejeitar(paymentResult.status_detail);
                    await this.pagamentoRepository.salvar(pagamento);
                    this.logger.warn(`❌ Pagamento ${pagamento.id} recusado`);
                } else if (status === 'pending') {
                    pagamento.processar();
                    await this.pagamentoRepository.salvar(pagamento);
                    this.logger.log(`⏳ Pagamento ${pagamento.id} pendente`);
                } else if (status === 'cancelled') {
                    pagamento.cancelar();
                    await this.pagamentoRepository.salvar(pagamento);
                    this.logger.warn(`🚫 Pagamento ${pagamento.id} cancelado`);
                } else {
                    this.logger.warn(
                        `Pagamento ${pagamento.id} com status desconhecido: ${status}`,
                    );
                    await this.auditoriaService.criar({
                        timestamp: new Date(),
                        usuarioId: pagamento.usuarioId,
                        modulo: 'pagamento',
                        acao: AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA,
                        recurso: 'pagamento',
                        recursoId: pagamento.id,
                        descricao: `Status de pagamento desconhecido recebido: ${status}`,
                        nivel: 'medio',
                        erro: `Status desconhecido: ${status}`,
                        estadoAntes: { status: pagamento.status },
                    });
                    return;
                }

                try {
                    await this.pagamentoQueue.add(
                        {
                            aluguelId,
                            pagamentoId: pagamento.id,
                            usuarioId: pagamento.usuarioId,
                            tipoServico: tipoServico as TipoServico,
                            status: status as any,
                            motivo: paymentResult.status_detail,
                            aprovadoEm: pagamento.aprovadoEm,
                        } as PagamentoJobData,
                        {
                            jobId: `pagamento-${pagamento.id}-${Date.now()}`,
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 2000,
                            },
                            removeOnComplete: true,
                            removeOnFail: false,
                        },
                    );

                    this.logger.log(
                        `🔄 Job de processamento enfileirado para pagamento ${pagamento.id}`,
                    );
                } catch (queueError) {
                    this.logger.error(
                        `Erro ao enfileirar job de pagamento: ${queueError.message}`,
                    );
                    await this.auditoriaFilaService.agendarAuditoria({
                        timestamp: new Date(),
                        usuarioId: pagamento.usuarioId,
                        modulo: 'pagamento',
                        acao: AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA,
                        recurso: 'pagamento_queue',
                        recursoId: pagamento.id,
                        descricao: `Falha ao enfileirar processamento adicional: ${queueError.message}`,
                        nivel: 'alto',
                        erro: queueError.message,
                        estadoAntes: { status: pagamento.status },
                    });
                    // Não retorna aqui pois o pagamento já foi salvo, apenas o processamento adicional falhou
                }
            } else if (type === 'merchant_order') {
                this.logger.log(
                    `Webhook de merchant_order recebido - ignorando (ID: ${props.dataId})`,
                );
            } else {
                this.logger.warn(
                    `Tipo de webhook desconhecido ou sem dataId: ${type}`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Erro ao processar webhook do MercadoPago: ${error.message}`,
                error.stack,
            );

            await this.auditoriaFilaService.agendarAuditoria({
                timestamp: new Date(),
                usuarioId: 'sistema',
                modulo: 'pagamento',
                acao: AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA,
                recurso: 'webhook_pagamento',
                recursoId: props.dataId || 'desconhecido',
                descricao: `Erro crítico no processamento do webhook: ${error.message}`,
                nivel: 'critico',
                erro: error.message,
                estadoAntes: {
                    type: props.body?.type,
                    dataId: props.dataId,
                    hasSignature: !!props.signature,
                },
            });
        }
    }

    private processarWebhook(props: ProcessarWebhookProps): void {
        if (!props.signature || !props.requestId || !props.dataId) {
            this.logger.error('Dados insuficientes para validação do webhook');
            return;
        }

        try {
            // Extrai ts e v1 do x-signature
            const parts = props.signature
                .split(',')
                .reduce((acc: Record<string, string>, part: string) => {
                    const [key, value] = part.split('=');
                    acc[key.trim()] = value.trim();
                    return acc;
                }, {});

            const ts = parts.ts;
            const receivedHash = parts.v1;

            // Monta a string no formato: id:123;request-id:abc;ts:123456;
            const manifest = `id:${props.dataId};request-id:${props.requestId};ts:${ts};`;

            // Gera o HMAC SHA256
            const SECRET_KEY = process.env.MERCADO_PAGO_WEBHOOK_SECRET || '';
            const hmac = crypto.createHmac('sha256', SECRET_KEY);
            hmac.update(manifest);
            const calculatedHash = hmac.digest('hex');

            // Verifica se é do Mercado Pago
            if (calculatedHash !== receivedHash) {
                this.logger.error('Assinatura do webhook inválida');
                // Auditar tentativa de webhook com assinatura inválida (possível ataque)
                this.auditoriaFilaService
                    .agendarAuditoria({
                        timestamp: new Date(),
                        usuarioId: 'sistema',
                        modulo: 'pagamento',
                        acao: AuditoriaAcao.PAGAMENTO_PROCESSAMENTO_FALHA,
                        recurso: 'webhook_validacao',
                        recursoId: props.dataId,
                        descricao:
                            'Tentativa de webhook com assinatura inválida',
                        nivel: 'critico',
                        erro: 'Assinatura HMAC inválida',
                        estadoAntes: {
                            signature: props.signature.substring(0, 20) + '...', // Log parcial por segurança
                            requestId: props.requestId,
                            dataId: props.dataId,
                        },
                    })
                    .catch((auditError) => {
                        this.logger.error(
                            'Erro ao auditar falha de validação:',
                            auditError,
                        );
                    });
                return;
            }

            this.logger.log('Webhook validado com sucesso');
        } catch (error) {
            this.logger.error(
                `Erro ao validar webhook: ${error.message}`,
                error.stack,
            );
        }
    }
}
