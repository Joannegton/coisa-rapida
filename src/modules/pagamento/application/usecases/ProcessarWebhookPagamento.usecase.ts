import {
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import type { PagamentoUnitOfWork } from '../../domain/repositories/pagamento-unit-of-work';
import * as crypto from 'node:crypto';
import type { MercadoPagoService } from '../../domain/services/mercado-pago.service';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import {
    PagamentoAprovadoEvent,
    TipoServico,
} from '../../domain/events/pagamento-aprovado.event';
import { PagamentoRecusadoEvent } from '../../domain/events/pagamento-recusado.event';
import { PagamentoPendingEvent } from '../../domain/events/pagamento-pending.event';
import { PagamentoCanceladoEvent } from '../../domain/events/pagamento-cancelado.event';
import { OutboxEvent } from 'src/modules/core/domain/outbox-event';

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
        @Inject('PagamentoUnitOfWork')
        private readonly unitOfWork: PagamentoUnitOfWork,
    ) {}

    async execute(props: ProcessarWebhookProps): Promise<void> {
        const type = props.body.type;

        if (props.signature && props.requestId && props.dataId) {
            this.processarWebhook(props);
        }

        if (type === 'payment' && props.dataId) {
            const paymentResult =
                await this.mercadoPagoService.obterStatusPagamento(
                    props.dataId,
                );

            const [aluguelId, tipoServico] = paymentResult.external_reference
                .split(',')
                .map((s: string) => s.trim());

            const pagamento =
                await this.pagamentoRepository.buscarUltimoPorAluguelId(
                    aluguelId,
                );

            if (!pagamento)
                throw new NotFoundException(
                    'Pagamento não encontrado para o aluguel.',
                );

            const status = paymentResult.status;

            if (status === 'approved') {
                await this.unitOfWork.executarEmTransacao(async (ctx) => {
                    pagamento.aprovar(paymentResult.id.toString());

                    await ctx.salvarPagamento(pagamento);

                    const evento = new PagamentoAprovadoEvent({
                        aluguelId: aluguelId,
                        pagamentoId: pagamento.id,
                        aprovadoEm: pagamento.aprovadoEm!,
                        usuarioId: pagamento.usuarioId,
                        tipoServico: tipoServico as TipoServico,
                    });

                    const outboxEvent = OutboxEvent.criar({
                        tipoEvento: evento.eventType,
                        idAgregado: pagamento.id,
                        tipoAgregado: 'Pagamento',
                        payload: {
                            eventId: evento.eventId,
                            aluguelId: evento.aggregateId,
                            pagamentoId: evento.aggregateId,
                            usuarioId: pagamento.usuarioId,
                            aprovadoEm: pagamento.aprovadoEm,
                            occurredOn: evento.occurredOn.toISOString(),
                        },
                    });

                    await ctx.salvarEvento(outboxEvent);

                    this.logger.log(
                        `Pagamento ${pagamento.id} aprovado e evento publicado no Outbox`,
                    );
                });
            } else if (status === 'rejected') {
                await this.unitOfWork.executarEmTransacao(async (ctx) => {
                    pagamento.rejeitar(paymentResult.status_detail);
                    await ctx.salvarPagamento(pagamento);

                    const evento = new PagamentoRecusadoEvent({
                        aluguelId: aluguelId,
                        pagamentoId: pagamento.id,
                        recusadoEm: new Date(),
                        usuarioId: pagamento.usuarioId,
                        motivo: paymentResult.status_detail,
                    });

                    const outboxEvent = OutboxEvent.criar({
                        tipoEvento: evento.eventType,
                        idAgregado: pagamento.id,
                        tipoAgregado: 'Pagamento',
                        payload: {
                            eventId: evento.eventId,
                            aluguelId: evento.aluguelId,
                            pagamentoId: evento.pagamentoId,
                            usuarioId: pagamento.usuarioId,
                            motivo: evento.motivo,
                            occurredOn: evento.occurredOn.toISOString(),
                        },
                    });

                    await ctx.salvarEvento(outboxEvent);

                    this.logger.warn(
                        `Pagamento ${pagamento.id} foi recusado. Motivo: ${paymentResult.status_detail}`,
                    );
                });
            } else if (status === 'pending') {
                await this.unitOfWork.executarEmTransacao(async (ctx) => {
                    pagamento.processar();
                    await ctx.salvarPagamento(pagamento);

                    const evento = new PagamentoPendingEvent({
                        aluguelId: aluguelId,
                        pagamentoId: pagamento.id,
                        pendingEm: new Date(),
                        usuarioId: pagamento.usuarioId,
                    });

                    const outboxEvent = OutboxEvent.criar({
                        tipoEvento: evento.eventType,
                        idAgregado: pagamento.id,
                        tipoAgregado: 'Pagamento',
                        payload: {
                            eventId: evento.eventId,
                            aluguelId: evento.aluguelId,
                            pagamentoId: evento.pagamentoId,
                            usuarioId: pagamento.usuarioId,
                            occurredOn: evento.occurredOn.toISOString(),
                        },
                    });

                    await ctx.salvarEvento(outboxEvent);

                    this.logger.log(`Pagamento ${pagamento.id} está pendente`);
                });
            } else if (status === 'cancelled') {
                await this.unitOfWork.executarEmTransacao(async (ctx) => {
                    pagamento.cancelar();
                    await ctx.salvarPagamento(pagamento);

                    const evento = new PagamentoCanceladoEvent({
                        aluguelId: aluguelId,
                        pagamentoId: pagamento.id,
                        canceladoEm: new Date(),
                        usuarioId: pagamento.usuarioId,
                        motivo: paymentResult.status_detail,
                    });

                    const outboxEvent = OutboxEvent.criar({
                        tipoEvento: evento.eventType,
                        idAgregado: pagamento.id,
                        tipoAgregado: 'Pagamento',
                        payload: {
                            eventId: evento.eventId,
                            aluguelId: evento.aluguelId,
                            pagamentoId: evento.pagamentoId,
                            usuarioId: pagamento.usuarioId,
                            motivo: evento.motivo,
                            occurredOn: evento.occurredOn.toISOString(),
                        },
                    });

                    await ctx.salvarEvento(outboxEvent);

                    this.logger.warn(
                        `Pagamento ${pagamento.id} foi cancelado. Motivo: ${paymentResult.status_detail}`,
                    );
                });
            } else {
                this.logger.warn(
                    `Pagamento ${pagamento.id} com status desconhecido: ${status}`,
                );
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
    }

    private processarWebhook(props: ProcessarWebhookProps): void {
        if (!props.signature || !props.requestId || !props.dataId) {
            throw new InvalidPropsException(
                'Dados insuficientes para validação',
            );
        }

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
            throw new UnauthorizedException('Não autorizado');
        }
    }
}
