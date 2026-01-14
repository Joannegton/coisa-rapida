import {
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import type { PagamentoRepository } from '../../domain/repositories/pagamento.repository';
import * as crypto from 'node:crypto';
import type { MercadoPagoService } from '../../domain/services/mercado-pago.service';
import { InvalidPropsException } from 'src/common/exceptions/invalidProps.exception';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { TipoServico } from '../../domain/events/pagamento-aprovado.event';
import type { PagamentoJobData } from 'src/shared/infra/jobs/pagamento.processor.worker';

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

            // ===== ETAPA 1: Persistir pagamento e salvar no Outbox =====
            // Isso garante idempotência: se o job falhar e retry, saberemos que já foi salvo
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
                return;
            }

            // ===== ETAPA 2: Enfileirar job CRÍTICO com retry automático =====
            // Bull vai fazer 3 tentativas + backoff exponencial
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
                    jobId: `pagamento-${pagamento.id}-${Date.now()}`, // Evita duplicatas
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                    removeOnComplete: true, // Remove após sucesso
                    removeOnFail: false, // Mantém registro em falha
                },
            );

            this.logger.log(
                `🔄 Job de processamento enfileirado para pagamento ${pagamento.id}`,
            );
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
